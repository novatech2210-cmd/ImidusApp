using IntegrationService.Core.Domain.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace IntegrationService.Core.Interfaces
{
    public interface IOnlineOrderStatusRepository
    {
        Task<OnlineOrderStatus?> GetBySalesIdAsync(int salesId);
        Task<int> InsertAsync(OnlineOrderStatus status);
        Task UpdateAsync(OnlineOrderStatus status);
        Task<IEnumerable<OnlineOrderStatus>> GetOrdersPendingReadyNotificationAsync();
    }
}
