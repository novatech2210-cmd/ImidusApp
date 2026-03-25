using System.Collections.Generic;
using System.Threading.Tasks;
using IntegrationService.Core.Domain.Entities;

namespace IntegrationService.Core.Interfaces
{
    public interface INotificationLogRepository
    {
        Task InsertAsync(NotificationLog log);
        Task<IEnumerable<NotificationLog>> GetRecentByCustomerIdAsync(int customerId, int count = 50);
        Task<int> DeleteOldLogsAsync(int daysOld);
    }
}
