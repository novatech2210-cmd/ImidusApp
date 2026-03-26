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

        // Admin Portal extensions - Customer CRM
        Task<IEnumerable<CustomerSegment>> GetCustomerListAsync(string? segment, string? searchTerm, int limit);
        Task<CustomerSegment?> GetCustomerProfileAsync(int customerId);
        Task<IEnumerable<LoyaltyTransactionDto>> GetCustomerLoyaltyAsync(int customerId, int limit);
        Task<CustomerSegmentCounts> GetCustomerSegmentCountsAsync();

        // Admin Portal extensions - Campaigns
        Task<IEnumerable<CampaignInfo>> GetCampaignsAsync();
        Task<CampaignInfo> CreateCampaignAsync(string name, string? description, string campaignType, string? targetQuery);
        Task<SendResult> SendCampaignAsync(int campaignId);
        Task<IEnumerable<MenuOverrideInfo>> GetMenuOverridesAsync();
        Task<MenuOverrideInfo> UpdateMenuOverrideAsync(int itemId, bool isAvailable, bool hidden, decimal? price, string? reason);
        Task<IEnumerable<ActivityLogInfo>> GetActivityLogsAsync(int limit = 100);
        
        // Admin Portal extensions - Birthday Rewards
        Task<BirthdayRewardConfig> GetBirthdayRewardConfigAsync();
        Task<bool> UpdateBirthdayRewardConfigAsync(BirthdayRewardConfig config);
        Task<IEnumerable<int>> GetCustomersWithBirthdayTodayAsync(int month, int day);
        Task<bool> UpdateCustomerBirthdayAsync(int customerId, int month, int day);
        Task<(int? Month, int? Day)> GetCustomerBirthdayAsync(int customerId);
        Task<bool> RecordBirthdayRewardSentAsync(int customerId);

        // Admin Portal extensions - Terminal Bridge
        Task<TerminalBridgeTransaction> CreateTerminalTransactionAsync(TerminalBridgeTransaction transaction);
        Task<TerminalBridgeTransaction?> GetTerminalTransactionAsync(int id);
        Task<TerminalBridgeTransaction?> GetTerminalTransactionByBridgeIdAsync(string bridgeRequestId);
        Task<bool> UpdateTerminalTransactionStatusAsync(int id, string status, string? statusMessage = null, string? authCode = null, string? transactionId = null, string? cardLastFour = null, string? cardType = null);
    }

    // Additional model classes for Admin Portal
    public class CustomerSegment
    {
        public int CustomerID { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public int EarnedPoints { get; set; }
        public string Segment { get; set; } = string.Empty;
        public int RScore { get; set; }
        public int FScore { get; set; }
        public int MScore { get; set; }
        public decimal LifetimeValue { get; set; }
        public decimal TotalSpent { get; set; }
        public int VisitCount { get; set; }
        public int OrderCount { get; set; }
        public DateTime? LastOrderDate { get; set; }
        public DateTime? CreatedAt { get; set; }
    }

    public class CustomerSegmentCounts
    {
        public int HighSpend { get; set; }
        public int Frequent { get; set; }
        public int Recent { get; set; }
        public int AtRisk { get; set; }
        public int NewCustomers { get; set; }
        public int Total { get; set; }
    }

    public class LoyaltyTransactionDto
    {
        public int Id { get; set; }
        public DateTime Date { get; set; }
        public string Type { get; set; } = string.Empty;
        public int Points { get; set; }
        public int? OrderId { get; set; }
        public string Description { get; set; } = string.Empty;
    }

    public class CampaignInfo
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
        public string? DeepLinkScreen { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? TargetQuery { get; set; }
        public int? TargetCount { get; set; }
        public int? SentCount { get; set; }
        public DateTime? ScheduledDateTime { get; set; }
        public DateTime? SentDateTime { get; set; }
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
        public bool IsEnabled { get; set; } = true;
        public string? DisplayName { get; set; }
        public string? DisplayDescription { get; set; }
        public int? DisplayOrder { get; set; }
        public string? CategoryOverride { get; set; }
        public decimal? OverridePrice { get; set; } // Kept for logic
    }

    public class ActivityLogInfo
    {
        public int Id { get; set; }
        public string Action { get; set; } = string.Empty;
        public string? EntityType { get; set; }
        public string? EntityId { get; set; }
        public string? Details { get; set; }
        public string? IpAddress { get; set; }
        public DateTime Timestamp { get; set; }
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
