using IntegrationService.Core.Interfaces;
using Entities = IntegrationService.Core.Domain.Entities;
using Models = IntegrationService.Core.Models;

namespace IntegrationService.Infrastructure.Data
{
    /// <summary>
    /// Menu repository that delegates to PosRepository and maps
    /// Domain.Entities types to Models types for the service layer.
    /// </summary>
    public class MenuRepository : IMenuRepository
    {
        private readonly IPosRepository _posRepository;

        public MenuRepository(IPosRepository posRepository)
        {
            _posRepository = posRepository;
        }

        public async Task<Models.MenuItem?> GetItemByIdAsync(int itemId)
        {
            var entity = await _posRepository.GetMenuItemByIdAsync(itemId);
            return entity == null ? null : MapMenuItem(entity);
        }

        public async Task<IEnumerable<Models.MenuItem>> GetActiveMenuItemsAsync()
        {
            var entities = await _posRepository.GetActiveMenuItemsAsync();
            return entities.Select(MapMenuItem);
        }

        public async Task<IEnumerable<Models.AvailableSize>> GetItemSizesAsync(int itemId)
        {
            var entities = await _posRepository.GetItemSizesAsync(itemId);
            return entities.Select(MapAvailableSize);
        }

        public async Task<int?> GetItemStockAsync(int itemId, int sizeId)
        {
            var stock = await _posRepository.GetItemStockAsync(itemId, sizeId);
            return (int?)stock?.OnHandQty;
        }

        public Task<bool> IsItemInStockAsync(int itemId, int sizeId, decimal quantity)
        {
            return _posRepository.IsItemInStockAsync(itemId, sizeId, quantity);
        }

        public Task<bool> DecreaseStockAsync(int itemId, int sizeId, decimal quantity)
        {
            return _posRepository.DecreaseStockAsync(itemId, sizeId, quantity);
        }

        // =========================================================================
        // Mapping helpers: Domain.Entities -> Models
        // =========================================================================

        private static Models.MenuItem MapMenuItem(Entities.MenuItem e)
        {
            return new Models.MenuItem
            {
                ItemID = e.ItemID,
                IName = e.IName,
                IName2 = e.IName2,
                ItemDescription = e.ItemDescription,
                ImageFilePath = e.ImageFilePath,
                ApplyGST = e.ApplyGST,
                ApplyPST = e.ApplyPST,
                ApplyPST2 = e.ApplyPST2,
                KitchenB = e.KitchenB,
                KitchenF = e.KitchenF,
                KitchenE = e.KitchenE,
                Kitchen5 = e.Kitchen5,
                Kitchen6 = e.Kitchen6,
                Bar = e.Bar,
                Alcohol = e.Alcohol,
                RewardItem = e.RewardItem,
                OnlineItem = e.OnlineItem,
                Status = e.Status,
                AvailableSizes = e.AvailableSizes?.Select(MapAvailableSize).ToList()
                                 ?? new List<Models.AvailableSize>()
            };
        }

        private static Models.AvailableSize MapAvailableSize(Entities.AvailableSize e)
        {
            return new Models.AvailableSize
            {
                SizeID = e.SizeID,
                SizeName = e.Size?.SizeName ?? "Regular",
                UnitPrice = e.UnitPrice,
                UnitPrice2 = e.UnitPrice2,
                UnitPrice3 = e.UnitPrice3,
                OnHandQty = e.OnHandQty,
                ApplyNoDSC = e.ApplyNoDSC
            };
        }
    }
}
