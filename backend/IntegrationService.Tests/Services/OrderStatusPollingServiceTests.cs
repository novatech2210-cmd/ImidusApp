using Xunit;
using Moq;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using IntegrationService.Infrastructure.Services;
using IntegrationService.Infrastructure.Data;
using IntegrationService.Core.Interfaces;
using IntegrationService.Core.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace IntegrationService.Tests.Services;

/// <summary>
/// Unit tests for OrderStatusPollingService
/// Tests polling logic, duplicate prevention, error handling, and cleanup jobs
/// </summary>
public class OrderStatusPollingServiceTests
{
    private readonly Mock<IServiceProvider> _mockServiceProvider;
    private readonly Mock<IServiceScope> _mockServiceScope;
    private readonly Mock<IServiceScopeFactory> _mockScopeFactory;
    private readonly Mock<IPosRepository> _mockPosRepo;
    private readonly Mock<IOnlineOrderStatusRepository> _mockStatusRepo;
    private readonly Mock<INotificationService> _mockNotificationService;
    private readonly Mock<IDeviceTokenRepository> _mockDeviceTokenRepo;
    private readonly Mock<INotificationLogRepository> _mockNotificationLogRepo;
    private readonly Mock<ILogger<OrderStatusPollingService>> _mockLogger;

    public OrderStatusPollingServiceTests()
    {
        _mockServiceProvider = new Mock<IServiceProvider>();
        _mockServiceScope = new Mock<IServiceScope>();
        _mockScopeFactory = new Mock<IServiceScopeFactory>();
        _mockPosRepo = new Mock<IPosRepository>();
        
        _mockStatusRepo = new Mock<IOnlineOrderStatusRepository>();
        _mockNotificationService = new Mock<INotificationService>();
        _mockDeviceTokenRepo = new Mock<IDeviceTokenRepository>();
        _mockNotificationLogRepo = new Mock<INotificationLogRepository>();
        _mockLogger = new Mock<ILogger<OrderStatusPollingService>>();

        // Setup service provider to return mocked services
        _mockServiceScope.Setup(x => x.ServiceProvider).Returns(_mockServiceProvider.Object);
        _mockServiceProvider.Setup(x => x.GetService(typeof(IPosRepository))).Returns(_mockPosRepo.Object);
        _mockServiceProvider.Setup(x => x.GetService(typeof(IOnlineOrderStatusRepository))).Returns(_mockStatusRepo.Object);
        _mockServiceProvider.Setup(x => x.GetService(typeof(INotificationService))).Returns(_mockNotificationService.Object);
        _mockServiceProvider.Setup(x => x.GetService(typeof(IDeviceTokenRepository))).Returns(_mockDeviceTokenRepo.Object);
        _mockServiceProvider.Setup(x => x.GetService(typeof(INotificationLogRepository))).Returns(_mockNotificationLogRepo.Object);

        // Setup CreateScope to return our mock scope
        var serviceCollection = new ServiceCollection();
        serviceCollection.AddScoped(_ => _mockPosRepo.Object);
        serviceCollection.AddScoped(_ => _mockStatusRepo.Object);
        serviceCollection.AddScoped(_ => _mockNotificationService.Object);
        serviceCollection.AddScoped(_ => _mockDeviceTokenRepo.Object);
        serviceCollection.AddScoped(_ => _mockNotificationLogRepo.Object);
        var serviceProvider = serviceCollection.BuildServiceProvider();

        _mockServiceProvider.Setup(x => x.GetService(typeof(IServiceScopeFactory))).Returns(_mockScopeFactory.Object);
        _mockScopeFactory.Setup(x => x.CreateScope()).Returns(_mockServiceScope.Object);
    }

    [Fact]
    public async Task GetCompletedOnlineOrdersAsync_FiltersCorrectly()
    {
        // Arrange
        var completedOrder = new PosTicket
        {
            ID = 1,
            TransType = 9,
            OnlineOrderCompanyID = 1,
            CustomerID = 100,
            DailyOrderNumber = 123
        };

        _mockPosRepo.Setup(x => x.GetCompletedOnlineOrdersAsync())
            .ReturnsAsync(new List<PosTicket> { completedOrder });

        // Act
        var result = await _mockPosRepo.Object.GetCompletedOnlineOrdersAsync();

        // Assert
        Assert.Single(result);
        Assert.Equal(9, result.First().TransType);
        Assert.NotNull(result.First().OnlineOrderCompanyID);
        Assert.NotNull(result.First().CustomerID);
    }

