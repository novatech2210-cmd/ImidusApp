using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace IntegrationService.API.DTOs
{
    /// <summary>
    /// Request to create/update a marketing rule
    /// </summary>
    public class CreateMarketingRuleRequest
    {
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? Description { get; set; }

        [Required]
        public int TriggerItemId { get; set; }

        [MaxLength(200)]
        public string? TriggerItemName { get; set; }

        [Required]
        public int SuggestItemId { get; set; }

        [MaxLength(200)]
        public string? SuggestItemName { get; set; }

        [Required]
        [MaxLength(200)]
        public string SuggestionMessage { get; set; } = "You might also like...";

        public int? DiscountPercent { get; set; }

        public int Priority { get; set; } = 100;

        public bool IsActive { get; set; } = true;

        public int? MaxUsagePerOrder { get; set; }

        public TimeSpan? StartTime { get; set; }
        public TimeSpan? EndTime { get; set; }

        public int? DaysOfWeek { get; set; } = 127;

        public decimal? MinOrderSubtotal { get; set; }

        [MaxLength(50)]
        public string? TargetLoyaltyTier { get; set; }
    }

    public class UpdateMarketingRuleRequest : CreateMarketingRuleRequest
    {
        [Required]
        public int Id { get; set; }
    }

    /// <summary>
    /// Marketing rule response
    /// </summary>
    public class MarketingRuleDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int TriggerItemId { get; set; }
        public string? TriggerItemName { get; set; }
        public int SuggestItemId { get; set; }
        public string? SuggestItemName { get; set; }
        public string SuggestionMessage { get; set; } = string.Empty;
        public int? DiscountPercent { get; set; }
        public int Priority { get; set; }
        public bool IsActive { get; set; }
        public int? MaxUsagePerOrder { get; set; }
        public TimeSpan? StartTime { get; set; }
        public TimeSpan? EndTime { get; set; }
        public int? DaysOfWeek { get; set; }
        public decimal? MinOrderSubtotal { get; set; }
        public string? TargetLoyaltyTier { get; set; }
        public DateTime CreatedAt { get; set; }
        public int TimesShown { get; set; }
        public int TimesAccepted { get; set; }
        public decimal ConversionRate { get; set; }
    }

    /// <summary>
    /// Request to evaluate upsell suggestions for current cart
    /// </summary>
    public class EvaluateUpsellRequest
    {
        [Required]
        public List<CartItemForUpsell> CartItems { get; set; } = new();

        public decimal CartSubtotal { get; set; }

        public string? CustomerLoyaltyTier { get; set; }

        public int? ScheduledOrderId { get; set; }

        [MaxLength(100)]
        public string? SessionId { get; set; }
    }

    public class CartItemForUpsell
    {
        public int MenuItemId { get; set; }
        public string Name { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
    }

    /// <summary>
    /// Upsell suggestion response
    /// </summary>
    public class UpsellSuggestionDto
    {
        public int RuleId { get; set; }
        public string RuleName { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public int SuggestItemId { get; set; }
        public string SuggestItemName { get; set; } = string.Empty;
        public string? SuggestItemDescription { get; set; }
        public string? SuggestItemImageUrl { get; set; }
        public decimal SuggestItemPrice { get; set; }
        public int? DiscountPercent { get; set; }
        public decimal? DiscountedPrice { get; set; }
        public string? DiscountMessage { get; set; }
    }

    /// <summary>
    /// Request to accept an upsell suggestion
    /// </summary>
    public class AcceptUpsellRequest
    {
        [Required]
        public int RuleId { get; set; }

        public int? ScheduledOrderId { get; set; }

        [MaxLength(100)]
        public string? SessionId { get; set; }
    }

    /// <summary>
    /// Response after accepting upsell
    /// </summary>
    public class AcceptUpsellResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public int? SuggestedItemId { get; set; }
        public string? SuggestedItemName { get; set; }
        public decimal? DiscountApplied { get; set; }
    }

    /// <summary>
    /// Analytics for marketing rules
    /// </summary>
    public class UpsellAnalyticsDto
    {
        public int TotalRules { get; set; }
        public int ActiveRules { get; set; }
        public int TotalSuggestionsShown { get; set; }
        public int TotalSuggestionsAccepted { get; set; }
        public decimal OverallConversionRate { get; set; }
        public List<RulePerformanceDto> TopPerformingRules { get; set; } = new();
    }

    public class RulePerformanceDto
    {
        public int RuleId { get; set; }
        public string RuleName { get; set; } = string.Empty;
        public int TimesShown { get; set; }
        public int TimesAccepted { get; set; }
        public decimal ConversionRate { get; set; }
        public decimal? TotalRevenueGenerated { get; set; }
    }
}
