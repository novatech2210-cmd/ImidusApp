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
    /// Repository for marketing push campaigns
    /// Uses IntegrationService database (overlay)
    /// </summary>
    public class CampaignRepository : ICampaignRepository
    {
        private readonly string _connectionString;
        private readonly ILogger<CampaignRepository> _logger;

        public CampaignRepository(IConfiguration configuration, ILogger<CampaignRepository> logger)
        {
            _connectionString = configuration.GetConnectionString("BackendDatabase")
                ?? throw new ArgumentNullException("BackendDatabase connection string not found");
            _logger = logger;
        }

        private IDbConnection CreateConnection() => new SqlConnection(_connectionString);

        public async Task<int> CreateCampaignAsync(PushCampaign campaign)
        {
            const string sql = @"
                INSERT INTO PushCampaigns (
                    Name, Title, Body, ImageUrl,
                    MinSpend, MaxSpend, MinVisits, MaxVisits,
                    RecencyDays, InactiveDays, HasBirthdayToday, SegmentFilter,
                    ScheduledAt, Status, TargetCount, SentCount, FailedCount, CreatedAt
                )
                VALUES (
                    @Name, @Title, @Body, @ImageUrl,
                    @MinSpend, @MaxSpend, @MinVisits, @MaxVisits,
                    @RecencyDays, @InactiveDays, @HasBirthdayToday, @SegmentFilter,
                    @ScheduledAt, @Status, @TargetCount, 0, 0, GETDATE()
                );
                SELECT SCOPE_IDENTITY();";

            using var connection = CreateConnection();
            var id = await connection.QuerySingleAsync<int>(sql, campaign);
            _logger.LogInformation("Created campaign {Id}: {Name}", id, campaign.Name);
            return id;
        }

        public async Task<PushCampaign?> GetByIdAsync(int id)
        {
            const string sql = @"
                SELECT Id, Name, Title, Body, ImageUrl,
                       MinSpend, MaxSpend, MinVisits, MaxVisits,
                       RecencyDays, InactiveDays, HasBirthdayToday, SegmentFilter,
                       ScheduledAt, Status, TargetCount, SentCount, FailedCount,
                       CreatedAt, SentAt
                FROM PushCampaigns
                WHERE Id = @Id";

            using var connection = CreateConnection();
            return await connection.QueryFirstOrDefaultAsync<PushCampaign>(sql, new { Id = id });
        }

        public async Task<IEnumerable<PushCampaign>> GetAllAsync(string? status = null)
        {
            var sql = @"
                SELECT Id, Name, Title, Body, ImageUrl,
                       MinSpend, MaxSpend, MinVisits, MaxVisits,
                       RecencyDays, InactiveDays, HasBirthdayToday, SegmentFilter,
                       ScheduledAt, Status, TargetCount, SentCount, FailedCount,
                       CreatedAt, SentAt
                FROM PushCampaigns";

            if (!string.IsNullOrEmpty(status))
                sql += " WHERE Status = @Status";

            sql += " ORDER BY CreatedAt DESC";

            using var connection = CreateConnection();
            return await connection.QueryAsync<PushCampaign>(sql, new { Status = status });
        }

        public async Task<IEnumerable<PushCampaign>> GetScheduledCampaignsAsync(DateTime before)
        {
            const string sql = @"
                SELECT Id, Name, Title, Body, ImageUrl,
                       MinSpend, MaxSpend, MinVisits, MaxVisits,
                       RecencyDays, InactiveDays, HasBirthdayToday, SegmentFilter,
                       ScheduledAt, Status, TargetCount, SentCount, FailedCount,
                       CreatedAt, SentAt
                FROM PushCampaigns
                WHERE Status = 'scheduled'
                  AND ScheduledAt <= @Before
                ORDER BY ScheduledAt";

            using var connection = CreateConnection();
            return await connection.QueryAsync<PushCampaign>(sql, new { Before = before });
        }

        public async Task UpdateStatusAsync(int id, string status, int? sentCount = null, int? failedCount = null)
        {
            var sql = "UPDATE PushCampaigns SET Status = @Status";

            if (sentCount.HasValue)
                sql += ", SentCount = @SentCount";
            if (failedCount.HasValue)
                sql += ", FailedCount = @FailedCount";
            if (status == "sent")
                sql += ", SentAt = GETDATE()";

            sql += " WHERE Id = @Id";

            using var connection = CreateConnection();
            await connection.ExecuteAsync(sql, new { Id = id, Status = status, SentCount = sentCount, FailedCount = failedCount });
            _logger.LogInformation("Updated campaign {Id} status to {Status}", id, status);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            const string sql = "DELETE FROM PushCampaigns WHERE Id = @Id";
            using var connection = CreateConnection();
            var rows = await connection.ExecuteAsync(sql, new { Id = id });
            return rows > 0;
        }
    }
}
