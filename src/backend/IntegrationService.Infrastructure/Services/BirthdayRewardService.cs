using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading.Tasks;
using Dapper;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using IntegrationService.Core.Models;

namespace IntegrationService.Infrastructure.Services
{
    /// <summary>
    /// Birthday Reward Service - Automates loyalty point rewards on customer birthdays
    /// </summary>
    public interface IBirthdayRewardService
    {
        Task ProcessBirthdaysAsync();
        Task<List<BirthdayCustomer>> GetUpcomingBirthdaysAsync(int daysAhead = 7);
        Task<BirthdayRewardConfig> GetConfigurationAsync();
        Task UpdateConfigurationAsync(BirthdayRewardConfig config);
    }

    public class BirthdayRewardService : IBirthdayRewardService
    {
        private readonly string _posConnectionString;
        private readonly string _backendConnectionString;
        private readonly ILogger<BirthdayRewardService> _logger;

        public BirthdayRewardService(
            IConfiguration configuration,
            ILogger<BirthdayRewardService> logger)
        {
            _posConnectionString = configuration.GetConnectionString("PosDatabase")
                ?? throw new ArgumentNullException(nameof(configuration));
            _backendConnectionString = configuration.GetConnectionString("BackendDatabase")
                ?? throw new ArgumentNullException(nameof(configuration));
            _logger = logger;
        }

        /// <summary>
        /// Process birthday rewards for customers with birthdays today
        /// Idempotent: Won't award duplicate rewards on same day
        /// </summary>
        public async Task ProcessBirthdaysAsync()
        {
            try
            {
                _logger.LogInformation("Starting birthday reward processing");

                var config = await GetConfigurationAsync();
                if (!config.Enabled)
                {
                    _logger.LogInformation("Birthday rewards disabled in configuration");
                    return;
                }

                // Get customers with birthdays today
                var birthdayCustomers = await GetBirthdayCustomersAsync();
                _logger.LogInformation($"Found {birthdayCustomers.Count} customers with birthdays today");

                foreach (var customer in birthdayCustomers)
                {
                    try
                    {
                        // Check idempotency - has reward already been issued today?
                        var alreadyRewarded = await CheckRewardIssuedTodayAsync(customer.CustomerID);
                        if (alreadyRewarded)
                        {
                            _logger.LogWarning($"Birthday reward already issued for customer {customer.CustomerID} today");
                            continue;
                        }

                        // Award points
                        await AwardBirthdayPointsAsync(customer, config.RewardPoints);

                        // Log the reward
                        await LogBirthdayRewardAsync(customer.CustomerID, config.RewardPoints);

                        _logger.LogInformation($"Birthday reward awarded to customer {customer.CustomerID}: {config.RewardPoints} points");
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError($"Error processing birthday for customer {customer.CustomerID}: {ex.Message}");
                        // Continue processing other customers
                    }
                }

                _logger.LogInformation("Birthday reward processing completed successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error in birthday reward service: {ex.Message}");
                throw;
            }
        }

        /// <summary>
        /// Get customers with birthdays in the next N days
        /// </summary>
        public async Task<List<BirthdayCustomer>> GetUpcomingBirthdaysAsync(int daysAhead = 7)
        {
            const string query = @"
                SELECT
                    c.CustomerID,
                    c.FName,
                    c.LName,
                    c.Phone,
                    c.Email,
                    c.BirthDate,
                    c.EarnedPoints,
                    DATEDIFF(day, GETUTCDATE(),
                        DATEFROMPARTS(YEAR(GETUTCDATE()), MONTH(c.BirthDate), DAY(c.BirthDate))
                    ) AS DaysUntilBirthday
                FROM TPPro.dbo.tblCustomer c
                WHERE c.CustomerID > 0
                  AND c.BirthDate IS NOT NULL
                  AND DATEDIFF(day, GETUTCDATE(),
                        DATEFROMPARTS(YEAR(GETUTCDATE()), MONTH(c.BirthDate), DAY(c.BirthDate))
                    ) BETWEEN 0 AND @DaysAhead
                ORDER BY DaysUntilBirthday";

            using var connection = new SqlConnection(_posConnectionString);
            var customers = (await connection.QueryAsync<BirthdayCustomer>(query, new { DaysAhead = daysAhead }))
                .ToList();
            return customers;
        }

        /// <summary>
        /// Get configuration for birthday rewards
        /// </summary>
        public async Task<BirthdayRewardConfig> GetConfigurationAsync()
        {
            const string query = @"
                SELECT TOP 1
                    RewardPoints,
                    Enabled,
                    LastModified
                FROM IntegrationService.dbo.BirthdayRewardConfig
                ORDER BY LastModified DESC";

            using var connection = new SqlConnection(_backendConnectionString);
            var config = await connection.QueryFirstOrDefaultAsync<BirthdayRewardConfig>(query);

            // Return default if not configured
            return config ?? new BirthdayRewardConfig
            {
                RewardPoints = 500,
                Enabled = true,
                LastModified = DateTime.UtcNow
            };
        }

