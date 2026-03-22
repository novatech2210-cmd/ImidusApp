using System;
using System.Text.Json;
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
    /// Background service that injects scheduled orders into POS at the appropriate time.
    /// Polls every minute for orders ready for injection (TargetDateTime - PrepTimeMinutes <= now)
    /// </summary>
    public class ScheduledOrderService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<ScheduledOrderService> _logger;
        private readonly TimeSpan _pollInterval = TimeSpan.FromMinutes(1);

        public ScheduledOrderService(
            IServiceProvider serviceProvider,
            ILogger<ScheduledOrderService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Scheduled Order Service started");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await ProcessPendingOrdersAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error processing scheduled orders");
                }

                await Task.Delay(_pollInterval, stoppingToken);
            }

            _logger.LogInformation("Scheduled Order Service stopped");
        }

        private async Task ProcessPendingOrdersAsync()
        {
            using var scope = _serviceProvider.CreateScope();
            var scheduledOrderRepo = scope.ServiceProvider.GetRequiredService<IScheduledOrderRepository>();
            var posRepo = scope.ServiceProvider.GetRequiredService<IPosRepository>();
            var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();

            var now = DateTime.Now;
            var pendingOrders = await scheduledOrderRepo.GetPendingOrdersForInjectionAsync(now);

            foreach (var order in pendingOrders)
            {
                try
                {
                    _logger.LogInformation("Injecting scheduled order {Id} for customer {CustomerId}, target time: {Target}",
                        order.Id, order.CustomerId, order.TargetDateTime);

                    // Deserialize the order data
                    var orderData = JsonSerializer.Deserialize<ScheduledOrderData>(order.OrderJson);
                    if (orderData == null)
                    {
                        await scheduledOrderRepo.UpdateStatusAsync(order.Id, "failed", errorMessage: "Invalid order JSON");
                        continue;
                    }

                    // Begin transaction for POS injection
                    using var transaction = await posRepo.BeginTransactionAsync();

                    try
                    {
                        // Get next order number
                        var orderNumber = await posRepo.GetNextDailyOrderNumberAsync();

                        // Create the ticket in POS
                        var ticket = new PosTicket
                        {
                            SaleDateTime = DateTime.Now,
                            TransType = 2, // Open order
                            SubTotal = order.SubTotal,
                            GSTAmt = order.TaxAmount,
                            CustomerID = order.CustomerId,
                            CashierID = 999, // Online order cashier
                            StationID = 2,
                            DailyOrderNumber = orderNumber,
                            TakeOutOrder = true,
                            OnlineOrderCompanyID = 1 // TOAST app
                        };

                        var salesId = await posRepo.CreateOpenOrderAsync(ticket, transaction);

                        // Insert order items
                        foreach (var item in orderData.Items)
                        {
                            var menuItem = await posRepo.GetMenuItemByIdAsync(item.ItemId);
                            var pendingItem = new PendingOrderItem
                            {
                                SalesID = salesId,
                                ItemID = item.ItemId,
                                SizeID = item.SizeId,
                                Qty = item.Quantity,
                                UnitPrice = item.UnitPrice,
                                ItemName = menuItem?.IName ?? item.ItemName,
                                SizeName = item.SizeName,
                                ApplyGST = menuItem?.ApplyGST ?? true,
                                ApplyPST = menuItem?.ApplyPST ?? false,
                                KitchenB = menuItem?.KitchenB ?? false,
                                KitchenF = menuItem?.KitchenF ?? false,
                                Bar = menuItem?.Bar ?? false,
                                PersonIndex = 1
                            };

                            await posRepo.InsertPendingOrderItemAsync(pendingItem, transaction);
                        }

                        // Insert payment if present
                        if (!string.IsNullOrEmpty(order.PaymentToken))
                        {
                            var payment = new PosTender
                            {
                                SalesID = salesId,
                                PaidAmount = order.TotalAmount,
                                CardType = order.CardType,
                                AuthorizationNo = order.PaymentToken,
                                PaymentTypeID = GetPaymentTypeId(order.CardType)
                            };

                            await posRepo.InsertPaymentAsync(payment, transaction);
                            await posRepo.UpdateSalePaymentTotalsAsync(salesId, payment, transaction);
                        }

                        transaction.Commit();

                        // Update scheduled order status
                        await scheduledOrderRepo.UpdateStatusAsync(order.Id, "injected", salesId);

                        // Send notification to customer
                        await notificationService.SendNotificationAsync(
                            order.CustomerId,
                            "IMIDUS | Your Order is Being Prepared",
                            $"Your scheduled order for {order.TargetDateTime:h:mm tt} is now being prepared!",
                            new System.Collections.Generic.Dictionary<string, string>
                            {
                                ["screen"] = "OrderTracking",
                                ["orderId"] = salesId.ToString()
                            });

                        _logger.LogInformation("Successfully injected scheduled order {Id} as SalesId {SalesId}",
                            order.Id, salesId);
                    }
                    catch (Exception ex)
                    {
                        transaction.Rollback();
                        throw;
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to inject scheduled order {Id}", order.Id);
                    await scheduledOrderRepo.UpdateStatusAsync(order.Id, "failed", errorMessage: ex.Message);
                }
            }
        }

        private byte GetPaymentTypeId(string? cardType)
        {
            return cardType?.ToUpperInvariant() switch
            {
                "VISA" => 3,
                "MASTERCARD" => 4,
                "AMEX" => 5,
                "DISCOVER" => 6,
                _ => 3 // Default to Visa
            };
        }
    }

    /// <summary>
    /// Scheduled order data structure (stored as JSON)
    /// </summary>
    public class ScheduledOrderData
    {
        public List<ScheduledOrderItem> Items { get; set; } = new();
        public string? SpecialInstructions { get; set; }
        public bool IsTakeout { get; set; } = true;
    }

    public class ScheduledOrderItem
    {
        public int ItemId { get; set; }
        public int SizeId { get; set; }
        public string? ItemName { get; set; }
        public string? SizeName { get; set; }
        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }
    }
}
