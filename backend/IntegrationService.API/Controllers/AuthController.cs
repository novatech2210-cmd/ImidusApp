using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using IntegrationService.Core.Domain.Entities;
using IntegrationService.Core.Interfaces;
using IntegrationService.Core.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace IntegrationService.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IPosRepository _repository;
        private readonly IPasswordHasher _passwordHasher;
        private readonly JwtSettings _jwtSettings;
        private readonly ILogger<AuthController> _logger;

        public AuthController(
            IPosRepository repository,
            IPasswordHasher passwordHasher,
            IOptions<JwtSettings> jwtSettings,
            ILogger<AuthController> logger)
        {
            _repository = repository;
            _passwordHasher = passwordHasher;
            _jwtSettings = jwtSettings.Value;
            _logger = logger;
        }

        /// <summary>
        /// Register a new user account.
        /// Creates a new customer record in tblCustomer with hashed password.
        /// </summary>
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                // Clean phone number (remove formatting)
                var cleanPhone = Regex.Replace(request.Phone, @"\D", "");

                // Check if user already exists (by phone or email)
                var existingCustomer = await _repository.GetCustomerByPhoneAsync(cleanPhone);
                if (existingCustomer != null)
                {
                    return BadRequest(new { error = "A user with this phone number already exists" });
                }

                var existingEmail = await _repository.GetCustomerByEmailAsync(request.Email);
                if (existingEmail != null)
                {
                    return BadRequest(new { error = "A user with this email already exists" });
                }

                // Hash password
                var hashedPassword = _passwordHasher.HashPassword(request.Password);

                // Create new customer
                var newCustomer = new PosCustomer
                {
                    Phone = cleanPhone,
                    Email = request.Email,
                    FName = request.FirstName,
                    LName = request.LastName,
                    Password = hashedPassword,
                    EarnedPoints = 0,
                    PointsManaged = true
                };

                var customerId = await _repository.InsertCustomerAsync(newCustomer);
                newCustomer.ID = customerId;

                _logger.LogInformation("New customer registered: ID={CustomerId}, Phone={Phone}, Email={Email}",
                    customerId, cleanPhone, request.Email);

                // Generate JWT token
                var authResponse = GenerateAuthResponse(newCustomer);

                return Ok(authResponse);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during user registration");
                return StatusCode(500, new { error = "An error occurred during registration" });
            }
        }

        /// <summary>
        /// Login with phone/email and password.
        /// Returns JWT token on successful authentication.
        /// </summary>
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Validate at least one identifier provided
            if (string.IsNullOrWhiteSpace(request.Phone) && string.IsNullOrWhiteSpace(request.Email))
            {
                return BadRequest(new { error = "Either phone or email must be provided" });
            }

            try
            {
                PosCustomer? customer = null;

                // Try phone lookup first
                if (!string.IsNullOrWhiteSpace(request.Phone))
                {
                    var cleanPhone = Regex.Replace(request.Phone, @"\D", "");
                    customer = await _repository.GetCustomerByPhoneAsync(cleanPhone);
                }

                // Fallback to email if phone not found
                if (customer == null && !string.IsNullOrWhiteSpace(request.Email))
                {
                    customer = await _repository.GetCustomerByEmailAsync(request.Email);
                }

                // Customer not found
                if (customer == null)
                {
                    _logger.LogWarning("Login attempt for non-existent user: Phone={Phone}, Email={Email}",
                        request.Phone, request.Email);
                    return Unauthorized(new { error = "Invalid credentials" });
                }

                // Verify password
                if (string.IsNullOrEmpty(customer.Password))
                {
                    _logger.LogWarning("Customer {CustomerId} has no password set", customer.ID);
                    return Unauthorized(new { error = "Account not configured for online access. Please contact support." });
                }

                var passwordValid = _passwordHasher.VerifyPassword(request.Password, customer.Password);
                if (!passwordValid)
                {
                    _logger.LogWarning("Invalid password attempt for customer {CustomerId}", customer.ID);
                    return Unauthorized(new { error = "Invalid credentials" });
                }

                _logger.LogInformation("Successful login for customer {CustomerId}", customer.ID);

                // Check if password needs migration (plaintext → hashed)
                if (_passwordHasher.IsPlaintextPassword(customer.Password))
                {
                    _logger.LogInformation("Migrating plaintext password to hash for customer {CustomerId}", customer.ID);
                    // TODO: Add UpdateCustomerPasswordAsync method to repository
                    // await _repository.UpdateCustomerPasswordAsync(customer.ID, _passwordHasher.HashPassword(request.Password));
                }

                // Generate JWT token
                var authResponse = GenerateAuthResponse(customer);

                return Ok(authResponse);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during login");
                return StatusCode(500, new { error = "An error occurred during login" });
            }
        }

        /// <summary>
        /// Get current user profile (requires authentication).
        /// </summary>
        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> GetCurrentUser()
        {
            try
            {
                // Extract customer ID from JWT token claims
                var customerIdClaim = User.FindFirst("sub")?.Value;
                if (string.IsNullOrEmpty(customerIdClaim) || !int.TryParse(customerIdClaim, out int customerId))
                {
                    return Unauthorized(new { error = "Invalid token" });
                }

                // Fetch latest customer data
                var customer = await _repository.GetCustomerByIdAsync(customerId);
                if (customer == null)
                {
                    _logger.LogWarning("Customer {CustomerId} not found (from token)", customerId);
                    return NotFound(new { error = "User not found" });
                }

                var userProfile = new UserProfile
                {
                    CustomerId = customer.ID,
                    FirstName = customer.FName ?? string.Empty,
                    LastName = customer.LName ?? string.Empty,
                    Phone = customer.Phone ?? string.Empty,
                    Email = customer.Email ?? string.Empty,
                    EarnedPoints = customer.EarnedPoints
                };

                return Ok(userProfile);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching current user");
                return StatusCode(500, new { error = "An error occurred" });
            }
        }

        /// <summary>
        /// Refresh an expired JWT token.
        /// Note: Simplified implementation - refresh tokens not persisted in this MVP.
        /// </summary>
        [HttpPost("refresh")]
        public IActionResult RefreshToken([FromBody] RefreshTokenRequest request)
        {
            // TODO: Implement proper refresh token validation with database persistence
            // For MVP: Return 401, client should re-login
            return Unauthorized(new { error = "Token refresh not implemented. Please login again." });
        }

        // ===== PRIVATE HELPERS =====

        /// <summary>
        /// Generates JWT token and auth response for a customer.
        /// </summary>
        private AuthResponse GenerateAuthResponse(PosCustomer customer)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(_jwtSettings.Secret);

            var claims = new[]
            {
                new Claim("sub", customer.ID.ToString()),
                new Claim("phone", customer.Phone ?? string.Empty),
                new Claim("email", customer.Email ?? string.Empty),
                new Claim("fname", customer.FName ?? string.Empty),
                new Claim("lname", customer.LName ?? string.Empty),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddMinutes(_jwtSettings.ExpiryMinutes),
                Issuer = _jwtSettings.Issuer,
                Audience = _jwtSettings.Audience,
                SigningCredentials = new SigningCredentials(
                    new SymmetricSecurityKey(key),
                    SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            var tokenString = tokenHandler.WriteToken(token);

            return new AuthResponse
            {
                Token = tokenString,
                RefreshToken = Guid.NewGuid().ToString(), // Placeholder (not validated in MVP)
                ExpiresAt = tokenDescriptor.Expires.Value,
                User = new UserProfile
                {
                    CustomerId = customer.ID,
                    FirstName = customer.FName ?? string.Empty,
                    LastName = customer.LName ?? string.Empty,
                    Phone = customer.Phone ?? string.Empty,
                    Email = customer.Email ?? string.Empty,
                    EarnedPoints = customer.EarnedPoints
                }
            };
        }
    }
}
