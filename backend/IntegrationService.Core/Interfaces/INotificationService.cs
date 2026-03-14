namespace IntegrationService.Core.Interfaces;

public interface INotificationService
{
    Task SendNotificationAsync(int customerId, string title, string body, Dictionary<string, string>? data = null);
    Task SendBroadcastNotificationAsync(string title, string body, Dictionary<string, string>? data = null);
}
