namespace IntegrationService.Core.Models;

/// <summary>
/// MenuItem DTO for service layer
/// </summary>
public class MenuItem
{
    public int ItemID { get; set; }
    public string IName { get; set; } = string.Empty;
    public string? IName2 { get; set; }
    public string? ItemDescription { get; set; }
    public string? ImageFilePath { get; set; }

    // Tax Application Flags
    public bool ApplyGST { get; set; }
    public bool ApplyPST { get; set; }
    public bool ApplyPST2 { get; set; }

    // Kitchen Routing
    public bool KitchenB { get; set; }
    public bool KitchenF { get; set; }
    public bool KitchenE { get; set; }
    public bool Kitchen5 { get; set; }
    public bool Kitchen6 { get; set; }
    public bool Bar { get; set; }

    // Item Type Flags
    public bool Alcohol { get; set; }
    public bool RewardItem { get; set; }
    public bool OnlineItem { get; set; }
    public bool Status { get; set; }

    // Available Sizes
    public List<AvailableSize> AvailableSizes { get; set; } = new();
}
