using IntegrationService.Core.Services;
using Microsoft.AspNetCore.Mvc;

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
                return Ok(summary);
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
                return Ok(data);
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
                return Ok(items);
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
        public async Task<IActionResult> GetOrderQueue([FromQuery] string? status, [FromQuery] int limit = 50)
        {
            try
            {
                var orders = await _adminService.GetOrderQueueAsync(status, limit);
                return Ok(orders);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting order queue");
                return StatusCode(500, new { error = "Failed to retrieve orders" });
            }
        }

        [HttpPost("orders/{salesId}/refund")]
        public async Task<IActionResult> ProcessRefund(int salesId, [FromBody] RefundRequest request)
        {
            try
            {
                // TODO: Get actual admin user from auth context
                var adminUserId = 1; // Placeholder
                var adminEmail = "admin@imidus.com"; // Placeholder

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

        [HttpGet("customers/segments")]
        public async Task<IActionResult> GetCustomerSegments()
        {
            try
            {
                var segments = await _adminService.GetCustomerSegmentsAsync();
                return Ok(segments);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting customer segments");
                return StatusCode(500, new { error = "Failed to retrieve customer segments" });
            }
        }

        [HttpGet("customers/{customerId}/history")]
        public async Task<IActionResult> GetCustomerHistory(int customerId)
        {
            try
            {
                var history = await _adminService.GetCustomerHistoryAsync(customerId);
                return Ok(history);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting customer history for {CustomerId}", customerId);
                return StatusCode(500, new { error = "Failed to retrieve customer history" });
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
                return Ok(campaigns);
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
                var campaign = await _adminService.CreateCampaignAsync(request);
                return Ok(campaign);
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
                return Ok(result);
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
                return Ok(overrides);
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
                var override_ = await _adminService.UpdateMenuOverrideAsync(itemId, request);
                return Ok(override_);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating menu override for item {ItemId}", itemId);
                return StatusCode(500, new { error = "Failed to update menu override" });
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
                return Ok(logs);
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
