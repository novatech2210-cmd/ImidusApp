using System;

namespace IntegrationService.Core.Domain.Entities
{
    public class IdempotencyRecord
    {
        public string IdempotencyKey { get; set; } = string.Empty;
        public string RequestHash { get; set; } = string.Empty;
        public string ResponseJson { get; set; } = string.Empty;
        public int StatusCode { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime ExpiresAt { get; set; }
    }

    public class DeviceToken
    {
        public int Id { get; set; }
        public int CustomerId { get; set; }
        public string Token { get; set; } = string.Empty;
        public string Platform { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
        public DateTime LastActive { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class NotificationLog
    {
        public int Id { get; set; }
        public int CustomerId { get; set; }
        public int DeviceTokenId { get; set; }
        public string NotificationType { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string? FcmResponse { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class OnlineOrderStatus
    {
        public int Id { get; set; }
        public int SalesId { get; set; }
        public bool ReadyNotificationSent { get; set; }
        public bool ConfirmationNotificationSent { get; set; }
        public DateTime LastCheckedAt { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
