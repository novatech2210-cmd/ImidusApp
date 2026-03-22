using System;
using System.Collections.Generic;

namespace IntegrationService.Core.Domain.Entities
{
    /// <summary>
    /// Marketing push notification campaign
    /// Stored in IntegrationService DB (overlay)
    /// </summary>
    public class PushCampaign
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }

        // Targeting criteria (RFM filters)
        public decimal? MinSpend { get; set; }        // Monetary: minimum lifetime spend
        public decimal? MaxSpend { get; set; }        // Monetary: maximum lifetime spend
        public int? MinVisits { get; set; }           // Frequency: minimum order count
        public int? MaxVisits { get; set; }           // Frequency: maximum order count
        public int? RecencyDays { get; set; }         // Recency: ordered within X days
        public int? InactiveDays { get; set; }        // At-risk: no order for X days
        public bool? HasBirthdayToday { get; set; }   // Birthday targeting
        public string? SegmentFilter { get; set; }    // Segment name: VIP, Loyal, At-Risk, Regular

        // Scheduling
        public DateTime? ScheduledAt { get; set; }    // Send at specific time (null = immediate)
        public string Status { get; set; } = "draft"; // draft, scheduled, sending, sent, cancelled

        // Stats
        public int TargetCount { get; set; }          // How many customers matched
        public int SentCount { get; set; }            // How many notifications sent
        public int FailedCount { get; set; }          // How many failed

        public DateTime CreatedAt { get; set; }
        public DateTime? SentAt { get; set; }
    }

    /// <summary>
    /// Scheduled future order
    /// Stored in IntegrationService DB (overlay) until injection time
    /// </summary>
    public class ScheduledOrder
    {
        public int Id { get; set; }
        public int CustomerId { get; set; }
        public string IdempotencyKey { get; set; } = string.Empty;

        // Order data (JSON serialized)
        public string OrderJson { get; set; } = string.Empty;
        public decimal SubTotal { get; set; }
        public decimal TaxAmount { get; set; }
        public decimal TotalAmount { get; set; }

        // Payment data (tokenized, no raw card data)
        public string? PaymentToken { get; set; }
        public string? CardType { get; set; }
        public string? Last4 { get; set; }

        // Scheduling
        public DateTime TargetDateTime { get; set; }  // When customer wants order ready
        public int PrepTimeMinutes { get; set; } = 30; // How early to inject into POS
        public DateTime InjectionTime => TargetDateTime.AddMinutes(-PrepTimeMinutes);

        // Status tracking
        public string Status { get; set; } = "pending"; // pending, injected, completed, cancelled, failed
        public int? SalesId { get; set; }             // POS SalesID after injection
        public string? ErrorMessage { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime? InjectedAt { get; set; }
    }

    /// <summary>
    /// Menu item overlay for online ordering
    /// Stored in IntegrationService DB (overlay)
    /// </summary>
    public class MenuOverlay
    {
        public int Id { get; set; }
        public int? ItemId { get; set; }             // References tblItem.ID in POS (null if category overlay)
        public int? CategoryId { get; set; }          // Optional: override entire category

        public bool IsEnabled { get; set; } = true;   // Show/hide in online ordering
        public string? OverrideImageUrl { get; set; } // Custom image (overrides POS)
        public string? OverrideDescription { get; set; }
        public int? DisplayOrder { get; set; }        // Custom sort order

        // Availability windows
        public TimeSpan? AvailableFrom { get; set; }  // e.g., 11:00 (lunch items)
        public TimeSpan? AvailableTo { get; set; }    // e.g., 14:00
        public string? AvailableDays { get; set; }    // e.g., "Mon,Tue,Wed,Thu,Fri"

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    /// <summary>
    /// RFM filter criteria for customer targeting
    /// </summary>
    public class RfmFilter
    {
        public decimal? MinSpend { get; set; }
        public decimal? MaxSpend { get; set; }
        public int? MinVisits { get; set; }
        public int? MaxVisits { get; set; }
        public int? RecencyDays { get; set; }
        public int? InactiveDays { get; set; }
        public string? Segment { get; set; }
        public bool? HasBirthdayToday { get; set; }
    }

    /// <summary>
    /// Customer with full RFM metrics
    /// </summary>
    public class CustomerRfmData
    {
        public int CustomerId { get; set; }
        public string? Name { get; set; }
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public int? BirthMonth { get; set; }
        public int? BirthDay { get; set; }

        // RFM Metrics
        public decimal TotalSpent { get; set; }       // Monetary
        public int OrderCount { get; set; }            // Frequency
        public int DaysSinceLastOrder { get; set; }   // Recency
        public DateTime? LastOrderDate { get; set; }

        // Derived segment
        public string Segment { get; set; } = "Regular";
        public int EarnedPoints { get; set; }
    }

    /// <summary>
    /// Marketing upsell rule
    /// Stored in IntegrationService DB (overlay)
    /// </summary>
    public class MarketingRule
    {
        public int Id { get; set; }
        public string RuleType { get; set; } = "upsell"; // upsell, crosssell, combo

        public int? TriggerItemId { get; set; }       // When this item is in cart
        public int? TriggerCategoryId { get; set; }   // Or when any item from this category
        public decimal? TriggerMinCartValue { get; set; } // Or when cart exceeds this

        public int SuggestItemId { get; set; }        // Suggest this item
        public string Message { get; set; } = string.Empty; // "Add fries for $2.99?"
        public string Position { get; set; } = "cart"; // cart, checkout, item_detail

        public bool IsActive { get; set; } = true;
        public int Priority { get; set; } = 0;        // Higher = shown first

        public DateTime CreatedAt { get; set; }
    }
}
