using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading.Tasks;
using IntegrationService.Core.Domain.Entities;
using IntegrationService.Core.Interfaces;
using IntegrationService.Core.Models;
using Microsoft.Extensions.Logging;

namespace IntegrationService.Core.Services
{
    /// <summary>
    /// Service for creating orders in the INI POS system.
    ///
    /// ORDER LIFECYCLE (per IMIDUS_Project_Analysis.md):
    /// 1. Create tblSales with TransType=2 (Open)
    /// 2. Insert items into tblPendingOrders (active items in kitchen)
    /// 3. Process payment → Insert tblPayment
    /// 4. Complete order → Update TransType=1, move items to tblSalesDetail
    /// </summary>
    public class OrderProcessingService : IOrderProcessingService
    {
        private readonly IPosRepository _posRepo;
        private readonly IPaymentService _paymentService;
        private readonly INotificationService _notificationService;
        private readonly ILogger<OrderProcessingService> _logger;

        public OrderProcessingService(
            IPosRepository posRepository,
            IPaymentService paymentService,
            INotificationService notificationService,
            ILogger<OrderProcessingService> logger)
        {
            _posRepo = posRepository ?? throw new ArgumentNullException(nameof(posRepository));
            _paymentService = paymentService ?? throw new ArgumentNullException(nameof(paymentService));
            _notificationService = notificationService ?? throw new ArgumentNullException(nameof(notificationService));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        /// <summary>
        /// Create a new order in the POS system.
        /// This creates an OPEN order (TransType=2) with items in tblPendingOrders.
        /// Call CompleteOrderAsync after payment to finalize.
        /// </summary>
        public async Task<Domain.Entities.OrderResult> CreateOrderAsync(CreateOrderRequest request, string idempotencyKey)
        {
            _logger.LogInformation("Creating order with idempotency key: {IdempotencyKey}", idempotencyKey);

            if (request == null || !request.Items.Any())
            {
                return new Domain.Entities.OrderResult
                {
                    Success = false,
                    ErrorMessage = "Order must contain at least one item"
                };
            }

            if (request.Items.Any(i => i.SizeId <= 0))
            {
                return new Domain.Entities.OrderResult
                {
                    Success = false,
                    ErrorMessage = "All items must have a valid SizeID"
                };
            }

            using var transaction = await _posRepo.BeginTransactionAsync();

            try
            {
                // 1. Validate inventory for all items
                await ValidateInventoryAsync(request.Items);

                // 2. Get tax rates from POS configuration
                var taxRates = await _posRepo.GetTaxRatesAsync();

                // 3. Get menu items for tax flags and kitchen routing
                var menuItems = (await _posRepo.GetActiveMenuItemsAsync()).ToList();

                // 4. Calculate order totals with per-item tax flags
                var orderTotals = await CalculateOrderTotalsAsync(request.Items, taxRates, menuItems);

                // 5. Get next daily order number
                var dailyOrderNumber = await _posRepo.GetNextDailyOrderNumberAsync();

                // 6. Create sale record with TransType=2 (OPEN ORDER)
                var sale = new PosTicket
                {
                    SaleDateTime = DateTime.Now,
                    TransType = (int)TransactionType.OpenOrder,  // 2 = Open
                    DailyOrderNumber = dailyOrderNumber,
                    SubTotal = orderTotals.SubTotal,
                    DSCAmt = 0,
                    AlcoholDSCAmt = 0,
                    GSTAmt = orderTotals.GSTAmt,
                    PSTAmt = orderTotals.PSTAmt,
                    PST2Amt = orderTotals.PST2Amt,
                    GSTRate = taxRates.GST,
                    PSTRate = taxRates.PST,
                    PST2Rate = taxRates.PST2,
                    CustomerID = request.CustomerID ?? 1,
                    CashierID = 999,  // Online cashier ID per project constants
                    TableID = 201,  // Online/takeout orders use TableID 201
                    StationID = 2,  // DESKTOP-DEMO (online orders)
                    Guests = 1,
                    TakeOutOrder = request.IsTakeout,
                    DeliveryChargeAmt = request.DeliveryCharge,
                    OnlineOrderCompanyID = request.OnlineOrderCompanyID,
                    Locked = false,
                    PaymentCount = 0
                };

                var salesId = await _posRepo.CreateOpenOrderAsync(sale, transaction);

                _logger.LogInformation("Created open order {SalesId} with order number {OrderNumber}",
                    salesId, dailyOrderNumber);

                // 7. Insert items into tblPendingOrders (NOT tblSalesDetail!)
                await InsertPendingOrderItemsAsync(salesId, request.Items, menuItems, transaction);

                // 8. Decrease stock quantities
                await DecreaseInventoryAsync(request.Items, transaction);

                // 9. Process payment if auth code provided
                if (!string.IsNullOrEmpty(request.PaymentAuthCode))
                {
                    await RecordPaymentAsync(salesId, orderTotals.TotalAmount, request, transaction);

                    // 10. Complete the order (move items to tblSalesDetail, update TransType)
                    await CompleteOrderInternalAsync(salesId, transaction);
                }

                // 11. Link to online order if applicable
                if (request.OnlineOrderCompanyID.HasValue && !string.IsNullOrEmpty(request.OnlineOrderNumber))
                {
                    await _posRepo.InsertOnlineSalesLinkAsync(new SalesOfOnlineOrder
                    {
                        SalesID = salesId,
                        OnlineOrderCompanyID = request.OnlineOrderCompanyID.Value,
                        OnlineOrderNumber = request.OnlineOrderNumber,
                        OnlineOrderCustomerName = request.CustomerName,
                        DineInOrder = false,
                        ReservedTipAmt = request.TipAmount,
                        DeliveryChargeAmt = request.DeliveryCharge
                    }, transaction);
                }

                transaction.Commit();

                _logger.LogInformation("Order {SalesId} created successfully", salesId);

                return new Domain.Entities.OrderResult
                {
                    Success = true,
                    SalesID = salesId,
                    DailyOrderNumber = dailyOrderNumber,
                    TicketNumber = dailyOrderNumber.ToString(),
                    TotalAmount = orderTotals.TotalAmount
                };
            }
            catch (InsufficientStockException ex)
            {
                transaction.Rollback();
                _logger.LogWarning(ex, "Order creation failed due to insufficient stock");

                return new Domain.Entities.OrderResult
                {
                    Success = false,
                    ErrorMessage = ex.Message
                };
            }
            catch (Exception ex)
            {
                transaction.Rollback();
                _logger.LogError(ex, "Order creation failed");

                return new Domain.Entities.OrderResult
                {
                    Success = false,
                    ErrorMessage = "Failed to create order. Please try again."
                };
            }
        }

        /// <summary>
        /// Process payment with Authorize.net, post to POS database, and complete order.
        /// Implements atomic transaction with automatic rollback and void on failure.
        /// </summary>
        public async Task<Models.OrderCompletionResult> ProcessPaymentAndCompleteOrderAsync(
            int salesId,
            Models.PaymentRequest paymentRequest,
            IDbTransaction? outerTransaction = null)
        {
            _logger.LogInformation(
                "Starting payment processing for order {SalesId}, amount: ${Amount}",
                salesId, paymentRequest.Amount);

            // Start transaction if not provided
            IDbTransaction? transaction = outerTransaction;
            bool shouldManageTransaction = outerTransaction == null;

            if (shouldManageTransaction)
            {
                transaction = await _posRepo.BeginTransactionAsync();
            }

            try
            {
                // Calculate points discount before charging (100 points = $1)
                decimal pointsDiscount = 0m;
                PaymentRequest requestToCharge = paymentRequest;

                if (paymentRequest.PointsToRedeem > 0)
                {
                    pointsDiscount = paymentRequest.PointsToRedeem / 100.0m;
                    _logger.LogInformation(
                        "Applying points redemption for order {SalesId}: {Points} points = ${Discount} discount",
                        salesId, paymentRequest.PointsToRedeem, pointsDiscount);

                    // Apply discount to charge amount
                    decimal finalAmount = paymentRequest.Amount - pointsDiscount;
                    if (finalAmount < 0) finalAmount = 0;

                    // Create adjusted request with discounted amount
                    requestToCharge = new PaymentRequest
                    {
                        Token = paymentRequest.Token,
                        Amount = finalAmount,
                        SalesId = paymentRequest.SalesId,
                        CustomerId = paymentRequest.CustomerId,
                        PointsToRedeem = paymentRequest.PointsToRedeem,
                        DailyOrderNumber = paymentRequest.DailyOrderNumber
                    };
                }

                // Step 1: Charge card via Authorize.net (with discount applied if points redeemed)
                var paymentResult = await _paymentService.ChargeCardAsync(requestToCharge);

                if (!paymentResult.Success)
                {
                    _logger.LogWarning(
                        "Payment declined for order {SalesId}: {ErrorMessage}",
                        salesId, paymentResult.ErrorMessage);

                    if (shouldManageTransaction)
                    {
                        transaction?.Rollback();
                    }

                    return new Models.OrderCompletionResult
                    {
                        Success = false,
                        ErrorMessage = paymentResult.ErrorMessage ?? "Payment declined"
                    };
                }

                _logger.LogInformation(
                    "Payment approved for order {SalesId}: TransactionId={TransactionId}",
                    salesId, paymentResult.TransactionId);

                // Step 2-5: Post payment to POS and complete order
                try
                {
                    // Create PosTender from payment result
                    var tender = new PosTender
                    {
                        SalesID = salesId,
                        PaymentTypeID = 0,  // Will be auto-mapped from CardType
                        PaidAmount = paymentRequest.Amount,
                        TipAmount = 0,  // Tip handled separately if needed
                        AuthorizationNo = paymentResult.TransactionId,
                        CardType = paymentResult.CardType,
                        Last4Digits = paymentResult.Last4Digits,
                        SequenceNo = 1,
                        StationName = "ONLINE",
                        Voided = false
                    };

                    // Step 2: Insert payment record with encrypted token
                    await _posRepo.InsertPaymentAsync(tender, transaction);

                    // Step 3: Update sale payment totals
                    await _posRepo.UpdateSalePaymentTotalsAsync(salesId, tender, transaction);

                    // Update sale totals with points discount if applicable
                    if (pointsDiscount > 0)
                    {
                        var ticket = await _posRepo.GetTicketByIdAsync(salesId);
                        if (ticket != null)
                        {
                            await _posRepo.UpdateSaleTotalsAsync(
                                salesId,
                                ticket.SubTotal,
                                ticket.GSTAmt,
                                ticket.PSTAmt,
                                ticket.PST2Amt,
                                pointsDiscount,  // DSCAmt reflects points redemption
                                transaction
                            );
                        }
                    }

                    // Step 4: Complete order (TransType 2->1, items to tblSalesDetail)
                    await _posRepo.CompleteOrderAsync(salesId, transaction);

                    // Step 5: Record loyalty points (NEW)
                    if (paymentRequest.CustomerId.HasValue)
                    {
                        // Calculate points earned (1 point per $1 spent, floor to integer)
                        int pointsEarned = (int)Math.Floor(paymentRequest.Amount);
                        int pointsRedeemed = paymentRequest.PointsToRedeem;

                        bool pointsRecorded = await _posRepo.RecordPointsTransactionAsync(
                            salesId,
                            paymentRequest.CustomerId.Value,
                            pointsRedeemed,
                            pointsEarned,
                            transaction
                        );

                        // Graceful failure: Log warning if points fail, but don't fail order
                        if (!pointsRecorded)
                        {
                            _logger.LogWarning(
                                "Loyalty points recording failed for order {SalesId}, customer {CustomerId}. Order completed without points.",
                                salesId,
                                paymentRequest.CustomerId.Value
                            );
                        }
                        else
                        {
                            _logger.LogInformation(
                                "Loyalty points recorded for order {SalesId}: earned {PointsEarned}, redeemed {PointsRedeemed}",
                                salesId, pointsEarned, pointsRedeemed
                            );
                        }
                    }

                    // Step 6: Commit transaction if we're managing it
                    if (shouldManageTransaction)
                    {
                        transaction?.Commit();
                    }

                    _logger.LogInformation(
                        "Order {SalesId} completed successfully with payment {TransactionId}",
                        salesId, paymentResult.TransactionId);

                    // Step 7: Send order confirmation push notification
                    if (paymentRequest.CustomerId.HasValue)
                    {
                        try
                        {
                            await _notificationService.SendNotificationAsync(
                                paymentRequest.CustomerId.Value,
                                "Thank you! Order received",
                                $"Order #{paymentRequest.DailyOrderNumber} received",
                                new Dictionary<string, string>
                                {
                                    { "type", "order_confirmed" },
                                    { "orderId", salesId.ToString() },
                                    { "screen", "OrderTracking" }
                                }
                            );

                            _logger.LogInformation(
                                "Order confirmation notification sent for order {SalesId}, customer {CustomerId}",
                                salesId, paymentRequest.CustomerId.Value);
                        }
                        catch (Exception notifEx)
                        {
                            _logger.LogWarning(notifEx,
                                "Failed to send order confirmation notification for order {SalesId}. Order completed successfully.",
                                salesId);
                            // Don't fail order completion if notification fails
                        }
                    }

                    return new Models.OrderCompletionResult
                    {
                        Success = true,
                        TransactionId = paymentResult.TransactionId,
                        TicketId = salesId,
                        DailyOrderNumber = paymentRequest.DailyOrderNumber
                    };
                }
                catch (Exception dbEx)
                {
                    // Payment succeeded but DB posting failed - CRITICAL: void the charge
                    _logger.LogError(dbEx,
                        "Payment posted to Authorize.net but DB write failed for order {SalesId}, voiding transaction {TransactionId}",
                        salesId, paymentResult.TransactionId);

                    // Rollback database transaction
                    if (shouldManageTransaction)
                    {
                        transaction?.Rollback();
                    }

                    // Attempt to void the Authorize.net charge
                    try
                    {
                        var voidSuccess = await _paymentService.VoidTransactionAsync(paymentResult.TransactionId);

                        if (voidSuccess)
                        {
                            _logger.LogInformation(
                                "Successfully voided Authorize.net transaction {TransactionId} after DB failure",
                                paymentResult.TransactionId);
                        }
                        else
                        {
                            _logger.LogCritical(
                                "Failed to void Authorize.net transaction {TransactionId} - MANUAL REFUND REQUIRED for order {SalesId}",
                                paymentResult.TransactionId, salesId);
                        }
                    }
                    catch (Exception voidEx)
                    {
                        _logger.LogCritical(voidEx,
                            "Exception while voiding Authorize.net transaction {TransactionId} - MANUAL REFUND REQUIRED for order {SalesId}",
                            paymentResult.TransactionId, salesId);
                    }

                    return new Models.OrderCompletionResult
                    {
                        Success = false,
                        ErrorMessage = "Payment processing failed, charge voided. Please try again."
                    };
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error during payment processing for order {SalesId}", salesId);

                if (shouldManageTransaction)
                {
                    transaction?.Rollback();
                }

                return new OrderCompletionResult
                {
                    Success = false,
                    ErrorMessage = "Payment processing failed. Please try again."
                };
            }
            finally
            {
                if (shouldManageTransaction)
                {
                    transaction?.Dispose();
                }
            }
        }

        /// <summary>
        /// Complete an open order: move items from tblPendingOrders to tblSalesDetail
        /// and update TransType from 2 (Open) to 1 (Completed)
        /// </summary>
        public async Task<bool> CompleteOrderAsync(int salesId)
        {
            using var transaction = await _posRepo.BeginTransactionAsync();

            try
            {
                await CompleteOrderInternalAsync(salesId, transaction);
                transaction.Commit();
                return true;
            }
            catch (Exception ex)
            {
                transaction.Rollback();
                _logger.LogError(ex, "Failed to complete order {SalesId}", salesId);
                return false;
            }
        }

        /// <summary>
        /// Cancel an open order: delete pending items and mark as refund
        /// </summary>
        public async Task<bool> CancelOrderAsync(int salesId)
        {
            using var transaction = await _posRepo.BeginTransactionAsync();

            try
            {
                // Delete pending order items
                await _posRepo.DeletePendingOrderItemsAsync(salesId, transaction);

                // Update TransType to Refund (0)
                await _posRepo.UpdateSaleTransTypeAsync(salesId, (int)TransactionType.Refund, transaction);

                transaction.Commit();

                _logger.LogInformation("Order {SalesId} cancelled", salesId);
                return true;
            }
            catch (Exception ex)
            {
                transaction.Rollback();
                _logger.LogError(ex, "Failed to cancel order {SalesId}", salesId);
                return false;
            }
        }

        /// <summary>
        /// Get order details including items
        /// </summary>
        public async Task<PosTicket?> GetOrderAsync(int salesId)
        {
            var ticket = await _posRepo.GetTicketByIdAsync(salesId);
            if (ticket == null) return null;

            // Load items based on order status
            if (ticket.IsOpen)
            {
                // Open orders have items in tblPendingOrders
                ticket.PendingItems = (await _posRepo.GetPendingOrderItemsAsync(salesId)).ToList();
            }
            else
            {
                // Completed orders have items in tblSalesDetail
                ticket.Items = (await _posRepo.GetSalesDetailItemsAsync(salesId)).ToList();
            }

            // Load payments
            ticket.Payments = (await _posRepo.GetPaymentsAsync(salesId)).ToList();

            return ticket;
        }

        // =========================================================================
        // PRIVATE METHODS
        // =========================================================================

        private async Task CompleteOrderInternalAsync(int salesId, IDbTransaction transaction)
        {
            // Move items from tblPendingOrders to tblSalesDetail
            await _posRepo.MovePendingOrdersToSalesDetailAsync(salesId, transaction);

            // Update TransType from Open (2) to Completed (1)
            await _posRepo.UpdateSaleTransTypeAsync(salesId, (int)TransactionType.CompletedSale, transaction);

            _logger.LogInformation("Order {SalesId} completed - items moved to sales detail", salesId);
        }

        private async Task ValidateInventoryAsync(List<Domain.Entities.OrderItemRequest> items)
        {
            foreach (var item in items)
            {
                var stock = await _posRepo.GetItemStockAsync(item.MenuItemId, item.SizeId);

                if (stock.HasValue && stock.Value < item.Quantity)
                {
                    var itemSizes = await _posRepo.GetItemSizesAsync(item.MenuItemId);
                    var size = itemSizes.FirstOrDefault(s => s.SizeID == item.SizeId);
                    var itemName = size?.Size?.SizeName ?? $"Item {item.MenuItemId}";

                    throw new InsufficientStockException(item.MenuItemId, item.SizeId, itemName);
                }
            }
        }

        private async Task<OrderTotals> CalculateOrderTotalsAsync(
            List<Domain.Entities.OrderItemRequest> items,
            TaxRates taxRates,
            List<Domain.Entities.MenuItem> menuItems)
        {
            decimal subtotal = 0;
            decimal gstAmt = 0;
            decimal pstAmt = 0;
            decimal pst2Amt = 0;

            foreach (var item in items)
            {
                var lineTotal = item.UnitPrice * item.Quantity;
                subtotal += lineTotal;

                // Get menu item for tax flags
                var menuItem = menuItems.FirstOrDefault(m => m.ItemID == item.MenuItemId);
                if (menuItem != null)
                {
                    if (menuItem.ApplyGST) gstAmt += lineTotal * taxRates.GST;
                    if (menuItem.ApplyPST) pstAmt += lineTotal * taxRates.PST;
                    if (menuItem.ApplyPST2) pst2Amt += lineTotal * taxRates.PST2;
                }
                else
                {
                    // Default: apply GST and PST
                    gstAmt += lineTotal * taxRates.GST;
                    pstAmt += lineTotal * taxRates.PST;
                }
            }

            return new OrderTotals
            {
                SubTotal = subtotal,
                GSTAmt = Math.Round(gstAmt, 2),
                PSTAmt = Math.Round(pstAmt, 2),
                PST2Amt = Math.Round(pst2Amt, 2),
                TotalAmount = Math.Round(subtotal + gstAmt + pstAmt + pst2Amt, 2)
            };
        }

        private async Task InsertPendingOrderItemsAsync(
            int salesId,
            List<Domain.Entities.OrderItemRequest> items,
            List<Domain.Entities.MenuItem> menuItems,
            IDbTransaction transaction)
        {
            foreach (var item in items)
            {
                var menuItem = menuItems.FirstOrDefault(m => m.ItemID == item.MenuItemId);
                var itemSizes = await _posRepo.GetItemSizesAsync(item.MenuItemId);
                var sizeData = itemSizes.FirstOrDefault(s => s.SizeID == item.SizeId);

                var pendingItem = new PendingOrderItem
                {
                    SalesID = salesId,
                    ItemID = item.MenuItemId,
                    SizeID = item.SizeId,
                    Qty = item.Quantity,
                    UnitPrice = item.UnitPrice,
                    ItemName = menuItem?.IName ?? $"Item {item.MenuItemId}",
                    ItemName2 = menuItem?.IName2,
                    SizeName = sizeData?.Size?.SizeName ?? "Regular",
                    Tastes = item.Tastes,
                    SideDishes = item.SideDishes,

                    // Tax flags from menu item
                    ApplyGST = menuItem?.ApplyGST ?? true,
                    ApplyPST = menuItem?.ApplyPST ?? true,
                    ApplyPST2 = menuItem?.ApplyPST2 ?? false,

                    // Kitchen routing from menu item
                    KitchenB = menuItem?.KitchenB ?? false,
                    KitchenF = menuItem?.KitchenF ?? false,
                    KitchenE = menuItem?.KitchenE ?? false,
                    Bar = menuItem?.Bar ?? false,

                    // Defaults for online orders
                    DSCAmt = 0,
                    DSCAmtEmployee = 0,
                    DSCAmtType1 = 0,
                    DSCAmtType2 = 0,
                    DayHourDiscountRate = 0,
                    PricePerWeightUnit = 0,
                    ApplyNoDSC = sizeData?.ApplyNoDSC ?? false,
                    PersonIndex = 1,
                    SeparateBillPrint = false,
                    OpenItem = menuItem?.OpenItem ?? false,
                    ExtraChargeItem = false,
                    Status = true
                };

                await _posRepo.InsertPendingOrderItemAsync(pendingItem, transaction);
            }
        }

        private async Task DecreaseInventoryAsync(List<Domain.Entities.OrderItemRequest> items, IDbTransaction transaction)
        {
            foreach (var item in items)
            {
                var success = await _posRepo.DecreaseStockAsync(
                    item.MenuItemId,
                    item.SizeId,
                    item.Quantity,
                    transaction
                );

                if (!success)
                {
                    _logger.LogDebug(
                        "Stock not decreased for item {ItemId} size {SizeId} (may be unlimited)",
                        item.MenuItemId, item.SizeId
                    );
                }
            }
        }

        private async Task RecordPaymentAsync(
            int salesId,
            decimal totalAmount,
            CreateOrderRequest request,
            IDbTransaction transaction)
        {
            var payment = new PosTender
            {
                SalesID = salesId,
                PaymentTypeID = request.PaymentTypeID,
                PaidAmount = totalAmount,
                TipAmount = request.TipAmount,
                Voided = false,
                AuthorizationNo = request.PaymentAuthCode,
                BatchNo = request.PaymentBatchNo,
                SequenceNo = 1,
                StationName = "ONLINE"
            };

            await _posRepo.InsertPaymentAsync(payment, transaction);

            // Update sale payment totals
            await _posRepo.UpdateSalePaymentTotalsAsync(salesId, payment, transaction);

            _logger.LogInformation(
                "Payment recorded: ${Amount} (Type: {PaymentType}, Auth: {AuthNo})",
                totalAmount, request.PaymentTypeID, request.PaymentAuthCode
            );
        }
    }

    // =========================================================================
    // INTERNAL HELPER CLASSES
    // =========================================================================

    internal class OrderTotals
    {
        public decimal SubTotal { get; set; }
        public decimal GSTAmt { get; set; }
        public decimal PSTAmt { get; set; }
        public decimal PST2Amt { get; set; }
        public decimal TotalAmount { get; set; }
    }

    // =========================================================================
    // EXCEPTIONS
    // =========================================================================

    public class InsufficientStockException : Exception
    {
        public int ItemId { get; }
        public int SizeId { get; }

        public InsufficientStockException(int itemId, int sizeId, string itemName)
            : base($"Insufficient stock for {itemName} (ItemID: {itemId}, SizeID: {sizeId})")
        {
            ItemId = itemId;
            SizeId = sizeId;
        }
    }
}
