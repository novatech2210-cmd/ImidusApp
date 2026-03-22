using System;
using System.Collections.Generic;
using System.Data;
using System.Threading.Tasks;
using Dapper;
using IntegrationService.Core.Domain.Entities;
using IntegrationService.Core.Interfaces;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace IntegrationService.Infrastructure.Data
{
    /// <summary>
    /// Repository for menu overlays (online item enable/disable, custom images)
    /// Uses IntegrationService database (overlay)
    /// </summary>
    public class MenuOverlayRepository : IMenuOverlayRepository
    {
        private readonly string _connectionString;
        private readonly ILogger<MenuOverlayRepository> _logger;

        public MenuOverlayRepository(IConfiguration configuration, ILogger<MenuOverlayRepository> logger)
        {
            _connectionString = configuration.GetConnectionString("BackendDatabase")
                ?? throw new ArgumentNullException("BackendDatabase connection string not found");
            _logger = logger;
        }

        private IDbConnection CreateConnection() => new SqlConnection(_connectionString);

        public async Task<int> CreateOrUpdateAsync(MenuOverlay overlay)
        {
            // Check if exists
            var existing = overlay.ItemId.HasValue
                ? await GetByItemIdAsync(overlay.ItemId.Value)
                : await GetByCategoryIdAsync(overlay.CategoryId ?? 0);

            if (existing != null)
            {
                // Update
                const string updateSql = @"
                    UPDATE MenuOverlays SET
                        IsEnabled = @IsEnabled,
                        OverrideImageUrl = @OverrideImageUrl,
                        OverrideDescription = @OverrideDescription,
                        DisplayOrder = @DisplayOrder,
                        AvailableFrom = @AvailableFrom,
                        AvailableTo = @AvailableTo,
                        AvailableDays = @AvailableDays,
                        UpdatedAt = GETDATE()
                    WHERE Id = @Id";

                overlay.Id = existing.Id;
                using var connection = CreateConnection();
                await connection.ExecuteAsync(updateSql, overlay);
                _logger.LogInformation("Updated menu overlay {Id} for item {ItemId}", overlay.Id, overlay.ItemId);
                return overlay.Id;
            }
            else
            {
                // Insert
                const string insertSql = @"
                    INSERT INTO MenuOverlays (
                        ItemId, CategoryId, IsEnabled,
                        OverrideImageUrl, OverrideDescription, DisplayOrder,
                        AvailableFrom, AvailableTo, AvailableDays,
                        CreatedAt, UpdatedAt
                    )
                    VALUES (
                        @ItemId, @CategoryId, @IsEnabled,
                        @OverrideImageUrl, @OverrideDescription, @DisplayOrder,
                        @AvailableFrom, @AvailableTo, @AvailableDays,
                        GETDATE(), GETDATE()
                    );
                    SELECT SCOPE_IDENTITY();";

                using var connection = CreateConnection();
                var id = await connection.QuerySingleAsync<int>(insertSql, overlay);
                _logger.LogInformation("Created menu overlay {Id} for item {ItemId}", id, overlay.ItemId);
                return id;
            }
        }

        public async Task<MenuOverlay?> GetByItemIdAsync(int itemId)
        {
            const string sql = @"
                SELECT Id, ItemId, CategoryId, IsEnabled,
                       OverrideImageUrl, OverrideDescription, DisplayOrder,
                       AvailableFrom, AvailableTo, AvailableDays,
                       CreatedAt, UpdatedAt
                FROM MenuOverlays
                WHERE ItemId = @ItemId";

            using var connection = CreateConnection();
            return await connection.QueryFirstOrDefaultAsync<MenuOverlay>(sql, new { ItemId = itemId });
        }

        public async Task<MenuOverlay?> GetByCategoryIdAsync(int categoryId)
        {
            const string sql = @"
                SELECT Id, ItemId, CategoryId, IsEnabled,
                       OverrideImageUrl, OverrideDescription, DisplayOrder,
                       AvailableFrom, AvailableTo, AvailableDays,
                       CreatedAt, UpdatedAt
                FROM MenuOverlays
                WHERE CategoryId = @CategoryId AND ItemId IS NULL";

            using var connection = CreateConnection();
            return await connection.QueryFirstOrDefaultAsync<MenuOverlay>(sql, new { CategoryId = categoryId });
        }

        public async Task<IEnumerable<MenuOverlay>> GetAllAsync()
        {
            const string sql = @"
                SELECT Id, ItemId, CategoryId, IsEnabled,
                       OverrideImageUrl, OverrideDescription, DisplayOrder,
                       AvailableFrom, AvailableTo, AvailableDays,
                       CreatedAt, UpdatedAt
                FROM MenuOverlays
                ORDER BY CategoryId, ItemId";

            using var connection = CreateConnection();
            return await connection.QueryAsync<MenuOverlay>(sql);
        }

        public async Task<IEnumerable<int>> GetDisabledItemIdsAsync()
        {
            const string sql = @"
                SELECT ItemId FROM MenuOverlays
                WHERE ItemId IS NOT NULL AND IsEnabled = 0";

            using var connection = CreateConnection();
            return await connection.QueryAsync<int>(sql);
        }

        public async Task<IEnumerable<int>> GetDisabledCategoryIdsAsync()
        {
            const string sql = @"
                SELECT CategoryId FROM MenuOverlays
                WHERE CategoryId IS NOT NULL AND ItemId IS NULL AND IsEnabled = 0";

            using var connection = CreateConnection();
            return await connection.QueryAsync<int>(sql);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            const string sql = "DELETE FROM MenuOverlays WHERE Id = @Id";
            using var connection = CreateConnection();
            var rows = await connection.ExecuteAsync(sql, new { Id = id });
            return rows > 0;
        }
    }
}
