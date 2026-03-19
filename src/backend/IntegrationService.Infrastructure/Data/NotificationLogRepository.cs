using System.Data;
using Microsoft.Data.SqlClient;
using System.Threading.Tasks;
using Dapper;
using IntegrationService.Core.Domain.Entities;
using IntegrationService.Core.Interfaces;
using Microsoft.Extensions.Configuration;

namespace IntegrationService.Infrastructure.Data;

/// <summary>
/// Repository for notification audit logs
/// Tracks all notification attempts for monitoring and debugging
/// </summary>
public class NotificationLogRepository : INotificationLogRepository
{
    private readonly string _connectionString;

    public NotificationLogRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("BackendDatabase")
            ?? throw new ArgumentNullException("BackendDatabase connection string not found");
    }

    private IDbConnection CreateConnection()
    {
        return new SqlConnection(_connectionString);
    }

    /// <summary>
    /// Insert notification log entry
    /// </summary>
    public async Task InsertAsync(NotificationLog log)
    {
        const string sql = @"
            INSERT INTO NotificationLogs (
                CustomerId,
                DeviceTokenId,
                NotificationType,
                Title,
                Body,
                Status,
                FcmResponse,
                CreatedAt
            )
            VALUES (
                @CustomerId,
                @DeviceTokenId,
                @NotificationType,
                @Title,
                @Body,
                @Status,
                @FcmResponse,
                @CreatedAt
            )";

        using var connection = CreateConnection();
        await connection.ExecuteAsync(sql, log);
    }

    /// <summary>
    /// Get recent logs for a customer (for debugging)
    /// </summary>
    public async Task<IEnumerable<NotificationLog>> GetRecentByCustomerIdAsync(int customerId, int count = 50)
    {
        const string sql = @"
            SELECT TOP (@Count)
                Id, CustomerId, DeviceTokenId, NotificationType, Title, Body, Status, FcmResponse, CreatedAt
            FROM NotificationLogs
            WHERE CustomerId = @CustomerId
            ORDER BY CreatedAt DESC";

        using var connection = CreateConnection();
        return await connection.QueryAsync<NotificationLog>(sql, new { CustomerId = customerId, Count = count });
    }

    /// <summary>
    /// Delete old notification logs (older than specified number of days).
    /// Returns count of deleted logs.
    /// </summary>
    public async Task<int> DeleteOldLogsAsync(int daysOld)
    {
        const string sql = @"
            DELETE FROM NotificationLogs
            WHERE CreatedAt < DATEADD(day, @DaysOld, GETDATE())";

        using var connection = CreateConnection();
        return await connection.ExecuteAsync(sql, new { DaysOld = -daysOld });
    }
}
