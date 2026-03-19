using IntegrationService.Core.Domain.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace IntegrationService.Core.Interfaces
{
    public interface INotificationLogRepository
    {
        Task InsertAsync(NotificationLog log);
        Task<IEnumerable<NotificationLog>> GetRecentByCustomerIdAsync(int customerId, int count = 50);
        Task<int> DeleteOldLogsAsync(int daysOld);
    }
}
