using System;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using IntegrationService.Core.Domain.Entities;
using IntegrationService.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Logging;

namespace IntegrationService.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CustomersController : ControllerBase
    {
        private readonly IPosRepository _repository;
        private readonly ILogger<CustomersController> _logger;

        public CustomersController(IPosRepository repository, ILogger<CustomersController> logger)
        {
            _repository = repository;
            _logger = logger;
        }

        /// <summary>
        /// Look up customer by phone or email.
        /// Phone is the primary identifier, email is fallback.
        /// Auto-creates customer profile if not found.
        /// </summary>
        /// <param name="phone">Customer phone number (any format)</param>
        /// <param name="email">Customer email address</param>
        /// <returns>Customer profile with loyalty points balance</returns>
        [HttpGet("lookup")]
        public async Task<IActionResult> LookupCustomer([FromQuery] string? phone, [FromQuery] string? email)
        {
            // Validate at least one parameter provided
            if (string.IsNullOrWhiteSpace(phone) && string.IsNullOrWhiteSpace(email))
            {
                return BadRequest(new { error = "Either phone or email must be provided" });
            }

            try
            {
                PosCustomer? customer = null;

                // Try phone lookup first (primary identifier)
                if (!string.IsNullOrWhiteSpace(phone))
                {
                    // Strip all non-digits for database lookup
                    var cleanPhone = Regex.Replace(phone, @"\D", "");

                    _logger.LogInformation("Looking up customer by phone: {CleanPhone}", cleanPhone);
                    customer = await _repository.GetCustomerByPhoneAsync(cleanPhone);
                }

                // If no phone match and email provided, try email lookup (fallback)
                if (customer == null && !string.IsNullOrWhiteSpace(email))
                {
                    _logger.LogInformation("Looking up customer by email: {Email}", email);
                    customer = await _repository.GetCustomerByEmailAsync(email);
                }

                // Auto-create new customer if not found
                if (customer == null)
                {
                    _logger.LogInformation("Customer not found, auto-creating new profile");

                    var newCustomer = new PosCustomer
                    {
                        Phone = !string.IsNullOrWhiteSpace(phone) ? Regex.Replace(phone, @"\D", "") : null,
                        Email = !string.IsNullOrWhiteSpace(email) ? email : null,
                        EarnedPoints = 0,
                        PointsManaged = true
                    };

                    var customerId = await _repository.InsertCustomerAsync(newCustomer);
                    newCustomer.ID = customerId;
                    customer = newCustomer;

                    _logger.LogInformation("Created new customer with ID: {CustomerId}", customerId);
                }

                // Return customer lookup response
                var response = new CustomerLookupResponse
                {
                    CustomerId = customer.ID,
                    FullName = customer.FullName,
                    Phone = customer.Phone,
                    Email = customer.Email,
                    EarnedPoints = customer.EarnedPoints
                };

                return Ok(response);
            }
            catch (SqlException ex)
            {
                _logger.LogError(ex, "Database error during customer lookup");
                return StatusCode(500, new { error = "An error occurred while looking up customer" });
            }
        }
    }

    /// <summary>
    /// Customer lookup API response
    /// </summary>
    public class CustomerLookupResponse
    {
        public int CustomerId { get; set; }
        public string? FullName { get; set; }
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public int EarnedPoints { get; set; }
    }
}
