using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using IntegrationService.Core.Domain.Entities;
using IntegrationService.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace IntegrationService.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AdminController : ControllerBase
    {
        private readonly IPosRepository _posRepository;
        private readonly IActivityLogRepository _activityRepo;
        private readonly ILogger<AdminController> _logger;

        public AdminController(
            IPosRepository posRepository, 
            IActivityLogRepository activityRepo, 
            ILogger<AdminController> logger)
        {
            _posRepository = posRepository;
            _activityRepo = activityRepo;
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

        [HttpGet("dashboard/stats")]
        public async Task<IActionResult> GetDashboardStats()
        {
            try
            {
                var today = DateTime.Today;
                var orders = await _posRepository.GetOrdersByDateRangeAsync(today, today.AddDays(1));
                
                var stats = new
                {
                    TotalSales = orders.Sum(o => o.TotalAmount),
                    OrderCount = orders.Count(),
                    AverageOrderValue = orders.Any() ? orders.Average(o => o.TotalAmount) : 0,
                    OpenOrders = orders.Count(o => o.TransType == 2)
                };

                return Ok(new { data = stats });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving dashboard stats");
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
    }
}
