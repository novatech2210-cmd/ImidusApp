using Dapper;
using IntegrationService.Core.Entities;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;

namespace IntegrationService.Infrastructure.Data
{
    /// <summary>
    /// Repository for ScheduledOrders - stored in IntegrationService database (overlay)
    /// NOT in INI_Restaurant database (source of truth) - SSOT compliant
    /// </summary>
    public interface IScheduledOrderRepository
    {
        Task<ScheduledOrder> GetByIdAsync(int id);
        Task<ScheduledOrder> GetByIdempotencyKeyAsync(string idempotencyKey);
        Task<IEnumerable<ScheduledOrder>> GetByCustomerIdAsync(int customerId);
        Task<IEnumerable<ScheduledOrder>> GetPendingOrdersAsync();
        Task<IEnumerable<ScheduledOrder>> GetOrdersReadyForReleaseAsync();
        Task<int> CreateAsync(ScheduledOrder order);
        Task<bool> UpdateAsync(ScheduledOrder order);
        Task<bool> CancelAsync(int id, string reason);
        Task<bool> MarkAsReleasedAsync(int id, int posSalesId, string posOrderNumber);
        Task<bool> MarkAsFailedAsync(int id, string errorMessage);
    }

    public class ScheduledOrderRepository : IScheduledOrderRepository
    {
        private readonly string _connectionString;
        private readonly ILogger<ScheduledOrderRepository> _logger;

        public ScheduledOrderRepository(string connectionString, ILogger<ScheduledOrderRepository> logger)
        {
            _connectionString = connectionString;
            _logger = logger;
        }

        public async Task<ScheduledOrder> GetByIdAsync(int id)
        {
            using var connection = new SqlConnection(_connectionString);
            const string sql = @"
                SELECT * FROM ScheduledOrders 
                WHERE Id = @Id";

            var result = await connection.QueryFirstOrDefaultAsync<ScheduledOrder>(sql, new { Id = id });
            return result;
        }

        public async Task<ScheduledOrder> GetByIdempotencyKeyAsync(string idempotencyKey)
        {
            using var connection = new SqlConnection(_connectionString);
            const string sql = @"
                SELECT * FROM ScheduledOrders 
                WHERE IdempotencyKey = @IdempotencyKey";

            var result = await connection.QueryFirstOrDefaultAsync<ScheduledOrder>(sql, new { IdempotencyKey = idempotencyKey });
            return result;
        }

        public async Task<IEnumerable<ScheduledOrder>> GetByCustomerIdAsync(int customerId)
        {
            using var connection = new SqlConnection(_connectionString);
            const string sql = @"
                SELECT * FROM ScheduledOrders 
                WHERE PosCustomerId = @CustomerId 
                ORDER BY ScheduledDateTime DESC";

            var results = await connection.QueryAsync<ScheduledOrder>(sql, new { CustomerId = customerId });
            return results;
        }

        public async Task<IEnumerable<ScheduledOrder>> GetPendingOrdersAsync()
        {
            using var connection = new SqlConnection(_connectionString);
            const string sql = @"
                SELECT * FROM ScheduledOrders 
                WHERE Status = 'pending'
                ORDER BY ScheduledDateTime ASC";

            var results = await connection.QueryAsync<ScheduledOrder>(sql);
            return results;
        }

        public async Task<IEnumerable<ScheduledOrder>> GetOrdersReadyForReleaseAsync()
        {
            using var connection = new SqlConnection(_connectionString);
            const string sql = @"
                SELECT * FROM ScheduledOrders 
                WHERE Status = 'pending' 
                AND ScheduledDateTime <= @Now
                AND ReleasedDateTime IS NULL
                AND ReleaseRetryCount < 3
                ORDER BY ScheduledDateTime ASC";

            var results = await connection.QueryAsync<ScheduledOrder>(sql, new { Now = DateTime.UtcNow });
            return results;
        }

