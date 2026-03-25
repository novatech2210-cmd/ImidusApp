namespace IntegrationService.Core.Domain.Entities;

/// <summary>
/// Audit log for notification attempts
/// Tracks success/failure for monitoring and debugging
/// </summary>
public class NotificationLog
{
    public int Id { get; set; }
    public int CustomerId { get; set; }
    public int? DeviceTokenId { get; set; }
    public string NotificationType { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty; // "success", "failed", "retry"
    public string? FcmResponse { get; set; }
    public DateTime CreatedAt { get; set; }
}
