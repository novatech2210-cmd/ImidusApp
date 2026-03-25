using System;
using System.Data;
using Microsoft.Data.SqlClient;
using System.Threading.Tasks;
using Dapper;
using IntegrationService.Core.Domain.Entities;
using IntegrationService.Core.Interfaces;
using Microsoft.Extensions.Configuration;

namespace IntegrationService.Infrastructure.Data
{
    /// <summary>
    /// Repository for idempotency records in IntegrationService database
    /// Handles cache lookup and storage for duplicate request detection
    /// </summary>
    public class IdempotencyRepository : IIdempotencyRepository
    {
        private readonly string _connectionString;

        public IdempotencyRepository(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("BackendDatabase")
                ?? "Server=localhost;Database=IntegrationService;User Id=sa;Password=YourStrong@Passw0rd;TrustServerCertificate=True;";
        }

        private IDbConnection CreateConnection()
        {
            return new SqlConnection(_connectionString);
        }

        /// <summary>
        /// Get idempotency record by key
        /// Automatically filters expired records
        /// </summary>
        public async Task<IdempotencyRecord?> GetByKeyAsync(string key)
        {
            const string sql = @"
                SELECT IdempotencyKey, RequestHash, ResponseJson, StatusCode, CreatedAt, ExpiresAt
                FROM IdempotencyKeys
                WHERE IdempotencyKey = @Key
                  AND ExpiresAt > GETDATE()";

            using var connection = CreateConnection();
            return await connection.QueryFirstOrDefaultAsync<IdempotencyRecord>(sql, new { Key = key });
        }

        /// <summary>
        /// Store new idempotency record with 24-hour expiration
        /// </summary>
        public async Task StoreAsync(IdempotencyRecord record)
        {
            const string sql = @"
                INSERT INTO IdempotencyKeys (
                    IdempotencyKey,
                    RequestHash,
                    ResponseJson,
                    StatusCode,
                    CreatedAt,
                    ExpiresAt
                )
                VALUES (
                    @IdempotencyKey,
                    @RequestHash,
                    @ResponseJson,
                    @StatusCode,
                    @CreatedAt,
                    @ExpiresAt
                )";

            using var connection = CreateConnection();
            await connection.ExecuteAsync(sql, record);
        }
    }
}
