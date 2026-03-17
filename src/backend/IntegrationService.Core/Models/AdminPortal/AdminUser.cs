namespace IntegrationService.Core.Models.AdminPortal
{
    /// <summary>
    /// Admin user role with permissions (SSOT: IntegrationService overlay table)
    /// </summary>
    public class AdminRole
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Permissions { get; set; } = "[]"; // JSON array
        public DateTime CreatedAt { get; set; }
    }

    /// <summary>
    /// Admin user account (SSOT: IntegrationService overlay table)
    /// </summary>
    public class AdminUser
    {
        public int Id { get; set; }
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public int RoleId { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime? LastLoginAt { get; set; }
        public string? LastLoginIp { get; set; }
        public int FailedLoginAttempts { get; set; }
        public DateTime? LockoutUntil { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        
        // Navigation property
        public AdminRole? Role { get; set; }
    }
}
