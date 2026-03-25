using IntegrationService.Core.Interfaces;
using IntegrationService.Core.Models;
using Microsoft.Extensions.Logging;

namespace IntegrationService.Infrastructure.Data;

public class MenuRepository : IMenuRepository
{
    private readonly IPosRepository _posRepo;
    private readonly ILogger<MenuRepository> _logger;

    public MenuRepository(IPosRepository posRepo, ILogger<MenuRepository> logger)
    {
        _posRepo = posRepo;
        _logger = logger;
    }

    public async Task<MenuItem?> GetItemByIdAsync(int itemId)
    {
        var entity = await _posRepo.GetMenuItemByIdAsync(itemId);
        if (entity == null) return null;
        
        return MapToModel(entity);
    }

    public async Task<IEnumerable<MenuItem>> GetActiveMenuItemsAsync()
    {
        var entities = await _posRepo.GetActiveMenuItemsAsync();
        return entities.Select(MapToModel);
    }

    public async Task<IEnumerable<AvailableSize>> GetItemSizesAsync(int itemId)
    {
        var entities = await _posRepo.GetItemSizesAsync(itemId);
        return entities.Select(MapToAvailableSizeModel);
    }

    public async Task<int?> GetItemStockAsync(int itemId, int sizeId)
    {
        return await _posRepo.GetItemStockAsync(itemId, sizeId);
    }

    public async Task<bool> IsItemInStockAsync(int itemId, int sizeId, decimal quantity)
    {
        return await _posRepo.IsItemInStockAsync(itemId, sizeId, quantity);
    }

    public async Task<bool> DecreaseStockAsync(int itemId, int sizeId, decimal quantity)
    {
        return await _posRepo.DecreaseStockAsync(itemId, sizeId, quantity);
    }

    private static MenuItem MapToModel(Core.Domain.Entities.MenuItem entity)
    {
        return new MenuItem
        {
            ItemID = entity.ItemID,
            IName = entity.IName,
            IName2 = entity.IName2,
            ItemDescription = entity.ItemDescription,
            ImageFilePath = entity.ImageFilePath,
            ApplyGST = entity.ApplyGST,
            ApplyPST = entity.ApplyPST,
            ApplyPST2 = entity.ApplyPST2,
            KitchenB = entity.KitchenB,
            KitchenF = entity.KitchenF,
            KitchenE = entity.KitchenE,
            Kitchen5 = entity.Kitchen5,
            Kitchen6 = entity.Kitchen6,
            Bar = entity.Bar,
            Alcohol = entity.Alcohol,
            RewardItem = entity.RewardItem,
            OnlineItem = entity.OnlineItem,
            Status = entity.Status
        };
    }

    private static AvailableSize MapToAvailableSizeModel(Core.Domain.Entities.AvailableSize entity)
    {
        return new AvailableSize
        {
            SizeID = entity.SizeID,
            SizeName = entity.Size?.SizeName ?? string.Empty,
            UnitPrice = entity.UnitPrice,
            UnitPrice2 = entity.UnitPrice2,
            UnitPrice3 = entity.UnitPrice3,
            OnHandQty = entity.OnHandQty,
            ApplyNoDSC = entity.ApplyNoDSC
        };
    }
}
