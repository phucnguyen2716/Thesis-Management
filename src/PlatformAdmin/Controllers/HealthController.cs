using System.Net.Sockets;
using Microsoft.AspNetCore.Mvc;
using RabbitMQ.Client;

namespace PlatformAdmin.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    private readonly IConfiguration _configuration;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<HealthController> _logger;

    public HealthController(IConfiguration configuration, IHttpClientFactory httpClientFactory, ILogger<HealthController> logger)
    {
        _configuration = configuration;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    [HttpGet]
    public IActionResult Get() => Ok(new
    {
        status = "Healthy",
        service = "eThesis PlatformAdmin",
        timestamp = DateTime.UtcNow
    });

    /// <summary>Dependency health: Elasticsearch + RabbitMQ</summary>
    [HttpGet("dependencies")]
    public async Task<IActionResult> GetDependencies()
    {
        var elasticsearch = await CheckElasticsearchAsync();
        var rabbitmq = CheckRabbitMq();

        var allHealthy = GetHealthy(elasticsearch) && GetHealthy(rabbitmq);
        return Ok(new
        {
            status = allHealthy ? "Healthy" : "Degraded",
            timestamp = DateTime.UtcNow,
            elasticsearch,
            rabbitmq
        });
    }

    private static bool GetHealthy(object result) =>
        result.GetType().GetProperty("healthy")?.GetValue(result) is true;

    private async Task<object> CheckElasticsearchAsync()
    {
        var enabled = _configuration.GetValue<bool>("Elasticsearch:Enabled", false);
        var uri = _configuration["Elasticsearch:Uri"]
            ?? _configuration["ElasticSearch:Url"]
            ?? "http://localhost:9200";

        if (!enabled)
        {
            return new { name = "Elasticsearch", healthy = true, status = "Disabled (mock mode)", uri };
        }

        try
        {
            var client = _httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(3);
            var response = await client.GetAsync($"{uri.TrimEnd('/')}/_cluster/health");
            var body = await response.Content.ReadAsStringAsync();
            return new
            {
                name = "Elasticsearch",
                healthy = response.IsSuccessStatusCode,
                status = response.IsSuccessStatusCode ? "Connected" : $"HTTP {(int)response.StatusCode}",
                uri,
                detail = body.Length > 200 ? body[..200] : body
            };
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Elasticsearch health check failed");
            return new { name = "Elasticsearch", healthy = false, status = ex.Message, uri };
        }
    }

    private object CheckRabbitMq()
    {
        var host = _configuration["RabbitMQ:Host"] ?? "localhost";
        var port = _configuration.GetValue<int>("RabbitMQ:Port", 5672);
        var queue = _configuration["RabbitMQ:QueueName"] ?? "thesis-plagiarism-queue";

        try
        {
            var factory = new ConnectionFactory
            {
                HostName = host,
                Port = port,
                UserName = _configuration["RabbitMQ:Username"] ?? "guest",
                Password = _configuration["RabbitMQ:Password"] ?? "guest",
                RequestedConnectionTimeout = TimeSpan.FromSeconds(3)
            };

            using var connection = factory.CreateConnection();
            using var channel = connection.CreateModel();
            channel.QueueDeclarePassive(queue);
            return new
            {
                name = "RabbitMQ",
                healthy = true,
                status = "Connected",
                host,
                port,
                queue
            };
        }
        catch (SocketException ex)
        {
            return new { name = "RabbitMQ", healthy = false, status = $"Connection refused: {ex.Message}", host, port, queue };
        }
        catch (Exception ex)
        {
            return new { name = "RabbitMQ", healthy = false, status = ex.Message, host, port, queue };
        }
    }
}
