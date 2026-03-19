using System;
using System.Collections.Generic;
using System.Data;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using IntegrationService.Core.Interfaces;

namespace IntegrationService.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SyncController : ControllerBase
    {
        private readonly IPosRepository _posRepo;
        private readonly ILogger<SyncController> _logger;
        private static DateTime? _lastSuccessfulSync;

        public SyncController(IPosRepository posRepository, ILogger<SyncController> logger)
        {
            _posRepo = posRepository;
            _logger = logger;
        }

        [HttpGet("status")]
        [ProducesResponseType(typeof(SyncStatusResponse), 200)]
        public async Task<IActionResult> GetStatus()
        {
            var stopwatch = Stopwatch.StartNew();
            string posDatabaseStatus = "unknown";
            string? posDatabaseError = null;
            int? posDatabaseLatency = null;

            try
            {
                var startTime = DateTime.UtcNow;
                var categories = await _posRepo.GetCategoriesAsync();
                stopwatch.Stop();
                posDatabaseLatency = (int)stopwatch.ElapsedMilliseconds;
                posDatabaseStatus = "connected";

                _lastSuccessfulSync = DateTime.UtcNow;

                var itemCounts = await _posRepo.GetCategoryItemCountsAsync();
                var categoriesAvailable = itemCounts.Values.Sum();

                var response = new SyncStatusResponse
                {
                    Status = "healthy",
                    IsHealthy = true,
                    Message = "POS database connected successfully",
                    Timestamp = DateTime.UtcNow.ToString("o"),
                    ServerTime = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"),
                    LastSuccessfulSync = _lastSuccessfulSync?.ToString("o"),
                    PosDatabaseStatus = posDatabaseStatus,
                    PosDatabaseLatency = posDatabaseLatency,
                    PosDatabaseError = posDatabaseError,
                    CategoriesAvailable = categoriesAvailable
                };

                _logger.LogInformation("Sync status check: Healthy, latency={Latency}ms, categories={Categories}", 
                    posDatabaseLatency, categoriesAvailable);

                return Ok(response);
            }
            catch (Exception ex)
            {
                stopwatch.Stop();
                posDatabaseLatency = (int)stopwatch.ElapsedMilliseconds;
                posDatabaseStatus = "disconnected";
                posDatabaseError = ex.Message;

                _logger.LogError(ex, "Sync status check failed");

                var response = new SyncStatusResponse
                {
                    Status = "unhealthy",
                    IsHealthy = false,
                    Message = $"POS database connection failed: {ex.Message}",
                    Timestamp = DateTime.UtcNow.ToString("o"),
                    ServerTime = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"),
                    LastSuccessfulSync = _lastSuccessfulSync?.ToString("o"),
                    PosDatabaseStatus = posDatabaseStatus,
                    PosDatabaseLatency = posDatabaseLatency,
                    PosDatabaseError = posDatabaseError,
                    CategoriesAvailable = 0
                };

                return StatusCode(503, response);
            }
        }

        [HttpGet("health")]
        [ProducesResponseType(typeof(HealthCheckResponse), 200)]
        public async Task<IActionResult> HealthCheck()
        {
            try
            {
                var startTime = DateTime.UtcNow;
                var categories = await _posRepo.GetCategoriesAsync();
                var elapsed = (DateTime.UtcNow - startTime).TotalMilliseconds;

                return Ok(new HealthCheckResponse
                {
                    Status = "healthy",
                    Timestamp = DateTime.UtcNow.ToString("o")
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Health check failed");
                return StatusCode(503, new HealthCheckResponse
                {
                    Status = "unhealthy",
                    Timestamp = DateTime.UtcNow.ToString("o")
                });
            }
        }

        [HttpGet("stats")]
        [ProducesResponseType(typeof(SyncStatsResponse), 200)]
        public async Task<IActionResult> GetStats()
        {
            try
            {
                var today = DateTime.Today;
                var orders = await _posRepo.GetOrdersByDateRangeAsync(today, today.AddDays(1));
                var categories = await _posRepo.GetCategoriesAsync();
                var menuItems = await _posRepo.GetActiveMenuItemsAsync();

                var totalRevenue = orders.Sum(o => o.TotalAmount);

                return Ok(new SyncStatsResponse
                {
                    Timestamp = DateTime.UtcNow.ToString("o"),
                    DatabaseStatus = "connected",
                    LastCheckTime = _lastSuccessfulSync?.ToString("o"),
                    TotalOrdersToday = orders.Count(),
                    TotalRevenueToday = totalRevenue,
                    AverageOrderValue = orders.Any() ? (double)orders.Average(o => o.TotalAmount) : 0,
                    TotalCategories = categories.Count(),
                    TotalMenuItems = menuItems.Count()
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get sync stats");
                return StatusCode(500, new SyncStatsResponse
                {
                    Timestamp = DateTime.UtcNow.ToString("o"),
                    DatabaseStatus = "error",
                    ErrorMessage = ex.Message
                });
            }
        }

        [HttpPost("check")]
        [ProducesResponseType(typeof(SyncStatusResponse), 200)]
        public async Task<IActionResult> ForceCheck()
        {
            return await GetStatus();
        }
    }

    public class SyncStatusResponse
    {
        public string Status { get; set; } = string.Empty;
        public bool IsHealthy { get; set; }
        public string Message { get; set; } = string.Empty;
        public string Timestamp { get; set; } = string.Empty;
        public string ServerTime { get; set; } = string.Empty;
        public string? LastSuccessfulSync { get; set; }
        public string PosDatabaseStatus { get; set; } = string.Empty;
        public int? PosDatabaseLatency { get; set; }
        public string? PosDatabaseError { get; set; }
        public int CategoriesAvailable { get; set; }
    }

    public class HealthCheckResponse
    {
        public string Status { get; set; } = string.Empty;
        public string Timestamp { get; set; } = string.Empty;
    }

    public class SyncStatsResponse
    {
        public string Timestamp { get; set; } = string.Empty;
        public string DatabaseStatus { get; set; } = string.Empty;
        public string? ErrorMessage { get; set; }
        public string? LastCheckTime { get; set; }
        public int TotalOrdersToday { get; set; }
        public decimal TotalRevenueToday { get; set; }
        public double AverageOrderValue { get; set; }
        public int TotalCategories { get; set; }
        public int TotalMenuItems { get; set; }
    }
}