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

        /// <summary>
        /// Get customer list with RFM calculations and filtering
        /// RFM Segment Definitions:
        /// - high-spend: Lifetime value > $500
        /// - frequent: Visit count > 10
        /// - recent: Last order < 14 days ago
        /// - at-risk: Last order > 30 days ago AND lifetime value > $100
        /// - new: Created < 30 days ago
        /// </summary>
        public async Task<IEnumerable<CustomerSegment>> GetCustomerListAsync(string? segment, string? searchTerm, int limit)
        {
            // Build base query with RFM calculation
            var sql = @"
                SELECT TOP (@Limit)
                    c.ID as CustomerID,
                    ISNULL(c.FName, '') AS FirstName,
                    ISNULL(c.LName, '') AS LastName,
                    COALESCE(NULLIF(c.FName + ' ' + c.LName, ' '), c.Phone, 'Customer ' + CAST(c.ID AS NVARCHAR(10))) AS Name,
                    NULL AS Email,
                    c.Phone,
                    ISNULL(c.EarnedPoints, 0) AS EarnedPoints,
                    CASE
                        WHEN ISNULL(s.TotalSpent, 0) > 500 THEN 'high-spend'
                        WHEN ISNULL(s.OrderCount, 0) > 10 THEN 'frequent'
                        WHEN DATEDIFF(day, ISNULL(s.LastOrderDate, '2000-01-01'), GETDATE()) <= 14 THEN 'recent'
                        WHEN DATEDIFF(day, ISNULL(s.LastOrderDate, '2000-01-01'), GETDATE()) > 30 AND ISNULL(s.TotalSpent, 0) > 100 THEN 'at-risk'
                        WHEN c.DateEntered IS NOT NULL AND DATEDIFF(day, c.DateEntered, GETDATE()) <= 30 THEN 'new'
                        ELSE 'new'
                    END AS Segment,
                    CASE
                        WHEN DATEDIFF(day, ISNULL(s.LastOrderDate, '2000-01-01'), GETDATE()) <= 30 THEN 5
                        WHEN DATEDIFF(day, ISNULL(s.LastOrderDate, '2000-01-01'), GETDATE()) <= 60 THEN 4
                        WHEN DATEDIFF(day, ISNULL(s.LastOrderDate, '2000-01-01'), GETDATE()) <= 90 THEN 3
                        WHEN DATEDIFF(day, ISNULL(s.LastOrderDate, '2000-01-01'), GETDATE()) <= 180 THEN 2
                        ELSE 1
                    END AS RScore,
                    CASE
                        WHEN ISNULL(s.OrderCount, 0) >= 20 THEN 5
                        WHEN ISNULL(s.OrderCount, 0) >= 10 THEN 4
                        WHEN ISNULL(s.OrderCount, 0) >= 5 THEN 3
                        WHEN ISNULL(s.OrderCount, 0) >= 2 THEN 2
                        ELSE 1
                    END AS FScore,
                    CASE
                        WHEN ISNULL(s.TotalSpent, 0) >= 500 THEN 5
                        WHEN ISNULL(s.TotalSpent, 0) >= 300 THEN 4
                        WHEN ISNULL(s.TotalSpent, 0) >= 150 THEN 3
                        WHEN ISNULL(s.TotalSpent, 0) >= 50 THEN 2
                        ELSE 1
                    END AS MScore,
                    ISNULL(s.TotalSpent, 0) AS LifetimeValue,
                    ISNULL(s.TotalSpent, 0) AS TotalSpent,
                    ISNULL(s.OrderCount, 0) AS VisitCount,
                    ISNULL(s.OrderCount, 0) AS OrderCount,
                    s.LastOrderDate,
                    c.DateEntered AS CreatedAt
                FROM INI_Restaurant.dbo.tblCustomer c
                LEFT JOIN (
                    SELECT
                        CustomerID,
                        SUM(SubTotal + GSTAmt - ISNULL(DSCAmt, 0) - ISNULL(AlcoholDSCAmt, 0)) AS TotalSpent,
                        COUNT(*) AS OrderCount,
                        MAX(SaleDateTime) AS LastOrderDate
                    FROM INI_Restaurant.dbo.tblSales
                    WHERE CustomerID IS NOT NULL AND CustomerID > 0 AND TransType = 1
                    GROUP BY CustomerID
                ) s ON c.ID = s.CustomerID
                WHERE c.ID > 0";

            // Add search filter
            if (!string.IsNullOrEmpty(searchTerm))
            {
                sql += @"
                AND (
                    c.FName LIKE @SearchTerm
                    OR c.LName LIKE @SearchTerm
                    OR c.Phone LIKE @SearchTerm
                    OR c.FName + ' ' + c.LName LIKE @SearchTerm
                )";
            }

            // Add segment filter using HAVING equivalent with subquery
            if (!string.IsNullOrEmpty(segment))
            {
                var segmentLower = segment.ToLower();
                sql += segmentLower switch
                {
                    "high-spend" => " AND ISNULL(s.TotalSpent, 0) > 500",
                    "frequent" => " AND ISNULL(s.OrderCount, 0) > 10",
                    "recent" => " AND DATEDIFF(day, ISNULL(s.LastOrderDate, '2000-01-01'), GETDATE()) <= 14",
                    "at-risk" => " AND DATEDIFF(day, ISNULL(s.LastOrderDate, '2000-01-01'), GETDATE()) > 30 AND ISNULL(s.TotalSpent, 0) > 100",
                    "new" => " AND (c.DateEntered IS NULL OR DATEDIFF(day, c.DateEntered, GETDATE()) <= 30)",
                    _ => ""
                };
            }

            sql += " ORDER BY ISNULL(s.TotalSpent, 0) DESC";

            using var connection = CreateConnection();
            return await connection.QueryAsync<CustomerSegment>(sql, new
            {
                Limit = limit,
                SearchTerm = $"%{searchTerm}%"
            });
        }

        /// <summary>
        /// Get detailed customer profile with RFM metrics
        /// </summary>
        public async Task<CustomerSegment?> GetCustomerProfileAsync(int customerId)
        {
            const string sql = @"
                SELECT
                    c.ID as CustomerID,
                    ISNULL(c.FName, '') AS FirstName,
                    ISNULL(c.LName, '') AS LastName,
                    COALESCE(NULLIF(c.FName + ' ' + c.LName, ' '), c.Phone, 'Customer ' + CAST(c.ID AS NVARCHAR(10))) AS Name,
                    NULL AS Email,
                    c.Phone,
                    ISNULL(c.EarnedPoints, 0) AS EarnedPoints,
                    CASE
                        WHEN ISNULL(s.TotalSpent, 0) > 500 THEN 'high-spend'
                        WHEN ISNULL(s.OrderCount, 0) > 10 THEN 'frequent'
                        WHEN DATEDIFF(day, ISNULL(s.LastOrderDate, '2000-01-01'), GETDATE()) <= 14 THEN 'recent'
                        WHEN DATEDIFF(day, ISNULL(s.LastOrderDate, '2000-01-01'), GETDATE()) > 30 AND ISNULL(s.TotalSpent, 0) > 100 THEN 'at-risk'
                        ELSE 'new'
                    END AS Segment,
                    CASE
                        WHEN DATEDIFF(day, ISNULL(s.LastOrderDate, '2000-01-01'), GETDATE()) <= 30 THEN 5
                        WHEN DATEDIFF(day, ISNULL(s.LastOrderDate, '2000-01-01'), GETDATE()) <= 60 THEN 4
                        WHEN DATEDIFF(day, ISNULL(s.LastOrderDate, '2000-01-01'), GETDATE()) <= 90 THEN 3
                        WHEN DATEDIFF(day, ISNULL(s.LastOrderDate, '2000-01-01'), GETDATE()) <= 180 THEN 2
                        ELSE 1
                    END AS RScore,
                    CASE
                        WHEN ISNULL(s.OrderCount, 0) >= 20 THEN 5
                        WHEN ISNULL(s.OrderCount, 0) >= 10 THEN 4
                        WHEN ISNULL(s.OrderCount, 0) >= 5 THEN 3
                        WHEN ISNULL(s.OrderCount, 0) >= 2 THEN 2
                        ELSE 1
                    END AS FScore,
                    CASE
                        WHEN ISNULL(s.TotalSpent, 0) >= 500 THEN 5
                        WHEN ISNULL(s.TotalSpent, 0) >= 300 THEN 4
                        WHEN ISNULL(s.TotalSpent, 0) >= 150 THEN 3
                        WHEN ISNULL(s.TotalSpent, 0) >= 50 THEN 2
                        ELSE 1
                    END AS MScore,
                    ISNULL(s.TotalSpent, 0) AS LifetimeValue,
                    ISNULL(s.TotalSpent, 0) AS TotalSpent,
                    ISNULL(s.OrderCount, 0) AS VisitCount,
                    ISNULL(s.OrderCount, 0) AS OrderCount,
                    s.LastOrderDate,
                    c.DateEntered AS CreatedAt
                FROM INI_Restaurant.dbo.tblCustomer c
                LEFT JOIN (
                    SELECT
                        CustomerID,
                        SUM(SubTotal + GSTAmt - ISNULL(DSCAmt, 0) - ISNULL(AlcoholDSCAmt, 0)) AS TotalSpent,
                        COUNT(*) AS OrderCount,
                        MAX(SaleDateTime) AS LastOrderDate
                    FROM INI_Restaurant.dbo.tblSales
                    WHERE CustomerID IS NOT NULL AND CustomerID > 0 AND TransType = 1
                    GROUP BY CustomerID
                ) s ON c.ID = s.CustomerID
                WHERE c.ID = @CustomerId";

            using var connection = CreateConnection();
            return await connection.QueryFirstOrDefaultAsync<CustomerSegment>(sql, new { CustomerId = customerId });
        }

        /// <summary>
        /// Get customer loyalty transaction history from tblPointsDetail
        /// </summary>
        public async Task<IEnumerable<LoyaltyTransactionDto>> GetCustomerLoyaltyAsync(int customerId, int limit)
        {
            const string sql = @"
                SELECT TOP (@Limit)
                    pd.ID as Id,
                    pd.TransDateTime as Date,
                    CASE WHEN pd.PointSaved > 0 THEN 'earned' ELSE 'redeemed' END as Type,
                    CASE WHEN pd.PointSaved > 0 THEN pd.PointSaved ELSE pd.PointUsed END as Points,
                    pd.SalesID as OrderId,
                    CASE
                        WHEN pd.PointSaved > 0 THEN 'Points earned on order #' + CAST(pd.SalesID AS NVARCHAR(20))
                        ELSE 'Points redeemed on order #' + CAST(pd.SalesID AS NVARCHAR(20))
                    END as Description
                FROM INI_Restaurant.dbo.tblPointsDetail pd
                WHERE pd.CustomerID = @CustomerId
                ORDER BY pd.TransDateTime DESC";

            using var connection = CreateConnection();
            return await connection.QueryAsync<LoyaltyTransactionDto>(sql, new { CustomerId = customerId, Limit = limit });
        }

        /// <summary>
        /// Get customer segment counts for RFM dashboard
        /// </summary>
        public async Task<CustomerSegmentCounts> GetCustomerSegmentCountsAsync()
        {
            const string sql = @"
                SELECT
                    SUM(CASE WHEN ISNULL(s.TotalSpent, 0) > 500 THEN 1 ELSE 0 END) AS HighSpend,
                    SUM(CASE WHEN ISNULL(s.OrderCount, 0) > 10 THEN 1 ELSE 0 END) AS Frequent,
                    SUM(CASE WHEN DATEDIFF(day, ISNULL(s.LastOrderDate, '2000-01-01'), GETDATE()) <= 14 THEN 1 ELSE 0 END) AS Recent,
                    SUM(CASE WHEN DATEDIFF(day, ISNULL(s.LastOrderDate, '2000-01-01'), GETDATE()) > 30 AND ISNULL(s.TotalSpent, 0) > 100 THEN 1 ELSE 0 END) AS AtRisk,
                    SUM(CASE WHEN c.DateEntered IS NULL OR DATEDIFF(day, c.DateEntered, GETDATE()) <= 30 THEN 1 ELSE 0 END) AS NewCustomers,
                    COUNT(*) AS Total
                FROM INI_Restaurant.dbo.tblCustomer c
                LEFT JOIN (
                    SELECT
                        CustomerID,
                        SUM(SubTotal + GSTAmt - ISNULL(DSCAmt, 0) - ISNULL(AlcoholDSCAmt, 0)) AS TotalSpent,
                        COUNT(*) AS OrderCount,
                        MAX(SaleDateTime) AS LastOrderDate
                    FROM INI_Restaurant.dbo.tblSales
                    WHERE CustomerID IS NOT NULL AND CustomerID > 0 AND TransType = 1
                    GROUP BY CustomerID
                ) s ON c.ID = s.CustomerID
                WHERE c.ID > 0";

            using var connection = CreateConnection();
            return await connection.QueryFirstAsync<CustomerSegmentCounts>(sql);
        }

        public async Task<IEnumerable<CampaignInfo>> GetCampaignsAsync()
        {
            const string sql = "SELECT * FROM PushCampaigns ORDER BY CreatedAt DESC";
            using var connection = CreateConnection();
            return await connection.QueryAsync<CampaignInfo>(sql);
        }

        public async Task<CampaignInfo> CreateCampaignAsync(string name, string? description, string campaignType, string? targetQuery)
        {
            // Note: campaignType mapping might be needed if PushCampaigns uses something else, 
            // but for now we follow the table schema.
            const string sql = @"
                INSERT INTO PushCampaigns (Name, Description, Title, Body, Status, CreatedAt, UpdatedAt, CreatedBy)
                VALUES (@Name, @Description, @Name, @Description, 'draft', GETDATE(), GETDATE(), 1);
                SELECT CAST(SCOPE_IDENTITY() as int);";
            using var connection = CreateConnection();
            var id = await connection.ExecuteScalarAsync<int>(sql, new { Name = name, Description = description });
            return new CampaignInfo { Id = id, Name = name, Description = description, Status = "draft", CreatedAt = DateTime.Now };
        }

        public async Task<SendResult> SendCampaignAsync(int campaignId)
        {
            const string sql = "UPDATE PushCampaigns SET Status = 'sent', SentDateTime = GETDATE() WHERE Id = @Id";
            using var connection = CreateConnection();
            await connection.ExecuteAsync(sql, new { Id = campaignId });
            return new SendResult { Success = true, Message = "Campaign queued for sending", RecipientsSent = 0 };
        }

        public async Task<IEnumerable<MenuOverrideInfo>> GetMenuOverridesAsync()
        {
            const string sql = @"
                SELECT m.ItemID, i.IName as ItemName, m.IsEnabled, m.DisplayName, m.DisplayDescription, m.DisplayOrder, m.CategoryOverride
                FROM MenuOverlays m
                INNER JOIN INI_Restaurant.dbo.tblItem i ON m.ItemID = i.ID";
            using var connection = CreateConnection();
            return await connection.QueryAsync<MenuOverrideInfo>(sql);
        }

        public async Task<MenuOverrideInfo> UpdateMenuOverrideAsync(int itemId, bool isEnabled, bool hidden, decimal? price, string? reason)
        {
            const string sql = @"
                IF EXISTS (SELECT 1 FROM MenuOverlays WHERE ItemID = @ItemID)
                BEGIN
                    UPDATE MenuOverlays 
                    SET IsEnabled = @IsEnabled, UpdatedAt = GETDATE()
                    WHERE ItemID = @ItemID
                END
                ELSE
                BEGIN
                    INSERT INTO MenuOverlays (ItemID, IsEnabled, UpdatedAt)
                    VALUES (@ItemID, @IsEnabled, GETDATE())
                END
                SELECT i.ID as ItemID, i.IName as ItemName, @IsEnabled as IsEnabled, NULL as DisplayName, NULL as DisplayDescription, NULL as DisplayOrder, NULL as CategoryOverride
                FROM INI_Restaurant.dbo.tblItem i WHERE i.ID = @ItemID;";
            using var connection = CreateConnection();
            return await connection.QueryFirstAsync<MenuOverrideInfo>(sql, new { ItemID = itemId, IsEnabled = isEnabled });
        }

        public async Task<IEnumerable<ActivityLogInfo>> GetActivityLogsAsync(int limit = 100)
        {
            const string sql = @"SELECT TOP (@Limit) Id, Action, EntityType, EntityId, Details, IpAddress, Timestamp FROM ActivityLogs ORDER BY Timestamp DESC";
            using var connection = CreateConnection();
            return await connection.QueryAsync<ActivityLogInfo>(sql, new { Limit = limit });
        }

        public async Task<BirthdayRewardConfig> GetBirthdayRewardConfigAsync()
        {
            const string sql = "SELECT * FROM BirthdayRewardConfigs";
            using var connection = CreateConnection();
            return await connection.QueryFirstOrDefaultAsync<BirthdayRewardConfig>(sql) 
                   ?? new BirthdayRewardConfig();
        }

        public async Task<bool> UpdateBirthdayRewardConfigAsync(BirthdayRewardConfig config)
        {
            const string sql = @"
                IF EXISTS (SELECT 1 FROM BirthdayRewardConfigs)
                BEGIN
                    UPDATE BirthdayRewardConfigs
                    SET IsEnabled = @IsEnabled,
                        DaysBeforeBirthday = @DaysBeforeBirthday,
                        RewardPoints = @RewardPoints,
                        RewardDescription = @RewardDescription,
                        BonusMultiplier = @BonusMultiplier,
                        NotificationTitle = @NotificationTitle,
                        NotificationBody = @NotificationBody,
                        UpdatedAt = GETDATE()
                END
                ELSE
                BEGIN
                    INSERT INTO BirthdayRewardConfigs (IsEnabled, DaysBeforeBirthday, RewardPoints, RewardDescription, BonusMultiplier, NotificationTitle, NotificationBody, UpdatedAt)
                    VALUES (@IsEnabled, @DaysBeforeBirthday, @RewardPoints, @RewardDescription, @BonusMultiplier, @NotificationTitle, @NotificationBody, GETDATE())
                END";
            using var connection = CreateConnection();
            var rows = await connection.ExecuteAsync(sql, config);
            return rows > 0;
        }

        public async Task<IEnumerable<int>> GetCustomersWithBirthdayTodayAsync(int month, int day)
        {
            const string sql = @"
                SELECT CustomerID 
                FROM CustomerBirthdayTracking 
                WHERE BirthMonth = @Month AND BirthDay = @Day";
            using var connection = CreateConnection();
            return await connection.QueryAsync<int>(sql, new { Month = month, Day = day });
        }

        public async Task<bool> UpdateCustomerBirthdayAsync(int customerId, int month, int day)
        {
            const string sql = @"
                IF EXISTS (SELECT 1 FROM CustomerBirthdayTracking WHERE CustomerID = @CustomerID)
                BEGIN
                    UPDATE CustomerBirthdayTracking
                    SET BirthMonth = @BirthMonth, BirthDay = @BirthDay
                    WHERE CustomerID = @CustomerID
                END
                ELSE
                BEGIN
                    INSERT INTO CustomerBirthdayTracking (CustomerID, BirthMonth, BirthDay)
                    VALUES (@CustomerID, @BirthMonth, @BirthDay)
                END";
            using var connection = CreateConnection();
            var rows = await connection.ExecuteAsync(sql, new { CustomerID = customerId, BirthMonth = month, BirthDay = day });
            return rows > 0;
        }

        public async Task<(int? Month, int? Day)> GetCustomerBirthdayAsync(int customerId)
        {
            const string sql = "SELECT BirthMonth, BirthDay FROM CustomerBirthdayTracking WHERE CustomerID = @CustomerID";
            using var connection = CreateConnection();
            var result = await connection.QueryFirstOrDefaultAsync(sql, new { CustomerID = customerId });
            if (result == null) return (null, null);
            return (result.BirthMonth, result.BirthDay);
        }

        public async Task<bool> RecordBirthdayRewardSentAsync(int customerId)
        {
            const string sql = @"
                UPDATE CustomerBirthdayTracking
                SET LastBirthdayRewardDate = GETDATE(),
                    TotalBirthdayRewards = TotalBirthdayRewards + 1
                WHERE CustomerID = @CustomerID";
            using var connection = CreateConnection();
            var rows = await connection.ExecuteAsync(sql, new { CustomerID = customerId });
            return rows > 0;
        }
    }
}
