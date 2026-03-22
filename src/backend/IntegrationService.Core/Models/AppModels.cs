using System.Collections.Generic;

namespace IntegrationService.Core.Models
{
    public class MenuItem
    {
        public int ItemID { get; set; }
        public string IName { get; set; } = string.Empty;
        public string? IName2 { get; set; }
        public string? ItemDescription { get; set; }
        public string? ImageFilePath { get; set; }
        public bool ApplyGST { get; set; }
        public bool ApplyPST { get; set; }
        public bool ApplyPST2 { get; set; }
        public bool KitchenB { get; set; }
        public bool KitchenF { get; set; }
        public bool KitchenE { get; set; }
        public bool Kitchen5 { get; set; }
        public bool Kitchen6 { get; set; }
        public bool Bar { get; set; }
        public bool Alcohol { get; set; }
        public bool RewardItem { get; set; }
        public bool OnlineItem { get; set; }
        public bool Status { get; set; }
        public List<AvailableSize> AvailableSizes { get; set; } = new();
    }

    public class AvailableSize
    {
        public int SizeID { get; set; }
        public string SizeName { get; set; } = string.Empty;
        public decimal UnitPrice { get; set; }
        public decimal? UnitPrice2 { get; set; }
        public decimal? UnitPrice3 { get; set; }
        public int? OnHandQty { get; set; }
        public bool ApplyNoDSC { get; set; }
    }

    public class Customer
    {
        public int CustomerID { get; set; }
        public string FName { get; set; } = string.Empty;
        public string LName { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public int EarnedPoints { get; set; }
    }
}
