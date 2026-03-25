using IntegrationService.Core.Services;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace IntegrationService.API.BackgroundServices;

public class BirthdayRewardBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<BirthdayRewardBackgroundService> _logger;

    public BirthdayRewardBackgroundService(
        IServiceProvider serviceProvider,
        ILogger<BirthdayRewardBackgroundService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Birthday Reward Background Service is starting.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                _logger.LogInformation("Checking for birthdays at {time}", DateTimeOffset.Now);

                using (var scope = _serviceProvider.CreateScope())
                {
                    var birthdayService = scope.ServiceProvider.GetRequiredService<BirthdayRewardService>();
                    await birthdayService.ProcessTodayBirthdaysAsync();
                    _logger.LogInformation("Successfully processed today's birthday rewards.");
                }

                // Wait until midnight for the next run
                var now = DateTime.Now;
                var nextRunTime = now.Date.AddDays(1);
                var delay = nextRunTime - now;
                
                await Task.Delay(delay, stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while processing birthday rewards.");
                await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken); // Retry after 5 mins
            }
        }
    }
}
