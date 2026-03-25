using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading.Tasks;
using Dapper;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using IntegrationService.Core.Domain.Entities;
using Microsoft.Extensions.Logging;

namespace IntegrationService.Infrastructure.Services
{
    /// <summary>
    /// RFM (Recency, Frequency, Monetary) Customer Segmentation Service
    /// Segments customers based on their purchase behavior for targeted marketing
    /// SSOT Compliant: Reads from INI_Restaurant (POS) for ground truth behavioral data
    /// </summary>
    public interface IRFMSegmentationService
    {
        Task<List<RFMSegment>> CalculateSegmentsAsync();
        Task<List<PosCustomer>> GetSegmentCustomersAsync(string segment);
        Task<RFMSegmentStats> GetSegmentStatsAsync();
    }

    public class RFMSegmentationService : IRFMSegmentationService
    {
        private readonly string _connectionString;
        private readonly ILogger<RFMSegmentationService> _logger;

        public RFMSegmentationService(IConfiguration configuration, ILogger<RFMSegmentationService> logger)
        {
            _connectionString = configuration.GetConnectionString("PosDatabase")
                ?? throw new ArgumentNullException(nameof(configuration));
            _logger = logger;
        }

        private IDbConnection CreateConnection() => new SqlConnection(_connectionString);

        /// <summary>
        /// Calculate RFM scores for all active customers
        /// Recency: Days since last purchase (lower = more recent)
        /// Frequency: Total orders in last 12 months
        /// Monetary: Total spending in last 12 months (calculated from Subtotal + Tax - Discount)
        /// SQL 2005 COMPATIBLE: Uses NTILE(4) for quartile scoring
        /// </summary>
        public async Task<List<RFMSegment>> CalculateSegmentsAsync()
        {
            // SQL 2005 Compatibility: 
            // 1. No 'Total' column in tblSales, calculate on the fly
            // 2. Use GETDATE() instead of GETUTCDATE() if server is local (POS standard)
            // 3. NTILE(4) is supported in SQL 2005
            const string query = @"
                WITH RFMData AS (
                    SELECT
                        c.ID AS CustomerID,
                        c.FName,
                        c.LName,
                        DATEDIFF(day, MAX(s.SaleDateTime), GETDATE()) AS RecencyDays,
                        COUNT(DISTINCT s.ID) AS FrequencyOrders,
                        ISNULL(SUM(s.SubTotal + s.GSTAmt + s.PSTAmt + s.PST2Amt - s.DSCAmt), 0) AS MonetaryValue
                    FROM dbo.tblCustomer c
                    LEFT JOIN dbo.tblSales s ON c.ID = s.CustomerID
                        AND s.SaleDateTime >= DATEADD(year, -1, GETDATE())
                        AND s.TransType = 1
                    WHERE c.ID > 0
                    GROUP BY c.ID, c.FName, c.LName
                ),
                RFMScores AS (
                    SELECT
                        CustomerID,
                        FName,
                        LName,
                        RecencyDays,
                        FrequencyOrders,
                        MonetaryValue,
                        -- Quartile scoring: 4 (best) to 1 (worst)
                        NTILE(4) OVER (ORDER BY RecencyDays DESC) AS RecencyScore,
                        NTILE(4) OVER (ORDER BY FrequencyOrders) AS FrequencyScore,
                        NTILE(4) OVER (ORDER BY MonetaryValue) AS MonetaryScore
                    FROM RFMData
                )
                SELECT
                    CustomerID,
                    FName,
                    LName,
                    RecencyScore,
                    FrequencyScore,
                    MonetaryScore,
                    (CAST(RecencyScore AS VARCHAR(1)) + CAST(FrequencyScore AS VARCHAR(1)) + CAST(MonetaryScore AS VARCHAR(1))) AS RFMCode,
                    CASE
                        WHEN RecencyScore = 4 AND FrequencyScore = 4 AND MonetaryScore = 4 THEN 'Champions'
                        WHEN RecencyScore >= 3 AND FrequencyScore >= 3 AND MonetaryScore >= 3 THEN 'Loyal'
                        WHEN RecencyScore >= 3 AND (FrequencyScore >= 3 OR MonetaryScore >= 3) THEN 'Potential'
                        WHEN RecencyScore <= 2 AND FrequencyScore >= 3 THEN 'At Risk'
                        WHEN RecencyScore <= 1 THEN 'Lost'
                        ELSE 'Regular'
                    END AS Segment
                FROM RFMScores
                ORDER BY Segment, RecencyScore DESC, FrequencyScore DESC";

            try 
            {
                using var connection = CreateConnection();
                var segments = (await connection.QueryAsync<RFMSegment>(query)).ToList();
                return segments;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calculating RFM segments from POS database");
                throw;
            }
        }