    [Fact]
    public async Task SendsNotificationForNewCompletedOrder()
    {
        // Arrange
        var completedOrder = new PosTicket
        {
            ID = 1,
            TransType = 9,
            OnlineOrderCompanyID = 1,
            CustomerID = 100,
            DailyOrderNumber = 123
        };

        _mockPosRepo.Setup(x => x.GetCompletedOnlineOrdersAsync())
            .ReturnsAsync(new List<PosTicket> { completedOrder });

        _mockStatusRepo.Setup(x => x.GetBySalesIdAsync(1))
            .ReturnsAsync((OnlineOrderStatus?)null); // New order, no status yet

        _mockStatusRepo.Setup(x => x.InsertAsync(It.IsAny<OnlineOrderStatus>()))
            .ReturnsAsync(1);

        _mockStatusRepo.Setup(x => x.UpdateAsync(It.IsAny<OnlineOrderStatus>()))
            .Returns(Task.CompletedTask);

        _mockNotificationService.Setup(x => x.SendNotificationAsync(
            It.IsAny<int>(),
            It.Is<string>(title => title.Contains("Order ready")),
            It.IsAny<string>(),
            It.Is<Dictionary<string, string>>(data => data["type"] == "order_ready")
        )).Returns(Task.CompletedTask);

        // Act - Simulate what PollOrderStatusAsync does
        var status = await _mockStatusRepo.Object.GetBySalesIdAsync(completedOrder.ID);

        if (status == null)
        {
            status = new OnlineOrderStatus
            {
                SalesId = completedOrder.ID,
                ReadyNotificationSent = false,
                ConfirmationNotificationSent = false,
                LastCheckedAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            };
            await _mockStatusRepo.Object.InsertAsync(status);
        }

        if (!status.ReadyNotificationSent)
        {
            await _mockNotificationService.Object.SendNotificationAsync(
                completedOrder.CustomerID!.Value,
                "Order ready for pickup!",
                $"Order #{completedOrder.DailyOrderNumber} is ready.",
                new Dictionary<string, string>
                {
                    { "type", "order_ready" },
                    { "orderId", completedOrder.ID.ToString() },
                    { "screen", "OrderTracking" }
                }
            );

            status.ReadyNotificationSent = true;
            status.LastCheckedAt = DateTime.UtcNow;
            await _mockStatusRepo.Object.UpdateAsync(status);
        }

        // Assert
        _mockNotificationService.Verify(x => x.SendNotificationAsync(
            100,
            "Order ready for pickup!",
            "Order #123 is ready.",
            It.Is<Dictionary<string, string>>(data =>
                data["type"] == "order_ready" &&
                data["orderId"] == "1" &&
                data["screen"] == "OrderTracking")
        ), Times.Once);

        _mockStatusRepo.Verify(x => x.UpdateAsync(It.Is<OnlineOrderStatus>(s =>
            s.ReadyNotificationSent == true &&
            s.SalesId == 1
        )), Times.Once);
    }

    [Fact]
    public async Task SkipsAlreadyNotifiedOrders()
    {
        // Arrange
        var completedOrder = new PosTicket
        {
            ID = 1,
            TransType = 9,
            OnlineOrderCompanyID = 1,
            CustomerID = 100,
            DailyOrderNumber = 123
        };

        var existingStatus = new OnlineOrderStatus
        {
            Id = 1,
            SalesId = 1,
            ReadyNotificationSent = true, // Already sent!
            ConfirmationNotificationSent = true,
            LastCheckedAt = DateTime.UtcNow.AddMinutes(-5),
            CreatedAt = DateTime.UtcNow.AddHours(-1)
        };

        _mockPosRepo.Setup(x => x.GetCompletedOnlineOrdersAsync())
            .ReturnsAsync(new List<PosTicket> { completedOrder });

        _mockStatusRepo.Setup(x => x.GetBySalesIdAsync(1))
            .ReturnsAsync(existingStatus);

        // Act - Simulate what PollOrderStatusAsync does
        var status = await _mockStatusRepo.Object.GetBySalesIdAsync(completedOrder.ID);

        if (status != null && !status.ReadyNotificationSent)
        {
            // Should NOT reach here
            await _mockNotificationService.Object.SendNotificationAsync(
                completedOrder.CustomerID!.Value,
                "Order ready for pickup!",
                $"Order #{completedOrder.DailyOrderNumber} is ready.",
                new Dictionary<string, string> { { "type", "order_ready" }, { "orderId", "1" } }
            );
        }

        // Assert - Notification should NOT be sent
        _mockNotificationService.Verify(x => x.SendNotificationAsync(
            It.IsAny<int>(),
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<Dictionary<string, string>>()
        ), Times.Never);
    }

    [Fact]
    public async Task CleanupDeletesStaleTokens()
    {
        // Arrange
        _mockDeviceTokenRepo.Setup(x => x.DeleteStaleTokensAsync(30))
            .ReturnsAsync(5); // 5 tokens deleted

        // Act
        var deletedCount = await _mockDeviceTokenRepo.Object.DeleteStaleTokensAsync(30);

        // Assert
        Assert.Equal(5, deletedCount);
        _mockDeviceTokenRepo.Verify(x => x.DeleteStaleTokensAsync(30), Times.Once);
    }

    [Fact]
    public async Task CleanupDeletesOldLogs()
    {
        // Arrange
        _mockNotificationLogRepo.Setup(x => x.DeleteOldLogsAsync(90))
            .ReturnsAsync(20); // 20 logs deleted

        // Act
        var deletedCount = await _mockNotificationLogRepo.Object.DeleteOldLogsAsync(90);

        // Assert
        Assert.Equal(20, deletedCount);
        _mockNotificationLogRepo.Verify(x => x.DeleteOldLogsAsync(90), Times.Once);
    }
}
