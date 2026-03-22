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
    /// Repository for scheduled future orders
    /// Uses IntegrationService database (overlay)
    /// </summary>
    public class ScheduledOrderRepository : IScheduledOrderRepository
    {
        private readonly string _connectionString;
        private readonly ILogger<ScheduledOrderRepository> _logger;

        public ScheduledOrderRepository(IConfiguration configuration, ILogger<ScheduledOrderRepository> logger)
        {
            _connectionString = configuration.GetConnectionString("BackendDatabase")
                ?? throw new ArgumentNullException("BackendDatabase connection string not found");
            _logger = logger;
        }

        private IDbConnection CreateConnection() => new SqlConnection(_connectionString);

        public async Task<int> CreateAsync(ScheduledOrder order)
        {
            const string sql = @"
                INSERT INTO ScheduledOrders (
                    CustomerId, IdempotencyKey, OrderJson,
                    SubTotal, TaxAmount, TotalAmount,
                    PaymentToken, CardType, Last4,
                    TargetDateTime, PrepTimeMinutes, Status, CreatedAt
                )
                VALUES (
                    @CustomerId, @IdempotencyKey, @OrderJson,
                    @SubTotal, @TaxAmount, @TotalAmount,
                    @PaymentToken, @CardType, @Last4,
                    @TargetDateTime, @PrepTimeMinutes, 'pending', GETDATE()
                );
                SELECT SCOPE_IDENTITY();";

            using var connection = CreateConnection();
            var id = await connection.QuerySingleAsync<int>(sql, order);
            _logger.LogInformation("Created scheduled order {Id} for customer {CustomerId}, target time: {Target}",
                id, order.CustomerId, order.TargetDateTime);
            return id;
        }

        public async Task<ScheduledOrder?> GetByIdAsync(int id)
        {
            const string sql = @"
                SELECT Id, CustomerId, IdempotencyKey, OrderJson,
                       SubTotal, TaxAmount, TotalAmount,
                       PaymentToken, CardType, Last4,
                       TargetDateTime, PrepTimeMinutes, Status,
                       SalesId, ErrorMessage, CreatedAt, InjectedAt
                FROM ScheduledOrders
                WHERE Id = @Id";

            using var connection = CreateConnection();
            return await connection.QueryFirstOrDefaultAsync<ScheduledOrder>(sql, new { Id = id });
        }

        public async Task<IEnumerable<ScheduledOrder>> GetPendingOrdersForInjectionAsync(DateTime asOf)
        {
            // Get orders where InjectionTime (TargetDateTime - PrepTimeMinutes) <= asOf
            const string sql = @"
                SELECT Id, CustomerId, IdempotencyKey, OrderJson,
                       SubTotal, TaxAmount, TotalAmount,
                       PaymentToken, CardType, Last4,
                       TargetDateTime, PrepTimeMinutes, Status,
                       SalesId, ErrorMessage, CreatedAt, InjectedAt
                FROM ScheduledOrders
                WHERE Status = 'pending'
                  AND DATEADD(minute, -PrepTimeMinutes, TargetDateTime) <= @AsOf
                ORDER BY TargetDateTime";

            using var connection = CreateConnection();
            return await connection.QueryAsync<ScheduledOrder>(sql, new { AsOf = asOf });
        }

        public async Task<IEnumerable<ScheduledOrder>> GetByCustomerIdAsync(int customerId)
        {
            const string sql = @"
                SELECT Id, CustomerId, IdempotencyKey, OrderJson,
                       SubTotal, TaxAmount, TotalAmount,
                       PaymentToken, CardType, Last4,
                       TargetDateTime, PrepTimeMinutes, Status,
                       SalesId, ErrorMessage, CreatedAt, InjectedAt
                FROM ScheduledOrders
                WHERE CustomerId = @CustomerId
                ORDER BY TargetDateTime DESC";

            using var connection = CreateConnection();
            return await connection.QueryAsync<ScheduledOrder>(sql, new { CustomerId = customerId });
        }

        public async Task UpdateStatusAsync(int id, string status, int? salesId = null, string? errorMessage = null)
        {
            var sql = "UPDATE ScheduledOrders SET Status = @Status";

            if (salesId.HasValue)
                sql += ", SalesId = @SalesId";
            if (errorMessage != null)
                sql += ", ErrorMessage = @ErrorMessage";
            if (status == "injected")
                sql += ", InjectedAt = GETDATE()";

            sql += " WHERE Id = @Id";

            using var connection = CreateConnection();
            await connection.ExecuteAsync(sql, new { Id = id, Status = status, SalesId = salesId, ErrorMessage = errorMessage });
            _logger.LogInformation("Updated scheduled order {Id} status to {Status}", id, status);
        }

        public async Task<bool> CancelAsync(int id)
        {
            const string sql = @"
                UPDATE ScheduledOrders
                SET Status = 'cancelled'
                WHERE Id = @Id AND Status = 'pending'";

            using var connection = CreateConnection();
            var rows = await connection.ExecuteAsync(sql, new { Id = id });
            return rows > 0;
        }
    }
}
