using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IntegrationService.Core.Entities
{
    /// <summary>
    /// Scheduled Orders - Stored in IntegrationService database (overlay)
    /// NOT in INI_Restaurant database (source of truth) - SSOT compliant
    /// Orders stay here until release time, then written to POS database
    /// </summary>
    [Table("ScheduledOrders")]
    public class ScheduledOrder
    {
        [Key]
        public int Id { get; set; }

        // Reference to POS customer (tblCustomer.CustomerNum)
        [Required]
        public int PosCustomerId { get; set; }

        // Customer info snapshot (in case POS customer changes)
        [MaxLength(100)]
        public string CustomerFirstName { get; set; }

        [MaxLength(100)]
        public string CustomerLastName { get; set; }

        [MaxLength(20)]
        public string CustomerPhone { get; set; }

        // When the order should be released to POS (kitchen prep time)
        [Required]
        public DateTime ScheduledDateTime { get; set; }

        // When the order was actually released to POS (null until released)
        public DateTime? ReleasedDateTime { get; set; }

        // Current status
        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = "pending"; // pending, released, cancelled, failed

        // Order items (JSON for flexibility)
        [Required]
        public string ItemsJson { get; set; }

        // Totals (stored for quick reference)
        [Column(TypeName = "decimal(18,2)")]
        public decimal Subtotal { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal TaxAmount { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalAmount { get; set; }

        // Payment info (Authorize.net token)
        [MaxLength(500)]
        public string PaymentAuthorizationNo { get; set; }

        [MaxLength(10)]
        public string PaymentBatchNo { get; set; }

        public int PaymentTypeId { get; set; } = 3; // Visa default

        // Tip
        [Column(TypeName = "decimal(18,2)")]
        public decimal TipAmount { get; set; }

        // Special instructions for kitchen
        [MaxLength(500)]
        public string SpecialInstructions { get; set; }

        // POS reference (populated after release)
        public int? PosSalesId { get; set; }

        [MaxLength(50)]
        public string PosOrderNumber { get; set; }

        // Idempotency key (contractual requirement)
        [Required]
        [MaxLength(100)]
        public string IdempotencyKey { get; set; }

        // Audit fields
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        [MaxLength(100)]
        public string CreatedBy { get; set; } = "system";

        // Release failure tracking
        [MaxLength(500)]
        public string ReleaseErrorMessage { get; set; } = string.Empty;

        public int ReleaseRetryCount { get; set; } = 0;

        // Helper property to check if order is ready for release
        [NotMapped]
        public bool IsReadyForRelease => 
            Status == "pending" && 
            ScheduledDateTime <= DateTime.UtcNow &&
            ReleasedDateTime == null;
    }

    /// <summary>
    /// Order item within a scheduled order
    /// </summary>
    public class ScheduledOrderItem
    {
        public int MenuItemId { get; set; }
        public string ItemName { get; set; }
        public int SizeId { get; set; }
        public string SizeName { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalPrice => Quantity * UnitPrice;
        public string SpecialInstructions { get; set; }
    }

    /// <summary>
    /// Available time slots for scheduling
    /// </summary>
    public class SchedulingTimeSlot
    {
        public TimeSpan Time { get; set; }
        public string DisplayText { get; set; }
        public bool IsAvailable { get; set; }
    }
}
