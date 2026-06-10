using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System;
using System.Threading;
using System.Threading.Tasks;
using Hangfire;

namespace PlatformAdmin.Jobs
{
    public class DriveSyncSchedulerService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<DriveSyncSchedulerService> _logger;

        public DriveSyncSchedulerService(IServiceScopeFactory scopeFactory, ILogger<DriveSyncSchedulerService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            // Wait 15 seconds after startup before starting the 10-second sync loop
            // to avoid conflicts with initial startup seeding
            await Task.Delay(TimeSpan.FromSeconds(15), stoppingToken);

            _logger.LogInformation("🔄 [DriveSyncSchedulerService] Starting 10-second sync loop...");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    // Enqueue the Hangfire job so that it runs asynchronously in the Hangfire queue
                    BackgroundJob.Enqueue<DriveSyncJob>(job => job.SyncAllAsync());
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "❌ [DriveSyncSchedulerService] Error enqueuing DriveSyncJob");
                }

                await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);
            }
        }
    }
}
