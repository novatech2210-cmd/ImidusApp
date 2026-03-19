using System;
using System.Collections.Generic;
using System.Data;
using Microsoft.Data.SqlClient;
using System.Threading.Tasks;
using Dapper;
using IntegrationService.Core.Domain.Entities;
using IntegrationService.Core.Interfaces;
using Microsoft.Extensions.Configuration;

namespace IntegrationService.Infrastructure.Data
{
    public class ActivityLogRepository : IActivityLogRepository
    {
        private readonly string _connectionString;

        public ActivityLogRepository(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("BackendDatabase")
                ?? throw new ArgumentNullException("BackendDatabase connection string not found");
        }

        private IDbConnection CreateConnection()
        {
            return new SqlConnection(_connectionString);
        }

        public async Task<int> LogActivityAsync(ActivityLog log)
        {
            const string sql = @"
                INSERT INTO tblActivityLog (AdminUserID, Action, ResourceType, ResourceID, OldValue, NewValue, IPAddress, UserAgent, Status, ErrorMessage, CreatedDate)
                VALUES (@AdminUserID, @Action, @ResourceType, @ResourceID, @OldValue, @NewValue, @IPAddress, @UserAgent, @Status, @ErrorMessage, GETDATE());
                SELECT SCOPE_IDENTITY();";

            using var connection = CreateConnection();
            return await connection.ExecuteScalarAsync<int>(sql, log);
        }

        public async Task<IEnumerable<ActivityLog>> GetRecentLogsAsync(int limit)
        {
            const string sql = @"
                SELECT TOP (@Limit) *
                FROM tblActivityLog
                ORDER BY CreatedDate DESC";

            using var connection = CreateConnection();
            return await connection.QueryAsync<ActivityLog>(sql, new { Limit = limit });
        }

        public async Task<IEnumerable<CustomerSegment>> GetCustomerSegmentsAsync()
        {
            // Note: This matches the implementation in PosRepository but might pull from an overlay if cached.
            // For now, we delegate or re-implement if specialized segments are needed.
            // Since this is the ActivityLogRepo, maybe we just provide the counts here?
            return new List<CustomerSegment>();
        }

        public async Task<CustomerSegmentCounts> GetCustomerSegmentCountsAsync()
        {
            // This is a placeholder for actual aggregation logic if needed in the overlay
            return new CustomerSegmentCounts();
        }
    }
}
