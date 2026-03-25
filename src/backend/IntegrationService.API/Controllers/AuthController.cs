using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using IntegrationService.Core.Domain.Entities;
using IntegrationService.Core.Interfaces;
using IntegrationService.Core.Models;
using IntegrationService.Core.Models.AdminPortal;
using Newtonsoft.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace IntegrationService.API.Controllers
{
    /// <summary>
    /// Authentication controller
    /// Manages user authentication using IntegrationService User table (overlay)
    /// Links to POS tblCustomer for customer profile data (ground truth)
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IPosRepository _posRepository;
        private readonly IUserRepository _userRepository;
        private readonly IActivityLogRepository _activityRepo;
        private readonly IPasswordHasher _passwordHasher;
        private readonly JwtSettings _jwtSettings;
        private readonly ILogger<AuthController> _logger;

        public AuthController(
            IPosRepository posRepository,
            IUserRepository userRepository,
            IActivityLogRepository activityRepo,
            IPasswordHasher passwordHasher,
            IOptions<JwtSettings> jwtSettings,
            ILogger<AuthController> logger)
        {
            _posRepository = posRepository;
            _userRepository = userRepository;
            _activityRepo = activityRepo;
            _passwordHasher = passwordHasher;
            _jwtSettings = jwtSettings.Value;
            _logger = logger;
        }

        /// <summary>
        /// Register a new user account.
        /// Creates both POS customer record AND IntegrationService User for authentication.
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

                // Check if email already registered in IntegrationService
                var existingUser = await _userRepository.GetByEmailAsync(request.Email);
                if (existingUser != null)
                {
                    return BadRequest(new { error = "A user with this email already exists" });
                }

                // Check if phone already exists in POS
                var existingCustomer = await _posRepository.GetCustomerByPhoneAsync(cleanPhone);
                if (existingCustomer != null)
                {
                    // Phone exists - check if already has a User account
                    var existingUserByCustomer = await _userRepository.GetByCustomerIdAsync(existingCustomer.ID);
                    if (existingUserByCustomer != null)
                    {
                        return BadRequest(new { error = "A user with this phone number already exists" });
                    }
                    
                    // Customer exists in POS but no User account - link to existing
                    _logger.LogInformation("Linking new User account to existing POS customer ID {CustomerId}", existingCustomer.ID);
                }
                else
                {
                    // Create new POS customer (ground truth for customer data)
                    existingCustomer = new PosCustomer
                    {
                        Phone = cleanPhone,
                        FName = request.FirstName,
                        LName = request.LastName,
                        EarnedPoints = 0,
                        PointsManaged = true
                    };
                    
                    var customerId = await _posRepository.InsertCustomerAsync(existingCustomer);
                    existingCustomer.ID = customerId;
                    
                    _logger.LogInformation("Created new POS customer: ID={CustomerId}, Phone={Phone}", customerId, cleanPhone);
                }

                // Hash password
                var hashedPassword = _passwordHasher.HashPassword(request.Password);

                // Create IntegrationService User for authentication (overlay)
                var user = new User
                {
                    CustomerID = existingCustomer.ID,
                    Email = request.Email,
                    EmailConfirmed = false, // TODO: Send confirmation email
                    PasswordHash = hashedPassword,
                    SecurityStamp = Guid.NewGuid().ToString(),
                    PhoneNumber = cleanPhone,
                    LockoutEnabled = true
                };

                var userId = await _userRepository.CreateAsync(user);
                
                _logger.LogInformation("Created new User account: ID={UserId}, CustomerID={CustomerId}, Email={Email}",
                    userId, existingCustomer.ID, request.Email);

                // Generate JWT token
                var authResponse = await GenerateAuthResponseAsync(existingCustomer, user);

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
        /// Authenticates against IntegrationService User table, retrieves profile from POS.
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
                User? user = null;
                PosCustomer? customer = null;

                // Try email lookup first (primary login identifier)
                if (!string.IsNullOrWhiteSpace(request.Email))
                {
                    user = await _userRepository.GetByEmailAsync(request.Email);
                }

                // Fallback to phone lookup
                if (user == null && !string.IsNullOrWhiteSpace(request.Phone))
                {
                    var cleanPhone = Regex.Replace(request.Phone, @"\D", "");
                    
                    // Find POS customer by phone
                    customer = await _posRepository.GetCustomerByPhoneAsync(cleanPhone);
                    if (customer != null)
                    {
                        // Find User by CustomerID
                        user = await _userRepository.GetByCustomerIdAsync(customer.ID);
                    }
                }
                else if (user != null)
                {
                    // User found by email - get POS customer
                    customer = await _posRepository.GetCustomerByIdAsync(user.CustomerID);
                }

                // User not found
                if (user == null)
                {
                    _logger.LogWarning("Login attempt for non-existent user: Phone={Phone}, Email={Email}",
                        request.Phone, request.Email);
                    return Unauthorized(new { error = "Invalid credentials" });
                }

                // Check if account is locked out
                if (user.IsLockedOut)
                {
                    _logger.LogWarning("Login attempt for locked out user ID {UserId}", user.ID);
                    return Unauthorized(new { error = "Account is locked. Please try again later." });
                }

                // Verify password
                var passwordValid = _passwordHasher.VerifyPassword(request.Password, user.PasswordHash);
                if (!passwordValid)
                {
                    _logger.LogWarning("Invalid password attempt for user ID {UserId}", user.ID);
                    
                    // Increment failed attempts
                    await _userRepository.IncrementAccessFailedCountAsync(user.ID);
                    
                    // Lock out after 5 failed attempts
                    if (user.AccessFailedCount + 1 >= 5)
                    {
                        var lockoutEnd = DateTime.UtcNow.AddMinutes(15);
                        await _userRepository.LockoutAsync(user.ID, lockoutEnd);
                        _logger.LogWarning("Locked out user ID {UserId} after 5 failed attempts", user.ID);
                        return Unauthorized(new { error = "Too many failed attempts. Account locked for 15 minutes." });
                    }
                    
                    return Unauthorized(new { error = "Invalid credentials" });
                }

                // Password valid - update last login
                await _userRepository.UpdateLastLoginAsync(user.ID);
                
                _logger.LogInformation("Successful login for user ID {UserId}, customer ID {CustomerId}", 
                    user.ID, user.CustomerID);

                // Generate JWT token
                var authResponse = await GenerateAuthResponseAsync(customer ?? new PosCustomer { ID = user.CustomerID }, user);

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

                // Fetch latest customer data from POS (ground truth)
                var customer = await _posRepository.GetCustomerByIdAsync(customerId);
                if (customer == null)
                {
                    _logger.LogWarning("Customer {CustomerId} not found in POS (from token)", customerId);
                    return NotFound(new { error = "User not found" });
                }

                // Get User data from IntegrationService for email
                var user = await _userRepository.GetByCustomerIdAsync(customerId);

                // Get birthday from overlay
                var birthday = await _activityRepo.GetCustomerBirthdayAsync(customerId);

                var userProfile = new UserProfile
                {
                    CustomerId = customer.ID,
                    FirstName = customer.FName ?? string.Empty,
                    LastName = customer.LName ?? string.Empty,
                    Phone = customer.Phone ?? string.Empty,
                    Email = user?.Email ?? string.Empty,
                    EarnedPoints = customer.EarnedPoints,
                    BirthMonth = birthday.Month,
                    BirthDay = birthday.Day
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

        /// <summary>
        /// Admin portal login.
        /// Authenticates against the AdminUsers table in the IntegrationService overlay database.
        /// </summary>
        [HttpPost("admin-login")]
        public async Task<IActionResult> AdminLogin([FromBody] LoginRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Email))
                return BadRequest(new { error = "Email is required for admin login" });

            try
            {
                _logger.LogInformation("Admin login attempt for {Email}", request.Email);

                // Fetch admin user from overlay database
                var adminUser = await _userRepository.GetAdminByEmailAsync(request.Email);
                if (adminUser == null)
                {
                    _logger.LogWarning("Admin user not found: {Email}", request.Email);
                    return Unauthorized(new { error = "Invalid credentials" });
                }

                if (!adminUser.IsActive)
                {
                    _logger.LogWarning("Attempt to login to inactive admin account: {Email}", request.Email);
                    return Unauthorized(new { error = "Account is inactive" });
                }

                // Check lockout
                if (adminUser.LockoutUntil > DateTime.UtcNow)
                {
                    return Unauthorized(new { error = "Account is locked. Please try again later." });
                }

                // Verify password
                var isValid = _passwordHasher.VerifyPassword(request.Password, adminUser.PasswordHash);
                if (!isValid)
                {
                    _logger.LogWarning("Invalid password for admin user {Email}", request.Email);
                    // Add logic to increment failed attempts and lockout if needed
                    return Unauthorized(new { error = "Invalid credentials" });
                }

                // Update last login
                await _userRepository.UpdateAdminLastLoginAsync(adminUser.Id);

                // Generate response with JWT enriched with role/permissions
                var response = GenerateAdminAuthResponse(adminUser);

                _logger.LogInformation("Successful admin login for {Email} (Role: {Role})", adminUser.Email, adminUser.Role?.Name);
                
                return Ok(new { success = true, data = response });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during admin login");
                return StatusCode(500, new { error = "An internal error occurred" });
            }
        }

        /// <summary>
        /// Admin logout endpoint.
        /// </summary>
        [HttpPost("admin-logout")]
        [Authorize]
        public IActionResult AdminLogout()
        {
            // Stateless JWT logout (client should clear token)
            return Ok(new { success = true });
        }

        // ===== PRIVATE HELPERS =====

        /// <summary>
        /// Generates JWT token and auth response for a customer.
        /// </summary>
        private async Task<AuthResponse> GenerateAuthResponseAsync(PosCustomer customer, User user)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(_jwtSettings.Secret);

            var claims = new[]
            {
                new Claim("sub", customer.ID.ToString()),
                new Claim("userId", user.ID.ToString()),
                new Claim("phone", customer.Phone ?? string.Empty),
                new Claim("email", user.Email ?? string.Empty),
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

            // Fetch birthday from overlay
            var birthday = await _activityRepo.GetCustomerBirthdayAsync(customer.ID);

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
                    Email = user.Email ?? string.Empty,
                    EarnedPoints = customer.EarnedPoints,
                    BirthMonth = birthday.Month,
                    BirthDay = birthday.Day
                }
            };
        }

        private object GenerateAdminAuthResponse(AdminUser user)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(_jwtSettings.Secret);

            // Parse permissions from JSON string
            var permissions = new List<string>();
            if (!string.IsNullOrEmpty(user.Role?.Permissions))
            {
                try
                {
                    permissions = JsonConvert.DeserializeObject<List<string>>(user.Role.Permissions) ?? new List<string>();
                }
                catch
                {
                    // Fallback if JSON parsing fails
                    if (user.Role.Permissions == "[\"*\"]" || user.Role.Permissions == "*")
                        permissions = new List<string> { "*" };
                }
            }

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim("role", user.Role?.Name ?? "Admin"),
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            // Add permissions individually as claims
            foreach (var perm in permissions)
            {
                claims.Add(new Claim("permissions", perm));
            }

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddMinutes(_jwtSettings.ExpiryMinutes * 2), // Longer expiry for admins
                Issuer = _jwtSettings.Issuer,
                Audience = _jwtSettings.Audience,
                SigningCredentials = new SigningCredentials(
                    new SymmetricSecurityKey(key),
                    SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            var tokenString = tokenHandler.WriteToken(token);

            return new
            {
                token = tokenString,
                refreshToken = Guid.NewGuid().ToString(),
                user = new
                {
                    id = user.Id,
                    email = user.Email,
                    firstName = user.FirstName,
                    lastName = user.LastName,
                    role = user.Role?.Name ?? "Admin",
                    permissions = permissions
                }
            };
        }
    }
}
