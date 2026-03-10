using IntegrationService.API.DTOs;
using IntegrationService.Core.Entities;
using IntegrationService.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace IntegrationService.API.Controllers
{
    /// <summary>
    /// Marketing Rules API for Admin Portal
    /// SSOT Compliant: Rules stored in IntegrationService database (overlay)
    /// NOT in INI_Restaurant database (source of truth)
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class MarketingRulesController : ControllerBase
    {
        private readonly IMarketingRuleRepository _ruleRepo;
        private readonly IUpsellService _upsellService;
        private readonly ILogger<MarketingRulesController> _logger;

        public MarketingRulesController(
            IMarketingRuleRepository ruleRepo,
            IUpsellService upsellService,
            ILogger<MarketingRulesController> logger)
        {
            _ruleRepo = ruleRepo;
            _upsellService = upsellService;
            _logger = logger;
        }

        /// <summary>
        /// Get all marketing rules
        /// </summary>
        [HttpGet]
        public async Task<ActionResult> GetAll([FromQuery] bool activeOnly = false)
        {
            var rules = await _ruleRepo.GetAllAsync(activeOnly);

            var dtos = rules.Select(r => new MarketingRuleDto
            {
                Id = r.Id,
                Name = r.Name,
                Description = r.Description,
                TriggerItemId = r.TriggerItemId,
                TriggerItemName = r.TriggerItemName,
                SuggestItemId = r.SuggestItemId,
                SuggestItemName = r.SuggestItemName,
                SuggestionMessage = r.SuggestionMessage,
                DiscountPercent = r.DiscountPercent,
                Priority = r.Priority,
                IsActive = r.IsActive,
                MaxUsagePerOrder = r.MaxUsagePerOrder,
                StartTime = r.StartTime,
                EndTime = r.EndTime,
                DaysOfWeek = r.DaysOfWeek,
                MinOrderSubtotal = r.MinOrderSubtotal,
                TargetLoyaltyTier = r.TargetLoyaltyTier,
                CreatedAt = r.CreatedAt,
                TimesShown = r.TimesShown,
                TimesAccepted = r.TimesAccepted,
                ConversionRate = r.ConversionRate
            });

            return Ok(dtos);
        }

        /// <summary>
        /// Get a specific marketing rule by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult> GetById(int id)
        {
            var rule = await _ruleRepo.GetByIdAsync(id);
            if (rule == null)
            {
                return NotFound(new { error = "Marketing rule not found" });
            }

            var dto = new MarketingRuleDto
            {
                Id = rule.Id,
                Name = rule.Name,
                Description = rule.Description,
                TriggerItemId = rule.TriggerItemId,
                TriggerItemName = rule.TriggerItemName,
                SuggestItemId = rule.SuggestItemId,
                SuggestItemName = rule.SuggestItemName,
                SuggestionMessage = rule.SuggestionMessage,
                DiscountPercent = rule.DiscountPercent,
                Priority = rule.Priority,
                IsActive = rule.IsActive,
                MaxUsagePerOrder = rule.MaxUsagePerOrder,
                StartTime = rule.StartTime,
                EndTime = rule.EndTime,
                DaysOfWeek = rule.DaysOfWeek,
                MinOrderSubtotal = rule.MinOrderSubtotal,
                TargetLoyaltyTier = rule.TargetLoyaltyTier,
                CreatedAt = rule.CreatedAt,
                TimesShown = rule.TimesShown,
                TimesAccepted = rule.TimesAccepted,
                ConversionRate = rule.ConversionRate
            };

            return Ok(dto);
        }

        /// <summary>
        /// Create a new marketing rule
        /// </summary>
        [HttpPost]
        public async Task<ActionResult> Create([FromBody] CreateMarketingRuleRequest request)
        {
            try
            {
                var rule = new MarketingRule
                {
                    Name = request.Name,
                    Description = request.Description,
                    TriggerItemId = request.TriggerItemId,
                    TriggerItemName = request.TriggerItemName,
                    SuggestItemId = request.SuggestItemId,
                    SuggestItemName = request.SuggestItemName,
                    SuggestionMessage = request.SuggestionMessage,
                    DiscountPercent = request.DiscountPercent,
                    Priority = request.Priority,
                    IsActive = request.IsActive,
                    MaxUsagePerOrder = request.MaxUsagePerOrder,
                    StartTime = request.StartTime,
                    EndTime = request.EndTime,
                    DaysOfWeek = request.DaysOfWeek,
                    MinOrderSubtotal = request.MinOrderSubtotal,
                    TargetLoyaltyTier = request.TargetLoyaltyTier,
                    CreatedBy = User.Identity?.Name ?? "system"
                };

                var id = await _ruleRepo.CreateAsync(rule);

                _logger.LogInformation("Marketing rule {RuleId} created by {User}", id, User.Identity?.Name);

                return Ok(new { success = true, id, message = "Rule created successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating marketing rule");
                return StatusCode(500, new { error = "Failed to create rule", details = ex.Message });
            }
        }

        /// <summary>
        /// Update an existing marketing rule
        /// </summary>
        [HttpPut("{id}")]
        public async Task<ActionResult> Update(int id, [FromBody] UpdateMarketingRuleRequest request)
        {
            if (id != request.Id)
            {
                return BadRequest(new { error = "ID mismatch" });
            }

            try
            {
                var existing = await _ruleRepo.GetByIdAsync(id);
                if (existing == null)
                {
                    return NotFound(new { error = "Marketing rule not found" });
                }

                existing.Name = request.Name;
                existing.Description = request.Description;
                existing.TriggerItemId = request.TriggerItemId;
                existing.TriggerItemName = request.TriggerItemName;
                existing.SuggestItemId = request.SuggestItemId;
                existing.SuggestItemName = request.SuggestItemName;
                existing.SuggestionMessage = request.SuggestionMessage;
                existing.DiscountPercent = request.DiscountPercent;
                existing.Priority = request.Priority;
                existing.IsActive = request.IsActive;
                existing.MaxUsagePerOrder = request.MaxUsagePerOrder;
                existing.StartTime = request.StartTime;
                existing.EndTime = request.EndTime;
                existing.DaysOfWeek = request.DaysOfWeek;
                existing.MinOrderSubtotal = request.MinOrderSubtotal;
                existing.TargetLoyaltyTier = request.TargetLoyaltyTier;

                var success = await _ruleRepo.UpdateAsync(existing);

                if (success)
                {
                    _logger.LogInformation("Marketing rule {RuleId} updated by {User}", id, User.Identity?.Name);
                    return Ok(new { success = true, message = "Rule updated successfully" });
                }

                return BadRequest(new { error = "Failed to update rule" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating marketing rule {RuleId}", id);
                return StatusCode(500, new { error = "Failed to update rule", details = ex.Message });
            }
        }

        /// <summary>
        /// Delete a marketing rule
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(int id)
        {
            try
            {
                var existing = await _ruleRepo.GetByIdAsync(id);
                if (existing == null)
                {
                    return NotFound(new { error = "Marketing rule not found" });
                }

                var success = await _ruleRepo.DeleteAsync(id);

                if (success)
                {
                    _logger.LogInformation("Marketing rule {RuleId} deleted by {User}", id, User.Identity?.Name);
                    return Ok(new { success = true, message = "Rule deleted successfully" });
                }

                return BadRequest(new { error = "Failed to delete rule" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting marketing rule {RuleId}", id);
                return StatusCode(500, new { error = "Failed to delete rule", details = ex.Message });
            }
        }

        /// <summary>
        /// Toggle rule active status
        /// </summary>
        [HttpPost("{id}/toggle")]
        public async Task<ActionResult> ToggleStatus(int id)
        {
            try
            {
                var existing = await _ruleRepo.GetByIdAsync(id);
                if (existing == null)
                {
                    return NotFound(new { error = "Marketing rule not found" });
                }

                existing.IsActive = !existing.IsActive;
                var success = await _ruleRepo.UpdateAsync(existing);

                if (success)
                {
                    return Ok(new
                    {
                        success = true,
                        isActive = existing.IsActive,
                        message = $"Rule {(existing.IsActive ? "activated" : "deactivated")} successfully"
                    });
                }

                return BadRequest(new { error = "Failed to toggle rule status" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error toggling marketing rule {RuleId}", id);
                return StatusCode(500, new { error = "Failed to toggle rule status", details = ex.Message });
            }
        }

        /// <summary>
        /// Get upsell analytics
        /// </summary>
        [HttpGet("analytics")]
        public async Task<ActionResult<UpsellAnalyticsDto>> GetAnalytics()
        {
            var analytics = await _upsellService.GetAnalyticsAsync();

            return Ok(new UpsellAnalyticsDto
            {
                TotalRules = analytics.TotalRules,
                ActiveRules = analytics.ActiveRules,
                TotalSuggestionsShown = analytics.TotalSuggestionsShown,
                TotalSuggestionsAccepted = analytics.TotalSuggestionsAccepted,
                OverallConversionRate = analytics.OverallConversionRate,
                TopPerformingRules = analytics.TopPerformingRules.Select(r => new RulePerformanceDto
                {
                    RuleId = r.RuleId,
                    RuleName = r.RuleName,
                    TimesShown = r.TimesShown,
                    TimesAccepted = r.TimesAccepted,
                    ConversionRate = r.ConversionRate,
                    TotalRevenueGenerated = r.TotalRevenueGenerated
                }).ToList()
            });
        }

        /// <summary>
        /// Evaluate upsell suggestions for a cart (public endpoint for web/mobile)
        /// </summary>
        [HttpPost("evaluate")]
        [AllowAnonymous]
        public async Task<ActionResult> Evaluate([FromBody] API.DTOs.EvaluateUpsellRequest request)
        {
            try
            {
                // Map API DTO to Core model
                var coreRequest = new Core.Interfaces.EvaluateUpsellRequest
                {
                    CartItems = request.CartItems.Select(c => new Core.Interfaces.CartItemForUpsell
                    {
                        MenuItemId = c.MenuItemId,
                        Name = c.Name,
                        Quantity = c.Quantity,
                        UnitPrice = c.UnitPrice
                    }).ToList(),
                    CartSubtotal = request.CartSubtotal,
                    CustomerLoyaltyTier = request.CustomerLoyaltyTier,
                    ScheduledOrderId = request.ScheduledOrderId,
                    SessionId = request.SessionId
                };

                var suggestions = await _upsellService.EvaluateUpsellSuggestionsAsync(coreRequest);

                return Ok(suggestions);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error evaluating upsell suggestions");
                return StatusCode(500, new { error = "Failed to evaluate upsells", details = ex.Message });
            }
        }

        /// <summary>
        /// Record that user accepted an upsell suggestion
        /// </summary>
        [HttpPost("accept")]
        public async Task<ActionResult<AcceptUpsellResponse>> Accept([FromBody] AcceptUpsellRequest request)
        {
            try
            {
                var result = await _upsellService.AcceptUpsellSuggestionAsync(
                    request.RuleId,
                    request.ScheduledOrderId,
                    request.SessionId
                );

                if (result.Success)
                {
                    return Ok(new AcceptUpsellResponse
                    {
                        Success = true,
                        Message = result.Message,
                        SuggestedItemId = result.SuggestedItemId,
                        SuggestedItemName = result.SuggestedItemName,
                        DiscountApplied = result.DiscountApplied
                    });
                }

                return BadRequest(new AcceptUpsellResponse
                {
                    Success = false,
                    Message = result.Message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error accepting upsell suggestion for rule {RuleId}", request.RuleId);
                return StatusCode(500, new AcceptUpsellResponse
                {
                    Success = false,
                    Message = "Failed to process upsell acceptance"
                });
            }
        }
    }
}
