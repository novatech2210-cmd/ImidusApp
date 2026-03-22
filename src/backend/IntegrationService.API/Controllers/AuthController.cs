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
        private readonly IUserRepository _userRepository; // Inject User repository for Admin access
        private readonly IPasswordHasher _passwordHasher;
        private readonly JwtSettings _jwtSettings;
        private readonly ILogger<AuthController> _logger;

        public AuthController(
            IPosRepository repository,
            IUserRepository userRepository,
            IPasswordHasher passwordHasher,
            IOptions<JwtSettings> jwtSettings,
            ILogger<AuthController> logger)
        {
            _repository = repository;
            _userRepository = userRepository;
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

                // Check if user already exists in User repository (by email)
                var existingUser = await _userRepository.GetByEmailAsync(request.Email);
                if (existingUser != null)
                {
                    return BadRequest(new { error = "A user with this email already exists" });
                }

                // Check if customer exists in POS repository (by phone)
                var existingCustomer = await _repository.GetCustomerByPhoneAsync(cleanPhone);
                int customerId;

                if (existingCustomer != null)
                {
                    customerId = existingCustomer.ID;
                    _logger.LogInformation("Linking existing POS customer {CustomerId} to the new account", customerId);
                }
                else
                {
                    // Create new customer in POS
                    var newCustomer = new PosCustomer
                    {
                        Phone = cleanPhone,
                        CustomerNum = cleanPhone, // Set CustomerNum to phone to satisfy DB constraint
                        FName = request.FirstName,
                        LName = request.LastName,
                        EarnedPoints = 0,
                        PointsManaged = true
                    };
                    customerId = await _repository.InsertCustomerAsync(newCustomer);
                    _logger.LogInformation("Created new POS customer: ID={CustomerId}, Phone={Phone}", customerId, cleanPhone);
                }

                // Create new user in IntegrationService overlay DB
                var newUser = new User
                {
                    CustomerID = customerId,
                    Email = request.Email,
                    PasswordHash = _passwordHasher.HashPassword(request.Password),
                    EmailConfirmed = false,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                var userId = await _userRepository.CreateAsync(newUser);
                newUser.ID = userId;

                _logger.LogInformation("New user account created: UserID={UserId}, CustomerID={CustomerId}, Email={Email}",
                    userId, customerId, request.Email);

                // For the response, we still need a PosCustomer object
                var customerForResponse = await _repository.GetCustomerByIdAsync(customerId);
                if (customerForResponse == null) throw new Exception("Failed to retrieve the created customer");

                // Generate JWT token
                var authResponse = GenerateAuthResponse(customerForResponse);

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
                User? user = null;

                // Auth is primarily via Email now for app accounts
                if (!string.IsNullOrWhiteSpace(request.Email))
                {
                    user = await _userRepository.GetByEmailAsync(request.Email);
                }

                // If not found by email, try phone link (optional fallback)
                // For now, only email-based app login is fully supported via the new User table

                // User not found
                if (user == null)
                {
                    _logger.LogWarning("Login attempt for non-existent user: Phone={Phone}, Email={Email}",
                        request.Phone, request.Email);
                    return Unauthorized(new { error = "Invalid credentials" });
                }

                // Verify password
                var passwordValid = _passwordHasher.VerifyPassword(request.Password, user.PasswordHash);
                if (!passwordValid)
                {
                    _logger.LogWarning("Invalid password attempt for User {UserId}", user.ID);
                    return Unauthorized(new { error = "Invalid credentials" });
                }

                // Fetch linked POS customer data
                var customer = await _repository.GetCustomerByIdAsync(user.CustomerID);
                if (customer == null)
                {
                    _logger.LogError("User {UserId} points to non-existent POS customer {CustomerId}", user.ID, user.CustomerID);
                    return StatusCode(500, new { error = "Unable to retrieve profile data" });
                }

                _logger.LogInformation("Successful login for User {UserId} (Customer {CustomerId})", user.ID, customer.ID);

                await _userRepository.UpdateLastLoginAsync(user.ID);

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
        /// Admin portal login.
        /// Queries the overlay IntegrationService database for admin users.
        /// </summary>
        [HttpPost("admin-login")]
        public async Task<IActionResult> AdminLogin([FromBody] LoginRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Email))
            {
                return BadRequest(new { error = "Email is required for admin login" });
            }

            try
            {
                _logger.LogInformation("Admin login attempt: {Email}", request.Email);

                // Fetch user from IntegrationService overlay DB
                var user = await _userRepository.GetByEmailAsync(request.Email);
                
                // If no admin user exists, allow the first one to login as superadmin for testing
                // ONLY if the email matches a specific development email or if we want to bootstrap
                if (user == null && request.Email == "admin@imidus.com")
                {
                    _logger.LogWarning("Bootstrapping first admin user: {Email}", request.Email);
                    var newUser = new User
                    {
                        Email = request.Email,
                        PasswordHash = _passwordHasher.HashPassword(request.Password),
                        EmailConfirmed = true,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow
                    };
                    var userId = await _userRepository.CreateAsync(newUser);
                    user = newUser;
                    user.ID = userId;
                }

                if (user == null)
                {
                    _logger.LogWarning("Admin user not found: {Email}", request.Email);
                    return Unauthorized(new { error = "Invalid credentials" });
                }

                // Verify password
                var passwordValid = _passwordHasher.VerifyPassword(request.Password, user.PasswordHash);
                if (!passwordValid)
                {
                    _logger.LogWarning("Invalid admin password attempt: {Email}", request.Email);
                    return Unauthorized(new { error = "Invalid credentials" });
                }

                await _userRepository.UpdateLastLoginAsync(user.ID);

                // For admin login, we need a PosCustomer object for the response model (simplified)
                var customer = await _repository.GetCustomerByEmailAsync(user.Email) ?? new PosCustomer
                {
                    ID = 0,
                    Email = user.Email,
                    FName = "Admin",
                    LName = "User"
                };

                var authResponse = GenerateAuthResponse(customer);
                
                // Manually set Admin fields (ideally from DB)
                authResponse.User.Role = "admin";
                authResponse.User.Permissions = new[] { "*" };

                return Ok(authResponse);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during admin login");
                return StatusCode(500, new { error = "An error occurred during admin login" });
            }
        }

        /// <summary>
        /// Admin logout.
        /// </summary>
        [HttpPost("admin-logout")]
        public IActionResult AdminLogout()
        {
            // JWT is statelessly invalidated by client removing the token
            return Ok(new { success = true, message = "Logout successful" });
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

            var claims = new List<Claim>
            {
                new Claim("sub", customer.ID.ToString()),
                new Claim("email", customer.Email ?? string.Empty),
                new Claim("fname", customer.FName ?? string.Empty),
                new Claim("lname", customer.LName ?? string.Empty),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            if (!string.IsNullOrEmpty(customer.Phone))
            {
                claims.Add(new Claim("phone", customer.Phone));
            }

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
