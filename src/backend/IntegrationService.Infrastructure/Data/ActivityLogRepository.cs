using Dapper;
using IntegrationService.Core.Interfaces;
using IntegrationService.Core.Models.AdminPortal;
using Microsoft.Extensions.Logging;
using System.Data;

namespace IntegrationService.Infrastructure.Data
{
    public class ActivityLogRepository : IActivityLogRepository
    {
        private readonly string _connectionString;
        private readonly ILogger<ActivityLogRepository> _logger;

        public ActivityLogRepository(string connectionString, ILogger<ActivityLogRepository> logger)
        {
            _connectionString = connectionString;
            _logger = logger;
        }

        private IDbConnection CreateConnection() => new Microsoft.Data.SqlClient.SqlConnection(_connectionString);

        public async Task<ActivityLog> CreateAsync(ActivityLog log)
        {
            const string sql = @"
                INSERT INTO ActivityLogs (AdminUserId, AdminEmail, Action, EntityType, EntityId, Details, IpAddress, UserAgent, Timestamp, Success)
                VALUES (@AdminUserId, @AdminEmail, @Action, @EntityType, @EntityId, @Details, @IpAddress, @UserAgent, @Timestamp, @Success);
                SELECT CAST(SCOPE_IDENTITY() as int);";

            using var connection = CreateConnection();
            log.Id = await connection.ExecuteScalarAsync<int>(sql, log);
            _logger.LogInformation("Activity logged: {Action} by {AdminEmail} at {Timestamp}", log.Action, log.AdminEmail, log.Timestamp);
            return log;
        }

        public async Task<IEnumerable<ActivityLog>> GetAllAsync(int limit = 100, int offset = 0)
        {
            const string sql = @"
                SELECT TOP (@Limit) * FROM ActivityLogs
                ORDER BY Timestamp DESC
                OFFSET @Offset ROWS";

            using var connection = CreateConnection();
            return await connection.QueryAsync<ActivityLog>(sql, new { Limit = limit, Offset = offset });
        }

        public async Task<IEnumerable<ActivityLog>> GetByAdminUserIdAsync(int adminUserId, int limit = 50)
        {
            const string sql = @"
                SELECT TOP (@Limit) * FROM ActivityLogs
                WHERE AdminUserId = @AdminUserId
                ORDER BY Timestamp DESC";

            using var connection = CreateConnection();
            return await connection.QueryAsync<ActivityLog>(sql, new { AdminUserId = adminUserId, Limit = limit });
        }

        public async Task<IEnumerable<ActivityLog>> GetByActionAsync(string action, int limit = 50)
        {
            const string sql = @"
                SELECT TOP (@Limit) * FROM ActivityLogs
                WHERE Action = @Action
                ORDER BY Timestamp DESC";

            using var connection = CreateConnection();
            return await connection.QueryAsync<ActivityLog>(sql, new { Action = action, Limit = limit });
        }

        public async Task<IEnumerable<ActivityLog>> GetByDateRangeAsync(DateTime startDate, DateTime endDate)
        {
            const string sql = @"
                SELECT * FROM ActivityLogs
                WHERE Timestamp >= @StartDate AND Timestamp <= @EndDate
                ORDER BY Timestamp DESC";

            using var connection = CreateConnection();
            return await connection.QueryAsync<ActivityLog>(sql, new { StartDate = startDate, EndDate = endDate });
        }

        public async Task<IEnumerable<ActivityLog>> GetByEntityAsync(string entityType, int? entityId = null)
        {
            string sql;
            object parameters;

            if (entityId.HasValue)
            {
                sql = @"SELECT * FROM ActivityLogs WHERE EntityType = @EntityType AND EntityId = @EntityId ORDER BY Timestamp DESC";
                parameters = new { EntityType = entityType, EntityId = entityId.Value };
            }
            else
            {
                sql = @"SELECT * FROM ActivityLogs WHERE EntityType = @EntityType ORDER BY Timestamp DESC";
                parameters = new { EntityType = entityType };
            }

            using var connection = CreateConnection();
            return await connection.QueryAsync<ActivityLog>(sql, parameters);
        }

