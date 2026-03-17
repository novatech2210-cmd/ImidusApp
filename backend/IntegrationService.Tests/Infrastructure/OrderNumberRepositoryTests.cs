using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Dapper;
using IntegrationService.Infrastructure.Data;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace IntegrationService.Tests.Infrastructure
{
    /// <summary>
    /// Integration tests for OrderNumberRepository
    /// Verifies atomic daily order number generation with race condition handling
    ///
    /// Requirements:
    /// - SQL Server running with POS database
    /// - tblOrderNumber table exists (run migration 002-create-order-number-table.sql)
    ///
    /// Test coverage:
    /// - First order of day returns 1
    /// - Sequential orders increment correctly
    /// - Daily reset behavior (new day starts at 1)
    /// - Concurrent requests don't produce duplicate numbers
    /// </summary>
    [Collection("Database")]
    public class OrderNumberRepositoryTests : IDisposable
    {
        private readonly OrderNumberRepository _repository;
        private readonly string? _connectionString;
        private readonly bool _skipTests;

        public OrderNumberRepositoryTests()
        {
            // Get connection string from environment or use default
            _connectionString = Environment.GetEnvironmentVariable("ConnectionStrings__PosDatabase")
                ?? "Server=localhost;Database=INI_Restaurant;User Id=sa;Password=YourStrong@Passw0rd;TrustServerCertificate=True;";

            // Check if database is available
            try
            {
                using var conn = new SqlConnection(_connectionString);
                conn.Open();

                // Check if tblOrderNumber table exists
                var tableExists = conn.QueryFirstOrDefault<int>(
                    "SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tblOrderNumber'");

                _skipTests = tableExists == 0;
            }
            catch
            {
                _skipTests = true;
            }

            // Create repository instance
            var config = new ConfigurationBuilder()
                .AddInMemoryCollection(new Dictionary<string, string>
                {
                    ["ConnectionStrings:PosDatabase"] = _connectionString
                })
                .Build();

            var logger = new Mock<ILogger<OrderNumberRepository>>().Object;
            _repository = new OrderNumberRepository(config, logger);
        }

        [SkippableFact]
        public async Task GetNextDailyOrderNumberAsync_FirstOrderOfDay_ReturnsOne()
        {
            Skip.If(_skipTests, "Database not available or tblOrderNumber table not created");

            // Arrange: Clean test data for today
            await CleanupTestDataAsync();

            // Act
            var orderNumber = await _repository.GetNextDailyOrderNumberAsync();

            // Assert
            Assert.Equal(1, orderNumber);
        }

        [SkippableFact]
        public async Task GetNextDailyOrderNumberAsync_SequentialOrders_IncrementsCorrectly()
        {
            Skip.If(_skipTests, "Database not available or tblOrderNumber table not created");

            // Arrange: Clean and seed test data
            await CleanupTestDataAsync();
            await SeedOrderNumberAsync(DateTime.Today, 5);

            // Act
            var orderNumber = await _repository.GetNextDailyOrderNumberAsync();

            // Assert
            Assert.Equal(6, orderNumber);
        }

        [SkippableFact]
        public async Task GetNextDailyOrderNumberAsync_NewDay_ResetsToOne()
        {
            Skip.If(_skipTests, "Database not available or tblOrderNumber table not created");

            // Arrange: Seed yesterday's order number
            await CleanupTestDataAsync();
            var yesterday = DateTime.Today.AddDays(-1);
            await SeedOrderNumberAsync(yesterday, 100);

            // Act: Get order number for today (should be 1, not 101)
            var orderNumber = await _repository.GetNextDailyOrderNumberAsync();

            // Assert
            Assert.Equal(1, orderNumber);

            // Verify yesterday's count is unchanged
            var yesterdayCount = await GetOrderNumberForDateAsync(yesterday);
            Assert.Equal(100, yesterdayCount);
        }

        [SkippableFact]
        public async Task GetNextDailyOrderNumberAsync_ConcurrentRequests_NoDuplicates()
        {
            Skip.If(_skipTests, "Database not available or tblOrderNumber table not created");

            // Arrange: Clean test data
            await CleanupTestDataAsync();

            // Act: Simulate concurrent requests
            var tasks = new List<Task<int>>();
            for (int i = 0; i < 10; i++)
            {
                tasks.Add(_repository.GetNextDailyOrderNumberAsync());
            }

            var results = await Task.WhenAll(tasks);

            // Assert: All order numbers are unique
            var uniqueNumbers = new HashSet<int>(results);
            Assert.Equal(10, uniqueNumbers.Count);

            // Assert: Numbers are sequential (1-10 in some order)
            Assert.Equal(10, results.Length);
            foreach (var num in results)
            {
                Assert.InRange(num, 1, 10);
            }
        }

        [SkippableFact]
        public async Task GetNextDailyOrderNumberAsync_MultipleCallsSameDay_IncrementsProperly()
        {
            Skip.If(_skipTests, "Database not available or tblOrderNumber table not created");

            // Arrange
            await CleanupTestDataAsync();

            // Act: Get three consecutive order numbers
            var num1 = await _repository.GetNextDailyOrderNumberAsync();
            var num2 = await _repository.GetNextDailyOrderNumberAsync();
            var num3 = await _repository.GetNextDailyOrderNumberAsync();

            // Assert: Sequential increments
            Assert.Equal(1, num1);
            Assert.Equal(2, num2);
            Assert.Equal(3, num3);
        }

        #region Helper Methods

        private async Task CleanupTestDataAsync()
        {
            using var conn = new SqlConnection(_connectionString);
            await conn.OpenAsync();

            // Delete today's record to start fresh
            await conn.ExecuteAsync(
                "DELETE FROM tblOrderNumber WHERE CAST(CalledDateTime AS DATE) = @Today",
                new { Today = DateTime.Today });
        }

        private async Task SeedOrderNumberAsync(DateTime date, int orderNumber)
        {
            using var conn = new SqlConnection(_connectionString);
            await conn.OpenAsync();

            // Insert or update specific date's order number
            await conn.ExecuteAsync(@"
                IF EXISTS (SELECT 1 FROM tblOrderNumber WHERE CAST(CalledDateTime AS DATE) = @Date)
                    UPDATE tblOrderNumber SET OrderNumber = @OrderNumber WHERE CAST(CalledDateTime AS DATE) = @Date
                ELSE
                    INSERT INTO tblOrderNumber (CalledDateTime, OrderNumber) VALUES (@Date, @OrderNumber)",
                new { Date = date, OrderNumber = orderNumber });
        }

        private async Task<int?> GetOrderNumberForDateAsync(DateTime date)
        {
            using var conn = new SqlConnection(_connectionString);
            await conn.OpenAsync();

                return await conn.QueryFirstOrDefaultAsync<int?>(
                "SELECT OrderNumber FROM tblOrderNumber WHERE CAST(CalledDateTime AS DATE) = @Date",
                new { Date = date });
        }

        #endregion

        public void Dispose()
        {
            // Cleanup: Remove today's test data
            try
            {
                using var conn = new SqlConnection(_connectionString);
                conn.Open();
                conn.Execute("DELETE FROM tblOrderNumber WHERE CAST(CalledDateTime AS DATE) = @Today", new { Today = DateTime.Today });
            }
            catch
            {
                // Ignore cleanup errors
            }
        }
    }
}
