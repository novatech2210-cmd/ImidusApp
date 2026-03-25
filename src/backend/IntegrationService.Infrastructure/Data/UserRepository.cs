using System;
using System.Data;
using System.Threading.Tasks;
using Dapper;
using IntegrationService.Core.Domain.Entities;
using IntegrationService.Core.Models.AdminPortal;
using IntegrationService.Core.Interfaces;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace IntegrationService.Infrastructure.Data
{
    /// <summary>
    /// Repository for User authentication in IntegrationService database
    /// </summary>
    public class UserRepository : IUserRepository
    {
        private readonly string _connectionString;
        private readonly ILogger<UserRepository> _logger;

        public UserRepository(IConfiguration configuration, ILogger<UserRepository> logger)
        {
            _connectionString = configuration.GetConnectionString("BackendDatabase")
                ?? throw new ArgumentNullException("BackendDatabase connection string not found");
            _logger = logger;
        }

        private IDbConnection CreateConnection()
        {
            return new SqlConnection(_connectionString);
        }

        /// <summary>
        /// Get user by ID
        /// </summary>
        public async Task<User?> GetByIdAsync(int id)
        {
            const string sql = @"
                SELECT ID, CustomerID, Email, EmailConfirmed, PasswordHash, SecurityStamp,
                       PhoneNumber, PhoneConfirmed, TwoFactorEnabled, LockoutEnd, LockoutEnabled,
                       AccessFailedCount, CreatedAt, UpdatedAt, LastLoginAt, IsActive
                FROM Users
                WHERE ID = @Id AND IsActive = 1";

            using var connection = CreateConnection();
            return await connection.QueryFirstOrDefaultAsync<User>(sql, new { Id = id });
        }

        /// <summary>
        /// Get user by email
        /// </summary>
        public async Task<User?> GetByEmailAsync(string email)
        {
            const string sql = @"
                SELECT ID, CustomerID, Email, EmailConfirmed, PasswordHash, SecurityStamp,
                       PhoneNumber, PhoneConfirmed, TwoFactorEnabled, LockoutEnd, LockoutEnabled,
                       AccessFailedCount, CreatedAt, UpdatedAt, LastLoginAt, IsActive
                FROM Users
                WHERE Email = @Email AND IsActive = 1";

            using var connection = CreateConnection();
            return await connection.QueryFirstOrDefaultAsync<User>(sql, new { Email = email });
        }

        /// <summary>
        /// Get user by CustomerID (POS tblCustomer link)
        /// </summary>
        public async Task<User?> GetByCustomerIdAsync(int customerId)
        {
            const string sql = @"
                SELECT ID, CustomerID, Email, EmailConfirmed, PasswordHash, SecurityStamp,
                       PhoneNumber, PhoneConfirmed, TwoFactorEnabled, LockoutEnd, LockoutEnabled,
                       AccessFailedCount, CreatedAt, UpdatedAt, LastLoginAt, IsActive
                FROM Users
                WHERE CustomerID = @CustomerId AND IsActive = 1";

            using var connection = CreateConnection();
            return await connection.QueryFirstOrDefaultAsync<User>(sql, new { CustomerId = customerId });
        }

        /// <summary>
        /// Create new user
        /// </summary>
        public async Task<int> CreateAsync(User user)
        {
            const string sql = @"
                INSERT INTO Users (
                    CustomerID, Email, EmailConfirmed, PasswordHash, SecurityStamp,
                    PhoneNumber, PhoneConfirmed, TwoFactorEnabled, LockoutEnabled,
                    CreatedAt, IsActive
                )
                VALUES (
                    @CustomerID, @Email, @EmailConfirmed, @PasswordHash, @SecurityStamp,
                    @PhoneNumber, @PhoneConfirmed, @TwoFactorEnabled, @LockoutEnabled,
                    GETDATE(), 1
                );
                SELECT SCOPE_IDENTITY();";

            using var connection = CreateConnection();
            var id = await connection.QuerySingleAsync<int>(sql, user);
            _logger.LogInformation("Created new user ID {UserId} for CustomerID {CustomerId}", id, user.CustomerID);
            return id;
        }

        /// <summary>
        /// Update user
        /// </summary>
        public async Task<bool> UpdateAsync(User user)
        {
            const string sql = @"
                UPDATE Users
                SET Email = @Email,
                    EmailConfirmed = @EmailConfirmed,
                    PhoneNumber = @PhoneNumber,
                    PhoneConfirmed = @PhoneConfirmed,
                    TwoFactorEnabled = @TwoFactorEnabled,
                    LockoutEnabled = @LockoutEnabled,
                    UpdatedAt = GETDATE()
                WHERE ID = @ID AND IsActive = 1";

            using var connection = CreateConnection();
            var rows = await connection.ExecuteAsync(sql, user);
            return rows > 0;
        }

        /// <summary>
        /// Update password hash
        /// </summary>
        public async Task<bool> UpdatePasswordAsync(int userId, string newPasswordHash)
        {
            const string sql = @"
                UPDATE Users
                SET PasswordHash = @PasswordHash,
                    SecurityStamp = @SecurityStamp,
                    UpdatedAt = GETDATE()
                WHERE ID = @UserId AND IsActive = 1";

            using var connection = CreateConnection();
            var rows = await connection.ExecuteAsync(sql, 
                new { UserId = userId, PasswordHash = newPasswordHash, SecurityStamp = Guid.NewGuid().ToString() });
            
            if (rows > 0)
                _logger.LogInformation("Updated password for user ID {UserId}", userId);
            
            return rows > 0;
        }

        /// <summary>
        /// Update security stamp
        /// </summary>
        public async Task<bool> UpdateSecurityStampAsync(int userId, string stamp)
        {
            const string sql = @"
                UPDATE Users
                SET SecurityStamp = @Stamp,
                    UpdatedAt = GETDATE()
                WHERE ID = @UserId AND IsActive = 1";

            using var connection = CreateConnection();
            var rows = await connection.ExecuteAsync(sql, new { UserId = userId, Stamp = stamp });
            return rows > 0;
        }

        /// <summary>
        /// Update last login time and reset failed attempts
        /// </summary>
        public async Task<bool> UpdateLastLoginAsync(int userId)
        {
            const string sql = @"
                UPDATE Users
                SET LastLoginAt = GETDATE(),
                    AccessFailedCount = 0,
                    LockoutEnd = NULL
                WHERE ID = @UserId AND IsActive = 1";

            using var connection = CreateConnection();
            var rows = await connection.ExecuteAsync(sql, new { UserId = userId });
            
            if (rows > 0)
                _logger.LogInformation("Updated last login for user ID {UserId}", userId);
            
            return rows > 0;
        }

        /// <summary>
        /// Increment failed login attempts
        /// </summary>
        public async Task<bool> IncrementAccessFailedCountAsync(int userId)
        {
            const string sql = @"
                UPDATE Users
                SET AccessFailedCount = AccessFailedCount + 1
                WHERE ID = @UserId AND IsActive = 1";

            using var connection = CreateConnection();
            var rows = await connection.ExecuteAsync(sql, new { UserId = userId });
            return rows > 0;
        }

        /// <summary>
        /// Lock out user until specified time
        /// </summary>
        public async Task<bool> LockoutAsync(int userId, DateTime lockoutEnd)
        {
            const string sql = @"
                UPDATE Users
                SET LockoutEnd = @LockoutEnd,
                    AccessFailedCount = 0
                WHERE ID = @UserId AND IsActive = 1";

            using var connection = CreateConnection();
            var rows = await connection.ExecuteAsync(sql, new { UserId = userId, LockoutEnd = lockoutEnd });
            
            if (rows > 0)
                _logger.LogWarning("Locked out user ID {UserId} until {LockoutEnd}", userId, lockoutEnd);
            
            return rows > 0;
        }

        /// <summary>
        /// Unlock user account
        /// </summary>
        public async Task<bool> UnlockAsync(int userId)
        {
            const string sql = @"
                UPDATE Users
                SET LockoutEnd = NULL,
                    AccessFailedCount = 0
                WHERE ID = @UserId AND IsActive = 1";

            using var connection = CreateConnection();
            var rows = await connection.ExecuteAsync(sql, new { UserId = userId });
            
            if (rows > 0)
                _logger.LogInformation("Unlocked user ID {UserId}", userId);
            
            return rows > 0;
        }

        /// <summary>
        /// Soft delete user (deactivate)
        /// </summary>
        public async Task<bool> DeactivateAsync(int userId)
        {
            const string sql = @"
                UPDATE Users
                SET IsActive = 0,
                    UpdatedAt = GETDATE()
                WHERE ID = @UserId";

            using var connection = CreateConnection();
            var rows = await connection.ExecuteAsync(sql, new { UserId = userId });
            
            if (rows > 0)
                _logger.LogInformation("Deactivated user ID {UserId}", userId);
            
            return rows > 0;
        }

        /// <summary>
        /// Get admin user by email from AdminUsers table
        /// </summary>
        public async Task<AdminUser?> GetAdminByEmailAsync(string email)
        {
            const string sql = @"
                SELECT u.*, r.Id as Role_Id, r.Name as Role_Name, r.Description as Role_Description, r.Permissions as Role_Permissions
                FROM AdminUsers u
                LEFT JOIN AdminRoles r ON u.RoleId = r.Id
                WHERE u.Email = @Email AND u.IsActive = 1";

            using var connection = CreateConnection();
            var result = await connection.QueryAsync<dynamic>(sql, new { Email = email });
            var row = result.FirstOrDefault();

            if (row == null) return null;

            return new AdminUser
            {
                Id = row.Id,
                Email = row.Email,
                PasswordHash = row.PasswordHash,
                FirstName = row.FirstName,
                LastName = row.LastName,
                Phone = row.Phone,
                RoleId = row.RoleId,
                IsActive = row.IsActive,
                LastLoginAt = row.LastLoginAt,
                LastLoginIp = row.LastLoginIp,
                FailedLoginAttempts = row.FailedLoginAttempts,
                LockoutUntil = row.LockoutUntil,
                CreatedAt = row.CreatedAt,
                UpdatedAt = row.UpdatedAt,
                Role = new AdminRole
                {
                    Id = row.Role_Id,
                    Name = row.Role_Name,
                    Description = row.Role_Description,
                    Permissions = row.Role_Permissions
                }
            };
        }

        /// <summary>
        /// Update admin user last login and reset failed attempts
        /// </summary>
        public async Task<bool> UpdateAdminLastLoginAsync(int adminUserId)
        {
            const string sql = @"
                UPDATE AdminUsers
                SET LastLoginAt = GETDATE(),
                    FailedLoginAttempts = 0,
                    LockoutUntil = NULL
                WHERE Id = @AdminUserId";

            using var connection = CreateConnection();
            var rows = await connection.ExecuteAsync(sql, new { AdminUserId = adminUserId });
            return rows > 0;
        }
    }
}
