using IntegrationService.Core.Domain.Entities;
using IntegrationService.Core.Entities;
using IntegrationService.Core.Interfaces;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace IntegrationService.Core.Services
{
    /// <summary>
    /// Rule-based upselling engine (NOT AI/ML)
    /// 
    /// Logic:
    /// 1. Get active marketing rules from IntegrationService database (overlay)
    /// 2. Check each rule against current cart contents
    /// 3. Filter by: time constraints, day of week, cart value, customer tier
    /// 4. Return matching suggestions sorted by priority
    /// 5. Track impressions for analytics
    /// 
    /// SSOT Compliant:
    /// - Rules stored in IntegrationService database (MarketingRules table)
    /// - Reads item details from POS database (tblItem) - read-only
    /// - Never writes to POS database directly
    /// </summary>
    public class UpsellService : IUpsellService
    {
        private readonly IMarketingRuleRepository _ruleRepo;
        private readonly IMenuRepository _menuRepo;
        private readonly IPosRepository _posRepo;
        private readonly ILogger<UpsellService> _logger;

        public UpsellService(
            IMarketingRuleRepository ruleRepo,
            IMenuRepository menuRepo,
            IPosRepository posRepo,
            ILogger<UpsellService> logger)
        {
            _ruleRepo = ruleRepo;
            _menuRepo = menuRepo;
            _posRepo = posRepo;
            _logger = logger;
        }

        /// <summary>
        /// Legacy method - simple category-based suggestions
        /// </summary>
        public async Task<IEnumerable<MenuItem>> GetUpsellSuggestionsAsync(int[] currentItemIds)
        {
            var onlineItems = await _posRepo.GetActiveMenuItemsAsync();
            
            return onlineItems
                .Where(i => !currentItemIds.Contains(i.ItemID))
                .Take(3);
        }

        /// <summary>
        /// Evaluate rules against current cart and return matching suggestions
        /// </summary>
        public async Task<List<UpsellSuggestion>> EvaluateUpsellSuggestionsAsync(EvaluateUpsellRequest request)
        {
            var suggestions = new List<UpsellSuggestion>();

            var cartItemIds = request.CartItems.Select(i => i.MenuItemId).ToHashSet();
            var rules = await _ruleRepo.GetActiveRulesAsync();

            foreach (var rule in rules)
            {
                try
                {
                    if (!await RuleMatchesContextAsync(rule, request, cartItemIds))
                    {
                        continue;
                    }

                    var suggestedItem = await _menuRepo.GetItemByIdAsync(rule.SuggestItemId);
                    if (suggestedItem == null)
                    {
                        _logger.LogWarning("Suggested item {ItemId} not found in POS database for rule {RuleId}",
                            rule.SuggestItemId, rule.Id);
                        continue;
                    }

                    // Get price from first available size
                    var firstSize = suggestedItem.AvailableSizes.FirstOrDefault();
                    var basePrice = firstSize?.UnitPrice ?? 0m;

                    decimal? discountedPrice = null;
                    string? discountMessage = null;
                    if (rule.DiscountPercent.HasValue && rule.DiscountPercent > 0)
                    {
                        discountedPrice = basePrice * (1 - rule.DiscountPercent.Value / 100m);
                        discountMessage = $"Save {rule.DiscountPercent}% when added!";
                    }

                    var suggestion = new UpsellSuggestion
                    {
                        RuleId = rule.Id,
                        RuleName = rule.Name,
                        Message = rule.SuggestionMessage,
                        SuggestItemId = rule.SuggestItemId,
                        SuggestItemName = suggestedItem.IName,
                        SuggestItemDescription = suggestedItem.ItemDescription,
                        SuggestItemImageUrl = suggestedItem.ImageFilePath,
                        SuggestItemPrice = basePrice,
                        DiscountPercent = rule.DiscountPercent,
                        DiscountedPrice = discountedPrice,
                        DiscountMessage = discountMessage
                    };

                    suggestions.Add(suggestion);

                    _ = Task.Run(async () =>
                    {
                        await _ruleRepo.IncrementTimesShownAsync(rule.Id);
                        await _ruleRepo.AddTrackingAsync(new UpsellTracking
                        {
                            ScheduledOrderId = request.ScheduledOrderId,
                            SessionId = request.SessionId,
                            MarketingRuleId = rule.Id,
                            WasAccepted = false,
                            DiscountApplied = discountedPrice
                        });
                    });
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error evaluating rule {RuleId}", rule.Id);
                }
            }

            return suggestions
                .OrderByDescending(s => s.DiscountPercent.HasValue ? 1 : 0)
                .ThenBy(s => s.RuleId)
                .Take(3)
                .ToList();
        }

        private async Task<bool> RuleMatchesContextAsync(
            MarketingRule rule, 
            EvaluateUpsellRequest request, 
            HashSet<int> cartItemIds)
        {
            if (!rule.IsCurrentlyActive())
            {
                return false;
            }

            if (!cartItemIds.Contains(rule.TriggerItemId))
            {
                return false;
            }

            if (cartItemIds.Contains(rule.SuggestItemId))
            {
                return false;
            }

            if (rule.MinOrderSubtotal.HasValue && request.CartSubtotal < rule.MinOrderSubtotal.Value)
            {
                return false;
            }

            if (!string.IsNullOrEmpty(rule.TargetLoyaltyTier))
            {
                var customerTier = request.CustomerLoyaltyTier?.ToLower() ?? "none";
                var targetTier = rule.TargetLoyaltyTier.ToLower();
                
                if (customerTier != targetTier)
                {
                    return false;
                }
            }

            if (rule.MaxUsagePerOrder.HasValue && request.ScheduledOrderId.HasValue)
            {
                var tracking = await _ruleRepo.GetTrackingByOrderIdAsync(request.ScheduledOrderId.Value);
                var shownCount = tracking.Count(t => t.MarketingRuleId == rule.Id);
                
                if (shownCount >= rule.MaxUsagePerOrder.Value)
                {
                    return false;
                }
            }

            return true;
        }

        /// <summary>
        /// Record that customer accepted an upsell suggestion
        /// </summary>
        public async Task<AcceptUpsellResult> AcceptUpsellSuggestionAsync(int ruleId, int? scheduledOrderId, string? sessionId)
        {
            try
            {
                var rule = await _ruleRepo.GetByIdAsync(ruleId);
                if (rule == null)
                {
                    return new AcceptUpsellResult
                    {
                        Success = false,
                        Message = "Rule not found"
                    };
                }

                await _ruleRepo.IncrementTimesAcceptedAsync(ruleId);

                var item = await _menuRepo.GetItemByIdAsync(rule.SuggestItemId);
                if (item == null)
                {
                    return new AcceptUpsellResult
                    {
                        Success = false,
                        Message = "Suggested item not found"
                    };
                }

                decimal? discountApplied = null;
                if (rule.DiscountPercent.HasValue && rule.DiscountPercent > 0)
                {
                    var firstSize = item.AvailableSizes.FirstOrDefault();
                    var basePrice = firstSize?.UnitPrice ?? 0m;
                    discountApplied = basePrice * (rule.DiscountPercent.Value / 100m);
                }

                if (scheduledOrderId.HasValue)
                {
                    var tracking = await _ruleRepo.GetTrackingByOrderIdAsync(scheduledOrderId.Value);
                    var record = tracking.FirstOrDefault(t => t.MarketingRuleId == ruleId && !t.WasAccepted);
                    if (record != null)
                    {
                        await _ruleRepo.UpdateTrackingAcceptedAsync(record.Id);
                    }
                }

                _logger.LogInformation(
                    "Upsell accepted: Rule {RuleId} ({RuleName}), Item {ItemId}, Discount {Discount}",
                    ruleId, rule.Name, rule.SuggestItemId, discountApplied);

                return new AcceptUpsellResult
                {
                    Success = true,
                    Message = "Upsell accepted successfully",
                    SuggestedItemId = rule.SuggestItemId,
                    SuggestedItemName = item.IName,
                    DiscountApplied = discountApplied
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error accepting upsell suggestion for rule {RuleId}", ruleId);
                return new AcceptUpsellResult
                {
                    Success = false,
                    Message = "Failed to process upsell acceptance"
                };
            }
        }

        /// <summary>
        /// Get analytics for upsell performance
        /// </summary>
        public async Task<UpsellAnalytics> GetAnalyticsAsync()
        {
            var rules = await _ruleRepo.GetAllAsync(activeOnly: false);

            var totalShown = rules.Sum(r => r.TimesShown);
            var totalAccepted = rules.Sum(r => r.TimesAccepted);

            var topRules = rules
                .Where(r => r.TimesShown > 0)
                .OrderByDescending(r => r.ConversionRate)
                .Take(5)
                .Select(r => new RulePerformance
                {
                    RuleId = r.Id,
                    RuleName = r.Name,
                    TimesShown = r.TimesShown,
                    TimesAccepted = r.TimesAccepted,
                    ConversionRate = r.ConversionRate
                })
                .ToList();

            return new UpsellAnalytics
            {
                TotalRules = rules.Count(),
                ActiveRules = rules.Count(r => r.IsActive),
                TotalSuggestionsShown = totalShown,
                TotalSuggestionsAccepted = totalAccepted,
                OverallConversionRate = totalShown > 0 ? (decimal)totalAccepted / totalShown * 100 : 0,
                TopPerformingRules = topRules
            };
        }
    }
}
