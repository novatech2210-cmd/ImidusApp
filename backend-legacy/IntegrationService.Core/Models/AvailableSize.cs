namespace IntegrationService.Core.Models;

/// <summary>
/// AvailableSize DTO for service layer
/// </summary>
public class AvailableSize
{
    public int SizeID { get; set; }
    public string SizeName { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public decimal? UnitPrice2 { get; set; }
    public decimal? UnitPrice3 { get; set; }
    public int? OnHandQty { get; set; }
    public bool ApplyNoDSC { get; set; }

    public bool InStock => OnHandQty == null || OnHandQty > 0;
}
