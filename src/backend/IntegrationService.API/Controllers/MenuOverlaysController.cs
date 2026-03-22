using System;
using System.Threading.Tasks;
using IntegrationService.Core.Domain.Entities;
using IntegrationService.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace IntegrationService.API.Controllers
{
    /// <summary>
    /// API for managing menu overlays (enable/disable items, custom images)
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    public class MenuOverlaysController : ControllerBase
    {
        private readonly IMenuOverlayRepository _overlayRepo;
        private readonly IPosRepository _posRepo;
        private readonly ILogger<MenuOverlaysController> _logger;

        public MenuOverlaysController(
            IMenuOverlayRepository overlayRepo,
            IPosRepository posRepo,
            ILogger<MenuOverlaysController> logger)
        {
            _overlayRepo = overlayRepo;
            _posRepo = posRepo;
            _logger = logger;
        }

        /// <summary>
        /// Get all menu overlays
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetOverlays()
        {
            var overlays = await _overlayRepo.GetAllAsync();
            return Ok(new { data = overlays });
        }

        /// <summary>
        /// Get overlay for specific item
        /// </summary>
        [HttpGet("item/{itemId}")]
        public async Task<IActionResult> GetItemOverlay(int itemId)
        {
            var overlay = await _overlayRepo.GetByItemIdAsync(itemId);
            if (overlay == null)
            {
                // Return default overlay (enabled, no overrides)
                return Ok(new
                {
                    data = new MenuOverlay
                    {
                        ItemId = itemId,
                        IsEnabled = true
                    }
                });
            }

            return Ok(new { data = overlay });
        }

        /// <summary>
        /// Get overlay for specific category
        /// </summary>
        [HttpGet("category/{categoryId}")]
        public async Task<IActionResult> GetCategoryOverlay(int categoryId)
        {
            var overlay = await _overlayRepo.GetByCategoryIdAsync(categoryId);
            if (overlay == null)
            {
                return Ok(new
                {
                    data = new MenuOverlay
                    {
                        CategoryId = categoryId,
                        IsEnabled = true
                    }
                });
            }

            return Ok(new { data = overlay });
        }

        /// <summary>
        /// Get list of disabled item IDs (for filtering menu)
        /// </summary>
        [HttpGet("disabled/items")]
        public async Task<IActionResult> GetDisabledItems()
        {
            var disabledIds = await _overlayRepo.GetDisabledItemIdsAsync();
            return Ok(new { data = disabledIds });
        }

        /// <summary>
        /// Get list of disabled category IDs (for filtering menu)
        /// </summary>
        [HttpGet("disabled/categories")]
        public async Task<IActionResult> GetDisabledCategories()
        {
            var disabledIds = await _overlayRepo.GetDisabledCategoryIdsAsync();
            return Ok(new { data = disabledIds });
        }

        /// <summary>
        /// Create or update item overlay
        /// </summary>
        [HttpPut("item/{itemId}")]
        public async Task<IActionResult> SetItemOverlay(int itemId, [FromBody] SetOverlayRequest request)
        {
            // Verify item exists in POS
            var menuItem = await _posRepo.GetMenuItemByIdAsync(itemId);
            if (menuItem == null)
                return NotFound(new { error = "Menu item not found in POS" });

            var overlay = new MenuOverlay
            {
                ItemId = itemId,
                IsEnabled = request.IsEnabled,
                OverrideImageUrl = request.OverrideImageUrl,
                OverrideDescription = request.OverrideDescription,
                DisplayOrder = request.DisplayOrder,
                AvailableFrom = request.AvailableFrom,
                AvailableTo = request.AvailableTo,
                AvailableDays = request.AvailableDays
            };

            var id = await _overlayRepo.CreateOrUpdateAsync(overlay);
            overlay.Id = id;

            _logger.LogInformation("Updated overlay for item {ItemId}: enabled={Enabled}", itemId, request.IsEnabled);

            return Ok(new { data = overlay });
        }

        /// <summary>
        /// Create or update category overlay
        /// </summary>
        [HttpPut("category/{categoryId}")]
        public async Task<IActionResult> SetCategoryOverlay(int categoryId, [FromBody] SetOverlayRequest request)
        {
            var overlay = new MenuOverlay
            {
                CategoryId = categoryId,
                IsEnabled = request.IsEnabled,
                OverrideImageUrl = request.OverrideImageUrl,
                OverrideDescription = request.OverrideDescription,
                DisplayOrder = request.DisplayOrder,
                AvailableFrom = request.AvailableFrom,
                AvailableTo = request.AvailableTo,
                AvailableDays = request.AvailableDays
            };

            var id = await _overlayRepo.CreateOrUpdateAsync(overlay);
            overlay.Id = id;

            _logger.LogInformation("Updated overlay for category {CategoryId}: enabled={Enabled}", categoryId, request.IsEnabled);

            return Ok(new { data = overlay });
        }

        /// <summary>
        /// Enable an item for online ordering
        /// </summary>
        [HttpPost("item/{itemId}/enable")]
        public async Task<IActionResult> EnableItem(int itemId)
        {
            var overlay = await _overlayRepo.GetByItemIdAsync(itemId) ?? new MenuOverlay { ItemId = itemId };
            overlay.IsEnabled = true;

            await _overlayRepo.CreateOrUpdateAsync(overlay);
            _logger.LogInformation("Enabled item {ItemId} for online ordering", itemId);

            return Ok(new { success = true });
        }

        /// <summary>
        /// Disable an item from online ordering
        /// </summary>
        [HttpPost("item/{itemId}/disable")]
        public async Task<IActionResult> DisableItem(int itemId)
        {
            var overlay = await _overlayRepo.GetByItemIdAsync(itemId) ?? new MenuOverlay { ItemId = itemId };
            overlay.IsEnabled = false;

            await _overlayRepo.CreateOrUpdateAsync(overlay);
            _logger.LogInformation("Disabled item {ItemId} from online ordering", itemId);

            return Ok(new { success = true });
        }

        /// <summary>
        /// Bulk enable/disable items
        /// </summary>
        [HttpPost("bulk")]
        public async Task<IActionResult> BulkUpdateOverlays([FromBody] BulkOverlayRequest request)
        {
            foreach (var itemId in request.ItemIds)
            {
                var overlay = await _overlayRepo.GetByItemIdAsync(itemId) ?? new MenuOverlay { ItemId = itemId };
                overlay.IsEnabled = request.IsEnabled;
                await _overlayRepo.CreateOrUpdateAsync(overlay);
            }

            _logger.LogInformation("Bulk updated {Count} items: enabled={Enabled}",
                request.ItemIds.Count, request.IsEnabled);

            return Ok(new { success = true, count = request.ItemIds.Count });
        }

        /// <summary>
        /// Delete an overlay (revert to default POS behavior)
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteOverlay(int id)
        {
            var deleted = await _overlayRepo.DeleteAsync(id);
            if (!deleted)
                return NotFound(new { error = "Overlay not found" });

            return Ok(new { success = true });
        }
    }

    public class SetOverlayRequest
    {
        public bool IsEnabled { get; set; } = true;
        public string? OverrideImageUrl { get; set; }
        public string? OverrideDescription { get; set; }
        public int? DisplayOrder { get; set; }
        public TimeSpan? AvailableFrom { get; set; }
        public TimeSpan? AvailableTo { get; set; }
        public string? AvailableDays { get; set; }
    }

    public class BulkOverlayRequest
    {
        public System.Collections.Generic.List<int> ItemIds { get; set; } = new();
        public bool IsEnabled { get; set; }
    }
}