        /// <summary>
        /// Update birthday reward configuration
        /// </summary>
        public async Task UpdateConfigurationAsync(BirthdayRewardConfig config)
        {
            const string query = @"
                MERGE INTO IntegrationService.dbo.BirthdayRewardConfig AS target
                USING (SELECT @RewardPoints as RewardPoints, @Enabled as Enabled) AS source
                ON 1=0
                WHEN NOT MATCHED THEN
                    INSERT (RewardPoints, Enabled, LastModified)
                    VALUES (source.RewardPoints, source.Enabled, GETUTCDATE())
                WHEN MATCHED THEN
                    UPDATE SET
                        RewardPoints = source.RewardPoints,
                        Enabled = source.Enabled,
                        LastModified = GETUTCDATE();";

            using var connection = new SqlConnection(_backendConnectionString);
            await connection.ExecuteAsync(query, new
            {
                RewardPoints = config.RewardPoints,
                Enabled = config.Enabled
            });

            _logger.LogInformation($"Birthday reward configuration updated: {config.RewardPoints} points, Enabled={config.Enabled}");
        }

        /// <summary>
        /// Get customers with birthdays today
        /// </summary>
        private async Task<List<BirthdayCustomer>> GetBirthdayCustomersAsync()
        {
            const string query = @"
                SELECT
                    c.CustomerID,
                    c.FName,
                    c.LName,
                    c.Phone,
                    c.Email,
                    c.BirthDate,
                    c.EarnedPoints
                FROM TPPro.dbo.tblCustomer c
                WHERE c.CustomerID > 0
                  AND c.BirthDate IS NOT NULL
                  AND MONTH(c.BirthDate) = MONTH(GETUTCDATE())
                  AND DAY(c.BirthDate) = DAY(GETUTCDATE())
                ORDER BY c.CustomerID";

            using var connection = new SqlConnection(_posConnectionString);
            var customers = (await connection.QueryAsync<BirthdayCustomer>(query)).ToList();
            return customers;
        }

        /// <summary>
        /// Check if reward already issued today (idempotency check)
        /// </summary>
        private async Task<bool> CheckRewardIssuedTodayAsync(int customerId)
        {
            const string query = @"
                SELECT COUNT(*)
                FROM IntegrationService.dbo.BirthdayRewards
                WHERE CustomerID = @CustomerId
                  AND CAST(RewardDate AS DATE) = CAST(GETUTCDATE() AS DATE)";

            using var connection = new SqlConnection(_backendConnectionString);
            var count = await connection.ExecuteScalarAsync<int>(query, new { CustomerId = customerId });
            return count > 0;
        }

        /// <summary>
        /// Award birthday points to customer
        /// Updates tblPointsDetail in POS database
        /// </summary>
        private async Task AwardBirthdayPointsAsync(BirthdayCustomer customer, int points)
        {
            const string insertQuery = @"
                INSERT INTO TPPro.dbo.tblPointsDetail (
                    CustomerID,
                    PointUsed,
                    PointSaved,
                    ReasonCode,
                    CreateDateTime
                ) VALUES (
                    @CustomerId,
                    0,
                    @Points,
                    'BIRTHDAY',
                    GETUTCDATE()
                );

                UPDATE TPPro.dbo.tblCustomer
                SET EarnedPoints = EarnedPoints + @Points
                WHERE CustomerID = @CustomerId";

            using var connection = new SqlConnection(_posConnectionString);
            await connection.ExecuteAsync(insertQuery, new
            {
                CustomerId = customer.CustomerID,
                Points = points
            });
        }

        /// <summary>
        /// Log birthday reward issuance for audit trail
        /// </summary>
        private async Task LogBirthdayRewardAsync(int customerId, int points)
        {
            const string query = @"
                INSERT INTO IntegrationService.dbo.BirthdayRewards (
                    CustomerID,
                    RewardDate,
                    PointsAwarded,
                    FcmSent,
                    CreatedAt
                ) VALUES (
                    @CustomerId,
                    CAST(GETUTCDATE() AS DATE),
                    @Points,
                    0,
                    GETUTCDATE()
                )";

            using var connection = new SqlConnection(_backendConnectionString);
            await connection.ExecuteAsync(query, new
            {
                CustomerId = customerId,
                Points = points
            });
        }
    }

    /// <summary>
    /// Birthday customer data
    /// </summary>
    public class BirthdayCustomer
    {
        public int CustomerID { get; set; }
        public string FName { get; set; }
        public string LName { get; set; }
        public string Phone { get; set; }
        public string Email { get; set; }
        public DateTime? BirthDate { get; set; }
        public int EarnedPoints { get; set; }
        public int? DaysUntilBirthday { get; set; }
    }

    /// <summary>
    /// Birthday reward configuration
    /// </summary>
    public class BirthdayRewardConfig
    {
        public int RewardPoints { get; set; } = 500;
        public bool Enabled { get; set; } = true;
        public DateTime LastModified { get; set; }
    }
}
