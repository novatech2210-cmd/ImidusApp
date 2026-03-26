using IntegrationService.Core.Domain.Entities;
using IntegrationService.Core.Interfaces;
using IntegrationService.Core.Configuration;
using Microsoft.Extensions.Options;
using OrderModels = IntegrationService.Core.Models;

namespace IntegrationService.Core.Services;

public class OrderService
{
    private readonly IOrderRepository _orderRepo;
    private readonly IMenuRepository _menuRepo;
    private readonly IPaymentService _paymentService;
    private readonly IMiscRepository _miscRepo;
    private readonly ILoyaltyService _loyaltyService;
    private readonly INotificationService _notificationService;
    private readonly OnlineOrderSettings _settings;

    public OrderService(
        IOrderRepository orderRepo,
        IMenuRepository menuRepo,
        IPaymentService paymentService,
        IMiscRepository miscRepo,
        ILoyaltyService loyaltyService,
        INotificationService notificationService,
        IOptions<OnlineOrderSettings> settings)
    {
        _orderRepo = orderRepo;
        _menuRepo = menuRepo;
        _paymentService = paymentService;
        _miscRepo = miscRepo;
        _loyaltyService = loyaltyService;
        _notificationService = notificationService;
        _settings = settings.Value;
    }

    public async Task<OrderModels.OrderResult> PlaceOrderAsync(OrderModels.OrderRequest request)
    {
        var result = new OrderModels.OrderResult();
        var taxRates = await _miscRepo.GetTaxRatesAsync();

        decimal subTotal = 0;
        decimal gstAccumulator = 0;
        decimal pstAccumulator = 0;
        decimal pst2Accumulator = 0;

        var pendingItems = new List<PendingOrderItem>();
        var unavailableItems = new List<string>();

        // Validate and calculate line items
        foreach (var itemRequest in request.Items)
        {
            var menuItem = await _menuRepo.GetItemByIdAsync(itemRequest.ItemId);
            if (menuItem == null)
            {
                unavailableItems.Add($"Item {itemRequest.ItemId} not found");
                continue;
            }

            // Validate item availability for online ordering
            if (!menuItem.OnlineItem)
            {
                unavailableItems.Add($"{menuItem.IName} is not available for online ordering");
                continue;
            }

            if (!menuItem.Status)
            {
                unavailableItems.Add($"{menuItem.IName} is currently unavailable");
                continue;
            }

            var size = menuItem.AvailableSizes.FirstOrDefault(s => s.SizeID == itemRequest.SizeId);
            if (size == null)
            {
                unavailableItems.Add($"Size {itemRequest.SizeId} not found for {menuItem.IName}");
                continue;
            }

            // Validate size availability
            if (!size.InStock)
            {
                unavailableItems.Add($"{menuItem.IName} ({size.SizeName}) is out of stock");
                continue;
            }

            decimal lineTotal = size.UnitPrice * itemRequest.Quantity;
            subTotal += lineTotal;

            // Accumulate unrounded tax amounts
            if (menuItem.ApplyGST && taxRates.TryGetValue("GST", out var gstRate))
            {
                gstAccumulator += lineTotal * gstRate;
            }
            if (menuItem.ApplyPST && taxRates.TryGetValue("PST", out var pstRate))
            {
                pstAccumulator += lineTotal * pstRate;
            }
            if (menuItem.ApplyPST2 && taxRates.TryGetValue("PST2", out var pst2Rate))
            {
                pst2Accumulator += lineTotal * pst2Rate;
            }

            pendingItems.Add(new PendingOrderItem
            {
                ItemID = itemRequest.ItemId,
                SizeID = itemRequest.SizeId,
                ItemName = menuItem.IName,
                ItemName2 = menuItem.IName2,
                SizeName = size.SizeName ?? string.Empty,
                Qty = itemRequest.Quantity,
                UnitPrice = size.UnitPrice,
                ApplyGST = menuItem.ApplyGST,
                ApplyPST = menuItem.ApplyPST,
                ApplyPST2 = menuItem.ApplyPST2,
                KitchenB = menuItem.KitchenB,
                KitchenF = menuItem.KitchenF,
                KitchenE = menuItem.KitchenE,
                Bar = menuItem.Bar,
                DSCAmt = 0,
                ApplyNoDSC = size.ApplyNoDSC,
                PersonIndex = 0,
                SeparateBillPrint = false,
                OpenItem = false,
                ExtraChargeItem = false,
                Tastes = itemRequest.SpecialInstructions
            });
        }

        // Reject entire order if any items unavailable (atomic validation)
        if (unavailableItems.Any())
        {
            return new OrderModels.OrderResult
            {
                Success = false,
                ErrorMessage = $"Order cannot be completed. Unavailable items: {string.Join(", ", unavailableItems)}"
            };
        }

        // Round tax amounts once at the end using half-up rounding
        decimal gstTotal = Math.Round(gstAccumulator, 2, MidpointRounding.AwayFromZero);
        decimal pstTotal = Math.Round(pstAccumulator, 2, MidpointRounding.AwayFromZero);
        decimal pst2Total = Math.Round(pst2Accumulator, 2, MidpointRounding.AwayFromZero);

        // Apply loyalty discount
        decimal discountAmount = 0;
        if (request.PointsToRedeem > 0 && request.CustomerId.HasValue)
        {
            // 100 points = $1.00
            discountAmount = request.PointsToRedeem / 100m;
            await _loyaltyService.RedeemPointsAsync(request.CustomerId.Value, request.PointsToRedeem);
        }

        // Calculate total
        decimal totalAmount = subTotal + gstTotal + pstTotal + pst2Total - discountAmount;

        // Create open order ticket (TransType=2)
        var ticket = new PosTicket
        {
            SaleDateTime = DateTime.UtcNow,
            TransType = 2, // Open Order (awaiting payment)
            DailyOrderNumber = await _orderRepo.GetNextDailyOrderNumberAsync(),
            SubTotal = subTotal,
            DSCAmt = discountAmount,
            GSTAmt = gstTotal,
            PSTAmt = pstTotal,
            PST2Amt = pst2Total,
            CustomerID = request.CustomerId,
            TakeOutOrder = request.TakeOut,
            TableID = _settings.OnlineTableId,
            CashierID = _settings.OnlineCashierId,
            Guests = 1
        };

        using var transaction = await _orderRepo.BeginTransactionAsync();
        try
        {
            // Create open order in tblSales with TransType=2
            var salesId = await _orderRepo.CreateOpenOrderAsync(ticket, transaction);
            ticket.ID = salesId;

            // Insert items into tblPendingOrders (not tblSalesDetail)
            foreach (var item in pendingItems)
            {
                item.SalesID = salesId;
                await _orderRepo.InsertPendingOrderItemAsync(item, transaction);
            }

            transaction.Commit();

            result.OrderId = salesId;
            result.DailyOrderNumber = ticket.DailyOrderNumber;
            result.SubTotal = subTotal;
            result.DSCAmt = discountAmount;
            result.GSTAmt = gstTotal;
            result.PSTAmt = pstTotal;
            result.PST2Amt = pst2Total;
            result.TotalAmount = totalAmount;
            result.OrderState = OrderModels.OrderState.AwaitingPayment;
            result.Success = true;

            // Update loyalty points for the sale (if customer is registered)
            if (request.CustomerId.HasValue)
            {
                await _loyaltyService.UpdatePointsAfterSaleAsync(request.CustomerId.Value, subTotal);
            }

            return result;
        }
        catch (Exception)
        {
            transaction.Rollback();
            throw;
        }
    }
}