        public async Task<IEnumerable<CustomerSegment>> GetCustomerSegmentsAsync()
        {
            const string sql = @"
                SELECT TOP 50
                    c.ID as CustomerID,
                    COALESCE(c.FName + ' ' + c.LName, c.Phone, 'Customer ' + CAST(c.ID AS NVARCHAR(10))) AS Name,
                    'Regular' AS Segment,
                    3 AS RScore,
                    3 AS FScore,
                    3 AS MScore,
                    0 AS TotalSpent,
                    0 AS OrderCount,
                    NULL AS LastOrderDate
                FROM dbo.tblCustomer c";

            using var connection = CreateConnection();
            return await connection.QueryAsync<CustomerSegment>(sql);
        }

        public async Task<IEnumerable<CampaignInfo>> GetCampaignsAsync()
        {
            const string sql = "SELECT * FROM Campaigns ORDER BY CreatedAt DESC";
            using var connection = CreateConnection();
            return await connection.QueryAsync<CampaignInfo>(sql);
        }

        public async Task<CampaignInfo> CreateCampaignAsync(string name, string? description, string campaignType, string? targetQuery)
        {
            const string sql = @"
                INSERT INTO Campaigns (Name, Description, CampaignType, Status, TargetQuery, CreatedAt)
                VALUES (@Name, @Description, @CampaignType, 'draft', @TargetQuery, GETDATE());
                SELECT CAST(SCOPE_IDENTITY() as int);";
            using var connection = CreateConnection();
            var id = await connection.ExecuteScalarAsync<int>(sql, new { Name = name, Description = description, CampaignType = campaignType, TargetQuery = targetQuery });
            return new CampaignInfo { Id = id, Name = name, Description = description, CampaignType = campaignType, Status = "draft", CreatedAt = DateTime.Now };
        }

        public async Task<SendResult> SendCampaignAsync(int campaignId)
        {
            const string sql = "UPDATE Campaigns SET Status = 'sent', SentAt = GETDATE() WHERE Id = @Id";
            using var connection = CreateConnection();
            await connection.ExecuteAsync(sql, new { Id = campaignId });
            return new SendResult { Success = true, Message = "Campaign queued for sending", RecipientsSent = 0 };
        }

        public async Task<IEnumerable<MenuOverrideInfo>> GetMenuOverridesAsync()
        {
            const string sql = @"
                SELECT m.ItemID, i.IName as ItemName, m.IsAvailable, m.HiddenFromOnline, m.OverridePrice, m.OverrideName
                FROM MenuItemOverrides m
                INNER JOIN dbo.tblItem i ON m.ItemID = i.ID";
            using var connection = CreateConnection();
            return await connection.QueryAsync<MenuOverrideInfo>(sql);
        }

        public async Task<MenuOverrideInfo> UpdateMenuOverrideAsync(int itemId, bool isAvailable, bool hidden, decimal? price, string? reason)
        {
            const string sql = @"
                MERGE INTO MenuItemOverrides AS target
                USING (SELECT @ItemID as ItemID) AS source
                ON target.ItemID = source.ItemID
                WHEN MATCHED THEN
                    UPDATE SET IsAvailable = @IsAvailable, HiddenFromOnline = @Hidden, OverridePrice = @Price, Reason = @Reason, UpdatedAt = GETDATE()
                WHEN NOT MATCHED THEN
                    INSERT (ItemID, IsAvailable, HiddenFromOnline, OverridePrice, Reason, CreatedAt)
                    VALUES (@ItemID, @IsAvailable, @Hidden, @Price, @Reason, GETDATE());
                SELECT i.ID as ItemID, i.IName as ItemName, @IsAvailable as IsAvailable, @Hidden as HiddenFromOnline, @Price as OverridePrice, NULL as OverrideName
                FROM dbo.tblItem i WHERE i.ID = @ItemID;";
            using var connection = CreateConnection();
            return await connection.QueryFirstAsync<MenuOverrideInfo>(sql, new { ItemID = itemId, IsAvailable = isAvailable, Hidden = hidden, Price = price, Reason = reason });
        }

        public async Task<IEnumerable<ActivityLogInfo>> GetActivityLogsAsync(int limit = 100)
        {
            const string sql = @"SELECT TOP (@Limit) ID, Action, EntityType, EntityId, Details, IPAddress, CreatedAt FROM AdminActivityLogs ORDER BY CreatedAt DESC";
            using var connection = CreateConnection();
            return await connection.QueryAsync<ActivityLogInfo>(sql, new { Limit = limit });
        }
    }
}
