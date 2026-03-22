using System;
using System.Collections.Generic;
using System.Data;
using System.Text;
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
    /// Repository for customer RFM analytics
    /// Reads from POS database (INI_Restaurant) - source of truth for sales data
    /// Reads from IntegrationService database for CustomerProfiles (birthday data)
    /// </summary>
    public class CustomerAnalyticsRepository : ICustomerAnalyticsRepository
    {
        private readonly string _posConnectionString;
        private readonly string _backendConnectionString;
        private readonly ILogger<CustomerAnalyticsRepository> _logger;

        public CustomerAnalyticsRepository(IConfiguration configuration, ILogger<CustomerAnalyticsRepository> logger)
        {
            _posConnectionString = configuration.GetConnectionString("PosDatabase")
                ?? throw new ArgumentNullException("PosDatabase connection string not found");
            _backendConnectionString = configuration.GetConnectionString("BackendDatabase")
                ?? throw new ArgumentNullException("BackendDatabase connection string not found");
            _logger = logger;
        }

        private IDbConnection CreatePosConnection() => new SqlConnection(_posConnectionString);
        private IDbConnection CreateBackendConnection() => new SqlConnection(_backendConnectionString);

        /// <summary>
        /// Get customers with full RFM metrics, optionally filtered
        /// </summary>
        public async Task<IEnumerable<CustomerRfmData>> GetCustomersWithRfmAsync(RfmFilter? filter = null)
        {
            var sql = new StringBuilder(@"
                SELECT
                    c.ID AS CustomerId,
                    COALESCE(c.FName + ' ' + c.LName, c.Phone) AS Name,
                    c.Phone,
                    c.Email,
                    c.BirthMonth,
                    c.BirthDay,
                    c.EarnedPoints,
                    COALESCE(rfm.TotalSpent, 0) AS TotalSpent,
                    COALESCE(rfm.OrderCount, 0) AS OrderCount,
                    COALESCE(DATEDIFF(day, rfm.LastOrderDate, GETDATE()), 9999) AS DaysSinceLastOrder,
                    rfm.LastOrderDate,
                    CASE
                        WHEN COALESCE(rfm.TotalSpent, 0) >= 500 THEN 'VIP'
                        WHEN COALESCE(rfm.TotalSpent, 0) >= 200 THEN 'Loyal'
                        WHEN rfm.LastOrderDate IS NULL THEN 'New'
                        WHEN rfm.LastOrderDate < DATEADD(day, -90, GETDATE()) THEN 'At-Risk'
                        ELSE 'Regular'
                    END AS Segment
                FROM dbo.tblCustomer c
                LEFT JOIN (
                    SELECT
                        CustomerID,
                        SUM(SubTotal + GSTAmt + PSTAmt) AS TotalSpent,
                        COUNT(*) AS OrderCount,
                        MAX(SaleDateTime) AS LastOrderDate
                    FROM dbo.tblSales
                    WHERE TransType = 1
                    GROUP BY CustomerID
                ) rfm ON c.ID = rfm.CustomerID
                WHERE c.ID > 0");

            var parameters = new DynamicParameters();

            if (filter != null)
            {
                if (filter.MinSpend.HasValue)
                {
                    sql.Append(" AND COALESCE(rfm.TotalSpent, 0) >= @MinSpend");
                    parameters.Add("MinSpend", filter.MinSpend.Value);
                }
                if (filter.MaxSpend.HasValue)
                {
                    sql.Append(" AND COALESCE(rfm.TotalSpent, 0) <= @MaxSpend");
                    parameters.Add("MaxSpend", filter.MaxSpend.Value);
                }
                if (filter.MinVisits.HasValue)
                {
                    sql.Append(" AND COALESCE(rfm.OrderCount, 0) >= @MinVisits");
                    parameters.Add("MinVisits", filter.MinVisits.Value);
                }
                if (filter.MaxVisits.HasValue)
                {
                    sql.Append(" AND COALESCE(rfm.OrderCount, 0) <= @MaxVisits");
                    parameters.Add("MaxVisits", filter.MaxVisits.Value);
                }
                if (filter.RecencyDays.HasValue)
                {
                    sql.Append(" AND rfm.LastOrderDate >= DATEADD(day, -@RecencyDays, GETDATE())");
                    parameters.Add("RecencyDays", filter.RecencyDays.Value);
                }
                if (filter.InactiveDays.HasValue)
                {
                    sql.Append(" AND (rfm.LastOrderDate IS NULL OR rfm.LastOrderDate < DATEADD(day, -@InactiveDays, GETDATE()))");
                    parameters.Add("InactiveDays", filter.InactiveDays.Value);
                }
                if (filter.HasBirthdayToday == true)
                {
                    sql.Append(" AND c.BirthMonth = MONTH(GETDATE()) AND c.BirthDay = DAY(GETDATE())");
                }
                if (!string.IsNullOrEmpty(filter.Segment))
                {
                    // Can't filter by computed column directly, wrap in subquery
                    sql = new StringBuilder($@"
                        SELECT * FROM ({sql}) AS sub
                        WHERE Segment = @Segment");
                    parameters.Add("Segment", filter.Segment);
                }
            }

            sql.Append(" ORDER BY TotalSpent DESC");

            using var connection = CreatePosConnection();
            var results = await connection.QueryAsync<CustomerRfmData>(sql.ToString(), parameters);
            _logger.LogInformation("Retrieved {Count} customers with RFM data", results.AsList().Count);
            return results;
        }

        /// <summary>
        /// Get RFM data for a single customer
        /// </summary>
        public async Task<CustomerRfmData?> GetCustomerRfmAsync(int customerId)
        {
            const string sql = @"
                SELECT
                    c.ID AS CustomerId,
                    COALESCE(c.FName + ' ' + c.LName, c.Phone) AS Name,
                    c.Phone,
                    c.Email,
                    c.BirthMonth,
                    c.BirthDay,
                    c.EarnedPoints,
                    COALESCE(rfm.TotalSpent, 0) AS TotalSpent,
                    COALESCE(rfm.OrderCount, 0) AS OrderCount,
                    COALESCE(DATEDIFF(day, rfm.LastOrderDate, GETDATE()), 9999) AS DaysSinceLastOrder,
                    rfm.LastOrderDate,
                    CASE
                        WHEN COALESCE(rfm.TotalSpent, 0) >= 500 THEN 'VIP'
                        WHEN COALESCE(rfm.TotalSpent, 0) >= 200 THEN 'Loyal'
                        WHEN rfm.LastOrderDate IS NULL THEN 'New'
                        WHEN rfm.LastOrderDate < DATEADD(day, -90, GETDATE()) THEN 'At-Risk'
                        ELSE 'Regular'
                    END AS Segment
                FROM dbo.tblCustomer c
                LEFT JOIN (
                    SELECT
                        CustomerID,
                        SUM(SubTotal + GSTAmt + PSTAmt) AS TotalSpent,
                        COUNT(*) AS OrderCount,
                        MAX(SaleDateTime) AS LastOrderDate
                    FROM dbo.tblSales
                    WHERE TransType = 1
                    GROUP BY CustomerID
                ) rfm ON c.ID = rfm.CustomerID
                WHERE c.ID = @CustomerId";

            using var connection = CreatePosConnection();
            return await connection.QueryFirstOrDefaultAsync<CustomerRfmData>(sql, new { CustomerId = customerId });
        }

        /// <summary>
        /// Count customers matching filter criteria (for campaign preview)
        /// </summary>
        public async Task<int> GetCustomerCountByFilterAsync(RfmFilter filter)
        {
            var customers = await GetCustomersWithRfmAsync(filter);
            return customers.AsList().Count;
        }

        /// <summary>
        /// Get customer IDs matching filter criteria (for campaign sending)
        /// </summary>
        public async Task<IEnumerable<int>> GetCustomerIdsByFilterAsync(RfmFilter filter)
        {
            var customers = await GetCustomersWithRfmAsync(filter);
            var ids = new List<int>();
            foreach (var c in customers)
            {
                ids.Add(c.CustomerId);
            }
            return ids;
        }
    }
}
