using IntegrationService.Core.Entities;
using IntegrationService.Core.Interfaces;
using IntegrationService.Infrastructure.Data;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System;
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

            // Get orders ready for release (ScheduledDateTime <= NOW and status=pending)
            var ordersToRelease = await scheduledOrderRepo.GetOrdersReadyForReleaseAsync();

            if (!ordersToRelease.Any())
            {
                return;
            }

            _logger.LogInformation("Found {Count} scheduled orders ready for release", ordersToRelease.Count());

            foreach (var order in ordersToRelease)
            {
                if (stoppingToken.IsCancellationRequested) break;

                try
                {
                    await ReleaseOrderToPosAsync(order, scheduledOrderRepo, posRepository);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to release scheduled order {OrderId}", order.Id);
                    await scheduledOrderRepo.MarkAsFailedAsync(order.Id, ex.Message);
                }
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
