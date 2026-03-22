using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using IntegrationService.Core.Domain.Entities;
using IntegrationService.Core.Interfaces;
using IntegrationService.Infrastructure.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace IntegrationService.API.Controllers
{
    [Route("api/admin")]
    [ApiController]
    public class AdminController : ControllerBase
    {
        private readonly IPosRepository _posRepository;
        private readonly IActivityLogRepository _activityRepo;
        private readonly ICustomerAnalyticsRepository _analyticsRepo;
        private readonly IMenuOverlayRepository _menuOverlayRepo;
        private readonly IRFMSegmentationService _rfmService;
        private readonly IBirthdayRewardService _birthdayService;
        private readonly ILogger<AdminController> _logger;

        public AdminController(
            IPosRepository posRepository,
            IActivityLogRepository activityRepo,
            ICustomerAnalyticsRepository analyticsRepo,
            IMenuOverlayRepository menuOverlayRepo,
            IRFMSegmentationService rfmService,
            IBirthdayRewardService birthdayService,
            ILogger<AdminController> logger)
        {
            _posRepository = posRepository;
            _activityRepo = activityRepo;
            _analyticsRepo = analyticsRepo;
            _menuOverlayRepo = menuOverlayRepo;
            _rfmService = rfmService;
            _birthdayService = birthdayService;
            _logger = logger;
        }

        [HttpGet("customers/segments")]
        public async Task<IActionResult> GetCustomerSegments()
        {
            try
            {
                _logger.LogInformation("Retrieving customer segments for admin dashboard");
                var segments = await _posRepository.GetCustomerSegmentsAsync();
                
                var counts = new CustomerSegmentCounts
                {
                    HighSpend = segments.Count(s => s.Segment == "VIP"),
                    Frequent = segments.Count(s => s.Segment == "Loyal"),
                    Recent = segments.Count(s => s.LastOrderDate > DateTime.Now.AddDays(-14)),
                    AtRisk = segments.Count(s => s.Segment == "At-Risk"),
                    New = segments.Count(s => s.VisitCount <= 1),
                    Total = segments.Count()
                };

                return Ok(new { data = counts });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving customer segments");
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        [HttpGet("dashboard/summary")]
        public async Task<IActionResult> GetDashboardSummary([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
        {
            try
            {
                var start = startDate ?? DateTime.Today.AddDays(-30);
                var end = endDate ?? DateTime.Today.AddDays(1);
                
                var orders = await _posRepository.GetOrdersByDateRangeAsync(start, end);
                var totalRevenue = orders.Sum(o => o.TotalAmount);
                var totalOrders = orders.Count();
                
                // Get customer count
                var segments = await _posRepository.GetCustomerSegmentsAsync();
                
                var stats = new
                {
                    totalRevenue = (int)(totalRevenue * 100), // Convert to cents for frontend consistency
                    totalOrders = totalOrders,
                    totalCustomers = segments.Count(),
                    revenueGrowth = 15.5 // Dummy growth rate for now
                };

                return Ok(new { data = stats });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving dashboard summary");
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        [HttpGet("dashboard/sales-chart")]
        public async Task<IActionResult> GetSalesChart([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
        {
            try
            {
                var start = startDate ?? DateTime.Today.AddDays(-30);
                var end = endDate ?? DateTime.Today.AddDays(1);
                
                var orders = await _posRepository.GetOrdersByDateRangeAsync(start, end);
                
                var chartData = orders
                    .GroupBy(o => o.SaleDateTime.Date)
                    .Select(g => new { date = g.Key.ToString("yyyy-MM-dd"), sales = g.Sum(o => o.TotalAmount) })
                    .OrderBy(x => x.date)
                    .ToList();

                return Ok(new { data = chartData });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving sales chart");
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        [HttpGet("dashboard/popular-items")]
        public async Task<IActionResult> GetPopularItems([FromQuery] int limit = 10)
        {
            return Ok(new { data = new List<object>() }); // Placeholder
        }

        [HttpGet("orders/queue")]
        public async Task<IActionResult> GetOrdersQueue([FromQuery] string? status, [FromQuery] int limit = 50)
        {
            try
            {
                // Mapping status to TransType (1=Sale, 2=Open)
                int? transType = status?.ToLower() switch
                {
                    "open" => 2,
                    "completed" => 1,
                    _ => null
                };

                var today = DateTime.Today;
                var orders = await _posRepository.GetOrdersByDateRangeAsync(today, today.AddDays(1));
                
                if (transType.HasValue)
                    orders = orders.Where(o => o.TransType == transType.Value);

                return Ok(new { data = orders.Take(limit) });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving orders queue");
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        [HttpGet("menu/overrides")]
        public async Task<IActionResult> GetMenuOverrides()
        {
            try
            {
                var overlays = await _menuOverlayRepo.GetAllAsync();
                return Ok(new { data = overlays });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving menu overrides");
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        [HttpGet("logs")]
        public async Task<IActionResult> GetActivityLogs([FromQuery] int limit = 50)
        {
            try
            {
                var logs = await _activityRepo.GetRecentLogsAsync(limit);
                return Ok(new { data = logs });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving activity logs");
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        /// <summary>
        /// Get customers with full RFM analytics
        /// </summary>
        [HttpGet("analytics/customers")]
        public async Task<IActionResult> GetCustomersWithRfm([FromQuery] RfmFilterQuery filter)
        {
            try
            {
                var rfmFilter = new RfmFilter
                {
                    MinSpend = filter.MinSpend,
                    MaxSpend = filter.MaxSpend,
                    MinVisits = filter.MinVisits,
                    MaxVisits = filter.MaxVisits,
                    RecencyDays = filter.RecencyDays,
                    InactiveDays = filter.InactiveDays,
                    Segment = filter.Segment,
                    HasBirthdayToday = filter.HasBirthdayToday
                };

                var customers = await _analyticsRepo.GetCustomersWithRfmAsync(rfmFilter);
                return Ok(new { data = customers });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving customer RFM data");
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        /// <summary>
        /// Get single customer RFM profile
        /// </summary>
        [HttpGet("analytics/customers/{customerId}")]
        public async Task<IActionResult> GetCustomerRfm(int customerId)
        {
            try
            {
                var customer = await _analyticsRepo.GetCustomerRfmAsync(customerId);
                if (customer == null)
                    return NotFound(new { error = "Customer not found" });

                return Ok(new { data = customer });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving customer {CustomerId} RFM data", customerId);
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        /// <summary>
        /// Get segment distribution
        /// </summary>
        [HttpGet("analytics/segments")]
        public async Task<IActionResult> GetSegmentDistribution()
        {
            try
            {
                var allCustomers = await _analyticsRepo.GetCustomersWithRfmAsync(null);
                var customerList = allCustomers.ToList();

                var distribution = new
                {
                    VIP = customerList.Count(c => c.Segment == "VIP"),
                    Loyal = customerList.Count(c => c.Segment == "Loyal"),
                    Regular = customerList.Count(c => c.Segment == "Regular"),
                    AtRisk = customerList.Count(c => c.Segment == "At-Risk"),
                    New = customerList.Count(c => c.Segment == "New"),
                    Total = customerList.Count
                };

                return Ok(new { data = distribution });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving segment distribution");
                return StatusCode(500, new { error = "Internal server error" });
            }
        }

        /// <summary>
        /// Get RFM segments (Recency, Frequency, Monetary) for all customers
        /// Returns segmentation: Champions, Loyal, Potential, At Risk, Lost, Regular
        /// </summary>
        [HttpGet("rfm/segments")]
        public async Task<IActionResult> GetRFMSegments()
        {
            try
            {
                _logger.LogInformation("Calculating RFM segments for all customers");
                var segments = await _rfmService.CalculateSegmentsAsync();
                return Ok(new { data = segments, count = segments.Count });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calculating RFM segments");
                return StatusCode(500, new { error = "Failed to calculate RFM segments" });
            }
        }

        /// <summary>
        /// Get customers in a specific RFM segment
        /// Segment values: Champions, Loyal, Potential, At Risk, Lost, Regular
        /// </summary>
        [HttpGet("rfm/segments/{segment}")]
        public async Task<IActionResult> GetSegmentCustomers(string segment)
        {
            try
            {
                _logger.LogInformation("Retrieving customers for RFM segment: {Segment}", segment);
                var customers = await _rfmService.GetSegmentCustomersAsync(segment);
                return Ok(new { data = customers, count = customers.Count });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving customers for segment {Segment}", segment);
                return StatusCode(500, new { error = "Failed to retrieve segment customers" });
            }
        }

        /// <summary>
        /// Get RFM segment statistics and distribution
        /// </summary>
        [HttpGet("rfm/stats")]
        public async Task<IActionResult> GetRFMStats()
        {
            try
            {
                _logger.LogInformation("Retrieving RFM segment statistics");
                var stats = await _rfmService.GetSegmentStatsAsync();
                return Ok(new { data = stats });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving RFM statistics");
                return StatusCode(500, new { error = "Failed to retrieve RFM statistics" });
            }
        }

        /// <summary>
        /// Get upcoming birthdays for the next N days
        /// </summary>
        [HttpGet("rewards/upcoming-birthdays")]
        public async Task<IActionResult> GetUpcomingBirthdays([FromQuery] int days = 7)
        {
            try
            {
                _logger.LogInformation("Retrieving upcoming birthdays for next {Days} days", days);
                var birthdays = await _birthdayService.GetUpcomingBirthdaysAsync(days);
                return Ok(new { data = birthdays, count = birthdays.Count });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving upcoming birthdays");
                return StatusCode(500, new { error = "Failed to retrieve upcoming birthdays" });
            }
        }

        /// <summary>
        /// Get current birthday reward configuration
        /// </summary>
        [HttpGet("rewards/birthday-config")]
        public async Task<IActionResult> GetBirthdayRewardConfig()
        {
            try
            {
                _logger.LogInformation("Retrieving birthday reward configuration");
                var config = await _birthdayService.GetConfigurationAsync();
                return Ok(new { data = config });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving birthday reward configuration");
                return StatusCode(500, new { error = "Failed to retrieve configuration" });
            }
        }

        /// <summary>
        /// Update birthday reward configuration
        /// </summary>
        [HttpPost("rewards/configure-birthday")]
        public async Task<IActionResult> ConfigureBirthdayReward([FromBody] BirthdayRewardConfigRequest config)
        {
            try
            {
                _logger.LogInformation("Updating birthday reward configuration: {Points} points, Enabled={Enabled}",
                    config.RewardPoints, config.Enabled);

                var configToUpdate = new BirthdayRewardConfig
                {
                    RewardPoints = config.RewardPoints,
                    Enabled = config.Enabled,
                    LastModified = DateTime.UtcNow
                };

                await _birthdayService.UpdateConfigurationAsync(configToUpdate);
                return Ok(new { success = true, message = "Birthday reward configuration updated" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating birthday reward configuration");
                return StatusCode(500, new { error = "Failed to update configuration" });
            }
        }
    }

    public class RfmFilterQuery
    {
        public decimal? MinSpend { get; set; }
        public decimal? MaxSpend { get; set; }
        public int? MinVisits { get; set; }
        public int? MaxVisits { get; set; }
        public int? RecencyDays { get; set; }
        public int? InactiveDays { get; set; }
        public string? Segment { get; set; }
        public bool? HasBirthdayToday { get; set; }
    }

    public class BirthdayRewardConfigRequest
    {
        public int RewardPoints { get; set; } = 500;
        public bool Enabled { get; set; } = true;
    }
}
