using System.Data;
using IntegrationService.Core.Interfaces;
using IntegrationService.Core.Services;
using OrderModels = IntegrationService.Core.Models;
using Moq;
using Xunit;

namespace IntegrationService.Tests;

public class OrderServiceTests
{
    private readonly Mock<IOrderRepository> _orderRepoMock = new();
    private readonly Mock<IMenuRepository> _menuRepoMock = new();
    private readonly Mock<IPaymentService> _paymentServiceMock = new();
    private readonly Mock<IMiscRepository> _miscRepoMock = new();
    private readonly Mock<ILoyaltyService> _loyaltyServiceMock = new();
    private readonly Mock<INotificationService> _notificationRepoMock = new();
    private readonly OrderService _orderService;

    public OrderServiceTests()
    {
        // Setup common mocks for order repository
        var mockTransaction = new Mock<IDbTransaction>();
        _orderRepoMock.Setup(r => r.BeginTransactionAsync()).ReturnsAsync(mockTransaction.Object);
        _orderRepoMock.Setup(r => r.GetNextDailyOrderNumberAsync()).ReturnsAsync(1);
        _orderRepoMock.Setup(r => r.InsertTicketAsync(It.IsAny<IntegrationService.Core.Domain.Entities.PosTicket>(), It.IsAny<IDbTransaction>())).ReturnsAsync(100);

        _orderService = new OrderService(
            _orderRepoMock.Object,
            _menuRepoMock.Object,
            _paymentServiceMock.Object,
            _miscRepoMock.Object,
            _loyaltyServiceMock.Object,
            _notificationRepoMock.Object);
    }

    [Fact]
    public async Task PlaceOrder_ShouldCalculateTaxesCorrectly()
    {
        // Arrange
        var taxRates = new Dictionary<string, decimal>
        {
            { "GST", 0.05m },
            { "PST", 0.07m },
            { "PST2", 0.03m }
        };
        _miscRepoMock.Setup(r => r.GetTaxRatesAsync()).ReturnsAsync(taxRates);

        var item = new OrderModels.MenuItem
        {
            ItemID = 1,
            IName = "Test Coffee",
            ApplyGST = true,
            ApplyPST = true,
            ApplyPST2 = true,
            AvailableSizes = new List<OrderModels.AvailableSize>
            {
                new OrderModels.AvailableSize { SizeID = 1, SizeName = "Large", UnitPrice = 10.0m }
            },
            KitchenB = true
        };
        _menuRepoMock.Setup(r => r.GetItemByIdAsync(1)).ReturnsAsync(item);
        
        _paymentServiceMock.Setup(p => p.ProcessPaymentAsync(It.IsAny<decimal>(), It.IsAny<string>()))
            .ReturnsAsync((true, "AUTH123", (string?)null));

        var request = new OrderModels.OrderRequest
        {
            Items = new List<OrderModels.OrderItemRequest>
            {
                new OrderModels.OrderItemRequest { ItemId = 1, SizeId = 1, Quantity = 1 }
            },
            TipAmount = 2.0m,
            PaymentToken = "tok_123"
        };

        // Act
        var result = await _orderService.PlaceOrderAsync(request);

        // Assert
        Assert.Equal(10.0m, result.SubTotal);
        Assert.Equal(0.5m, result.GSTAmt); // 5% of 10
        Assert.Equal(0.7m, result.PSTAmt); // 7% of 10
        Assert.Equal(0.3m, result.PST2Amt); // 3% of 10
        Assert.Equal(11.5m, result.TotalAmount); // 10 + 0.5 + 0.7 + 0.3 = 11.5
        Assert.Single(result.Payments);
        Assert.Equal(13.5m, result.Payments[0].PaidAmount); // 11.5 + 2.0 tip
    }

    [Fact]
    public async Task PlaceOrder_ShouldApplyLoyaltyDiscount()
    {
        // Arrange
        var taxRates = new Dictionary<string, decimal> { { "GST", 0.05m }, { "PST", 0m }, { "PST2", 0m } };
        _miscRepoMock.Setup(r => r.GetTaxRatesAsync()).ReturnsAsync(taxRates);

        var item = new OrderModels.MenuItem
        {
            ItemID = 1, IName = "Coffee", ApplyGST = true,
            AvailableSizes = new List<OrderModels.AvailableSize> { new() { SizeID = 1, UnitPrice = 10.0m } }
        };
        _menuRepoMock.Setup(r => r.GetItemByIdAsync(1)).ReturnsAsync(item);
        _paymentServiceMock.Setup(p => p.ProcessPaymentAsync(It.IsAny<decimal>(), It.IsAny<string>())).ReturnsAsync((true, "AUTH124", (string?)null));

        var request = new OrderModels.OrderRequest
        {
            CustomerId = 1,
            Items = new List<OrderModels.OrderItemRequest> { new() { ItemId = 1, SizeId = 1, Quantity = 1 } },
            PointsToRedeem = 500 // $5.00
        };

        // Act
        var result = await _orderService.PlaceOrderAsync(request);

        // Assert
        Assert.Equal(5.0m, result.DSCAmt); // $5.00 discount
        Assert.Equal(5.5m, result.TotalAmount); // 10 + 0.5 - 5 = 5.5
        _loyaltyServiceMock.Verify(l => l.RedeemPointsAsync(1, 500), Times.Once);
    }
}
