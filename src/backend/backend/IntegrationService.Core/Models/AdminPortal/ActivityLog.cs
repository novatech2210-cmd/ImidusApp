namespace IntegrationService.Core.Models.AdminPortal
{
    /// <summary>
    /// Activity log for admin actions (SSOT: IntegrationService overlay table)
    /// </summary>
    public class ActivityLog
    {
        public int Id { get; set; }
        public int AdminUserId { get; set; }
        public string AdminEmail { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty;
        public string? EntityType { get; set; }
        public int? EntityId { get; set; }
        public string? Details { get; set; }
        public string? IpAddress { get; set; }
        public string? UserAgent { get; set; }
        public DateTime Timestamp { get; set; }
        public bool Success { get; set; } = true;
    }
}
