namespace IntegrationService.Core.Domain.Entities;

/// <summary>
/// Tracks notification status for online orders without modifying POS schema (tblSales).
/// Uses SalesId to link to tblSales.ID (POS database).
/// </summary>
public class OnlineOrderStatus
{
    /// <summary>
    /// Primary key for OnlineOrderStatus table.
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Foreign key to tblSales.ID in POS database.
    /// Unique index ensures one status record per order.
    /// </summary>
    public int SalesId { get; set; }

    /// <summary>
    /// Tracks if "Order ready for pickup" notification has been sent.
    /// Prevents duplicate ready notifications.
    /// </summary>
    public bool ReadyNotificationSent { get; set; }

    /// <summary>
    /// Tracks if "Order confirmed" notification has been sent.
    /// Prevents duplicate confirmation notifications.
    /// </summary>
    public bool ConfirmationNotificationSent { get; set; }

    /// <summary>
    /// Last polling check timestamp (UTC).
    /// Used for debugging and monitoring polling activity.
    /// </summary>
    public DateTime LastCheckedAt { get; set; }

    /// <summary>
    /// Record creation timestamp (UTC).
    /// </summary>
    public DateTime CreatedAt { get; set; }
}
