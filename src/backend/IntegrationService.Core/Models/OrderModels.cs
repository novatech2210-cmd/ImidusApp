using System.Collections.Generic;

namespace IntegrationService.Core.Models
{
    public class CreateOrderRequest
    {
        public int? CustomerID { get; set; }
        public bool IsTakeout { get; set; }
        public decimal DeliveryCharge { get; set; }
        public decimal TipAmount { get; set; }
        public int? OnlineOrderCompanyID { get; set; }
        public string? OnlineOrderNumber { get; set; }
        public string? CustomerName { get; set; }
        public string? PaymentAuthCode { get; set; }
        public int? PaymentBatchNo { get; set; }
        public int PaymentTypeID { get; set; }
        public List<OrderItemRequest> Items { get; set; } = new List<OrderItemRequest>();
    }

    public class OrderItemRequest
    {
        public int MenuItemId { get; set; }
        public int SizeId { get; set; }
        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public string? Tastes { get; set; }
        public string? SideDishes { get; set; }
    }
}
