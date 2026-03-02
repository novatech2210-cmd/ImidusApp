using System.Data;
using Microsoft.Data.SqlClient;
using System.Threading.Tasks;
using Dapper;
using IntegrationService.Core.Domain.Entities;
using IntegrationService.Core.Interfaces;
using Microsoft.Extensions.Configuration;

namespace IntegrationService.Infrastructure.Data;

/// <summary>
/// Repository for device token management
/// Handles FCM token storage and lifecycle
/// </summary>
public class DeviceTokenRepository : IDeviceTokenRepository
{
    private readonly string _connectionString;

    public DeviceTokenRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("BackendDatabase")
            ?? throw new ArgumentNullException("BackendDatabase connection string not found");
    }

    private IDbConnection CreateConnection()
    {
        return new SqlConnection(_connectionString);
    }

    /// <summary>
    /// Get all active tokens for a customer
    /// </summary>
    public async Task<IEnumerable<DeviceToken>> GetActiveTokensByCustomerIdAsync(int customerId)
    {
        const string sql = @"
            SELECT Id, CustomerId, Token, Platform, IsActive, LastActive, CreatedAt
            FROM DeviceTokens
            WHERE CustomerId = @CustomerId
              AND IsActive = 1";

        using var connection = CreateConnection();
        return await connection.QueryAsync<DeviceToken>(sql, new { CustomerId = customerId });
    }

    /// <summary>
    /// Get token by value
    /// </summary>
    public async Task<DeviceToken?> GetByTokenAsync(string token)
    {
        const string sql = @"
            SELECT Id, CustomerId, Token, Platform, IsActive, LastActive, CreatedAt
            FROM DeviceTokens
            WHERE Token = @Token";

        using var connection = CreateConnection();
        return await connection.QueryFirstOrDefaultAsync<DeviceToken>(sql, new { Token = token });
    }

    /// <summary>
    /// Insert new token
    /// </summary>
    public async Task<int> InsertAsync(DeviceToken token)
    {
        const string sql = @"
            INSERT INTO DeviceTokens (CustomerId, Token, Platform, IsActive, LastActive, CreatedAt)
            OUTPUT INSERTED.Id
            VALUES (@CustomerId, @Token, @Platform, @IsActive, @LastActive, @CreatedAt)";

        using var connection = CreateConnection();
        return await connection.ExecuteScalarAsync<int>(sql, token);
    }

    /// <summary>
    /// Update token's active status and last active time
    /// </summary>
    public async Task UpdateAsync(DeviceToken token)
    {
        const string sql = @"
            UPDATE DeviceTokens
            SET IsActive = @IsActive,
                LastActive = @LastActive
            WHERE Id = @Id";

        using var connection = CreateConnection();
        await connection.ExecuteAsync(sql, token);
    }

    /// <summary>
    /// Mark token as inactive (for expired/invalid tokens)
    /// </summary>
    public async Task MarkInactiveAsync(int tokenId)
    {
        const string sql = @"
            UPDATE DeviceTokens
            SET IsActive = 0
            WHERE Id = @TokenId";

        using var connection = CreateConnection();
        await connection.ExecuteAsync(sql, new { TokenId = tokenId });
    }

    /// <summary>
    /// Reactivate an existing token
    /// </summary>
    public async Task ReactivateAsync(int tokenId)
    {
        const string sql = @"
            UPDATE DeviceTokens
            SET IsActive = 1,
                LastActive = GETDATE()
            WHERE Id = @TokenId";

        using var connection = CreateConnection();
        await connection.ExecuteAsync(sql, new { TokenId = tokenId });
    }
}
