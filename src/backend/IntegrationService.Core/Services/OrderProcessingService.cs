using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading.Tasks;
using IntegrationService.Core.Domain.Entities;
using IntegrationService.Core.Interfaces;
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
        private readonly ILogger<OrderProcessingService> _logger;

        public OrderProcessingService(
            IPosRepository posRepository,
            ILogger<OrderProcessingService> logger)
        {
            _posRepo = posRepository ?? throw new ArgumentNullException(nameof(posRepository));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        /// <summary>
        /// Create a new order in the POS system.
        /// This creates an OPEN order (TransType=2) with items in tblPendingOrders.
        /// Call CompleteOrderAsync after payment to finalize.
        /// </summary>
        public async Task<OrderResult> CreateOrderAsync(CreateOrderRequest request, string idempotencyKey)
        {
            _logger.LogInformation("Creating order with idempotency key: {IdempotencyKey}", idempotencyKey);

            if (request == null || !request.Items.Any())
            {
                return new OrderResult
                {
                    Success = false,
                    ErrorMessage = "Order must contain at least one item"
                };
            }

            if (request.Items.Any(i => i.SizeId <= 0))
            {
                return new OrderResult
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
                    CashierID = 1,  // System user for online orders
                    TableID = null,
                    StationID = 1,
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

                return new OrderResult
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

                return new OrderResult
                {
                    Success = false,
                    ErrorMessage = ex.Message
                };
            }
            catch (Exception ex)
            {
                transaction.Rollback();
                _logger.LogError(ex, "Order creation failed");

                return new OrderResult
                {
                    Success = false,
                    ErrorMessage = "Failed to create order. Please try again."
                };
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

        private async Task ValidateInventoryAsync(List<OrderItemRequest> items)
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
            List<OrderItemRequest> items,
            TaxRates taxRates,
            List<MenuItem> menuItems)
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
            List<OrderItemRequest> items,
            List<MenuItem> menuItems,
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
                    ApplyNoDSC = sizeData?.ApplyNoDSC ?? false,
                    PersonIndex = 1,
                    SeparateBillPrint = false,
                    OpenItem = menuItem?.OpenItem ?? false,
                    ExtraChargeItem = false
                };

                await _posRepo.InsertPendingOrderItemAsync(pendingItem, transaction);
            }
        }

        private async Task DecreaseInventoryAsync(List<OrderItemRequest> items, IDbTransaction transaction)
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
