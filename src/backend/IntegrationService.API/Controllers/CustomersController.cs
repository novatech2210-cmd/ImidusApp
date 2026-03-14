using System;
using System.Collections.Generic;
using System.Linq;
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
        private readonly IActivityLogRepository _activityRepo;
        private readonly ILogger<CustomersController> _logger;

        public CustomersController(IPosRepository repository, IActivityLogRepository activityRepo, ILogger<CustomersController> logger)
        {
            _repository = repository;
            _activityRepo = activityRepo;
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

                // Fetch birthday from overlay if exists
                var birthday = await _activityRepo.GetCustomerBirthdayAsync(customer.ID);

                // Return customer lookup response
                var response = new CustomerLookupResponse
                {
                    CustomerId = customer.ID,
                    FullName = customer.FullName,
                    Phone = customer.Phone,
                    Email = customer.Email,
                    EarnedPoints = customer.EarnedPoints,
                    BirthMonth = birthday.Month,
                    BirthDay = birthday.Day
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during customer lookup");
                return StatusCode(500, new { error = "An error occurred while looking up customer" });
            }
        }

        /// <summary>
        /// Get loyalty transaction history for a customer.
        /// Returns recent earn/redeem activity from tblRewardPointsDetail.
        /// </summary>
        /// <param name="customerId">Customer ID</param>
        /// <param name="limit">Maximum number of transactions to return (default 50)</param>
        /// <returns>List of loyalty transactions</returns>
        [HttpGet("{customerId}/loyalty-history")]
        public async Task<IActionResult> GetLoyaltyHistory([FromRoute] int customerId, [FromQuery] int limit = 50)
        {
            // Validate customerId
            if (customerId <= 0)
            {
                return BadRequest(new { error = "Customer ID must be greater than 0" });
            }

            try
            {
                // Verify customer exists
                var customer = await _repository.GetCustomerByIdAsync(customerId);
                if (customer == null)
                {
                    return NotFound(new { error = $"Customer with ID {customerId} not found" });
                }

                // Get loyalty history
                _logger.LogInformation("Fetching loyalty history for customer {CustomerId}, limit {Limit}", customerId, limit);
                var pointsDetails = await _repository.GetLoyaltyHistoryAsync(customerId, limit);

                // Transform to presentation model
                var transactions = pointsDetails.Select(detail => new Core.Interfaces.LoyaltyTransactionDto
                {
                    Id = detail.ID,
                    Date = detail.TransactionDate,
                    Type = detail.PointSaved > 0 ? "earn" : "redeem",
                    Points = detail.PointSaved > 0 ? detail.PointSaved : detail.PointUsed,
                    OrderId = detail.SalesID,
                    Description = detail.PointSaved > 0
                        ? $"Earned on order #{detail.SalesID}"
                        : $"Redeemed on order #{detail.SalesID}"
                }).ToList();

                return Ok(transactions);
            }
            catch (SqlException ex)
            {
                _logger.LogError(ex, "Database error fetching loyalty history for customer {CustomerId}", customerId);
                return StatusCode(500, new { error = "An error occurred while fetching loyalty history" });
            }
        }

        /// <summary>
        /// Update customer birthday in the overlay database.
        /// </summary>
        [HttpPost("{customerId}/birthday")]
        public async Task<IActionResult> UpdateBirthday([FromRoute] int customerId, [FromBody] BirthdayUpdateRequest request)
        {
            if (customerId <= 0) return BadRequest(new { error = "Invalid customer ID" });
            if (request.Month < 1 || request.Month > 12) return BadRequest(new { error = "Invalid month" });
            if (request.Day < 1 || request.Day > 31) return BadRequest(new { error = "Invalid day" });

            try
            {
                var success = await _activityRepo.UpdateCustomerBirthdayAsync(customerId, request.Month, request.Day);
                if (success)
                    return Ok(new { success = true, message = "Birthday updated successfully" });

                return BadRequest(new { error = "Failed to update birthday" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating birthday for customer {CustomerId}", customerId);
                return StatusCode(500, new { error = "An error occurred while updating birthday" });
            }
        }
    }

    public class BirthdayUpdateRequest
    {
        public int Month { get; set; }
        public int Day { get; set; }
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
        public int? BirthMonth { get; set; }
        public int? BirthDay { get; set; }
    }


}
