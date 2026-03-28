using Microsoft.AspNetCore.Mvc;
using IntegrationService.Core.Interfaces;
using Microsoft.Extensions.Logging;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace IntegrationService.API.Controllers
{
    /// <summary>
    /// Health and sync status API
    /// Provides real-time connectivity status for the web frontend
    /// SSOT Compliant: Read-only endpoint, queries POS database for status
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class SyncController : ControllerBase
    {
        private readonly IPosRepository _posRepo;
        private readonly ILogger<SyncController> _logger;

        public SyncController(
            IPosRepository posRepository,
            ILogger<SyncController> logger)
        {
            _posRepo = posRepository;
            _logger = logger;
        }

        /// <summary>
        /// Get overall system health and sync status
        /// Used by web frontend for real-time sync indicator
        /// Polls POS database to verify connectivity (SSOT - read only)
        /// </summary>
        [HttpGet("status")]
        [ProducesResponseType(typeof(SyncStatusResponse), 200)]
        public async Task<IActionResult> GetSyncStatus()
        {
            var status = new SyncStatusResponse
            {
                Timestamp = DateTime.UtcNow,
                ServerTime = DateTime.Now
            };

            try
            {
                // Check POS database connectivity by fetching categories
                // This is a lightweight read-only operation (SSOT compliant)
                var startTime = DateTime.UtcNow;
                var categories = await _posRepo.GetCategoriesAsync();
                var latency = (DateTime.UtcNow - startTime).TotalMilliseconds;

                if (categories != null && categories.Any())
                {
                    status.PosDatabaseStatus = "connected";
                    status.PosDatabaseLatency = latency;
                    status.CategoriesAvailable = categories.Count();
                    status.IsHealthy = true;
                    status.Status = "online";
                    status.Message = "POS Connected";
                    status.LastSuccessfulSync = DateTime.UtcNow;
                }
                else
                {
                    status.PosDatabaseStatus = "empty";
                    status.Status = "warning";
                    status.IsHealthy = false;
                    status.Message = "POS database returned no categories";
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "POS database connectivity check failed");
                status.PosDatabaseStatus = "error";
                status.PosDatabaseError = ex.Message;
                status.Status = "offline";
                status.IsHealthy = false;
                status.Message = "POS Database Unavailable";
            }

            return Ok(status);
        }

        /// <summary>
        /// Get lightweight health check (for frequent polling)
        /// Minimal overhead, just returns 200 if backend is up
        /// </summary>
        [HttpGet("health")]
        public IActionResult HealthCheck()
        {
            return Ok(new 
            { 
                status = "healthy", 
                timestamp = DateTime.UtcNow,
                serverTime = DateTime.Now
            });
        }

        /// <summary>
        /// Get POS database statistics
        /// For admin dashboards and monitoring - SSOT read-only
        /// </summary>
        [HttpGet("stats")]
        [ProducesResponseType(typeof(SyncStatsResponse), 200)]
        public async Task<IActionResult> GetSyncStats()
        {
            try
            {
                var stats = new SyncStatsResponse
                {
                    Timestamp = DateTime.UtcNow
                };

                // Get today's orders from POS (SSOT read)
                var today = DateTime.Today;
                var todayOrders = await _posRepo.GetOrdersByDateRangeAsync(today, today.AddDays(1));
                stats.TotalOrdersToday = todayOrders?.Count() ?? 0;
                stats.TotalRevenueToday = todayOrders?.Sum(o => o.TotalAmount) ?? 0;

                // Calculate average order value
                if (stats.TotalOrdersToday > 0)
                {
                    stats.AverageOrderValue = stats.TotalRevenueToday / stats.TotalOrdersToday;
                }

                // Get menu statistics
                var categories = await _posRepo.GetCategoriesAsync();
                stats.TotalCategories = categories?.Count() ?? 0;

                var menuItems = await _posRepo.GetActiveMenuItemsAsync();
                stats.TotalMenuItems = menuItems?.Count() ?? 0;

                stats.DatabaseStatus = "connected";
                stats.LastCheckTime = DateTime.UtcNow;

                return Ok(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get sync statistics");
                return StatusCode(500, new SyncStatsResponse
                {
                    DatabaseStatus = "error",
                    Timestamp = DateTime.UtcNow,
                    ErrorMessage = ex.Message
                });
            }
        }

        /// <summary>
        /// Manual sync check triggered from {IP}
        /// Still read-only, just refreshes cached data from POS
        /// </summary>
        [HttpPost("check")]
        public async Task<IActionResult> ForceSyncCheck()
        {
            _logger.LogInformation("Manual sync check triggered from {IP}", HttpContext.Connection.RemoteIpAddress);
            return await GetSyncStatus();
        }

    }

    /// <summary>
    /// Sync status response model for real-time indicator
    /// </summary>
    public class SyncStatusResponse
    {
        public string Status { get; set; } = "unknown"; // online, offline, warning, error
        public bool IsHealthy { get; set; }
        public string Message { get; set; } = "";
        public DateTime Timestamp { get; set; }
        public DateTime ServerTime { get; set; }
        public DateTime? LastSuccessfulSync { get; set; }
        
        // POS Database (INI_Restaurant) - Ground Truth
        public string PosDatabaseStatus { get; set; } = "unknown"; // connected, error, empty
        public double? PosDatabaseLatency { get; set; } // milliseconds
        public string PosDatabaseError { get; set; }
        public int CategoriesAvailable { get; set; }
    }

    /// <summary>
    /// Sync statistics response model
    /// </summary>
    public class SyncStatsResponse
    {
        public DateTime Timestamp { get; set; }
        public string DatabaseStatus { get; set; } = "unknown";
        public string ErrorMessage { get; set; }
        public DateTime? LastCheckTime { get; set; }
        
        // Order Statistics (from POS - SSOT)
        public int TotalOrdersToday { get; set; }
        public decimal TotalRevenueToday { get; set; }
        public decimal AverageOrderValue { get; set; }
        
        // Menu Statistics
        public int TotalCategories { get; set; }
        public int TotalMenuItems { get; set; }
    }
}
