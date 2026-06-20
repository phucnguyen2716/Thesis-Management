using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using PlatformAdmin.Data;
using PlatformAdmin.Entities;
using PlatformAdmin.Controllers;
using BuildingBlocks.SharedContracts;
using Microsoft.EntityFrameworkCore;

namespace PlatformAdmin.Services;

public class PlagiarismQueueConsumer : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<PlagiarismQueueConsumer> _logger;
    private IConnection? _connection;
    private IModel? _channel;
    private const string QueueName = "thesis-plagiarism-queue";

    public PlagiarismQueueConsumer(IServiceProvider serviceProvider, ILogger<PlagiarismQueueConsumer> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Start the connection attempt in a separate thread so it doesn't block startup
        Task.Run(() => StartConsumer(stoppingToken), stoppingToken);
        return Task.CompletedTask;
    }

    private void StartConsumer(CancellationToken stoppingToken)
    {
        int retryCount = 0;
        const int maxRetries = 10;

        while (!stoppingToken.IsCancellationRequested && _connection == null && retryCount < maxRetries)
        {
            try
            {
                _logger.LogInformation("Attempting to connect to RabbitMQ (Attempt {Count}/{Max})...", retryCount + 1, maxRetries);
                var factory = new ConnectionFactory() { HostName = "localhost" };
                _connection = factory.CreateConnection();
                _channel = _connection.CreateModel();
                _channel.QueueDeclare(queue: QueueName,
                                     durable: true,
                                     exclusive: false,
                                     autoDelete: false,
                                     arguments: null);
                _logger.LogInformation("Successfully connected to RabbitMQ and declared queue '{QueueName}'.", QueueName);
            }
            catch (Exception ex)
            {
                retryCount++;
                _logger.LogWarning("Failed to connect to RabbitMQ: {Message}. Retrying in 5 seconds...", ex.Message);
                Thread.Sleep(5000);
            }
        }

        if (_connection == null)
        {
            _logger.LogError("Could not connect to RabbitMQ after {Max} attempts. Background queue processing will not be available.", maxRetries);
            return;
        }

        var consumer = new EventingBasicConsumer(_channel);
        consumer.Received += async (model, ea) =>
        {
            var body = ea.Body.ToArray();
            var message = Encoding.UTF8.GetString(body);
            _logger.LogInformation("Received message from RabbitMQ: {Message}", message);

            try
            {
                using var doc = JsonDocument.Parse(message);
                if (doc.RootElement.TryGetProperty("ThesisId", out var idProp) && idProp.TryGetInt32(out int thesisId))
                {
                    string? apiKey = null;
                    if (doc.RootElement.TryGetProperty("GeminiApiKey", out var keyProp))
                    {
                        apiKey = keyProp.GetString();
                    }
                    await ProcessPlagiarismCheckAsync(thesisId, apiKey);
                }
                else
                {
                    _logger.LogWarning("Invalid message format: {Message}", message);
                }

                _channel!.BasicAck(deliveryTag: ea.DeliveryTag, multiple: false);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing message {Message}", message);
                // Negative acknowledgment: requeue = false to avoid infinite loops, or true if we want retry
                _channel!.BasicNack(deliveryTag: ea.DeliveryTag, multiple: false, requeue: false);
            }
        };

        _channel.BasicConsume(queue: QueueName,
                             autoAck: false,
                             consumer: consumer);

        // Keep running until cancellation requested
        while (!stoppingToken.IsCancellationRequested)
        {
            Thread.Sleep(1000);
        }

        _channel?.Close();
        _connection?.Close();
    }

    private async Task ProcessPlagiarismCheckAsync(int thesisId, string? apiKey)
    {
        using var scope = _serviceProvider.CreateScope();
        var plagiarismService = scope.ServiceProvider.GetRequiredService<IPlagiarismService>();
        await plagiarismService.ProcessPlagiarismCheckAsync(thesisId, apiKey);
    }
}
