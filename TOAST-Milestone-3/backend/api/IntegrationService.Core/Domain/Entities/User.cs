using System;

namespace IntegrationService.Core.Domain.Entities
{
    /// <summary>
    /// User authentication entity for IntegrationService overlay database
    /// Links to POS tblCustomer via CustomerID
    /// </summary>
    public class User
    {
        public int ID { get; set; }
        
        /// <summary>
        /// Links to POS tblCustomer.ID
        /// </summary>
        public int CustomerID { get; set; }
        
        /// <summary>
        /// Login email (unique)
        /// </summary>
        public string Email { get; set; } = string.Empty;
        
        /// <summary>
        /// Email verification status
        /// </summary>
        public bool EmailConfirmed { get; set; }
        
        /// <summary>
        /// BCrypt/Argon2 hashed password
        /// </summary>
        public string PasswordHash { get; set; } = string.Empty;
        
        /// <summary>
        /// Security stamp for token invalidation
        /// </summary>
        public string? SecurityStamp { get; set; }
        
        /// <summary>
        /// Additional phone for MFA/recovery
        /// </summary>
        public string? PhoneNumber { get; set; }
        
        /// <summary>
        /// Phone verification status
        /// </summary>
        public bool PhoneConfirmed { get; set; }
        
        /// <summary>
        /// Two-factor authentication enabled
        /// </summary>
        public bool TwoFactorEnabled { get; set; }
        
        /// <summary>
        /// Account lockout end time
        /// </summary>
        public DateTime? LockoutEnd { get; set; }
        
        /// <summary>
        /// Enable account lockout on failed attempts
        /// </summary>
        public bool LockoutEnabled { get; set; } = true;
        
        /// <summary>
        /// Consecutive failed login attempts
        /// </summary>
        public int AccessFailedCount { get; set; }
        
        /// <summary>
        /// Account creation timestamp
        /// </summary>
        public DateTime CreatedAt { get; set; }
        
        /// <summary>
        /// Last profile update timestamp
        /// </summary>
        public DateTime? UpdatedAt { get; set; }
        
        /// <summary>
        /// Last successful login timestamp
        /// </summary>
        public DateTime? LastLoginAt { get; set; }
        
        /// <summary>
        /// Soft delete flag
        /// </summary>
        public bool IsActive { get; set; } = true;
        
        // Navigation property
        public virtual PosCustomer? PosCustomer { get; set; }
        
        /// <summary>
        /// Check if account is currently locked out
        /// </summary>
        public bool IsLockedOut => LockoutEnabled && 
                                   LockoutEnd.HasValue && 
                                   LockoutEnd.Value > DateTime.UtcNow;
    }
}
