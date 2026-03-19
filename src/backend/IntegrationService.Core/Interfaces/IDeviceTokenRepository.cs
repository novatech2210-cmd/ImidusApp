using IntegrationService.Core.Domain.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace IntegrationService.Core.Interfaces
{
    public interface IDeviceTokenRepository
    {
        Task<IEnumerable<DeviceToken>> GetActiveTokensByCustomerIdAsync(int customerId);
        Task<DeviceToken?> GetByTokenAsync(string token);
        Task<int> InsertAsync(DeviceToken token);
        Task UpdateAsync(DeviceToken token);
        Task MarkInactiveAsync(int tokenId);
        Task ReactivateAsync(int tokenId);
        Task<int> DeleteStaleTokensAsync(int daysInactive);
    }
}
