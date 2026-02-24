using System;
using System.Collections.Generic;
using System.Linq;

namespace IntegrationService.API.DTOs
{
    /// <summary>
    /// Menu item response - includes all available sizes
    /// </summary>
    public class MenuItemDTO
    {
        public int ItemId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? ImageUrl { get; set; }
        public int CategoryId { get; set; }
        public string? CategoryName { get; set; }

        // Item flags
        public bool IsAlcohol { get; set; }
        public bool IsAvailable { get; set; } = true;

        // CRITICAL: Now returns array of sizes with prices
        public List<MenuItemSizeDTO> Sizes { get; set; } = new();

        // Deprecated: Remove after mobile app updated
        [Obsolete("Use Sizes collection instead")]
        public decimal Price => Sizes.FirstOrDefault()?.Price ?? 0;
    }

    /// <summary>
    /// Size option for a menu item
    /// NEW DTO - represents one size/price combination
    /// </summary>
    public class MenuItemSizeDTO
    {
        public int SizeId { get; set; }
        public string SizeName { get; set; } = string.Empty;  // "Small", "Medium", "Large"
        public string? ShortName { get; set; }  // "S", "M", "L"
        public decimal Price { get; set; }
        public bool InStock { get; set; }
        public int? StockQuantity { get; set; }  // NULL = unlimited
        public int DisplayOrder { get; set; }
    }

    /// <summary>
    /// Response for menu endpoint
    /// </summary>
    public class MenuResponse
    {
        public List<MenuItemDTO> Items { get; set; } = new();
        public List<CategoryDTO> Categories { get; set; } = new();
    }

    /// <summary>
    /// Category information
    /// </summary>
    public class CategoryDTO
    {
        public int CategoryId { get; set; }
        public string Name { get; set; } = string.Empty;
        public int DisplayOrder { get; set; }
    }
}
