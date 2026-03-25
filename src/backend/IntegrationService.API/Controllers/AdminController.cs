using IntegrationService.Core.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using IntegrationService.Core.Models.AdminPortal;

using CampaignRequest = IntegrationService.Core.Services.CampaignRequest;
using MenuOverrideRequest = IntegrationService.Core.Services.MenuOverrideRequest;

namespace IntegrationService.API.Controllers
{
    /// <summary>
    /// Admin Portal API Controller
    /// Provides endpoints for merchant dashboard, order management, and analytics
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // Added for security
    public class AdminController : ControllerBase
    {
        private readonly AdminPortalService _adminService;
        private readonly ILogger<AdminController> _logger;

        public AdminController(AdminPortalService adminService, ILogger<AdminController> logger)
        {
            _adminService = adminService;
            _logger = logger;
        }

        #region Dashboard

        [HttpGet("dashboard/summary")]
        public async Task<IActionResult> GetDashboardSummary([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
        {
            try
            {
                var summary = await _adminService.GetDashboardSummaryAsync(startDate, endDate);
                return Ok(new { success = true, data = summary });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting dashboard summary");
                return StatusCode(500, new { error = "Failed to retrieve dashboard data" });
            }
        }

        [HttpGet("dashboard/sales-chart")]
        public async Task<IActionResult> GetSalesChart([FromQuery] DateTime startDate, [FromQuery] DateTime endDate, [FromQuery] string groupBy = "day")
        {
            try
            {
                var data = await _adminService.GetSalesChartDataAsync(startDate, endDate, groupBy);
                return Ok(new { success = true, data = data });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting sales chart data");
                return StatusCode(500, new { error = "Failed to retrieve chart data" });
            }
        }

        [HttpGet("dashboard/popular-items")]
        public async Task<IActionResult> GetPopularItems([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate, [FromQuery] int limit = 10)
        {
            try
            {
                var items = await _adminService.GetPopularItemsAsync(startDate, endDate, limit);
                return Ok(new { success = true, data = items });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting popular items");
                return StatusCode(500, new { error = "Failed to retrieve popular items" });
            }
        }

        #endregion

        #region Order Queue

        [HttpGet("orders/queue")]
        public async Task<IActionResult> GetOrderQueue(
            [FromQuery] string? status,
            [FromQuery] string? paymentStatus,
            [FromQuery] string? searchTerm,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            [FromQuery] int limit = 50)
        {
            try
            {
                var orders = await _adminService.GetOrderQueueAsync(
                    status, paymentStatus, searchTerm, startDate, endDate, limit);
                return Ok(new { success = true, data = orders });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting order queue");
                return StatusCode(500, new { error = "Failed to retrieve orders" });
            }
        }

        [HttpGet("orders/{salesId}")]
        public async Task<IActionResult> GetOrderDetail(int salesId)
        {
            try
            {
                var order = await _adminService.GetOrderDetailAsync(salesId);
                if (order == null)
                    return NotFound(new { error = "Order not found" });

                return Ok(new { success = true, data = order });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting order detail for SalesID {SalesId}", salesId);
                return StatusCode(500, new { error = "Failed to retrieve order details" });
            }
        }

        [HttpPost("orders/{salesId}/refund")]
        public async Task<IActionResult> ProcessRefund(int salesId, [FromBody] RefundRequest request)
        {
            try
            {
                // Extract admin user from auth context
                var adminUserIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value 
                                     ?? User.FindFirst("userId")?.Value ?? "1";
                var adminEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value 
                                 ?? User.FindFirst("email")?.Value ?? "admin@imidus.com";
                
                int.TryParse(adminUserIdStr, out int adminUserId);

                var success = await _adminService.ProcessRefundAsync(salesId, request.Amount, adminUserId, adminEmail);
                
                if (success)
                    return Ok(new { message = "Refund processed successfully" });
                
                return BadRequest(new { error = "Failed to process refund" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing refund for SalesID {SalesId}", salesId);
                return StatusCode(500, new { error = "Failed to process refund" });
            }
        }

        #endregion

        #region Customers (CRM & RFM)

        /// <summary>
        /// Get customer list with RFM data and filtering
        /// </summary>
        /// <param name="segment">Filter by segment: high-spend, frequent, recent, at-risk, new</param>
        /// <param name="searchTerm">Search by name, phone, or email</param>
        /// <param name="limit">Max results (default 50)</param>
        [HttpGet("customers")]
        public async Task<IActionResult> GetCustomerList(
            [FromQuery] string? segment,
            [FromQuery] string? searchTerm,
            [FromQuery] int limit = 50)
        {
            try
            {
                var customers = await _adminService.GetCustomerListAsync(segment, searchTerm, limit);
                return Ok(new { success = true, data = customers });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting customer list");
                return StatusCode(500, new { success = false, error = "Failed to retrieve customers" });
            }
        }

        /// <summary>
        /// Get detailed customer profile with RFM metrics
        /// </summary>
        [HttpGet("customers/{customerId:int}")]
        public async Task<IActionResult> GetCustomerProfile(int customerId)
        {
            try
            {
                var profile = await _adminService.GetCustomerProfileAsync(customerId);
                if (profile == null)
                    return NotFound(new { success = false, error = "Customer not found" });

                return Ok(new { success = true, data = profile });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting customer profile for {CustomerId}", customerId);
                return StatusCode(500, new { success = false, error = "Failed to retrieve customer profile" });
            }
        }

        /// <summary>
        /// Get customer loyalty transaction history
        /// </summary>
        [HttpGet("customers/{customerId:int}/loyalty")]
        public async Task<IActionResult> GetCustomerLoyalty(int customerId, [FromQuery] int limit = 50)
        {
            try
            {
                var loyalty = await _adminService.GetCustomerLoyaltyAsync(customerId, limit);
                return Ok(new { success = true, data = loyalty });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting loyalty history for {CustomerId}", customerId);
                return StatusCode(500, new { success = false, error = "Failed to retrieve loyalty history" });
            }
        }

        /// <summary>
        /// Get customer segment counts for RFM dashboard
        /// </summary>
        [HttpGet("customers/segments")]
        public async Task<IActionResult> GetCustomerSegments()
        {
            try
            {
                var segments = await _adminService.GetCustomerSegmentCountsAsync();
                return Ok(new { success = true, data = segments });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting customer segments");
                return StatusCode(500, new { success = false, error = "Failed to retrieve customer segments" });
            }
        }

        /// <summary>
        /// Get customer order history
        /// </summary>
        [HttpGet("customers/{customerId:int}/history")]
        public async Task<IActionResult> GetCustomerHistory(int customerId)
        {
            try
            {
                var history = await _adminService.GetCustomerHistoryAsync(customerId);
                return Ok(new { success = true, data = history });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting customer history for {CustomerId}", customerId);
                return StatusCode(500, new { success = false, error = "Failed to retrieve customer history" });
            }
        }

        #endregion

        #region Campaigns (Push Notifications)

        [HttpGet("campaigns")]
        public async Task<IActionResult> GetCampaigns()
        {
            try
            {
                var campaigns = await _adminService.GetCampaignsAsync();
                return Ok(new { success = true, data = campaigns });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting campaigns");
                return StatusCode(500, new { error = "Failed to retrieve campaigns" });
            }
        }

        [HttpPost("campaigns")]
        public async Task<IActionResult> CreateCampaign([FromBody] CampaignRequest request)
        {
            try
            {
                // Extract admin user info from claims
                var adminUserIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "1";
                var adminEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value ?? "admin@imidus.com";
                int.TryParse(adminUserIdStr, out int adminUserId);

                var campaign = await _adminService.CreateCampaignAsync(request, adminUserId, adminEmail);
                return Ok(new { success = true, data = campaign });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating campaign");
                return StatusCode(500, new { error = "Failed to create campaign" });
            }
        }

        [HttpPost("campaigns/{campaignId}/send")]
        public async Task<IActionResult> SendCampaign(int campaignId)
        {
            try
            {
                var result = await _adminService.SendCampaignAsync(campaignId);
                return Ok(new { success = true, message = "Campaign sent", sentCount = result.RecipientsSent });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending campaign {CampaignId}", campaignId);
                return StatusCode(500, new { error = "Failed to send campaign" });
            }
        }

        #endregion

        #region Menu Overrides (Overlay)

        [HttpGet("menu/overrides")]
        public async Task<IActionResult> GetMenuOverrides()
        {
            try
            {
                var overrides = await _adminService.GetMenuOverridesAsync();
                return Ok(new { success = true, data = overrides });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting menu overrides");
                return StatusCode(500, new { error = "Failed to retrieve menu overrides" });
            }
        }

        [HttpPut("menu/overrides/{itemId}")]
        public async Task<IActionResult> UpdateMenuOverride(int itemId, [FromBody] MenuOverrideRequest request)
        {
            try
            {
                // Extract admin user info from claims
                var adminUserIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "1";
                var adminEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value ?? "admin@imidus.com";
                int.TryParse(adminUserIdStr, out int adminUserId);

                var override_ = await _adminService.UpdateMenuOverrideAsync(itemId, request, adminUserId, adminEmail);
                return Ok(new { success = true, data = override_ });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating menu override for item {ItemId}", itemId);
                return StatusCode(500, new { error = "Failed to update menu override" });
            }
        }

        #endregion

        #region Birthday Rewards (Overlay)

        [HttpGet("rewards/birthday")]
        public async Task<IActionResult> GetBirthdayConfig()
        {
            try
            {
                var config = await _adminService.GetBirthdayRewardConfigAsync();
                return Ok(new { success = true, data = config });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting birthday reward config");
                return StatusCode(500, new { error = "Failed to retrieve birthday configuration" });
            }
        }

        [HttpPut("rewards/birthday")]
        public async Task<IActionResult> UpdateBirthdayConfig([FromBody] BirthdayRewardConfig config)
        {
            try
            {
                // Extract admin user info from claims
                var adminUserIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "1";
                var adminEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value ?? "admin@imidus.com";
                int.TryParse(adminUserIdStr, out int adminUserId);

                var success = await _adminService.UpdateBirthdayRewardConfigAsync(config, adminUserId, adminEmail);
                if (success)
                    return Ok(new { success = true, message = "Birthday configuration updated" });

                return BadRequest(new { error = "Failed to update birthday configuration" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating birthday reward config");
                return StatusCode(500, new { error = "Failed to update birthday configuration" });
            }
        }

        #endregion

        #region Activity Logs

        [HttpGet("logs")]
        public async Task<IActionResult> GetActivityLogs([FromQuery] int limit = 100)
        {
            try
            {
                var logs = await _adminService.GetActivityLogsAsync(limit);
                return Ok(new { success = true, data = logs });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting activity logs");
                return StatusCode(500, new { error = "Failed to retrieve activity logs" });
            }
        }

        #endregion
    }

    public class RefundRequest
    {
        public decimal Amount { get; set; }
        public string? Reason { get; set; }
    }
}
