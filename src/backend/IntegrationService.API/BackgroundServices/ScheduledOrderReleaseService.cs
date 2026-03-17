using IntegrationService.Core.Entities;
using IntegrationService.Core.Interfaces;
using IntegrationService.Infrastructure.Data;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace IntegrationService.API.BackgroundServices
{
    /// <summary>
    /// Background service that monitors scheduled orders and releases them to POS at the right time.
    /// SSOT Compliant: Orders stored in IntegrationService DB until release, then written to INI_Restaurant.
    /// Releases orders 90 minutes BEFORE pickup time to allow for kitchen prep.
    /// Retries failed releases up to 3 times with exponential backoff (1, 2, 4 minutes).
    /// Sends FCM notification to customer on final failure.
    /// </summary>
    public class ScheduledOrderReleaseService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<ScheduledOrderReleaseService> _logger;
        private readonly TimeSpan _checkInterval = TimeSpan.FromMinutes(1);

        public ScheduledOrderReleaseService(
            IServiceProvider serviceProvider,
            ILogger<ScheduledOrderReleaseService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Scheduled Order Release Service started. Checking every {Interval} minutes.", _checkInterval.TotalMinutes);

            // Wait a bit for the app to fully start
            await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await ProcessScheduledOrdersAsync(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error in scheduled order release service");
                }

                await Task.Delay(_checkInterval, stoppingToken);
            }
        }

        private async Task ProcessScheduledOrdersAsync(CancellationToken stoppingToken)
        {
            using var scope = _serviceProvider.CreateScope();
            var scheduledOrderRepo = scope.ServiceProvider.GetRequiredService<IScheduledOrderRepository>();
            var posRepository = scope.ServiceProvider.GetRequiredService<IPosRepository>();
            var notificationService = scope.ServiceProvider.GetService<INotificationService>();

            // Get orders ready for release
            // Release 90 minutes BEFORE pickup time (ScheduledDateTime - 90min <= NOW)
            // Query respects exponential backoff for retries
            var ordersToRelease = await scheduledOrderRepo.GetOrdersReadyForReleaseAsync();

            if (!ordersToRelease.Any())
            {
                return;
            }

            _logger.LogInformation("Found {Count} scheduled orders ready for release (90 min before pickup)", ordersToRelease.Count());

            foreach (var order in ordersToRelease)
            {
                if (stoppingToken.IsCancellationRequested) break;

                try
                {
                    await ReleaseOrderToPosAsync(order, scheduledOrderRepo, posRepository);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to release scheduled order {OrderId} (attempt {Attempt}/3)", order.Id, order.ReleaseRetryCount + 1);

                    // Mark as failed (increments ReleaseRetryCount)
                    await scheduledOrderRepo.MarkAsFailedAsync(order.Id, ex.Message);

                    // Check if this was the final retry (3 attempts total: 0, 1, 2)
                    if (order.ReleaseRetryCount >= 2)
                    {
                        await NotifyReleaseFailureAsync(order, notificationService, ex.Message);
                    }
                }
            }
        }

        /// <summary>
        /// Send FCM notification to customer when order release fails after all retries
        /// </summary>
        private async Task NotifyReleaseFailureAsync(ScheduledOrder order, INotificationService? notificationService, string errorMessage)
        {
            // Log critical for admin dashboard visibility
            _logger.LogCritical(
                "SCHEDULED ORDER RELEASE FAILED after {RetryCount} attempts - OrderId: {OrderId}, Customer: {CustomerId}, PickupTime: {PickupTime}, Error: {Error}",
                order.ReleaseRetryCount + 1, order.Id, order.PosCustomerId, order.ScheduledDateTime, errorMessage);

            // Send FCM notification to customer
            if (notificationService == null)
            {
                _logger.LogWarning("Notification service not available - cannot notify customer of failed order {OrderId}", order.Id);
                return;
            }

            try
            {
                await notificationService.SendNotificationAsync(
                    order.PosCustomerId,
                    "Order Issue - Action Required",
                    $"We're having trouble processing your scheduled order for {order.ScheduledDateTime:MMM d 'at' h:mm tt}. Please contact us or cancel for a refund.",
                    new Dictionary<string, string>
                    {
                        ["type"] = "scheduled_order_failed",
                        ["orderId"] = order.Id.ToString(),
                        ["confirmationCode"] = $"SCH-{order.Id:D6}"
                    }
                );

                _logger.LogInformation("FCM notification sent for failed order {OrderId} to customer {CustomerId}", order.Id, order.PosCustomerId);
            }
            catch (Exception ex)
            {
                // Log but don't fail - notification is best-effort
                _logger.LogError(ex, "Failed to send FCM notification for failed order {OrderId}", order.Id);
            }
        }

        private async Task ReleaseOrderToPosAsync(
            ScheduledOrder order,
            IScheduledOrderRepository scheduledOrderRepo,
            IPosRepository posRepository)
        {
            _logger.LogInformation("Releasing scheduled order {OrderId} to POS database", order.Id);

            // Deserialize items from JSON
            var items = JsonSerializer.Deserialize<ScheduledOrderItem[]>(order.ItemsJson);
            if (items == null || items.Length == 0)
            {
                throw new InvalidOperationException("No items found in scheduled order");
            }

            using var transaction = await posRepository.BeginTransactionAsync();

            try
            {
                // 1. Get next daily order number from POS
                var dailyOrderNumber = await posRepository.GetNextDailyOrderNumberAsync();

                // 2. Create open order in POS (tblSales with TransType=2)
                var ticket = new Core.Domain.Entities.PosTicket
                {
                    DailyOrderNumber = dailyOrderNumber,
                    CustomerID = order.PosCustomerId,
                    TableID = 0,
                    StationID = 2, // DESKTOP-DEMO (online orders)
                    CashierID = 999, // Online cashier ID per project constants
                    TransType = 2, // Open ticket
                    SaleDateTime = DateTime.Now,
                    SubTotal = order.Subtotal,
                    GSTAmt = order.TaxAmount,
                    PSTAmt = 0,
                    TakeOutOrder = true // Online orders are takeout
                };

                var salesId = await posRepository.CreateOpenOrderAsync(
                    ticket, 
                    transaction, 
                    $"{order.CustomerFirstName} {order.CustomerLastName}".Trim()
                );

                // 3. Insert items into tblPendingOrders (active in kitchen)
                foreach (var item in items)
                {
                    var pendingItem = new Core.Domain.Entities.PendingOrderItem
                    {
                        SalesID = salesId,
                        ItemID = item.MenuItemId,
                        ItemName = item.ItemName,
                        SizeID = item.SizeId,
                        SizeName = item.SizeName,
                        Qty = item.Quantity,
                        UnitPrice = item.UnitPrice,
                        ApplyGST = true,
                        ApplyPST = false,
                        KitchenB = false,
                        KitchenF = false,
                        PersonIndex = 1,
                        Bar = false
                    };

                    await posRepository.InsertPendingOrderItemAsync(pendingItem, transaction);
                }

                // 4. Record payment in tblPayment (if payment info exists)
                if (!string.IsNullOrEmpty(order.PaymentAuthorizationNo))
                {
                    var payment = new Core.Domain.Entities.PosTender
                    {
                        SalesID = salesId,
                        PaymentTypeID = (byte)order.PaymentTypeId,
                        PaidAmount = order.TotalAmount,
                        TipAmount = order.TipAmount,
                        AuthorizationNo = order.PaymentAuthorizationNo,
                        BatchNo = order.PaymentBatchNo ?? "1",
                        PaidDateTime = DateTime.Now
                    };

                    await posRepository.InsertPaymentAsync(payment, transaction);
                }

                // 5. Complete the order (updates TransType to 1)
                await posRepository.CompleteOrderAsync(salesId, transaction);

                // 6. Commit transaction
                transaction.Commit();

                // 7. Mark scheduled order as released in IntegrationService DB
                var orderNumber = $"ON-{dailyOrderNumber:D4}";
                await scheduledOrderRepo.MarkAsReleasedAsync(order.Id, salesId, orderNumber);

                _logger.LogInformation(
                    "Successfully released scheduled order {ScheduledOrderId} to POS as SalesID {SalesId}, OrderNumber {OrderNumber}",
                    order.Id, salesId, orderNumber);
            }
            catch (Exception ex)
            {
                transaction.Rollback();
                _logger.LogError(ex, "Transaction rolled back for scheduled order {OrderId}", order.Id);
                throw;
            }
        }
    }
}
