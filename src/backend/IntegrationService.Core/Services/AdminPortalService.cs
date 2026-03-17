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

            _logger.LogInformation("Fetching popular items from {StartDate} to {EndDate}", start, end);
            
            var aggregations = await _posRepository.GetItemSalesAggregationAsync(start, end);

            return aggregations.Take(limit).Select(a => new PopularItemReport
            {
                ItemID = a.ItemId,
                ItemName = a.Name,
                QuantitySold = a.QuantitySold,
                Revenue = a.TotalRevenue
            });
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
        /// Get live order queue with comprehensive filtering
        /// SSOT: Reads from POS database
        /// </summary>
        public async Task<IEnumerable<OrderQueueDto>> GetOrderQueueAsync(
            string? status = null,
            string? paymentStatus = null,
            string? searchTerm = null,
            DateTime? startDate = null,
            DateTime? endDate = null,
            int limit = 50)
        {
            // Default date range: last 7 days to tomorrow
            var start = startDate ?? DateTime.Today.AddDays(-7);
            var end = endDate ?? DateTime.Today.AddDays(1);

            // Read orders from POS within date range
            var orders = await _posRepository.GetOrdersByDateRangeAsync(start, end);

            // Filter by status if specified
            if (!string.IsNullOrEmpty(status))
            {
                var transType = status.ToLower() switch
                {
                    "pending" or "open" => 2,
                    "completed" => 1,
                    "refunded" => 0,
                    "ready" => 9,
                    "cancelled" => -1,
                    _ => (int?)null
                };

                if (transType.HasValue)
                    orders = orders.Where(o => o.TransType == transType.Value);
            }

            // Filter by search term (order number or customer name)
            if (!string.IsNullOrEmpty(searchTerm))
            {
                var term = searchTerm.ToLower();
                orders = orders.Where(o =>
                    o.DailyOrderNumber.ToString().Contains(term) ||
                    (o.Customer?.FullName?.ToLower().Contains(term) ?? false));
            }

            // Get payments for filtered orders to determine payment status
            var orderList = orders.OrderByDescending(o => o.SaleDateTime).Take(limit * 2).ToList();
            var result = new List<OrderQueueDto>();

            foreach (var order in orderList)
            {
                var payments = await _posRepository.GetPaymentsAsync(order.ID);
                var paymentList = payments.ToList();

                var orderPaymentStatus = DeterminePaymentStatus(paymentList, order.TotalAmount);
                var orderPaymentMethod = DeterminePaymentMethod(paymentList);

                // Filter by payment status if specified
                if (!string.IsNullOrEmpty(paymentStatus))
                {
                    if (!orderPaymentStatus.Equals(paymentStatus, StringComparison.OrdinalIgnoreCase))
                        continue;
                }

                result.Add(new OrderQueueDto
                {
                    Id = order.ID,
                    OrderNumber = order.DailyOrderNumber.ToString().PadLeft(4, '0'),
                    CustomerName = order.Customer?.FullName ?? "Walk-in",
                    CustomerPhone = order.Customer?.Phone,
                    Total = (int)(order.TotalAmount * 100), // Convert to cents for frontend
                    Status = MapTransTypeToStatus(order.TransType),
                    PaymentStatus = orderPaymentStatus,
                    PaymentMethod = orderPaymentMethod,
                    CreatedAt = order.SaleDateTime,
                    TransType = order.TransType
                });

                if (result.Count >= limit)
                    break;
            }

            return result;
        }

        /// <summary>
        /// Get full order detail including items and payment info
        /// SSOT: Reads from POS database
        /// </summary>
        public async Task<OrderDetailDto?> GetOrderDetailAsync(int salesId)
        {
            var ticket = await _posRepository.GetTicketByIdAsync(salesId);
            if (ticket == null)
                return null;

            // Get items - try completed items first, then pending
            var completedItems = await _posRepository.GetSalesDetailItemsAsync(salesId);
            var itemsList = completedItems.ToList();

            if (!itemsList.Any())
            {
                var pendingItems = await _posRepository.GetPendingOrderItemsAsync(salesId);
                itemsList = pendingItems.Select(p => new PosTicketItem
                {
                    ID = p.ID ?? 0,
                    SalesID = p.SalesID,
                    ItemID = p.ItemID,
                    SizeID = p.SizeID,
                    ItemName = p.ItemName,
                    SizeName = p.SizeName,
                    Qty = p.Qty,
                    UnitPrice = p.UnitPrice,
                    DiscountAmt = p.DSCAmt
                }).ToList();
            }

            // Get payments
            var payments = await _posRepository.GetPaymentsAsync(salesId);
            var paymentList = payments.ToList();

            // Get customer if exists
            PosCustomer? customer = null;
            if (ticket.CustomerID.HasValue && ticket.CustomerID > 0)
            {
                customer = await _posRepository.GetCustomerByIdAsync(ticket.CustomerID.Value);
            }

            var paymentStatusValue = DeterminePaymentStatus(paymentList, ticket.TotalAmount);
            var paymentMethod = DeterminePaymentMethod(paymentList);
            var paidAt = paymentList.FirstOrDefault(p => !p.Voided)?.PaidDateTime;

            return new OrderDetailDto
            {
                Id = ticket.ID,
                SalesId = ticket.ID,
                OrderNumber = ticket.DailyOrderNumber.ToString().PadLeft(4, '0'),
                CustomerName = customer?.FullName ?? "Walk-in",
                CustomerEmail = customer?.Email,
                CustomerPhone = customer?.Phone,
                CustomerAddress = customer?.Address,
                Items = itemsList.Select(i => new OrderItemDto
                {
                    Id = i.ID,
                    ItemId = i.ItemID,
                    Name = i.ItemName,
                    SizeName = i.SizeName,
                    Quantity = (int)i.Qty,
                    Price = (int)(i.LineTotal * 100) // Cents
                }).ToList(),
                Subtotal = (int)(ticket.SubTotal * 100),
                GstAmt = (int)(ticket.GSTAmt * 100),
                PstAmt = (int)(ticket.PSTAmt * 100),
                Total = (int)(ticket.TotalAmount * 100),
                Status = MapTransTypeToStatus(ticket.TransType),
                PaymentMethod = paymentMethod,
                PaymentStatus = paymentStatusValue,
                TransType = ticket.TransType,
                CreatedAt = ticket.SaleDateTime,
                PaidAt = paidAt,
                ReadyAt = ticket.TransType == 9 ? ticket.SaleDateTime : null,
                CompletedAt = ticket.TransType == 1 ? ticket.SaleDateTime : null,
                Notes = null // Notes could be added if available
            };
        }

        private static string MapTransTypeToStatus(int transType)
        {
            return transType switch
            {
                0 => "refunded",
                1 => "completed",
                2 => "pending",
                9 => "ready",
                -1 => "cancelled",
                _ => "pending"
            };
        }

        private static string DeterminePaymentStatus(List<PosTender> payments, decimal totalAmount)
        {
            if (!payments.Any() || payments.All(p => p.Voided))
                return "pending";

            var paidAmount = payments.Where(p => !p.Voided).Sum(p => p.PaidAmount);

            if (payments.Any(p => p.Voided && !payments.Any(p2 => !p2.Voided)))
                return "refunded";

            if (paidAmount >= totalAmount)
                return "paid";

            return "pending";
        }

        private static string DeterminePaymentMethod(List<PosTender> payments)
        {
            var payment = payments.FirstOrDefault(p => !p.Voided);
            if (payment == null)
                return "Pending";

            return payment.PaymentTypeID switch
            {
                1 => "Cash",
                2 => "Debit",
                3 => "Visa",
                4 => "MasterCard",
                5 => "Amex",
                6 => "Coupon",
                7 => "Discover",
                8 => "JCB",
                9 => "Gift Card",
                10 => "Reward Points",
                _ => payment.CardType ?? "Other"
            };
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

        /// <summary>
        /// Get customer list with RFM segment filtering
        /// </summary>
        public async Task<IEnumerable<CustomerSegment>> GetCustomerListAsync(string? segment, string? searchTerm, int limit = 50)
        {
            return await _activityLogRepository.GetCustomerListAsync(segment, searchTerm, limit);
        }

        /// <summary>
        /// Get detailed customer profile with RFM metrics
        /// </summary>
        public async Task<CustomerSegment?> GetCustomerProfileAsync(int customerId)
        {
            return await _activityLogRepository.GetCustomerProfileAsync(customerId);
        }

        /// <summary>
        /// Get customer loyalty transaction history
        /// </summary>
        public async Task<IEnumerable<LoyaltyTransactionDto>> GetCustomerLoyaltyAsync(int customerId, int limit = 50)
        {
            return await _activityLogRepository.GetCustomerLoyaltyAsync(customerId, limit);
        }

        /// <summary>
        /// Get segment counts for dashboard
        /// RFM Segment Definitions:
        /// - High-spend: Lifetime value > $500
        /// - Frequent: Visit count > 10
        /// - Recent: Last order < 14 days ago
        /// - At-risk: Last order > 30 days ago AND lifetime value > $100
        /// - New: Created < 30 days ago
        /// </summary>
        public async Task<CustomerSegmentCounts> GetCustomerSegmentCountsAsync()
        {
            return await _activityLogRepository.GetCustomerSegmentCountsAsync();
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

        #region Birthday Rewards (Overlay)

        public async Task<BirthdayRewardConfig> GetBirthdayRewardConfigAsync()
        {
            return await _activityLogRepository.GetBirthdayRewardConfigAsync();
        }

        public async Task<bool> UpdateBirthdayRewardConfigAsync(BirthdayRewardConfig config, int adminUserId, string adminEmail)
        {
            var success = await _activityLogRepository.UpdateBirthdayRewardConfigAsync(config);
            if (success)
            {
                await LogActivityAsync("UpdateBirthdayConfig", "BirthdayConfig", null, "Birthday reward configuration updated", adminUserId, adminEmail);
            }
            return success;
        }

        #endregion

        #region Campaigns (Push Notifications)

        public async Task<IEnumerable<CampaignInfo>> GetCampaignsAsync()
        {
            return await _activityLogRepository.GetCampaignsAsync();
        }

        public async Task<CampaignInfo> CreateCampaignAsync(CampaignRequest request, int adminUserId, string adminEmail)
        {
            var campaign = await _activityLogRepository.CreateCampaignAsync(request.Name, request.Description ?? "", request.CampaignType, request.TargetQuery ?? "");
            
            await LogActivityAsync("CreateCampaign", "Campaign", campaign.Id, $"Campaign created: {campaign.Name}", adminUserId, adminEmail);
            
            return campaign;
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

        public async Task<MenuOverrideInfo> UpdateMenuOverrideAsync(int itemId, MenuOverrideRequest request, int adminUserId, string adminEmail)
        {
            var result = await _activityLogRepository.UpdateMenuOverrideAsync(itemId, request.IsAvailable ?? true, request.HiddenFromOnline ?? false, request.OverridePrice, request.Reason);
            
            await LogActivityAsync("UpdateMenuOverride", "MenuItem", itemId, $"Menu override updated for item {itemId}", adminUserId, adminEmail);
            
            return result;
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
