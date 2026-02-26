using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading.Tasks;
using IntegrationService.Core.Domain.Entities;
using IntegrationService.Core.Configuration;
using IntegrationService.Core.Interfaces;
using IntegrationService.Core.Services;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;
using Models = IntegrationService.Core.Models;

namespace IntegrationService.Tests.Services
{
    public class OrderServiceTests
    {
        private readonly Mock<IOrderRepository> _orderRepo;
        private readonly Mock<IMenuRepository> _menuRepo;
        private readonly Mock<IPaymentService> _paymentService;
        private readonly Mock<IMiscRepository> _miscRepo;
        private readonly Mock<ILoyaltyService> _loyaltyService;
        private readonly Mock<INotificationService> _notificationService;
        private readonly Mock<IDbTransaction> _mockTransaction;
        private readonly OrderService _orderService;

        public OrderServiceTests()
        {
            _orderRepo = new Mock<IOrderRepository>();
            _menuRepo = new Mock<IMenuRepository>();
            _paymentService = new Mock<IPaymentService>();
            _miscRepo = new Mock<IMiscRepository>();
            _loyaltyService = new Mock<ILoyaltyService>();
            _notificationService = new Mock<INotificationService>();
            _mockTransaction = new Mock<IDbTransaction>();

            // Mock OnlineOrderSettings
            var mockSettings = new Mock<IOptions<OnlineOrderSettings>>();
            mockSettings.Setup(x => x.Value).Returns(new OnlineOrderSettings
            {
                OnlineCashierId = 999,
                OnlineStationId = 999,
                OnlineTableId = 0,
                OnlineCompanyId = 1,
                TestCashierId = 998
            });

            _orderService = new OrderService(
                _orderRepo.Object,
                _menuRepo.Object,
                _paymentService.Object,
                _miscRepo.Object,
                _loyaltyService.Object,
                _notificationService.Object,
                mockSettings.Object
            );

            // Default setup for transaction
            _orderRepo.Setup(x => x.BeginTransactionAsync())
                .ReturnsAsync(_mockTransaction.Object);
        }

        [Fact]
        public async Task PlaceOrderAsync_ValidRequest_CreatesOpenOrder()
        {
            // Arrange
            var taxRates = new Dictionary<string, decimal>
            {
                { "GST", 0.05m },
                { "PST", 0.07m },
                { "PST2", 0.00m }
            };

            var menuItem = new Models.MenuItem
            {
                ItemID = 1,
                IName = "Burger",
                OnlineItem = true,
                Status = true,
                ApplyGST = true,
                ApplyPST = true,
                ApplyPST2 = false,
                KitchenB = true,
                KitchenF = false,
                KitchenE = false,
                Bar = false,
                AvailableSizes = new List<Models.AvailableSize>
                {
                    new Models.AvailableSize
                    {
                        SizeID = 1,
                        SizeName = "Regular",
                        UnitPrice = 10.00m,
                        OnHandQty = 10,  // InStock is computed from OnHandQty
                        ApplyNoDSC = false
                    }
                }
            };

            var orderRequest = new Models.OrderRequest
            {
                CustomerId = 123,
                Items = new List<Models.OrderItemRequest>
                {
                    new Models.OrderItemRequest
                    {
                        ItemId = 1,
                        SizeId = 1,
                        Quantity = 2
                    }
                },
                TakeOut = true,
                TableId = 0,
                PointsToRedeem = 0
            };

            _miscRepo.Setup(x => x.GetTaxRatesAsync()).ReturnsAsync(taxRates);
            _menuRepo.Setup(x => x.GetItemByIdAsync(1)).ReturnsAsync(menuItem);
            _orderRepo.Setup(x => x.GetNextDailyOrderNumberAsync()).ReturnsAsync(42);
            _orderRepo.Setup(x => x.CreateOpenOrderAsync(It.IsAny<PosTicket>(), It.IsAny<IDbTransaction>()))
                .ReturnsAsync(100);
            _orderRepo.Setup(x => x.InsertPendingOrderItemAsync(It.IsAny<PendingOrderItem>(), It.IsAny<IDbTransaction>()))
                .Returns(Task.CompletedTask);
            _loyaltyService.Setup(x => x.UpdatePointsAfterSaleAsync(It.IsAny<int>(), It.IsAny<decimal>()))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _orderService.PlaceOrderAsync(orderRequest);

            // Assert
            Assert.True(result.Success);
            Assert.Equal(100, result.OrderId);
            Assert.Equal(42, result.DailyOrderNumber);
            Assert.Equal(20.00m, result.SubTotal); // 2 items * $10
            Assert.Equal(1.00m, result.GSTAmt);   // $20 * 0.05
            Assert.Equal(1.40m, result.PSTAmt);   // $20 * 0.07
            Assert.Equal(0.00m, result.PST2Amt);
            Assert.Equal(22.40m, result.TotalAmount); // 20 + 1 + 1.40
            Assert.Equal(Models.OrderState.AwaitingPayment, result.OrderState);

            // Verify CreateOpenOrderAsync called with TransType=2
            _orderRepo.Verify(x => x.CreateOpenOrderAsync(
                It.Is<PosTicket>(t => t.TransType == 2),
                It.IsAny<IDbTransaction>()),
                Times.Once);

            // Verify InsertPendingOrderItemAsync called once (1 order item request with Qty=2)
            _orderRepo.Verify(x => x.InsertPendingOrderItemAsync(
                It.Is<PendingOrderItem>(p => p.Qty == 2),
                It.IsAny<IDbTransaction>()),
                Times.Once);

            // Verify transaction committed
            _mockTransaction.Verify(x => x.Commit(), Times.Once);
        }

