namespace IntegrationService.Core.Models.AdminPortal
{
    /// <summary>
    /// DTO for order queue list display
    /// </summary>
    public class OrderQueueDto
    {
        public int Id { get; set; }  // SalesID
        public string OrderNumber { get; set; } = string.Empty;  // DailyOrderNumber (padded)
        public string CustomerName { get; set; } = string.Empty;
        public string? CustomerPhone { get; set; }
        public int Total { get; set; }  // In cents for frontend
        public string Status { get; set; } = string.Empty;  // pending/completed/cancelled/refunded/ready
        public string PaymentStatus { get; set; } = string.Empty;  // paid/pending/failed/refunded
        public string PaymentMethod { get; set; } = string.Empty;  // Visa/MC/Cash etc
        public DateTime CreatedAt { get; set; }  // SaleDateTime
        public int TransType { get; set; }  // Raw TransType for reference
    }

    /// <summary>
    /// DTO for full order detail view
    /// </summary>
    public class OrderDetailDto
    {
        public int Id { get; set; }
        public int SalesId { get; set; }
        public string OrderNumber { get; set; } = string.Empty;
        public string CustomerName { get; set; } = string.Empty;
        public string? CustomerEmail { get; set; }
        public string? CustomerPhone { get; set; }
        public string? CustomerAddress { get; set; }
        public List<OrderItemDto> Items { get; set; } = new();
        public int Subtotal { get; set; }  // Cents
        public int GstAmt { get; set; }  // Cents
        public int PstAmt { get; set; }  // Cents
        public int Total { get; set; }  // Cents
        public string Status { get; set; } = string.Empty;
        public string PaymentMethod { get; set; } = string.Empty;
        public string PaymentStatus { get; set; } = string.Empty;
        public int TransType { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? PaidAt { get; set; }
        public DateTime? ReadyAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public string? Notes { get; set; }
    }

    /// <summary>
    /// DTO for order line items
    /// </summary>
    public class OrderItemDto
    {
        public int Id { get; set; }
        public int ItemId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? SizeName { get; set; }
        public int Quantity { get; set; }
        public int Price { get; set; }  // Line total in cents
    }

    /// <summary>
    /// Aggregation of item sales for reporting
    /// </summary>
    public class ItemSalesAggregation
    {
        public int ItemId { get; set; }
        public string Name { get; set; } = string.Empty;
        public int QuantitySold { get; set; }
        public decimal TotalRevenue { get; set; }
    }
}
