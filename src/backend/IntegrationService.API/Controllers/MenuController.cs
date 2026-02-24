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
    }
}
