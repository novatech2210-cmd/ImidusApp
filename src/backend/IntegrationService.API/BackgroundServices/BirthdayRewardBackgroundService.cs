using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using IntegrationService.Infrastructure.Services;

namespace IntegrationService.API.BackgroundServices
{
    /// <summary>
    /// Background service that runs daily birthday reward processing
    /// Executes at 2:00 AM UTC every day
    /// </summary>
    public class BirthdayRewardBackgroundService : BackgroundService
    {
        private readonly ILogger<BirthdayRewardBackgroundService> _logger;
        private readonly IServiceProvider _serviceProvider;
        private const int ScheduledHour = 2;  // 2:00 AM UTC
        private const int ScheduledMinute = 0;

        public BirthdayRewardBackgroundService(
            ILogger<BirthdayRewardBackgroundService> logger,
            IServiceProvider serviceProvider)
        {
            _logger = logger;
            _serviceProvider = serviceProvider;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Birthday Reward Background Service started");

            try
            {
                while (!stoppingToken.IsCancellationRequested)
                {
                    try
                    {
                        // Calculate next run time
                        var now = DateTime.UtcNow;
                        var nextRun = CalculateNextRunTime(now);
                        var delayMs = (long)(nextRun - now).TotalMilliseconds;

                        _logger.LogInformation($"Next birthday reward processing scheduled for: {nextRun:O}");

                        // Wait until next scheduled time
                        if (delayMs > 0)
                        {
                            await Task.Delay((int)Math.Min(delayMs, int.MaxValue), stoppingToken);
                        }

                        if (!stoppingToken.IsCancellationRequested)
                        {
                            await ProcessBirthdaysAsync(stoppingToken);
                        }
                    }
                    catch (OperationCanceledException)
                    {
                        _logger.LogInformation("Birthday Reward Background Service cancellation requested");
                        break;
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error in birthday reward background service");
                        // Continue running despite errors
                        await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
                    }
                }
            }
            finally
            {
                _logger.LogInformation("Birthday Reward Background Service stopped");
            }
        }

        /// <summary>
        /// Calculate the next scheduled run time (2:00 AM UTC)
        /// </summary>
        private DateTime CalculateNextRunTime(DateTime now)
        {
            var nextRun = now.Date.AddHours(ScheduledHour).AddMinutes(ScheduledMinute);

            // If the scheduled time has already passed today, schedule for tomorrow
            if (nextRun <= now)
            {
                nextRun = nextRun.AddDays(1);
            }

            return nextRun;
        }

        /// <summary>
        /// Execute birthday reward processing
        /// Uses scoped service to ensure clean database connections
        /// </summary>
        private async Task ProcessBirthdaysAsync(CancellationToken cancellationToken)
        {
            try
            {
                _logger.LogInformation("Processing birthday rewards...");

                using var scope = _serviceProvider.CreateScope();
                var birthdayService = scope.ServiceProvider.GetRequiredService<IBirthdayRewardService>();

                var startTime = DateTime.UtcNow;
                await birthdayService.ProcessBirthdaysAsync();
                var duration = DateTime.UtcNow - startTime;

                _logger.LogInformation($"Birthday reward processing completed successfully in {duration.TotalSeconds:F2} seconds");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing birthday rewards");
                throw;
            }
        }

        /// <summary>
        /// Override to ensure graceful shutdown
        /// </summary>
        public override async Task StopAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("Birthday Reward Background Service is shutting down");
            await base.StopAsync(cancellationToken);
        }
    }

    /// <summary>
    /// Extension methods for dependency injection
    /// Usage in Program.cs: services.AddBirthdayRewardService();
    /// </summary>
    public static class BirthdayRewardServiceExtensions
    {
        public static IServiceCollection AddBirthdayRewardService(this IServiceCollection services)
        {
            services.AddScoped<IBirthdayRewardService, BirthdayRewardService>();
            services.AddHostedService<BirthdayRewardBackgroundService>();
            return services;
        }
    }
}
