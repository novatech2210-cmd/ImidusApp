namespace IntegrationService.Core.Domain.Entities;

/// <summary>
/// Device token for push notifications
/// Tracks FCM tokens for iOS and Android devices
/// </summary>
public class DeviceToken
{
    public int Id { get; set; }
    public int CustomerId { get; set; }
    public string Token { get; set; } = string.Empty;
    public string Platform { get; set; } = string.Empty; // "ios" or "android"
    public bool IsActive { get; set; } = true;
    public DateTime LastActive { get; set; }
    public DateTime CreatedAt { get; set; }
}
