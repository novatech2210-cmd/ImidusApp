using System;
using System.Threading.Tasks;
using Dapper;
using Microsoft.Data.SqlClient;
using Xunit;

namespace IntegrationService.Tests.Integration
{
    /// <summary>
    /// Integration tests that verify database connectivity and entity queries.
    /// These tests require a running SQL Server instance with the POS database.
    ///
    /// To run: Ensure docker-compose is up and database is restored.
    /// Skip in CI if database is not available.
    ///
    /// Test coverage:
    /// - Basic connectivity
    /// - tblItem query with correct column aliases
    /// - tblCategory query with correct column aliases
    /// - tblMisc tax rate configuration
    /// </summary>
    [Collection("Database")]
    public class DatabaseConnectivityTests : IDisposable
    {
        private readonly string? _connectionString;
        private readonly bool _skipTests;

        public DatabaseConnectivityTests()
        {
            // Try to get connection string from environment or use default for docker-compose
            _connectionString = Environment.GetEnvironmentVariable("ConnectionStrings__PosDatabase")
                ?? "Server=localhost;Database=INI_Restaurant;User Id=sa;Password=YourStrong@Passw0rd;TrustServerCertificate=True;";

            // Check if we can connect
            try
            {
                using var conn = new SqlConnection(_connectionString);
                conn.Open();
                _skipTests = false;
            }
            catch
            {
                _skipTests = true;
            }
        }

        [SkippableFact]
        public async Task CanConnect_ToDatabase()
        {
            Skip.If(_skipTests, "Database not available");

            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            var result = await connection.QueryFirstAsync<int>("SELECT 1");
            Assert.Equal(1, result);
        }

        [SkippableFact]
        public async Task CanQuery_tblItem_WithCorrectAliases()
        {
            Skip.If(_skipTests, "Database not available");

            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            // Use the actual query pattern from PosRepository - testing column aliases
            var sql = @"
                SELECT TOP 5
                    ID AS ItemID,
                    IName,
                    CategoryID,
                    Status,
                    OnlineItem
                FROM dbo.tblItem
                WHERE Status = 1";

            var items = await connection.QueryAsync<dynamic>(sql);

            // Verify we got some results and columns map correctly
            foreach (var item in items)
            {
                Assert.NotNull(item.ItemID);
                Assert.NotNull(item.IName);
            }
        }

        [SkippableFact]
        public async Task CanQuery_tblCategory_WithCorrectAliases()
        {
            Skip.If(_skipTests, "Database not available");

            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            // Test category query with column aliasing
            var sql = @"
                SELECT TOP 5
                    ID AS CategoryID,
                    CatName AS CName,
                    PrintOrder
                FROM dbo.tblCategory
                WHERE Status = 1";

            var categories = await connection.QueryAsync<dynamic>(sql);

            foreach (var cat in categories)
            {
                Assert.NotNull(cat.CategoryID);
                Assert.NotNull(cat.CName);
            }
        }

        [SkippableFact]
        public async Task CanQuery_tblMisc_TaxRates()
        {
            Skip.If(_skipTests, "Database not available");

            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            // Verify tblMisc structure for tax rates
            var sql = @"
                SELECT MiscName, Value
                FROM dbo.tblMisc
                WHERE MiscName IN ('GSTPercentage', 'PSTPercentage', 'PST2Percentage')";

            var rates = await connection.QueryAsync<dynamic>(sql);

            // Should find at least GST rate (standard Canadian tax)
            Assert.NotEmpty(rates);
        }

        [SkippableFact]
        public async Task CanQuery_tblSize_WithCorrectAliases()
        {
            Skip.If(_skipTests, "Database not available");

            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            // Test size query with column aliasing (ID -> SizeID)
            var sql = @"
                SELECT TOP 5
                    ID AS SizeID,
                    SizeName,
                    ShortName
                FROM dbo.tblSize";

            var sizes = await connection.QueryAsync<dynamic>(sql);

            foreach (var size in sizes)
            {
                Assert.NotNull(size.SizeID);
                Assert.NotNull(size.SizeName);
            }
        }

        [SkippableFact]
        public async Task CanQuery_tblAvailableSize_PricingData()
        {
            Skip.If(_skipTests, "Database not available");

            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            // Test available sizes query - critical for pricing
            var sql = @"
                SELECT TOP 5
                    ItemID,
                    SizeID,
                    UnitPrice,
                    OnHandQty
                FROM dbo.tblAvailableSize";

            var prices = await connection.QueryAsync<dynamic>(sql);

            foreach (var price in prices)
            {
                Assert.NotNull(price.ItemID);
                Assert.NotNull(price.SizeID);
                Assert.NotNull(price.UnitPrice);
            }
        }

        public void Dispose()
        {
            // Cleanup if needed
        }
    }
}
