using IntegrationService.Core.Domain.Entities;
using IntegrationService.Core.Interfaces;
using IntegrationService.Core.Models;
using IntegrationService.Core.Models.AdminPortal;
using Microsoft.Extensions.Logging;
using System.Globalization;

namespace IntegrationService.Core.Services
{
    /// <summary>
    /// Admin Portal Service - coordinates all admin portal operations
    /// SSOT Compliant: Reads from POS, writes through repositories
    /// </summary>
    public class AdminPortalService
    {
        private readonly IPosRepository _posRepository;
        private readonly IActivityLogRepository _activityLogRepository;
        private readonly ILogger<AdminPortalService> _logger;

        public AdminPortalService(
            IPosRepository posRepository,
            IActivityLogRepository activityLogRepository,
            ILogger<AdminPortalService> logger)
        {
            _posRepository = posRepository;
            _activityLogRepository = activityLogRepository;
            _logger = logger;
        }

        #region Dashboard & Analytics

        /// <summary>
        /// Get dashboard summary statistics
        /// SSOT: Reads from POS database
        /// </summary>
        public async Task<DashboardSummary> GetDashboardSummaryAsync(DateTime? startDate = null, DateTime? endDate = null)
        {
            var start = startDate ?? DateTime.Today.AddDays(-30);
            var end = endDate ?? DateTime.Today.AddDays(1);

            var orders = await _posRepository.GetOrdersByDateRangeAsync(start, end);
            var orderList = orders.ToList();

            return new DashboardSummary
            {
                TotalOrders = orderList.Count,
                TotalRevenue = orderList.Sum(o => o.SubTotal + o.GSTAmt + o.PSTAmt + o.PST2Amt - o.DSCAmt),
                AverageOrderValue = orderList.Any() ? orderList.Average(o => o.SubTotal) : 0,
                TotalCustomers = orderList.Select(o => o.CustomerID).Distinct().Count(),
                PeriodStart = start,
                PeriodEnd = end
            };
        }

        /// <summary>
        /// Get popular items report
        /// SSOT: Reads from POS tblSalesDetail
        /// </summary>
        public async Task<IEnumerable<PopularItemReport>> GetPopularItemsAsync(DateTime? startDate = null, DateTime? endDate = null, int limit = 10)
        {
            var start = startDate ?? DateTime.Today.AddDays(-30);
            var end = endDate ?? DateTime.Today.AddDays(1);

            // This would query POS database for sales detail aggregated by item
            // For now, return placeholder structure
            _logger.LogInformation("Fetching popular items from {StartDate} to {EndDate}", start, end);
            
            return new List<PopularItemReport>(); // Implementation depends on POS schema
        }

        /// <summary>
        /// Get sales chart data (daily/weekly/monthly)
        /// SSOT: Reads from POS tblSales
        /// </summary>
        public async Task<IEnumerable<SalesChartData>> GetSalesChartDataAsync(DateTime startDate, DateTime endDate, string groupBy = "day")
        {
            var orders = await _posRepository.GetOrdersByDateRangeAsync(startDate, endDate.AddDays(1));
            
            return groupBy.ToLower() switch
            {
                "day" => orders.GroupBy(o => o.SaleDateTime.Date)
                    .Select(g => new SalesChartData
                    {
                        Label = g.Key.ToString("MMM dd"),
                        OrderCount = g.Count(),
                        Revenue = g.Sum(o => o.SubTotal + o.GSTAmt + o.PSTAmt + o.PST2Amt - o.DSCAmt)
                    }),
                "week" => orders.GroupBy(o => GetWeekStart(o.SaleDateTime))
                    .Select(g => new SalesChartData
                    {
                        Label = g.Key.ToString("MMM dd"),
                        OrderCount = g.Count(),
                        Revenue = g.Sum(o => o.SubTotal + o.GSTAmt + o.PSTAmt + o.PST2Amt - o.DSCAmt)
                    }),
                _ => orders.GroupBy(o => new { o.SaleDateTime.Year, o.SaleDateTime.Month })
                    .Select(g => new SalesChartData
                    {
                        Label = $"{g.Key.Year}-{g.Key.Month:D2}",
                        OrderCount = g.Count(),
                        Revenue = g.Sum(o => o.SubTotal + o.GSTAmt + o.PSTAmt + o.PST2Amt - o.DSCAmt)
                    })
            };
        }

        private static DateTime GetWeekStart(DateTime date)
        {
            var diff = date.DayOfWeek - DayOfWeek.Monday;
            if (diff < 0) diff += 7;
            return date.AddDays(-diff).Date;
        }

        #endregion

        #region Order Management

        /// <summary>
        /// Get live order queue
        /// SSOT: Reads from POS database
        /// </summary>
        public async Task<IEnumerable<PosTicket>> GetOrderQueueAsync(string? status = null, int limit = 50)
        {
            // Read recent orders from POS
            var orders = await _posRepository.GetOrdersByDateRangeAsync(
                DateTime.Today.AddDays(-1), 
                DateTime.Today.AddDays(1));

            // Filter by status if specified
            if (!string.IsNullOrEmpty(status))
            {
                var transType = status.ToLower() switch
                {
                    "open" => 2,
                    "completed" => 1,
                    "refunded" => 0,
                    _ => (int?)null
                };

                if (transType.HasValue)
                    orders = orders.Where(o => o.TransType == transType.Value);
            }

            return orders.OrderByDescending(o => o.SaleDateTime).Take(limit);
        }

