using IntegrationService.Core.Domain.Entities;

namespace IntegrationService.Core.Models;

/// <summary>
/// Order state enum
/// </summary>
public enum OrderState
{
    Open,
    AwaitingPayment,
    Completed
}

/// <summary>
/// Result DTO returned after placing an order
/// </summary>
public class OrderResult
{
    public int OrderId { get; set; }
    public int DailyOrderNumber { get; set; }
    public decimal SubTotal { get; set; }
    public decimal DSCAmt { get; set; }
    public decimal GSTAmt { get; set; }
    public decimal PSTAmt { get; set; }
    public decimal PST2Amt { get; set; }
    public decimal TotalAmount { get; set; }
    public OrderState OrderState { get; set; }
    public List<PaymentInfo> Payments { get; set; } = new();
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
}

/// <summary>
/// Payment information in order result
/// </summary>
public class PaymentInfo
{
    public decimal PaidAmount { get; set; }
    public decimal TipAmount { get; set; }
    public string? AuthorizationNo { get; set; }
    public PaymentType PaymentType { get; set; }
}

/// <summary>
/// Result of payment processing and order completion orchestration
/// </summary>
public class OrderCompletionResult
{
    /// <summary>
    /// True if payment was processed and order completed successfully
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// Authorize.net transaction ID (for refunds/voids)
    /// </summary>
    public string? TransactionId { get; set; }

    /// <summary>
    /// POS ticket ID (SalesID)
    /// </summary>
    public int? TicketId { get; set; }

    /// <summary>
    /// Daily order number for customer reference
    /// </summary>
    public int? DailyOrderNumber { get; set; }

    /// <summary>
    /// Error message if payment or completion failed
    /// </summary>
    public string? ErrorMessage { get; set; }
}
