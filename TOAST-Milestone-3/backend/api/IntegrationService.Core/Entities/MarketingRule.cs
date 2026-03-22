using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IntegrationService.Core.Entities
{
    /// <summary>
    /// Marketing Rules - Stored in IntegrationService database (overlay)
    /// NOT in INI_Restaurant database (source of truth) - SSOT compliant
    /// 
    /// Rule-based upselling engine (NOT AI/ML):
    /// - If customer has Item A in cart, suggest Item B
    /// - Simple deterministic rules configured in Admin Portal
    /// - Examples: "If Burger → suggest Fries", "If Pizza → suggest Soft Drink"
    /// </summary>
    [Table("MarketingRules")]
    public class MarketingRule
    {
        [Key]
        public int Id { get; set; }

        // Rule Identification
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? Description { get; set; }

        // Trigger Condition (what item triggers this rule)
        [Required]
        public int TriggerItemId { get; set; }  // References tblItem.ID in POS database (read-only)

        [MaxLength(200)]
        public string? TriggerItemName { get; set; } // Cached name for display

        // Suggestion (what item to recommend)
        [Required]
        public int SuggestItemId { get; set; }  // References tblItem.ID in POS database (read-only)

        [MaxLength(200)]
        public string? SuggestItemName { get; set; } // Cached name for display

        // Display Message
        [Required]
        [MaxLength(200)]
        public string SuggestionMessage { get; set; } = "You might also like...";

        // Optional: Discount incentive
        public int? DiscountPercent { get; set; } // e.g., 10 = 10% off when added together

        // Priority (higher = evaluated first)
        public int Priority { get; set; } = 100;

        // Rule Status
        public bool IsActive { get; set; } = true;

        // Usage Limits (optional)
        public int? MaxUsagePerOrder { get; set; } // How many times this suggestion can appear per order

        // Time-based availability (optional)
        public TimeSpan? StartTime { get; set; }  // e.g., Only suggest coffee in morning
        public TimeSpan? EndTime { get; set; }

        // Days of week (optional) - bit flags: 1=Mon, 2=Tue, 4=Wed, etc.
        public int? DaysOfWeek { get; set; } = 127; // All days by default (1+2+4+8+16+32+64)

        // Minimum order value to trigger (optional)
        public decimal? MinOrderSubtotal { get; set; }

        // Customer segment targeting (optional)
        [MaxLength(50)]
        public string? TargetLoyaltyTier { get; set; } // "bronze", "silver", "gold", "vip", or null for all

        // Audit
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        [MaxLength(100)]
        public string? CreatedBy { get; set; }

        // Performance tracking
        public int TimesShown { get; set; } = 0;
        public int TimesAccepted { get; set; } = 0;

        // Calculated property: Conversion rate
        [NotMapped]
        public decimal ConversionRate => TimesShown > 0 
            ? (decimal)TimesAccepted / TimesShown * 100 
            : 0;

        /// <summary>
        /// Check if rule is currently active based on time/day constraints
        /// </summary>
        public bool IsCurrentlyActive()
        {
            if (!IsActive) return false;

            var now = DateTime.Now;

            // Check day of week
            if (DaysOfWeek.HasValue)
            {
                var dayFlag = 1 << ((int)now.DayOfWeek == 0 ? 6 : (int)now.DayOfWeek - 1); // Sunday = 6, Monday = 0
                if ((DaysOfWeek.Value & dayFlag) == 0) return false;
            }

            // Check time window
            if (StartTime.HasValue && EndTime.HasValue)
            {
                var currentTime = now.TimeOfDay;
                if (currentTime < StartTime.Value || currentTime > EndTime.Value)
                    return false;
            }

            return true;
        }
    }

    /// <summary>
    /// Types of marketing rules supported
    /// </summary>
    public enum RuleType
    {
        /// <summary>
        /// If item A in cart, suggest item B
        /// </summary>
        ItemBased = 1,

        /// <summary>
        /// If cart total > X, suggest item
        /// </summary>
        CartValueBased = 2,

        /// <summary>
        /// If customer tier is X, suggest item
        /// </summary>
        TierBased = 3,

        /// <summary>
        /// Suggest complementary items (bundle)
        /// </summary>
        Complementary = 4
    }

    /// <summary>
    /// Tracks which upsell suggestions have been shown/accepted per order
    /// Used for analytics and to prevent showing same suggestion multiple times
    /// </summary>
    [Table("UpsellTracking")]
    public class UpsellTracking
    {
        [Key]
        public int Id { get; set; }

        // Can track by scheduled order ID or session ID for anonymous users
        public int? ScheduledOrderId { get; set; }

        [MaxLength(100)]
        public string? SessionId { get; set; }

        public int MarketingRuleId { get; set; }

        public bool WasAccepted { get; set; }

        public DateTime ShownAt { get; set; } = DateTime.UtcNow;

        public DateTime? AcceptedAt { get; set; }

        public decimal? DiscountApplied { get; set; }
    }
}
