using IntegrationService.Core.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace IntegrationService.Core.Interfaces
{
    public interface IMenuRepository
    {
        Task<MenuItem?> GetItemByIdAsync(int itemId);
        Task<IEnumerable<MenuItem>> GetActiveMenuItemsAsync();
        Task<IEnumerable<AvailableSize>> GetItemSizesAsync(int itemId);
        Task<int?> GetItemStockAsync(int itemId, int sizeId);
        Task<bool> IsItemInStockAsync(int itemId, int sizeId, decimal quantity);
        Task<bool> DecreaseStockAsync(int itemId, int sizeId, decimal quantity);
    }
}
