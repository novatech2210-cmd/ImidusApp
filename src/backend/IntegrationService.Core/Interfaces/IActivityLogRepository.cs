using IntegrationService.Core.Models.AdminPortal;

namespace IntegrationService.Core.Interfaces
{
    /// <summary>
    /// Repository for admin portal activity logging
    /// SSOT: Writes to IntegrationService overlay table
    /// </summary>
    public interface IActivityLogRepository
    {
        Task<ActivityLog> CreateAsync(ActivityLog log);
        Task<IEnumerable<ActivityLog>> GetAllAsync(int limit = 100, int offset = 0);
        Task<IEnumerable<ActivityLog>> GetByAdminUserIdAsync(int adminUserId, int limit = 50);
        Task<IEnumerable<ActivityLog>> GetByActionAsync(string action, int limit = 50);
        Task<IEnumerable<ActivityLog>> GetByDateRangeAsync(DateTime startDate, DateTime endDate);
        Task<IEnumerable<ActivityLog>> GetByEntityAsync(string entityType, int? entityId = null);

        // Admin Portal extensions
        Task<IEnumerable<CustomerSegment>> GetCustomerSegmentsAsync();
        Task<IEnumerable<CampaignInfo>> GetCampaignsAsync();
        Task<CampaignInfo> CreateCampaignAsync(string name, string? description, string campaignType, string? targetQuery);
        Task<SendResult> SendCampaignAsync(int campaignId);
        Task<IEnumerable<MenuOverrideInfo>> GetMenuOverridesAsync();
        Task<MenuOverrideInfo> UpdateMenuOverrideAsync(int itemId, bool isAvailable, bool hidden, decimal? price, string? reason);
        Task<IEnumerable<ActivityLogInfo>> GetActivityLogsAsync(int limit = 100);
    }

    // Additional model classes for Admin Portal
    public class CustomerSegment
    {
        public int CustomerID { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Segment { get; set; } = string.Empty;
        public int RScore { get; set; }
        public int FScore { get; set; }
        public int MScore { get; set; }
        public decimal TotalSpent { get; set; }
        public int OrderCount { get; set; }
        public DateTime? LastOrderDate { get; set; }
    }

    public class CampaignInfo
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string CampaignType { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string? TargetQuery { get; set; }
        public DateTime? ScheduledAt { get; set; }
        public DateTime? SentAt { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class SendResult
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public int RecipientsSent { get; set; }
    }

    public class MenuOverrideInfo
    {
        public int ItemID { get; set; }
        public string ItemName { get; set; } = string.Empty;
        public bool IsAvailable { get; set; } = true;
        public bool HiddenFromOnline { get; set; }
        public decimal? OverridePrice { get; set; }
        public string? OverrideName { get; set; }
    }

    public class ActivityLogInfo
    {
        public int Id { get; set; }
        public string Action { get; set; } = string.Empty;
        public string? EntityType { get; set; }
        public string? EntityId { get; set; }
        public string? Details { get; set; }
        public string? IpAddress { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class OrderHistoryItem
    {
        public int OrderID { get; set; }
        public int DailyOrderNumber { get; set; }
        public DateTime OrderDate { get; set; }
        public decimal SubTotal { get; set; }
        public decimal GSTAmt { get; set; }
        public decimal Total { get; set; }
        public string Status { get; set; } = string.Empty;
    }
}
