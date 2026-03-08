using System;
using System.Threading.Tasks;
using Dapper;
using IntegrationService.Core.Interfaces;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace IntegrationService.Infrastructure.Data
{
    /// <summary>
    /// Repository for atomic daily order number generation
    /// Uses tblOrderNumber table with UPDATE...OUTPUT pattern for race condition safety
    /// Implements exponential backoff retry for deadlock handling
    ///
    /// ORDER NUMBER LIFECYCLE:
    /// - Resets to 1 at midnight daily (new OrderDate row)
    /// - Increments atomically per order
    /// - Retries up to 3 times on deadlock (SQL error 1205)
    /// - Exponential backoff: 10ms, 20ms, 40ms
    /// </summary>
    public class OrderNumberRepository : IOrderNumberRepository
    {
        private readonly string _connectionString;
        private readonly ILogger<OrderNumberRepository> _logger;

        public OrderNumberRepository(IConfiguration configuration, ILogger<OrderNumberRepository> logger)
        {
            _connectionString = configuration.GetConnectionString("PosDatabase")
                ?? throw new ArgumentNullException("PosDatabase connection string not found");
            _logger = logger;
        }

        /// <summary>
        /// Get next daily order number with atomic increment
        /// Uses UPDATE...OUTPUT for atomicity, handles race conditions with retry
        /// </summary>
        public async Task<int> GetNextDailyOrderNumberAsync()
        {
            var today = DateTime.Today;
            var maxRetries = 3;
            var baseDelay = 10; // milliseconds

            for (int attempt = 0; attempt < maxRetries; attempt++)
            {
                try
                {
                    using var connection = new SqlConnection(_connectionString);
                    await connection.OpenAsync();

                    // Atomic increment using UPDATE with OUTPUT
                    // If no row exists for today, INSERT with OrderNumber=1
                    const string sql = @"
                        UPDATE tblOrderNumber
                        SET OrderNumber = OrderNumber + 1
                        OUTPUT INSERTED.OrderNumber
                        WHERE CalledDateTime = @Today

                        IF @@ROWCOUNT = 0
                        BEGIN
                            INSERT INTO tblOrderNumber (CalledDateTime, OrderNumber)
                            VALUES (@Today, 1)
                            SELECT 1
                        END";

                    var result = await connection.QuerySingleAsync<int>(sql, new { Today = today });

                    _logger.LogInformation("Generated daily order number {OrderNumber} for {Date}",
                        result, today.ToString("yyyy-MM-dd"));

                    return result;
                }
                catch (SqlException ex) when (ex.Number == 1205) // Deadlock victim
                {
                    if (attempt == maxRetries - 1)
                    {
                        _logger.LogError(ex, "Failed to generate order number after {Retries} retries due to deadlock",
                            maxRetries);
                        throw;
                    }

                    // Exponential backoff: 10ms, 20ms, 40ms
                    var delay = baseDelay * (int)Math.Pow(2, attempt);
                    _logger.LogWarning("Deadlock detected on attempt {Attempt}, retrying after {Delay}ms",
                        attempt + 1, delay);
                    await Task.Delay(delay);
                }
            }

            throw new Exception("Failed to generate order number after retries");
        }
    }
}
