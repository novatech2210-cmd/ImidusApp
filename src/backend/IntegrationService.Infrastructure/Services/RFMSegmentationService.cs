using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading.Tasks;
using Dapper;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using IntegrationService.Core.Models;

namespace IntegrationService.Infrastructure.Services
{
    /// <summary>
    /// RFM (Recency, Frequency, Monetary) Customer Segmentation Service
    /// Segments customers based on their purchase behavior for targeted marketing
    /// </summary>
    public interface IRFMSegmentationService
    {
        Task<List<RFMSegment>> CalculateSegmentsAsync();
        Task<List<Customer>> GetSegmentCustomersAsync(string segment);
        Task<RFMSegmentStats> GetSegmentStatsAsync();
    }

    public class RFMSegmentationService : IRFMSegmentationService
    {
        private readonly string _connectionString;

        public RFMSegmentationService(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("PosDatabase")
                ?? throw new ArgumentNullException(nameof(configuration));
        }

        /// <summary>
        /// Calculate RFM scores for all active customers
        /// Recency: Days since last purchase (lower = more recent)
        /// Frequency: Total orders in last 12 months
        /// Monetary: Total spending in last 12 months
        /// </summary>
        public async Task<List<RFMSegment>> CalculateSegmentsAsync()
        {
            const string query = @"
                WITH RFMData AS (
                    SELECT
                        c.CustomerID,
                        c.FName,
                        c.LName,
                        DATEDIFF(day, MAX(s.SalesDateTime), GETUTCDATE()) AS RecencyDays,
                        COUNT(DISTINCT s.SalesID) AS FrequencyOrders,
                        ISNULL(SUM(s.Total), 0) AS MonetaryValue
                    FROM TPPro.dbo.tblCustomer c
                    LEFT JOIN TPPro.dbo.tblSales s ON c.CustomerID = s.CustomerID
                        AND s.SalesDateTime >= DATEADD(year, -1, GETUTCDATE())
                        AND s.TransType = 1
                    WHERE c.CustomerID > 0
                    GROUP BY c.CustomerID, c.FName, c.LName
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
                    CONCAT(RecencyScore, FrequencyScore, MonetaryScore) AS RFMCode,
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

            using var connection = new SqlConnection(_connectionString);
            var segments = (await connection.QueryAsync<RFMSegment>(query)).ToList();
            return segments;
        }

        /// <summary>
        /// Get all customers in a specific RFM segment for targeted campaigns
        /// </summary>
        public async Task<List<Customer>> GetSegmentCustomersAsync(string segment)
        {
            const string query = @"
                WITH RFMData AS (
                    SELECT
                        c.CustomerID,
                        c.FName,
                        c.LName,
                        c.Phone,
                        c.Email,
                        c.EarnedPoints,
                        DATEDIFF(day, MAX(s.SalesDateTime), GETUTCDATE()) AS RecencyDays,
                        COUNT(DISTINCT s.SalesID) AS FrequencyOrders,
                        ISNULL(SUM(s.Total), 0) AS MonetaryValue
                    FROM TPPro.dbo.tblCustomer c
                    LEFT JOIN TPPro.dbo.tblSales s ON c.CustomerID = s.CustomerID
                        AND s.SalesDateTime >= DATEADD(year, -1, GETUTCDATE())
                        AND s.TransType = 1
                    WHERE c.CustomerID > 0
                    GROUP BY c.CustomerID, c.FName, c.LName, c.Phone, c.Email, c.EarnedPoints
                ),
                RFMScores AS (
                    SELECT
                        CustomerID,
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
                        CustomerID,
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
                ORDER BY CustomerID";

            using var connection = new SqlConnection(_connectionString);
            var customers = (await connection.QueryAsync<Customer>(query, new { Segment = segment })).ToList();
            return customers;
        }

        /// <summary>
        /// Get RFM segment statistics for dashboard
        /// </summary>
        public async Task<RFMSegmentStats> GetSegmentStatsAsync()
        {
            const string query = @"
                WITH RFMData AS (
                    SELECT
                        c.CustomerID,
                        DATEDIFF(day, MAX(s.SalesDateTime), GETUTCDATE()) AS RecencyDays,
                        COUNT(DISTINCT s.SalesID) AS FrequencyOrders,
                        ISNULL(SUM(s.Total), 0) AS MonetaryValue
                    FROM TPPro.dbo.tblCustomer c
                    LEFT JOIN TPPro.dbo.tblSales s ON c.CustomerID = s.CustomerID
                        AND s.SalesDateTime >= DATEADD(year, -1, GETUTCDATE())
                        AND s.TransType = 1
                    WHERE c.CustomerID > 0
                    GROUP BY c.CustomerID
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

            using var connection = new SqlConnection(_connectionString);
            var stats = await connection.QueryAsync<(string Segment, int Count)>(query);

            return new RFMSegmentStats
            {
                SegmentCounts = stats.ToDictionary(s => s.Segment, s => s.Count),
                TotalCustomers = stats.Sum(s => s.Count),
                LastCalculated = DateTime.UtcNow
            };
        }
    }

    /// <summary>
    /// Represents a customer's RFM segment
    /// </summary>
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

    /// <summary>
    /// RFM segment statistics
    /// </summary>
    public class RFMSegmentStats
    {
        public Dictionary<string, int> SegmentCounts { get; set; } = new();
        public int TotalCustomers { get; set; }
        public DateTime LastCalculated { get; set; }
    }
}
