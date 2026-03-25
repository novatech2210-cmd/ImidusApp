namespace IntegrationService.Core.Models.AdminPortal
{
    /// <summary>
    /// Terminal bridge transaction (SSOT: IntegrationService overlay table)
    /// For Verifone/Ingenico integration
    /// </summary>
    public class TerminalBridgeTransaction
    {
        public int Id { get; set; }
        public int SalesID { get; set; }
        public string OrderNumber { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        
        // Bridge Request/Response
        public string BridgeRequestId { get; set; } = string.Empty;
        public string? BridgeRequestData { get; set; } // JSON
        public string? BridgeResponseData { get; set; } // JSON
        
        // Status
        public string Status { get; set; } = "pending"; // pending, processing, approved, declined, error
        public string? StatusMessage { get; set; }
        
        // Card Info (tokenized)
        public string? CardLastFour { get; set; }
        public string? CardType { get; set; }
        public string? AuthCode { get; set; }
        public string? TransactionId { get; set; }
        
        // Receipt
        public string? ReceiptData { get; set; } // JSON
        
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
    }
}
