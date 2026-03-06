namespace IntegrationService.Core.Models.AdminPortal
{
    /// <summary>
    /// Push notification campaign (SSOT: IntegrationService overlay table)
    /// </summary>
    public class PushCampaign
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
        public string? DeepLinkScreen { get; set; }
        
        // Audience Targeting (RFM)
        public decimal? MinSpend { get; set; }
        public int? MinFrequency { get; set; }
        public int? MaxRecencyDays { get; set; }
        public string? TargetCustomerIds { get; set; } // JSON array
        
        // Status
        public string Status { get; set; } = "draft"; // draft, scheduled, sent, cancelled
        public DateTime? ScheduledDateTime { get; set; }
        public DateTime? SentDateTime { get; set; }
        
        // Statistics
        public int? TargetCount { get; set; }
        public int? SentCount { get; set; }
        public int? DeliveredCount { get; set; }
        public int? OpenedCount { get; set; }
        
        public int CreatedBy { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
