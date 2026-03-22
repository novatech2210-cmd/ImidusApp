using System;
using System.ComponentModel.DataAnnotations;

namespace IntegrationService.Core.Models
{
    /// <summary>
    /// Request model for user registration.
    /// </summary>
    public class RegisterRequest
    {
        [Required(ErrorMessage = "Phone number is required")]
        [Phone(ErrorMessage = "Invalid phone number format")]
        public string Phone { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Invalid email address")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "First name is required")]
        [StringLength(50, MinimumLength = 1, ErrorMessage = "First name must be between 1 and 50 characters")]
        public string FirstName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Last name is required")]
        [StringLength(50, MinimumLength = 1, ErrorMessage = "Last name must be between 1 and 50 characters")]
        public string LastName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Password is required")]
        [StringLength(100, MinimumLength = 8, ErrorMessage = "Password must be at least 8 characters")]
        public string Password { get; set; } = string.Empty;
    }

    /// <summary>
    /// Request model for user login.
    /// Supports login via phone OR email.
    /// </summary>
    public class LoginRequest
    {
        /// <summary>
        /// Phone number (alternative to email).
        /// </summary>
        public string? Phone { get; set; }

        /// <summary>
        /// Email address (alternative to phone).
        /// </summary>
        [EmailAddress(ErrorMessage = "Invalid email address")]
        public string? Email { get; set; }

        [Required(ErrorMessage = "Password is required")]
        public string Password { get; set; } = string.Empty;
    }

    /// <summary>
    /// Response model for successful authentication.
    /// </summary>
    public class AuthResponse
    {
        public string Token { get; set; } = string.Empty;
        public string RefreshToken { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
        public UserProfile User { get; set; } = new();
    }

    /// <summary>
    /// User profile returned after authentication.
    /// </summary>
    public class UserProfile
    {
        public int CustomerId { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public int EarnedPoints { get; set; }
        
        // Admin Portal properties
        public string? Role { get; set; }
        public string[]? Permissions { get; set; }
    }

    /// <summary>
    /// Request model for token refresh.
    /// </summary>
    public class RefreshTokenRequest
    {
        [Required]
        public string RefreshToken { get; set; } = string.Empty;
    }

    /// <summary>
    /// JWT configuration settings.
    /// </summary>
    public class JwtSettings
    {
        public string Secret { get; set; } = string.Empty;
        public string Issuer { get; set; } = string.Empty;
        public string Audience { get; set; } = string.Empty;
        public int ExpiryMinutes { get; set; } = 43200; // 30 days default
        public int RefreshTokenExpiryDays { get; set; } = 60; // 60 days default
    }
}
