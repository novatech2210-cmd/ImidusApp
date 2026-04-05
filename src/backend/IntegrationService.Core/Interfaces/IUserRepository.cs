using System.Threading.Tasks;
using IntegrationService.Core.Domain.Entities;
using IntegrationService.Core.Models.AdminPortal;

namespace IntegrationService.Core.Interfaces
{
    /// <summary>
    /// Repository for User authentication data in IntegrationService database
    /// </summary>
    public interface IUserRepository
    {
        /// <summary>
        /// Get user by ID
        /// </summary>
        Task<User?> GetByIdAsync(int id);
        
        /// <summary>
        /// Get user by email
        /// </summary>
        Task<User?> GetByEmailAsync(string email);
        
        /// <summary>
        /// Get user by CustomerID (POS tblCustomer link)
        /// </summary>
        Task<User?> GetByCustomerIdAsync(int customerId);
        
        /// <summary>
        /// Create new user
        /// </summary>
        Task<int> CreateAsync(User user);
        
        /// <summary>
        /// Update user
        /// </summary>
        Task<bool> UpdateAsync(User user);
        
        /// <summary>
        /// Update password hash
        /// </summary>
        Task<bool> UpdatePasswordAsync(int userId, string newPasswordHash);
        
        /// <summary>
        /// Update security stamp
        /// </summary>
        Task<bool> UpdateSecurityStampAsync(int userId, string stamp);
        
        /// <summary>
        /// Update last login time and reset failed attempts
        /// </summary>
        Task<bool> UpdateLastLoginAsync(int userId);
        
        /// <summary>
        /// Increment failed login attempts
        /// </summary>
        Task<bool> IncrementAccessFailedCountAsync(int userId);
        
        /// <summary>
        /// Lock out user until specified time
        /// </summary>
        Task<bool> LockoutAsync(int userId, DateTime lockoutEnd);
        
        /// <summary>
        /// Unlock user account
        /// </summary>
        Task<bool> UnlockAsync(int userId);
        
        /// <summary>
        /// Soft delete user
        /// </summary>
        Task<bool> DeactivateAsync(int userId);

        /// <summary>
        /// Get admin user by email from AdminUsers table
        /// </summary>
        Task<AdminUser?> GetAdminByEmailAsync(string email);

        /// <summary>
        /// Update admin user last login and reset failed attempts
        /// </summary>
        Task<bool> UpdateAdminLastLoginAsync(int adminUserId);

        /// <summary>
        /// Increment admin failed login attempts
        /// </summary>
        Task<bool> IncrementAdminFailedAttemptsAsync(int adminUserId);

        /// <summary>
        /// Lock out admin user until specified time
        /// </summary>
        Task<bool> LockoutAdminAsync(int adminUserId, DateTime lockoutUntil);
    }
}
