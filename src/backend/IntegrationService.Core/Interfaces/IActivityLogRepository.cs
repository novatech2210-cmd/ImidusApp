using System.Collections.Generic;
using System.Threading.Tasks;
using IntegrationService.Core.Domain.Entities;

namespace IntegrationService.Core.Interfaces
{
    public interface IActivityLogRepository
    {
        Task<int> LogActivityAsync(ActivityLog log);
        Task<IEnumerable<ActivityLog>> GetRecentLogsAsync(int limit);
        
        // Admin Portal CRM specific methods
        Task<IEnumerable<CustomerSegment>> GetCustomerSegmentsAsync();
        Task<CustomerSegmentCounts> GetCustomerSegmentCountsAsync();
    }

    public class ActivityLog
    {
        public int ID { get; set; }
        public int? AdminUserID { get; set; }
        public string? Action { get; set; }
        public string? ResourceType { get; set; }
        public int? ResourceID { get; set; }
        public string? OldValue { get; set; }
        public string? NewValue { get; set; }
        public string? IPAddress { get; set; }
        public string? UserAgent { get; set; }
        public string? Status { get; set; }
        public string? ErrorMessage { get; set; }
        public System.DateTime CreatedDate { get; set; }
    }
}
