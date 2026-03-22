using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using IntegrationService.Core.Domain.Entities;
using IntegrationService.Core.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace IntegrationService.Infrastructure.Services
{
    /// <summary>
    /// Service for sending marketing push campaigns.
    /// Includes background service for scheduled campaigns.
    /// </summary>
    public class CampaignService : BackgroundService, ICampaignService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<CampaignService> _logger;
        private readonly TimeSpan _pollInterval = TimeSpan.FromMinutes(1);

        public CampaignService(
            IServiceProvider serviceProvider,
            ILogger<CampaignService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        /// <summary>
        /// Background task to check for and send scheduled campaigns
        /// </summary>
        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Campaign Service started");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await ProcessScheduledCampaignsAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error processing scheduled campaigns");
                }

                await Task.Delay(_pollInterval, stoppingToken);
            }

            _logger.LogInformation("Campaign Service stopped");
        }

        private async Task ProcessScheduledCampaignsAsync()
        {
            using var scope = _serviceProvider.CreateScope();
            var campaignRepo = scope.ServiceProvider.GetRequiredService<ICampaignRepository>();

            var now = DateTime.Now;
            var scheduledCampaigns = await campaignRepo.GetScheduledCampaignsAsync(now);

            foreach (var campaign in scheduledCampaigns)
            {
                _logger.LogInformation("Processing scheduled campaign {Id}: {Name}", campaign.Id, campaign.Name);
                await SendCampaignInternalAsync(campaign, scope.ServiceProvider);
            }
        }

        /// <summary>
        /// Send a campaign immediately
        /// </summary>
        public async Task<CampaignSendResult> SendCampaignAsync(int campaignId)
        {
            using var scope = _serviceProvider.CreateScope();
            var campaignRepo = scope.ServiceProvider.GetRequiredService<ICampaignRepository>();

            var campaign = await campaignRepo.GetByIdAsync(campaignId);
            if (campaign == null)
                return new CampaignSendResult { Success = false, Error = "Campaign not found" };

            return await SendCampaignInternalAsync(campaign, scope.ServiceProvider);
        }

        private async Task<CampaignSendResult> SendCampaignInternalAsync(PushCampaign campaign, IServiceProvider services)
        {
            var campaignRepo = services.GetRequiredService<ICampaignRepository>();
            var analyticsRepo = services.GetRequiredService<ICustomerAnalyticsRepository>();
            var tokenRepo = services.GetRequiredService<IDeviceTokenRepository>();
            var notificationService = services.GetRequiredService<INotificationService>();

            try
            {
                // Update status to sending
                await campaignRepo.UpdateStatusAsync(campaign.Id, "sending");

                // Build RFM filter from campaign criteria
                var filter = new RfmFilter
                {
                    MinSpend = campaign.MinSpend,
                    MaxSpend = campaign.MaxSpend,
                    MinVisits = campaign.MinVisits,
                    MaxVisits = campaign.MaxVisits,
                    RecencyDays = campaign.RecencyDays,
                    InactiveDays = campaign.InactiveDays,
                    HasBirthdayToday = campaign.HasBirthdayToday,
                    Segment = campaign.SegmentFilter
                };

                // Get matching customers
                var customerIds = await analyticsRepo.GetCustomerIdsByFilterAsync(filter);
                var customerList = new List<int>(customerIds);

                _logger.LogInformation("Campaign {Id} targeting {Count} customers", campaign.Id, customerList.Count);

                int sentCount = 0;
                int failedCount = 0;

                // Send notifications
                foreach (var customerId in customerList)
                {
                    try
                    {
                        var tokens = await tokenRepo.GetActiveTokensByCustomerIdAsync(customerId);
                        var hasTokens = false;

                        foreach (var token in tokens)
                        {
                            hasTokens = true;
                            try
                            {
                                await notificationService.SendNotificationAsync(
                                    customerId,
                                    campaign.Title,
                                    campaign.Body,
                                    new Dictionary<string, string>
                                    {
                                        ["campaignId"] = campaign.Id.ToString(),
                                        ["type"] = "marketing"
                                    });
                                sentCount++;
                                break; // Only count once per customer
                            }
                            catch
                            {
                                // Token-level failure, try next token
                            }
                        }

                        if (!hasTokens)
                        {
                            _logger.LogDebug("Customer {CustomerId} has no active device tokens", customerId);
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Failed to send campaign notification to customer {CustomerId}", customerId);
                        failedCount++;
                    }
                }

                // Update campaign status
                await campaignRepo.UpdateStatusAsync(campaign.Id, "sent", sentCount, failedCount);

                _logger.LogInformation("Campaign {Id} complete: {Sent} sent, {Failed} failed",
                    campaign.Id, sentCount, failedCount);

                return new CampaignSendResult
                {
                    Success = true,
                    TargetCount = customerList.Count,
                    SentCount = sentCount,
                    FailedCount = failedCount
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send campaign {Id}", campaign.Id);
                await campaignRepo.UpdateStatusAsync(campaign.Id, "failed", 0, 0);

                return new CampaignSendResult
                {
                    Success = false,
                    Error = ex.Message
                };
            }
        }

        /// <summary>
        /// Preview campaign targeting (get count without sending)
        /// </summary>
        public async Task<int> PreviewCampaignTargetCountAsync(RfmFilter filter)
        {
            using var scope = _serviceProvider.CreateScope();
            var analyticsRepo = scope.ServiceProvider.GetRequiredService<ICustomerAnalyticsRepository>();
            return await analyticsRepo.GetCustomerCountByFilterAsync(filter);
        }
    }

    /// <summary>
    /// Campaign service interface
    /// </summary>
    public interface ICampaignService
    {
        Task<CampaignSendResult> SendCampaignAsync(int campaignId);
        Task<int> PreviewCampaignTargetCountAsync(RfmFilter filter);
    }

    /// <summary>
    /// Result of sending a campaign
    /// </summary>
    public class CampaignSendResult
    {
        public bool Success { get; set; }
        public int TargetCount { get; set; }
        public int SentCount { get; set; }
        public int FailedCount { get; set; }
        public string? Error { get; set; }
    }
}
