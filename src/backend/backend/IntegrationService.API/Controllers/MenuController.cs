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
        private readonly ILogger<MenuController> _logger;

        public MenuController(IPosRepository posRepository, ILogger<MenuController> logger)
        {
            _posRepo = posRepository;
            _logger = logger;
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
        /// </summary>
        [HttpGet("categories")]
        [ProducesResponseType(typeof(List<CategoryDTO>), 200)]
        public async Task<IActionResult> GetCategories()
        {
            try
            {
                // Get categories that have available items
                var categories = await _posRepo.GetCategoriesAsync();

                // Get item counts per category to filter out empty ones
                var itemCounts = await _posRepo.GetCategoryItemCountsAsync();

                // Map to DTO and filter categories with zero items
                var categoryDTOs = categories
                    .Where(c => itemCounts.ContainsKey(c.CategoryID) && itemCounts[c.CategoryID] > 0)
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
        /// </summary>
        [HttpGet("items/{categoryId}")]
        [ProducesResponseType(typeof(List<MenuItemDTO>), 200)]
        public async Task<IActionResult> GetItemsByCategory(int categoryId)
        {
            try
            {
                // Get items for this category
                var menuItems = await _posRepo.GetMenuItemsByCategoryAsync(categoryId);

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

                    // Skip items with no in-stock sizes
                    if (!sizesDTOs.Any(s => s.InStock))
                    {
                        _logger.LogDebug("Skipping item {ItemId} - no in-stock sizes", item.ItemID);
                        continue;
                    }

                    menuItemDTOs.Add(new MenuItemDTO
                    {
                        ItemId = item.ItemID,
                        Name = item.IName,
                        Description = item.ItemDescription,
                        ImageUrl = item.ImageFilePath,
                        CategoryId = item.CategoryID,
                        IsAlcohol = item.Alcohol,
                        IsAvailable = true,
                        ApplyGST = item.ApplyGST,
                        ApplyPST = item.ApplyPST,
                        KitchenB = item.KitchenB,
                        KitchenF = item.KitchenF,
                        Bar = item.Bar,
                        DisplayOrder = item.ItemID, // Use ItemID as fallback - PrintOrder doesn't exist in tblItem
                        Sizes = sizesDTOs
                    });
                }

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