        [Fact]
        public async Task PlaceOrderAsync_ItemNotAvailableOnline_ReturnsError()
        {
            // Arrange
            var taxRates = new Dictionary<string, decimal>
            {
                { "GST", 0.05m },
                { "PST", 0.07m },
                { "PST2", 0.00m }
            };

            var menuItem = new Models.MenuItem
            {
                ItemID = 1,
                IName = "Special Item",
                OnlineItem = false, // NOT available online
                Status = true,
                AvailableSizes = new List<Models.AvailableSize>
                {
                    new Models.AvailableSize
                    {
                        SizeID = 1,
                        SizeName = "Regular",
                        UnitPrice = 10.00m,
                        OnHandQty = 10
                    }
                }
            };

            var orderRequest = new Models.OrderRequest
            {
                Items = new List<Models.OrderItemRequest>
                {
                    new Models.OrderItemRequest { ItemId = 1, SizeId = 1, Quantity = 1 }
                }
            };

            _miscRepo.Setup(x => x.GetTaxRatesAsync()).ReturnsAsync(taxRates);
            _menuRepo.Setup(x => x.GetItemByIdAsync(1)).ReturnsAsync(menuItem);

            // Act
            var result = await _orderService.PlaceOrderAsync(orderRequest);

            // Assert
            Assert.False(result.Success);
            Assert.Contains("not available for online ordering", result.ErrorMessage);

            // Verify CreateOpenOrderAsync NOT called (validation fails early)
            _orderRepo.Verify(x => x.CreateOpenOrderAsync(
                It.IsAny<PosTicket>(),
                It.IsAny<IDbTransaction>()),
                Times.Never);
        }

        [Fact]
        public async Task PlaceOrderAsync_TaxCalculation_RoundsCorrectly()
        {
            // Arrange - Test case where rounding matters
            // Item: $10.33 with 5% GST (0.5165 -> should round to 0.52)
            // and 7% PST (0.7231 -> should round to 0.72)
            var taxRates = new Dictionary<string, decimal>
            {
                { "GST", 0.05m },
                { "PST", 0.07m },
                { "PST2", 0.00m }
            };

            var menuItem = new Models.MenuItem
            {
                ItemID = 1,
                IName = "Test Item",
                OnlineItem = true,
                Status = true,
                ApplyGST = true,
                ApplyPST = true,
                ApplyPST2 = false,
                KitchenB = true,
                KitchenF = false,
                KitchenE = false,
                Bar = false,
                AvailableSizes = new List<Models.AvailableSize>
                {
                    new Models.AvailableSize
                    {
                        SizeID = 1,
                        SizeName = "Regular",
                        UnitPrice = 10.33m,
                        OnHandQty = 10,
                        ApplyNoDSC = false
                    }
                }
            };

            var orderRequest = new Models.OrderRequest
            {
                Items = new List<Models.OrderItemRequest>
                {
                    new Models.OrderItemRequest { ItemId = 1, SizeId = 1, Quantity = 1 }
                }
            };

            _miscRepo.Setup(x => x.GetTaxRatesAsync()).ReturnsAsync(taxRates);
            _menuRepo.Setup(x => x.GetItemByIdAsync(1)).ReturnsAsync(menuItem);
            _orderRepo.Setup(x => x.GetNextDailyOrderNumberAsync()).ReturnsAsync(1);
            _orderRepo.Setup(x => x.CreateOpenOrderAsync(It.IsAny<PosTicket>(), It.IsAny<IDbTransaction>()))
                .ReturnsAsync(1);

            // Act
            var result = await _orderService.PlaceOrderAsync(orderRequest);

            // Assert
            Assert.True(result.Success);
            Assert.Equal(10.33m, result.SubTotal);

            // GST: 10.33 * 0.05 = 0.5165 -> rounds to 0.52 (AwayFromZero)
            Assert.Equal(0.52m, result.GSTAmt);

            // PST: 10.33 * 0.07 = 0.7231 -> rounds to 0.72 (AwayFromZero)
            Assert.Equal(0.72m, result.PSTAmt);

            // Total: 10.33 + 0.52 + 0.72 = 11.57
            Assert.Equal(11.57m, result.TotalAmount);
        }

        [Fact]
        public async Task PlaceOrderAsync_OutOfStockSize_ReturnsError()
        {
            // Arrange
            var taxRates = new Dictionary<string, decimal>
            {
                { "GST", 0.05m },
                { "PST", 0.07m },
                { "PST2", 0.00m }
            };

            var menuItem = new Models.MenuItem
            {
                ItemID = 1,
                IName = "Pizza",
                OnlineItem = true,
                Status = true,
                AvailableSizes = new List<Models.AvailableSize>
                {
                    new Models.AvailableSize
                    {
                        SizeID = 1,
                        SizeName = "Large",
                        UnitPrice = 15.00m,
                        OnHandQty = 0 // OUT OF STOCK
                    }
                }
            };

            var orderRequest = new Models.OrderRequest
            {
                Items = new List<Models.OrderItemRequest>
                {
                    new Models.OrderItemRequest { ItemId = 1, SizeId = 1, Quantity = 1 }
                }
            };

            _miscRepo.Setup(x => x.GetTaxRatesAsync()).ReturnsAsync(taxRates);
            _menuRepo.Setup(x => x.GetItemByIdAsync(1)).ReturnsAsync(menuItem);

            // Act
            var result = await _orderService.PlaceOrderAsync(orderRequest);

            // Assert
            Assert.False(result.Success);
            Assert.Contains("out of stock", result.ErrorMessage);

            // Verify CreateOpenOrderAsync NOT called
            _orderRepo.Verify(x => x.CreateOpenOrderAsync(
                It.IsAny<PosTicket>(),
                It.IsAny<IDbTransaction>()),
                Times.Never);
        }
    }
}
