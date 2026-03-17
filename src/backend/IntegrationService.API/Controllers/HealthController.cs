using Microsoft.AspNetCore.Mvc;
using IntegrationService.Core.Interfaces;
using Microsoft.Extensions.Logging;
using System;
using System.Threading.Tasks;

namespace IntegrationService.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class HealthController : ControllerBase
    {
        private readonly IPosRepository _posRepo;
        private readonly ILogger<HealthController> _logger;

        public HealthController(IPosRepository posRepository, ILogger<HealthController> logger)
        {
            _posRepo = posRepository;
            _logger = logger;
        }

        /// <summary>
        /// Basic health check
        /// </summary>
        [HttpGet]
        [Route("/health")]
        public IActionResult HealthCheck()
        {
            return Ok(new
            {
                Status = "Healthy",
                Timestamp = DateTime.UtcNow,
                Version = "2.0.0"
            });
        }

        /// <summary>
        /// Deep health check including database connectivity
        /// </summary>
        [HttpGet("deep")]
        public async Task<IActionResult> DeepHealthCheck()
        {
            try
            {
                // Test database connectivity by fetching menu items count
                var items = await _posRepo.GetActiveMenuItemsAsync();
                var itemCount = 0;
                foreach (var _ in items) itemCount++;

                return Ok(new
                {
                    Status = "Healthy",
                    Timestamp = DateTime.UtcNow,
                    Version = "2.0.0",
                    Database = new
                    {
                        Connected = true,
                        MenuItemCount = itemCount
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Health check failed");
                return StatusCode(503, new
                {
                    Status = "Unhealthy",
                    Timestamp = DateTime.UtcNow,
                    Error = ex.Message
                });
            }
        }
    }
}
