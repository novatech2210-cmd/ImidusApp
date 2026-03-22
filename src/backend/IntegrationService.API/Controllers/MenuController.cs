using Microsoft.AspNetCore.Mvc;
using IntegrationService.Core.Interfaces;
using IntegrationService.API.DTOs;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using System;

namespace IntegrationService.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MenuController : ControllerBase
    {
        private readonly IPosRepository _posRepo;
        private readonly IMenuOverlayRepository? _overlayRepo;
        private readonly ILogger<MenuController> _logger;

        public MenuController(
            IPosRepository posRepository,
            ILogger<MenuController> logger,
            IMenuOverlayRepository? overlayRepo = null)
        {
            _posRepo = posRepository;
            _logger = logger;
            _overlayRepo = overlayRepo;
        }

        /// <summary>
        /// Get full menu with all items and sizes
        /// </summary>
        [HttpGet]
        [ProducesResponseType(typeof(MenuResponse), 200)]
        public async Task<IActionResult> GetMenu()
        {
            try
            {
                // Get all active menu items
                var menuItems = await _posRepo.GetActiveMenuItemsAsync();

                var menuItemDTOs = new List<MenuItemDTO>();

                foreach (var item in menuItems)
                {
                    // Get all available sizes for this item
                    var sizes = await _posRepo.GetItemSizesAsync(item.ItemID);

                    var sizesDTOs = sizes.Select(s => new MenuItemSizeDTO
                    {
                        SizeId = s.SizeID,
                        SizeName = s.Size?.SizeName ?? "Regular",
                        ShortName = s.Size?.ShortName,
                        Price = s.UnitPrice,
                        InStock = s.InStock,
                        StockQuantity = s.OnHandQty,
                        DisplayOrder = s.Size?.DisplayOrder ?? 0
                    }).OrderBy(s => s.DisplayOrder).ToList();

                    // Only include items that have at least one size in stock
                    if (sizesDTOs.Any())
                    {
                        menuItemDTOs.Add(new MenuItemDTO
                        {
                            ItemId = item.ItemID,
                            Name = item.IName,
                            Description = item.ItemDescription,
                            ImageUrl = item.ImageFilePath,
                            CategoryId = item.CategoryID,
                            IsAlcohol = item.Alcohol,
                            IsAvailable = true,
                            Sizes = sizesDTOs
                        });
                    }
                }

                return Ok(new MenuResponse
                {
                    Items = menuItemDTOs
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to retrieve menu");
                return StatusCode(500, "Failed to retrieve menu");
            }
        }

        /// <summary>
        /// Get sizes for a specific menu item
        /// </summary>
        [HttpGet("{itemId}/sizes")]
        [ProducesResponseType(typeof(List<MenuItemSizeDTO>), 200)]
        public async Task<IActionResult> GetItemSizes(int itemId)
        {
            try
            {
                var sizes = await _posRepo.GetItemSizesAsync(itemId);

                var sizeDTOs = sizes.Select(s => new MenuItemSizeDTO
                {
                    SizeId = s.SizeID,
                    SizeName = s.Size?.SizeName ?? "Regular",
                    ShortName = s.Size?.ShortName,
                    Price = s.UnitPrice,
                    InStock = s.InStock,
                    StockQuantity = s.OnHandQty,
                    DisplayOrder = s.Size?.DisplayOrder ?? 0
                }).OrderBy(s => s.DisplayOrder).ToList();

                return Ok(sizeDTOs);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to retrieve sizes for item {ItemId}", itemId);
                return StatusCode(500, "Failed to retrieve item sizes");
            }
        }

        /// <summary>
        /// Get all categories with available online items
        /// Only returns categories that have at least one item with OnlineItem=1
        /// Filters out categories disabled via MenuOverlay
        /// </summary>
        [HttpGet("categories")]
        [ProducesResponseType(typeof(List<CategoryDTO>), 200)]
        public async Task<IActionResult> GetCategories()
        {
            try
            {
                // Get categories that have available items
                var categories = await _posRepo.GetCategoriesAsync();
                _logger.LogInformation("Raw categories from DB: {Count}", categories.Count());

                // Get item counts per category to filter out empty ones
                var itemCounts = await _posRepo.GetCategoryItemCountsAsync();

                // Get disabled categories from overlay
                var disabledCategoryIds = new HashSet<int>();
                if (_overlayRepo != null)
                {
                    var disabled = await _overlayRepo.GetDisabledCategoryIdsAsync();
                    disabledCategoryIds = new HashSet<int>(disabled);
                    _logger.LogDebug("Disabled categories via overlay: {Count}", disabledCategoryIds.Count);
                }

                // Map to DTO and filter categories with zero items or disabled via overlay
                var categoryDTOs = categories
                    .Where(c => itemCounts.ContainsKey(c.CategoryID) && itemCounts[c.CategoryID] > 0)
                    .Where(c => !disabledCategoryIds.Contains(c.CategoryID))
                    .Select(c => new CategoryDTO
                    {
                        CategoryId = c.CategoryID,
                        Name = c.CName,
                        DisplayOrder = c.PrintOrder
                    })
                    .OrderBy(c => c.DisplayOrder)
                    .ToList();

                _logger.LogInformation("Retrieved {Count} categories with available items", categoryDTOs.Count);
                return Ok(categoryDTOs);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to retrieve categories");
                return StatusCode(500, "Failed to retrieve categories");
            }
        }

        /// <summary>
        /// Get menu items for a specific category
        /// Returns only items available for online ordering (OnlineItem=1)
        /// Items without in-stock sizes are excluded
        /// Applies MenuOverlay filtering and image/description overrides
        /// </summary>
        [HttpGet("items/{categoryId}")]
        [ProducesResponseType(typeof(List<MenuItemDTO>), 200)]
        public async Task<IActionResult> GetItemsByCategory(int categoryId)
        {
            try
            {
                // Get items for this category
                var menuItems = await _posRepo.GetMenuItemsByCategoryAsync(categoryId);

                // Get disabled items from overlay
                var disabledItemIds = new HashSet<int>();
                var overlays = new Dictionary<int, Core.Domain.Entities.MenuOverlay>();
                if (_overlayRepo != null)
                {
                    var disabled = await _overlayRepo.GetDisabledItemIdsAsync();
                    disabledItemIds = new HashSet<int>(disabled);

                    // Get all overlays for lookup
                    var allOverlays = await _overlayRepo.GetAllAsync();
                    foreach (var o in allOverlays.Where(x => x.ItemId.HasValue))
                    {
                        overlays[o.ItemId!.Value] = o;
                    }
                }

                var menuItemDTOs = new List<MenuItemDTO>();

                foreach (var item in menuItems)
                {
                    // Skip disabled items
                    if (disabledItemIds.Contains(item.ItemID))
                    {
                        _logger.LogDebug("Skipping item {ItemId} - disabled via overlay", item.ItemID);
                        continue;
                    }

                    // Get all available sizes for this item
                    var sizes = await _posRepo.GetItemSizesAsync(item.ItemID);

                    var sizesDTOs = sizes.Select(s => new MenuItemSizeDTO
                    {
                        SizeId = s.SizeID,
                        SizeName = s.Size?.SizeName ?? "Regular",
                        ShortName = s.Size?.ShortName,
                        Price = s.UnitPrice,
                        InStock = s.InStock,
                        StockQuantity = s.OnHandQty,
                        DisplayOrder = s.Size?.DisplayOrder ?? 0
                    }).OrderBy(s => s.DisplayOrder).ToList();

                    // Apply overlay overrides
                    var imageUrl = item.ImageFilePath;
                    var description = item.ItemDescription;
                    int? displayOrder = item.PrintOrder;

                    if (overlays.TryGetValue(item.ItemID, out var overlay))
                    {
                        if (!string.IsNullOrEmpty(overlay.OverrideImageUrl))
                            imageUrl = overlay.OverrideImageUrl;
                        if (!string.IsNullOrEmpty(overlay.OverrideDescription))
                            description = overlay.OverrideDescription;
                        if (overlay.DisplayOrder.HasValue)
                            displayOrder = overlay.DisplayOrder;
                    }

                    menuItemDTOs.Add(new MenuItemDTO
                    {
                        ItemId = item.ItemID,
                        Name = item.IName,
                        Description = description,
                        ImageUrl = imageUrl,
                        CategoryId = item.CategoryID,
                        IsAlcohol = item.Alcohol,
                        IsAvailable = true,
                        ApplyGST = item.ApplyGST,
                        ApplyPST = item.ApplyPST,
                        KitchenB = item.KitchenB,
                        KitchenF = item.KitchenF,
                        Bar = item.Bar,
                        DisplayOrder = displayOrder ?? 0,
                        Sizes = sizesDTOs
                    });
                }

                // Sort by display order
                menuItemDTOs = menuItemDTOs.OrderBy(m => m.DisplayOrder).ToList();

                _logger.LogInformation("Retrieved {Count} menu items for category {CategoryId}", menuItemDTOs.Count, categoryId);
                return Ok(menuItemDTOs);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to retrieve items for category {CategoryId}", categoryId);
                return StatusCode(500, "Failed to retrieve menu items");
            }
        }
    }
}