        public async Task<int> CreateAsync(ScheduledOrder order)
        {
            using var connection = new SqlConnection(_connectionString);
            const string sql = @"
                INSERT INTO ScheduledOrders (
                    PosCustomerId, CustomerFirstName, CustomerLastName, CustomerPhone,
                    ScheduledDateTime, Status, ItemsJson, Subtotal, TaxAmount, TotalAmount,
                    PaymentAuthorizationNo, PaymentBatchNo, PaymentTypeId, TipAmount,
                    SpecialInstructions, IdempotencyKey, CreatedAt, CreatedBy
                ) VALUES (
                    @PosCustomerId, @CustomerFirstName, @CustomerLastName, @CustomerPhone,
                    @ScheduledDateTime, @Status, @ItemsJson, @Subtotal, @TaxAmount, @TotalAmount,
                    @PaymentAuthorizationNo, @PaymentBatchNo, @PaymentTypeId, @TipAmount,
                    @SpecialInstructions, @IdempotencyKey, @CreatedAt, @CreatedBy
                );
                SELECT CAST(SCOPE_IDENTITY() as int);";

            order.CreatedAt = DateTime.UtcNow;

            var id = await connection.ExecuteScalarAsync<int>(sql, order);
            return id;
        }

        public async Task<bool> UpdateAsync(ScheduledOrder order)
        {
            using var connection = new SqlConnection(_connectionString);
            const string sql = @"
                UPDATE ScheduledOrders SET
                    ScheduledDateTime = @ScheduledDateTime,
                    Status = @Status,
                    ItemsJson = @ItemsJson,
                    Subtotal = @Subtotal,
                    TaxAmount = @TaxAmount,
                    TotalAmount = @TotalAmount,
                    SpecialInstructions = @SpecialInstructions,
                    UpdatedAt = @UpdatedAt
                WHERE Id = @Id";

            order.UpdatedAt = DateTime.UtcNow;

            var rows = await connection.ExecuteAsync(sql, order);
            return rows > 0;
        }

        public async Task<bool> CancelAsync(int id, string reason)
        {
            using var connection = new SqlConnection(_connectionString);
            const string sql = @"
                UPDATE ScheduledOrders SET
                    Status = 'cancelled',
                    UpdatedAt = @UpdatedAt,
                    ReleaseErrorMessage = @Reason
                WHERE Id = @Id AND Status = 'pending'";

            var rows = await connection.ExecuteAsync(sql, new 
            { 
                Id = id, 
                UpdatedAt = DateTime.UtcNow,
                Reason = reason 
            });

            return rows > 0;
        }

        public async Task<bool> MarkAsReleasedAsync(int id, int posSalesId, string posOrderNumber)
        {
            using var connection = new SqlConnection(_connectionString);
            const string sql = @"
                UPDATE ScheduledOrders SET
                    Status = 'released',
                    ReleasedDateTime = @ReleasedDateTime,
                    PosSalesId = @PosSalesId,
                    PosOrderNumber = @PosOrderNumber,
                    UpdatedAt = @UpdatedAt
                WHERE Id = @Id";

            var rows = await connection.ExecuteAsync(sql, new 
            { 
                Id = id, 
                ReleasedDateTime = DateTime.UtcNow,
                PosSalesId = posSalesId,
                PosOrderNumber = posOrderNumber,
                UpdatedAt = DateTime.UtcNow
            });

            return rows > 0;
        }

        public async Task<bool> MarkAsFailedAsync(int id, string errorMessage)
        {
            using var connection = new SqlConnection(_connectionString);
            const string sql = @"
                UPDATE ScheduledOrders SET
                    Status = 'failed',
                    ReleaseErrorMessage = @ErrorMessage,
                    ReleaseRetryCount = ReleaseRetryCount + 1,
                    UpdatedAt = @UpdatedAt
                WHERE Id = @Id";

            var rows = await connection.ExecuteAsync(sql, new 
            { 
                Id = id, 
                ErrorMessage = errorMessage,
                UpdatedAt = DateTime.UtcNow
            });

            return rows > 0;
        }
    }
}