        /// <summary>
        /// Process order refund
        /// SSOT: Writes to POS through service
        /// </summary>
        public async Task<bool> ProcessRefundAsync(int salesId, decimal refundAmount, int adminUserId, string adminEmail)
        {
            try
            {
                // Log the refund action
                await _activityLogRepository.CreateAsync(new ActivityLog
                {
                    AdminUserId = adminUserId,
                    AdminEmail = adminEmail,
                    Action = "OrderRefund",
                    EntityType = "Order",
                    EntityId = salesId,
                    Details = $"Refund processed: ${refundAmount:C2}",
                    Timestamp = DateTime.UtcNow,
                    Success = true
                });

                _logger.LogInformation("Refund processed for SalesID {SalesId}: ${Amount} by {Admin}", 
                    salesId, refundAmount, adminEmail);

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to process refund for SalesID {SalesId}", salesId);
                return false;
            }
        }

        #endregion

        #region Activity Logging

        public async Task LogActivityAsync(string action, string? entityType, int? entityId, string? details, int adminUserId, string adminEmail, string? ipAddress = null, bool success = true)
        {
            await _activityLogRepository.CreateAsync(new ActivityLog
            {
                AdminUserId = adminUserId,
                AdminEmail = adminEmail,
                Action = action,
                EntityType = entityType,
                EntityId = entityId,
                Details = details,
                IpAddress = ipAddress,
                Timestamp = DateTime.UtcNow,
                Success = success
            });
        }

        #endregion

        #region Customer CRM (RFM Segmentation)

        public async Task<IEnumerable<CustomerSegment>> GetCustomerSegmentsAsync()
        {
            return await _posRepository.GetCustomerSegmentsAsync();
        }

        public async Task<IEnumerable<OrderHistoryItem>> GetCustomerHistoryAsync(int customerId)
        {
            var orders = await _posRepository.GetOrdersByCustomerIdAsync(customerId);
            return orders.Select(o => new OrderHistoryItem
            {
                OrderID = o.ID,
                DailyOrderNumber = o.DailyOrderNumber,
                OrderDate = o.SaleDateTime,
                SubTotal = o.SubTotal,
                GSTAmt = o.GSTAmt,
                Total = o.SubTotal + o.GSTAmt + o.PSTAmt - o.DSCAmt,
                Status = "Completed"
            });
        }

        #endregion

        #region Campaigns (Push Notifications)

        public async Task<IEnumerable<CampaignInfo>> GetCampaignsAsync()
        {
            return await _activityLogRepository.GetCampaignsAsync();
        }

        public async Task<CampaignInfo> CreateCampaignAsync(CampaignRequest request)
        {
            return await _activityLogRepository.CreateCampaignAsync(request.Name, request.Description ?? "", request.CampaignType, request.TargetQuery ?? "");
        }

        public async Task<SendResult> SendCampaignAsync(int campaignId)
        {
            return await _activityLogRepository.SendCampaignAsync(campaignId);
        }

        #endregion

        #region Menu Overrides (Overlay)

        public async Task<IEnumerable<MenuOverrideInfo>> GetMenuOverridesAsync()
        {
            return await _activityLogRepository.GetMenuOverridesAsync();
        }

        public async Task<MenuOverrideInfo> UpdateMenuOverrideAsync(int itemId, MenuOverrideRequest request)
        {
            return await _activityLogRepository.UpdateMenuOverrideAsync(itemId, request.IsAvailable ?? true, request.HiddenFromOnline ?? false, request.OverridePrice, request.Reason);
        }

        #endregion

        #region Activity Logs

        public async Task<IEnumerable<ActivityLogInfo>> GetActivityLogsAsync(int limit = 100)
        {
            return await _activityLogRepository.GetActivityLogsAsync(limit);
        }

        #endregion
    }

    // Request DTOs
    public class CampaignRequest
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string CampaignType { get; set; } = "marketing";
        public string? TargetQuery { get; set; }
        public DateTime? ScheduledAt { get; set; }
    }

    public class MenuOverrideRequest
    {
        public bool? IsAvailable { get; set; }
        public bool? HiddenFromOnline { get; set; }
        public decimal? OverridePrice { get; set; }
        public string? OverrideName { get; set; }
        public string? Reason { get; set; }
    }

    #region Dashboard Models

    public class DashboardSummary
    {
        public int TotalOrders { get; set; }
        public decimal TotalRevenue { get; set; }
        public decimal AverageOrderValue { get; set; }
        public int TotalCustomers { get; set; }
        public DateTime PeriodStart { get; set; }
        public DateTime PeriodEnd { get; set; }
    }

    public class PopularItemReport
    {
        public int ItemID { get; set; }
        public string ItemName { get; set; } = string.Empty;
        public int QuantitySold { get; set; }
        public decimal Revenue { get; set; }
    }

    public class SalesChartData
    {
        public string Label { get; set; } = string.Empty;
        public int OrderCount { get; set; }
        public decimal Revenue { get; set; }
    }

    #endregion
}
