namespace IntegrationService.Core.Models;

/// <summary>
/// Request DTO for placing an order
/// </summary>
public class OrderRequest
{
    public int? CustomerId { get; set; }
    public List<OrderItemRequest> Items { get; set; } = new();
    public decimal TipAmount { get; set; }
    public string? PaymentToken { get; set; }
    public int PointsToRedeem { get; set; }
    public bool TakeOut { get; set; }
    public int? TableId { get; set; }
}

/// <summary>
/// Request DTO for a single order item
/// </summary>
public class OrderItemRequest
{
    public int ItemId { get; set; }
    public int SizeId { get; set; }
    public int Quantity { get; set; } = 1;
    public string? SpecialInstructions { get; set; }
}
