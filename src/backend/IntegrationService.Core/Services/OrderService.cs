using IntegrationService.Core.Domain.Entities;
using IntegrationService.Core.Interfaces;
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

    public OrderService(
        IOrderRepository orderRepo,
        IMenuRepository menuRepo,
        IPaymentService paymentService,
        IMiscRepository miscRepo,
        ILoyaltyService loyaltyService,
        INotificationService notificationService)
    {
        _orderRepo = orderRepo;
        _menuRepo = menuRepo;
        _paymentService = paymentService;
        _miscRepo = miscRepo;
        _loyaltyService = loyaltyService;
        _notificationService = notificationService;
    }

    public async Task<OrderModels.OrderResult> PlaceOrderAsync(OrderModels.OrderRequest request)
    {
        var result = new OrderModels.OrderResult();
        var taxRates = await _miscRepo.GetTaxRatesAsync();

        decimal subTotal = 0;
        decimal gstTotal = 0;
        decimal pstTotal = 0;
        decimal pst2Total = 0;

        var ticketItems = new List<PosTicketItem>();

        // Calculate line items and taxes
        foreach (var itemRequest in request.Items)
        {
            var menuItem = await _menuRepo.GetItemByIdAsync(itemRequest.ItemId);
            if (menuItem == null)
            {
                return new OrderModels.OrderResult { Success = false, ErrorMessage = $"Item {itemRequest.ItemId} not found" };
            }

            var size = menuItem.AvailableSizes.FirstOrDefault(s => s.SizeID == itemRequest.SizeId);
            if (size == null)
            {
                return new OrderModels.OrderResult { Success = false, ErrorMessage = $"Size {itemRequest.SizeId} not found for item {itemRequest.ItemId}" };
            }

            decimal lineTotal = size.UnitPrice * itemRequest.Quantity;
            subTotal += lineTotal;

            // Calculate taxes per item based on item tax flags
            if (menuItem.ApplyGST && taxRates.TryGetValue("GST", out var gstRate))
            {
                gstTotal += lineTotal * gstRate;
            }
            if (menuItem.ApplyPST && taxRates.TryGetValue("PST", out var pstRate))
            {
                pstTotal += lineTotal * pstRate;
            }
            if (menuItem.ApplyPST2 && taxRates.TryGetValue("PST2", out var pst2Rate))
            {
                pst2Total += lineTotal * pst2Rate;
            }

            ticketItems.Add(new PosTicketItem
            {
                ItemID = itemRequest.ItemId,
                SizeID = itemRequest.SizeId,
                ItemName = menuItem.IName,
                SizeName = size.SizeName,
                Quantity = itemRequest.Quantity,
                UnitPrice = size.UnitPrice,
                ApplyGST = menuItem.ApplyGST,
                ApplyPST = menuItem.ApplyPST,
                ApplyPST2 = menuItem.ApplyPST2,
                KitchenB = menuItem.KitchenB,
                KitchenF = menuItem.KitchenF,
                KitchenE = menuItem.KitchenE
            });
        }

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
        decimal amountToPay = totalAmount + request.TipAmount;

        // Process payment
        if (!string.IsNullOrEmpty(request.PaymentToken))
        {
            var (success, authCode, error) = await _paymentService.ProcessPaymentAsync(amountToPay, request.PaymentToken);
            if (!success)
            {
                return new OrderModels.OrderResult { Success = false, ErrorMessage = error ?? "Payment failed" };
            }

            result.Payments.Add(new OrderModels.PaymentInfo
            {
                PaidAmount = amountToPay,
                TipAmount = request.TipAmount,
                AuthorizationNo = authCode,
                PaymentType = PaymentType.Visa
            });
        }

        // Create ticket
        var ticket = new PosTicket
        {
            SaleDateTime = DateTime.UtcNow,
            TransType = 1, // Sale
            DailyOrderNumber = await _orderRepo.GetNextDailyOrderNumberAsync(),
            SubTotal = subTotal,
            DSCAmt = discountAmount,
            GSTAmt = gstTotal,
            PSTAmt = pstTotal,
            PST2Amt = pst2Total,
            CustomerID = request.CustomerId,
            TakeOutOrder = request.TakeOut,
            TableID = request.TableId
        };

        using var transaction = await _orderRepo.BeginTransactionAsync();
        try
        {
            var salesId = await _orderRepo.InsertTicketAsync(ticket, transaction);
            ticket.ID = salesId;

            foreach (var item in ticketItems)
            {
                item.SalesID = salesId;
                await _orderRepo.InsertTicketItemAsync(item, transaction);
            }

            foreach (var payment in result.Payments)
            {
                await _orderRepo.InsertPaymentAsync(new PosTender
                {
                    SalesID = salesId,
                    PaymentTypeID = (byte)payment.PaymentType,
                    PaidAmount = payment.PaidAmount,
                    TipAmount = payment.TipAmount,
                    AuthorizationNo = payment.AuthorizationNo,
                    CreatedDate = DateTime.UtcNow
                }, transaction);
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
