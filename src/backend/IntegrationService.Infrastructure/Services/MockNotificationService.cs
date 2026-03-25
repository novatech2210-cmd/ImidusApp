using IntegrationService.Core.Interfaces;
using Microsoft.Extensions.Logging;

namespace IntegrationService.Infrastructure.Services;

public class MockNotificationService : INotificationService
{
    private readonly ILogger<MockNotificationService> _logger;

    public MockNotificationService(ILogger<MockNotificationService> logger)
    {
        _logger = logger;
    }

    public Task SendNotificationAsync(int customerId, string title, string body, Dictionary<string, string>? data = null)
    {
        _logger.LogInformation("🔔 [MOCK NOTIFICATION] To PosCustomer {CustomerId}: {Title} - {Body}", customerId, title, body);
        if (data != null)
        {
            foreach (var kvp in data)
            {
                _logger.LogInformation("   Data: {Key} = {Value}", kvp.Key, kvp.Value);
            }
        }
        return Task.CompletedTask;
    }

    public Task SendBroadcastNotificationAsync(string title, string body, Dictionary<string, string>? data = null)
    {
        _logger.LogInformation("📢 [MOCK BROADCAST] {Title} - {Body}", title, body);
        return Task.CompletedTask;
    }
}
