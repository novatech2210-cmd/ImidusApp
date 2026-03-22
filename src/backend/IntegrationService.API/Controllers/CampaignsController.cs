using System;
using System.Threading.Tasks;
using IntegrationService.Core.Domain.Entities;
using IntegrationService.Core.Interfaces;
using IntegrationService.Infrastructure.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace IntegrationService.API.Controllers
{
    /// <summary>
    /// API for managing marketing push campaigns
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    public class CampaignsController : ControllerBase
    {
        private readonly ICampaignRepository _campaignRepo;
        private readonly ICustomerAnalyticsRepository _analyticsRepo;
        private readonly ICampaignService _campaignService;
        private readonly ILogger<CampaignsController> _logger;

        public CampaignsController(
            ICampaignRepository campaignRepo,
            ICustomerAnalyticsRepository analyticsRepo,
            ICampaignService campaignService,
            ILogger<CampaignsController> logger)
        {
            _campaignRepo = campaignRepo;
            _analyticsRepo = analyticsRepo;
            _campaignService = campaignService;
            _logger = logger;
        }

        /// <summary>
        /// Get all campaigns
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetCampaigns([FromQuery] string? status = null)
        {
            var campaigns = await _campaignRepo.GetAllAsync(status);
            return Ok(new { data = campaigns });
        }

        /// <summary>
        /// Get campaign by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetCampaign(int id)
        {
            var campaign = await _campaignRepo.GetByIdAsync(id);
            if (campaign == null)
                return NotFound(new { error = "Campaign not found" });

            return Ok(new { data = campaign });
        }

        /// <summary>
        /// Create a new campaign
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> CreateCampaign([FromBody] CreateCampaignRequest request)
        {
            // Build filter to get target count
            var filter = new RfmFilter
            {
                MinSpend = request.MinSpend,
                MaxSpend = request.MaxSpend,
                MinVisits = request.MinVisits,
                MaxVisits = request.MaxVisits,
                RecencyDays = request.RecencyDays,
                InactiveDays = request.InactiveDays,
                HasBirthdayToday = request.HasBirthdayToday,
                Segment = request.SegmentFilter
            };

            var targetCount = await _analyticsRepo.GetCustomerCountByFilterAsync(filter);

            var campaign = new PushCampaign
            {
                Name = request.Name,
                Title = request.Title,
                Body = request.Body,
                ImageUrl = request.ImageUrl,
                MinSpend = request.MinSpend,
                MaxSpend = request.MaxSpend,
                MinVisits = request.MinVisits,
                MaxVisits = request.MaxVisits,
                RecencyDays = request.RecencyDays,
                InactiveDays = request.InactiveDays,
                HasBirthdayToday = request.HasBirthdayToday,
                SegmentFilter = request.SegmentFilter,
                ScheduledAt = request.ScheduledAt,
                Status = request.ScheduledAt.HasValue ? "scheduled" : "draft",
                TargetCount = targetCount
            };

            var id = await _campaignRepo.CreateCampaignAsync(campaign);
            campaign.Id = id;

            _logger.LogInformation("Created campaign {Id}: {Name}, targeting {Count} customers",
                id, campaign.Name, targetCount);

            return CreatedAtAction(nameof(GetCampaign), new { id }, new { data = campaign });
        }

        /// <summary>
        /// Preview target count without creating campaign
        /// </summary>
        [HttpPost("preview")]
        public async Task<IActionResult> PreviewTargetCount([FromBody] RfmFilter filter)
        {
            var count = await _analyticsRepo.GetCustomerCountByFilterAsync(filter);
            return Ok(new { targetCount = count });
        }

        /// <summary>
        /// Send a campaign immediately
        /// </summary>
        [HttpPost("{id}/send")]
        public async Task<IActionResult> SendCampaign(int id)
        {
            var campaign = await _campaignRepo.GetByIdAsync(id);
            if (campaign == null)
                return NotFound(new { error = "Campaign not found" });

            if (campaign.Status == "sent")
                return BadRequest(new { error = "Campaign already sent" });

            var result = await _campaignService.SendCampaignAsync(id);

            if (result.Success)
            {
                return Ok(new
                {
                    success = true,
                    targetCount = result.TargetCount,
                    sentCount = result.SentCount,
                    failedCount = result.FailedCount
                });
            }
            else
            {
                return StatusCode(500, new { error = result.Error });
            }
        }

        /// <summary>
        /// Cancel a scheduled campaign
        /// </summary>
        [HttpPost("{id}/cancel")]
        public async Task<IActionResult> CancelCampaign(int id)
        {
            var campaign = await _campaignRepo.GetByIdAsync(id);
            if (campaign == null)
                return NotFound(new { error = "Campaign not found" });

            if (campaign.Status != "draft" && campaign.Status != "scheduled")
                return BadRequest(new { error = "Can only cancel draft or scheduled campaigns" });

            await _campaignRepo.UpdateStatusAsync(id, "cancelled");
            return Ok(new { success = true });
        }

        /// <summary>
        /// Delete a campaign
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCampaign(int id)
        {
            var campaign = await _campaignRepo.GetByIdAsync(id);
            if (campaign == null)
                return NotFound(new { error = "Campaign not found" });

            if (campaign.Status == "sending")
                return BadRequest(new { error = "Cannot delete campaign while sending" });

            await _campaignRepo.DeleteAsync(id);
            return Ok(new { success = true });
        }
    }

    public class CreateCampaignRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }

        // RFM Targeting
        public decimal? MinSpend { get; set; }
        public decimal? MaxSpend { get; set; }
        public int? MinVisits { get; set; }
        public int? MaxVisits { get; set; }
        public int? RecencyDays { get; set; }
        public int? InactiveDays { get; set; }
        public bool? HasBirthdayToday { get; set; }
        public string? SegmentFilter { get; set; }

        // Scheduling
        public DateTime? ScheduledAt { get; set; }
    }
}
