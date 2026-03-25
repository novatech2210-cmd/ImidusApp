using IntegrationService.Core.Domain.Entities;
using IntegrationService.Core.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace IntegrationService.Core.Interfaces
{
    /// <summary>
    /// Rule-based upselling service interface
    /// NOT AI/ML - deterministic rule engine configured in Admin Portal
    /// </summary>
    public interface IUpsellService
    {
        /// <summary>
        /// Legacy method - simple category-based suggestions
        /// </summary>
        Task<IEnumerable<MenuItem>> GetUpsellSuggestionsAsync(int[] currentItemIds);

        /// <summary>
        /// Evaluate rules against current cart and return matching suggestions
        /// </summary>
        Task<List<UpsellSuggestion>> EvaluateUpsellSuggestionsAsync(EvaluateUpsellRequest request);

        /// <summary>
        /// Record that customer accepted an upsell suggestion
        /// </summary>
        Task<AcceptUpsellResult> AcceptUpsellSuggestionAsync(int ruleId, int? scheduledOrderId, string? sessionId);

        /// <summary>
        /// Get analytics for upsell performance
        /// </summary>
        Task<UpsellAnalytics> GetAnalyticsAsync();
    }

    /// <summary>
    /// Request to evaluate upsell suggestions
    /// </summary>
    public class EvaluateUpsellRequest
    {
        public List<CartItemForUpsell> CartItems { get; set; } = new();
        public decimal CartSubtotal { get; set; }
        public string? CustomerLoyaltyTier { get; set; }
        public int? ScheduledOrderId { get; set; }
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
    /// Upsell suggestion result
    /// </summary>
    public class UpsellSuggestion
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
    /// Result of accepting an upsell
    /// </summary>
    public class AcceptUpsellResult
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public int? SuggestedItemId { get; set; }
        public string? SuggestedItemName { get; set; }
        public decimal? DiscountApplied { get; set; }
    }

    /// <summary>
    /// Analytics data for upsell performance
    /// </summary>
    public class UpsellAnalytics
    {
        public int TotalRules { get; set; }
        public int ActiveRules { get; set; }
        public int TotalSuggestionsShown { get; set; }
        public int TotalSuggestionsAccepted { get; set; }
        public decimal OverallConversionRate { get; set; }
        public List<RulePerformance> TopPerformingRules { get; set; } = new();
    }

    public class RulePerformance
    {
        public int RuleId { get; set; }
        public string RuleName { get; set; } = string.Empty;
        public int TimesShown { get; set; }
        public int TimesAccepted { get; set; }
        public decimal ConversionRate { get; set; }
        public decimal? TotalRevenueGenerated { get; set; }
    }
}
