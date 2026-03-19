using System.Data;
using Microsoft.Data.SqlClient;
using System.Threading.Tasks;
using Dapper;
using IntegrationService.Core.Domain.Entities;
using IntegrationService.Core.Interfaces;
using Microsoft.Extensions.Configuration;

namespace IntegrationService.Infrastructure.Data;

/// <summary>
/// Repository for online order notification status tracking.
/// Tracks which notifications have been sent for each order without modifying POS schema.
/// </summary>
public class OnlineOrderStatusRepository : IOnlineOrderStatusRepository
{
    private readonly string _connectionString;

    public OnlineOrderStatusRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("BackendDatabase")
            ?? throw new ArgumentNullException("BackendDatabase connection string not found");
    }

    private IDbConnection CreateConnection()
    {
        return new SqlConnection(_connectionString);
    }

    /// <summary>
    /// Get order status by SalesId (links to tblSales.ID in POS database).
    /// </summary>
    public async Task<OnlineOrderStatus?> GetBySalesIdAsync(int salesId)
    {
        const string sql = @"
            SELECT Id, SalesId, ReadyNotificationSent, ConfirmationNotificationSent, LastCheckedAt, CreatedAt
            FROM OnlineOrderStatus
            WHERE SalesId = @SalesId";

        using var connection = CreateConnection();
        return await connection.QueryFirstOrDefaultAsync<OnlineOrderStatus>(sql, new { SalesId = salesId });
    }

    /// <summary>
    /// Insert new order status tracking record.
    /// </summary>
    public async Task<int> InsertAsync(OnlineOrderStatus status)
    {
        const string sql = @"
            INSERT INTO OnlineOrderStatus (SalesId, ReadyNotificationSent, ConfirmationNotificationSent, LastCheckedAt, CreatedAt)
            OUTPUT INSERTED.Id
            VALUES (@SalesId, @ReadyNotificationSent, @ConfirmationNotificationSent, @LastCheckedAt, @CreatedAt)";

        using var connection = CreateConnection();
        return await connection.ExecuteScalarAsync<int>(sql, status);
    }

    /// <summary>
    /// Update order status (marks notifications as sent, updates LastCheckedAt).
    /// </summary>
    public async Task UpdateAsync(OnlineOrderStatus status)
    {
        const string sql = @"
            UPDATE OnlineOrderStatus
            SET ReadyNotificationSent = @ReadyNotificationSent,
                ConfirmationNotificationSent = @ConfirmationNotificationSent,
                LastCheckedAt = @LastCheckedAt
            WHERE Id = @Id";

        using var connection = CreateConnection();
        await connection.ExecuteAsync(sql, status);
    }

    /// <summary>
    /// Get all orders that need ready notification check.
    /// Returns orders that haven't had ready notification sent yet.
    /// </summary>
    public async Task<IEnumerable<OnlineOrderStatus>> GetOrdersPendingReadyNotificationAsync()
    {
        const string sql = @"
            SELECT Id, SalesId, ReadyNotificationSent, ConfirmationNotificationSent, LastCheckedAt, CreatedAt
            FROM OnlineOrderStatus
            WHERE ReadyNotificationSent = 0";

        using var connection = CreateConnection();
        return await connection.QueryAsync<OnlineOrderStatus>(sql);
    }
}