        public async Task<List<PosCustomer>> GetSegmentCustomersAsync(string segment)
        {
            const string query = @"
                WITH RFMData AS (
                    SELECT
                        c.ID,
                        c.FName,
                        c.LName,
                        c.Phone,
                        c.Email,
                        c.EarnedPoints,
                        DATEDIFF(day, MAX(s.SaleDateTime), GETDATE()) AS RecencyDays,
                        COUNT(DISTINCT s.ID) AS FrequencyOrders,
                        ISNULL(SUM(s.SubTotal + s.GSTAmt + s.PSTAmt + s.PST2Amt - s.DSCAmt), 0) AS MonetaryValue
                    FROM dbo.tblCustomer c
                    LEFT JOIN dbo.tblSales s ON c.ID = s.CustomerID
                        AND s.SaleDateTime >= DATEADD(year, -1, GETDATE())
                        AND s.TransType = 1
                    WHERE c.ID > 0
                    GROUP BY c.ID, c.FName, c.LName, c.Phone, c.Email, c.EarnedPoints
                ),
                RFMScores AS (
                    SELECT
                        ID,
                        FName,
                        LName,
                        Phone,
                        Email,
                        EarnedPoints,
                        NTILE(4) OVER (ORDER BY RecencyDays DESC) AS RecencyScore,
                        NTILE(4) OVER (ORDER BY FrequencyOrders) AS FrequencyScore,
                        NTILE(4) OVER (ORDER BY MonetaryValue) AS MonetaryScore
                    FROM RFMData
                ),
                Segmented AS (
                    SELECT
                        ID,
                        FName,
                        LName,
                        Phone,
                        Email,
                        EarnedPoints,
                        CASE
                            WHEN RecencyScore = 4 AND FrequencyScore = 4 AND MonetaryScore = 4 THEN 'Champions'
                            WHEN RecencyScore >= 3 AND FrequencyScore >= 3 AND MonetaryScore >= 3 THEN 'Loyal'
                            WHEN RecencyScore >= 3 AND (FrequencyScore >= 3 OR MonetaryScore >= 3) THEN 'Potential'
                            WHEN RecencyScore <= 2 AND FrequencyScore >= 3 THEN 'At Risk'
                            WHEN RecencyScore <= 1 THEN 'Lost'
                            ELSE 'Regular'
                        END AS Segment
                    FROM RFMScores
                )
                SELECT * FROM Segmented
                WHERE Segment = @Segment
                ORDER BY ID";

            using var connection = CreateConnection();
            var customers = (await connection.QueryAsync<PosCustomer>(query, new { Segment = segment })).ToList();
            return customers;
        }

        public async Task<RFMSegmentStats> GetSegmentStatsAsync()
        {
            const string query = @"
                WITH RFMData AS (
                    SELECT
                        c.ID AS CustomerID,
                        DATEDIFF(day, MAX(s.SaleDateTime), GETDATE()) AS RecencyDays,
                        COUNT(DISTINCT s.ID) AS FrequencyOrders,
                        ISNULL(SUM(s.SubTotal + s.GSTAmt + s.PSTAmt + s.PST2Amt - s.DSCAmt), 0) AS MonetaryValue
                    FROM dbo.tblCustomer c
                    LEFT JOIN dbo.tblSales s ON c.ID = s.CustomerID
                        AND s.SaleDateTime >= DATEADD(year, -1, GETDATE())
                        AND s.TransType = 1
                    WHERE c.ID > 0
                    GROUP BY c.ID
                ),
                RFMScores AS (
                    SELECT
                        NTILE(4) OVER (ORDER BY RecencyDays DESC) AS RecencyScore,
                        NTILE(4) OVER (ORDER BY FrequencyOrders) AS FrequencyScore,
                        NTILE(4) OVER (ORDER BY MonetaryValue) AS MonetaryScore
                    FROM RFMData
                ),
                Segmented AS (
                    SELECT
                        CASE
                            WHEN RecencyScore = 4 AND FrequencyScore = 4 AND MonetaryScore = 4 THEN 'Champions'
                            WHEN RecencyScore >= 3 AND FrequencyScore >= 3 AND MonetaryScore >= 3 THEN 'Loyal'
                            WHEN RecencyScore >= 3 AND (FrequencyScore >= 3 OR MonetaryScore >= 3) THEN 'Potential'
                            WHEN RecencyScore <= 2 AND FrequencyScore >= 3 THEN 'At Risk'
                            WHEN RecencyScore <= 1 THEN 'Lost'
                            ELSE 'Regular'
                        END AS Segment
                    FROM RFMScores
                )
                SELECT
                    Segment,
                    COUNT(*) AS Count
                FROM Segmented
                GROUP BY Segment";

            using var connection = CreateConnection();
            var stats = await connection.QueryAsync<SegmentCountRow>(query);

            return new RFMSegmentStats
            {
                SegmentCounts = stats.ToDictionary(s => s.Segment, s => s.Count),
                TotalCustomers = stats.Sum(s => s.Count),
                LastCalculated = DateTime.UtcNow
            };
        }

        private class SegmentCountRow
        {
            public string Segment { get; set; }
            public int Count { get; set; }
        }
    }

    public class RFMSegment
    {
        public int CustomerID { get; set; }
        public string FName { get; set; }
        public string LName { get; set; }
        public int RecencyScore { get; set; }
        public int FrequencyScore { get; set; }
        public int MonetaryScore { get; set; }
        public string RFMCode { get; set; }
        public string Segment { get; set; }
    }

    public class RFMSegmentStats
    {
        public Dictionary<string, int> SegmentCounts { get; set; } = new();
        public int TotalCustomers { get; set; }
        public DateTime LastCalculated { get; set; }
    }
}
