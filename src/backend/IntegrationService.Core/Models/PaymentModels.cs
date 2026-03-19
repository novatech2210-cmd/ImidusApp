namespace IntegrationService.Core.Models
{
    /// <summary>
    /// Represents a payment request, including amount, token, and customer information.
    /// </summary>
    public class PaymentRequest
    {
        public OpaqueDataType Token { get; set; } = new(); // This should be an OpaqueDataType or similar
        public decimal Amount { get; set; }
        public int SalesId { get; set; }
        public int? CustomerId { get; set; }
        public int PointsToRedeem { get; set; } = 0;
        public int? DailyOrderNumber { get; set; } // For logging/reference
        public decimal TipAmount { get; set; } = 0;
        public int PaymentTypeID { get; set; }
        public string? PaymentAuthCode { get; set; } // For recorded payments
        public int? PaymentBatchNo { get; set; } // For recorded payments
    }

    /// <summary>
    /// Represents the result of a payment transaction.
    /// </summary>
    public class PaymentResult
    {
        public bool Success { get; set; }
        public string? TransactionId { get; set; }
        public string? AuthorizationCode { get; set; }
        public string? Last4Digits { get; set; } // From tokenized card
        public string? CardType { get; set; }    // e.g., Visa, MasterCard
        public string? ErrorMessage { get; set; }
        public string? ErrorCode { get; set; }
    }

    /// <summary>
    /// Represents a tokenized payment method for saving a card.
    /// </summary>
    public class SavedCardRequest
    {
        public OpaqueDataType PaymentToken { get; set; } = new();
        public int CustomerId { get; set; }
        public string Email { get; set; } = string.Empty;
    }

    /// <summary>
    /// Represents the result of creating a customer payment profile.
    /// </summary>
    public class CustomerProfileResult
    {
        public bool Success { get; set; }
        public string? ProfileId { get; set; }
        public string? PaymentProfileId { get; set; }
        public string? ErrorMessage { get; set; }
    }

    /// <summary>
    /// Represents the result of completing an order after payment.
    /// </summary>
    public class OrderCompletionResult
    {
        public bool Success { get; set; }
        public string? TransactionId { get; set; } // Authorize.net transaction ID
        public int TicketId { get; set; }        // POS SalesID
        public int? DailyOrderNumber { get; set; } // POS Daily Order Number
        public string? ErrorMessage { get; set; }
    }

    // Placeholder for Authorize.Net's OpaqueDataType if it's not directly available in SDK
    // In a real scenario, you'd ensure the AuthorizeNet SDK provides this or define it.
    // For now, we'll use a simple string for simplicity in this example, but it should be structured.
    // The SDK uses a complex object, so this is a simplification for demonstration.
    // If the SDK is correctly referenced, it should provide opaqueDataType.
    // For the purpose of this example, let's assume `PaymentRequest.Token` and `SavedCardRequest.PaymentToken`
    // are represented by a structure that holds these two properties.
    public class OpaqueDataType
    {
        public string DataDescriptor { get; set; } = string.Empty;
        public string DataValue { get; set; } = string.Empty;
    }
}
