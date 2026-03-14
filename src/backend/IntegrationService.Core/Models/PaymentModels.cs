namespace IntegrationService.Core.Models
{
    /// <summary>
    /// Request to charge a credit card using an opaque payment token
    /// </summary>
    public class PaymentRequest
    {
        /// <summary>
        /// Opaque payment token from mobile tokenization
        /// </summary>
        public PaymentToken Token { get; set; } = null!;

        /// <summary>
        /// Amount to charge in dollars
        /// </summary>
        public decimal Amount { get; set; }

        /// <summary>
        /// POS Sales ID for transaction linkage
        /// </summary>
        public int SalesId { get; set; }

        /// <summary>
        /// Customer ID (optional, for saved cards and loyalty points)
        /// </summary>
        public int? CustomerId { get; set; }

        /// <summary>
        /// Loyalty points to redeem for discount (100 points = $1)
        /// </summary>
        public int PointsToRedeem { get; set; }

        /// <summary>
        /// Daily order number for invoice reference
        /// </summary>
        public int DailyOrderNumber { get; set; }
    }

    /// <summary>
    /// Opaque data token from Authorize.net Accept.js
    /// Single-use token with 15-minute expiration
    /// </summary>
    public class PaymentToken
    {
        /// <summary>
        /// Token descriptor (typically "COMMON.ACCEPT.INAPP.PAYMENT")
        /// </summary>
        public string DataDescriptor { get; set; } = string.Empty;

        /// <summary>
        /// Opaque token value (actual encrypted payment data)
        /// </summary>
        public string DataValue { get; set; } = string.Empty;
    }

    /// <summary>
    /// Result of a payment transaction
    /// </summary>
    public class PaymentResult
    {
        /// <summary>
        /// True if payment was successfully authorized and captured
        /// </summary>
        public bool Success { get; set; }

        /// <summary>
        /// Authorize.net transaction ID (required for voids/refunds)
        /// </summary>
        public string? TransactionId { get; set; }

        /// <summary>
        /// Authorization code from card processor
        /// </summary>
        public string? AuthorizationCode { get; set; }

        /// <summary>
        /// Last 4 digits of card (masked)
        /// </summary>
        public string? Last4Digits { get; set; }

        /// <summary>
        /// Card type (Visa, MasterCard, Amex, Discover)
        /// </summary>
        public string? CardType { get; set; }

        /// <summary>
        /// Error message if transaction failed
        /// </summary>
        public string? ErrorMessage { get; set; }

        /// <summary>
        /// Error code if transaction failed
        /// </summary>
        public string? ErrorCode { get; set; }
    }

    /// <summary>
    /// Request to save a card as a customer profile for future charges
    /// </summary>
    public class SavedCardRequest
    {
        /// <summary>
        /// Customer ID from POS system
        /// </summary>
        public int CustomerId { get; set; }

        /// <summary>
        /// Opaque payment token from mobile tokenization
        /// </summary>
        public PaymentToken PaymentToken { get; set; } = null!;

        /// <summary>
        /// Customer email address
        /// </summary>
        public string Email { get; set; } = string.Empty;
    }

    /// <summary>
    /// Result of creating a customer payment profile
    /// </summary>
    public class CustomerProfileResult
    {
        /// <summary>
        /// True if profile was created successfully
        /// </summary>
        public bool Success { get; set; }

        /// <summary>
        /// Authorize.net customer profile ID
        /// </summary>
        public string? ProfileId { get; set; }

        /// <summary>
        /// Authorize.net payment profile ID
        /// </summary>
        public string? PaymentProfileId { get; set; }

        /// <summary>
        /// Error message if profile creation failed
        /// </summary>
        public string? ErrorMessage { get; set; }
    }
}
