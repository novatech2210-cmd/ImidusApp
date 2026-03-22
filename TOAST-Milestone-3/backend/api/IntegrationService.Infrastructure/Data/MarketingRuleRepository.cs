using Dapper;
using IntegrationService.Core.Entities;
using IntegrationService.Core.Interfaces;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace IntegrationService.Infrastructure.Data
{
    /// <summary>
    /// Repository for Marketing Rules - stored in IntegrationService database (overlay)
    /// NOT in INI_Restaurant database (source of truth) - SSOT compliant
    /// </summary>
    public class MarketingRuleRepository : IMarketingRuleRepository
    {
        private readonly string _connectionString;
        private readonly ILogger<MarketingRuleRepository> _logger;

        public MarketingRuleRepository(string connectionString, ILogger<MarketingRuleRepository> logger)
        {
            _connectionString = connectionString;
            _logger = logger;
        }

        public async Task<MarketingRule?> GetByIdAsync(int id)
        {
            using var connection = new SqlConnection(_connectionString);
            const string sql = @"SELECT * FROM MarketingRules WHERE Id = @Id";
            var result = await connection.QueryFirstOrDefaultAsync<MarketingRule>(sql, new { Id = id });
            return result;
        }

        public async Task<IEnumerable<MarketingRule>> GetAllAsync(bool activeOnly = true)
        {
            using var connection = new SqlConnection(_connectionString);
            var sql = activeOnly
                ? @"SELECT * FROM MarketingRules WHERE IsActive = 1 ORDER BY Priority DESC"
                : @"SELECT * FROM MarketingRules ORDER BY Priority DESC";

            var results = await connection.QueryAsync<MarketingRule>(sql);
            return results;
        }

        public async Task<IEnumerable<MarketingRule>> GetActiveRulesAsync()
        {
            using var connection = new SqlConnection(_connectionString);
            const string sql = @"
                SELECT * FROM MarketingRules 
                WHERE IsActive = 1 
                AND (StartTime IS NULL OR CAST(GETDATE() AS TIME) >= StartTime)
                AND (EndTime IS NULL OR CAST(GETDATE() AS TIME) <= EndTime)
                ORDER BY Priority DESC";

            var results = await connection.QueryAsync<MarketingRule>(sql);
            return results;
        }

        public async Task<int> CreateAsync(MarketingRule rule)
        {
            using var connection = new SqlConnection(_connectionString);
            const string sql = @"
                INSERT INTO MarketingRules (
                    Name, Description, TriggerItemId, TriggerItemName, SuggestItemId, SuggestItemName,
                    SuggestionMessage, DiscountPercent, Priority, IsActive, MaxUsagePerOrder,
                    StartTime, EndTime, DaysOfWeek, MinOrderSubtotal, TargetLoyaltyTier,
                    CreatedAt, CreatedBy, TimesShown, TimesAccepted
                ) VALUES (
                    @Name, @Description, @TriggerItemId, @TriggerItemName, @SuggestItemId, @SuggestItemName,
                    @SuggestionMessage, @DiscountPercent, @Priority, @IsActive, @MaxUsagePerOrder,
                    @StartTime, @EndTime, @DaysOfWeek, @MinOrderSubtotal, @TargetLoyaltyTier,
                    @CreatedAt, @CreatedBy, 0, 0
                );
                SELECT CAST(SCOPE_IDENTITY() as int);";

            rule.CreatedAt = DateTime.UtcNow;

            var id = await connection.ExecuteScalarAsync<int>(sql, rule);
            return id;
        }

        public async Task<bool> UpdateAsync(MarketingRule rule)
        {
            using var connection = new SqlConnection(_connectionString);
            const string sql = @"
                UPDATE MarketingRules SET
                    Name = @Name,
                    Description = @Description,
                    TriggerItemId = @TriggerItemId,
                    TriggerItemName = @TriggerItemName,
                    SuggestItemId = @SuggestItemId,
                    SuggestItemName = @SuggestItemName,
                    SuggestionMessage = @SuggestionMessage,
                    DiscountPercent = @DiscountPercent,
                    Priority = @Priority,
                    IsActive = @IsActive,
                    MaxUsagePerOrder = @MaxUsagePerOrder,
                    StartTime = @StartTime,
                    EndTime = @EndTime,
                    DaysOfWeek = @DaysOfWeek,
                    MinOrderSubtotal = @MinOrderSubtotal,
                    TargetLoyaltyTier = @TargetLoyaltyTier,
                    UpdatedAt = @UpdatedAt
                WHERE Id = @Id";

            rule.UpdatedAt = DateTime.UtcNow;

            var rows = await connection.ExecuteAsync(sql, rule);
            return rows > 0;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            using var connection = new SqlConnection(_connectionString);
            const string sql = @"DELETE FROM MarketingRules WHERE Id = @Id";
            var rows = await connection.ExecuteAsync(sql, new { Id = id });
            return rows > 0;
        }

        public async Task<bool> IncrementTimesShownAsync(int id)
        {
            using var connection = new SqlConnection(_connectionString);
            const string sql = @"
                UPDATE MarketingRules SET TimesShown = TimesShown + 1 WHERE Id = @Id";
            var rows = await connection.ExecuteAsync(sql, new { Id = id });
            return rows > 0;
        }

        public async Task<bool> IncrementTimesAcceptedAsync(int id)
        {
            using var connection = new SqlConnection(_connectionString);
            const string sql = @"
                UPDATE MarketingRules SET TimesAccepted = TimesAccepted + 1 WHERE Id = @Id";
            var rows = await connection.ExecuteAsync(sql, new { Id = id });
            return rows > 0;
        }

        public async Task<IEnumerable<UpsellTracking>> GetTrackingByOrderIdAsync(int scheduledOrderId)
        {
            using var connection = new SqlConnection(_connectionString);
            const string sql = @"
                SELECT * FROM UpsellTracking 
                WHERE ScheduledOrderId = @ScheduledOrderId 
                ORDER BY ShownAt DESC";

            var results = await connection.QueryAsync<UpsellTracking>(sql, new { ScheduledOrderId = scheduledOrderId });
            return results;
        }

        public async Task<int> AddTrackingAsync(UpsellTracking tracking)
        {
            using var connection = new SqlConnection(_connectionString);
            const string sql = @"
                INSERT INTO UpsellTracking (
                    ScheduledOrderId, SessionId, MarketingRuleId, WasAccepted, ShownAt, AcceptedAt, DiscountApplied
                ) VALUES (
                    @ScheduledOrderId, @SessionId, @MarketingRuleId, @WasAccepted, @ShownAt, @AcceptedAt, @DiscountApplied
                );
                SELECT CAST(SCOPE_IDENTITY() as int);";

            tracking.ShownAt = DateTime.UtcNow;

            var id = await connection.ExecuteScalarAsync<int>(sql, tracking);
            return id;
        }

        public async Task<bool> UpdateTrackingAcceptedAsync(int trackingId)
        {
            using var connection = new SqlConnection(_connectionString);
            const string sql = @"
                UPDATE UpsellTracking SET
                    WasAccepted = 1,
                    AcceptedAt = @AcceptedAt
                WHERE Id = @Id";

            var rows = await connection.ExecuteAsync(sql, new 
            { 
                Id = trackingId, 
                AcceptedAt = DateTime.UtcNow 
            });
            return rows > 0;
        }
    }
}
