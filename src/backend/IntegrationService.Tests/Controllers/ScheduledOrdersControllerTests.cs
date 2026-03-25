using Xunit;
using Moq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using IntegrationService.API.Controllers;
using IntegrationService.API.DTOs;
using IntegrationService.Core.Entities;
using IntegrationService.Core.Interfaces;
using IntegrationService.Infrastructure.Data;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace IntegrationService.Tests.Controllers;

public class ScheduledOrdersControllerTests
{
    private readonly Mock<IScheduledOrderRepository> _mockScheduledOrderRepo;
    private readonly Mock<IPosRepository> _mockPosRepository;
    private readonly Mock<IIdempotencyRepository> _mockIdempotencyRepo;
    private readonly Mock<IPaymentService> _mockPaymentService;
    private readonly Mock<ILogger<ScheduledOrdersController>> _mockLogger;
    private readonly ScheduledOrdersController _controller;

    public ScheduledOrdersControllerTests()
    {
        _mockScheduledOrderRepo = new Mock<IScheduledOrderRepository>();
        _mockPosRepository = new Mock<IPosRepository>();
        _mockIdempotencyRepo = new Mock<IIdempotencyRepository>();
        _mockPaymentService = new Mock<IPaymentService>();
        _mockLogger = new Mock<ILogger<ScheduledOrdersController>>();

        _controller = new ScheduledOrdersController(
            _mockScheduledOrderRepo.Object,
            _mockPosRepository.Object,
            _mockIdempotencyRepo.Object,
            _mockPaymentService.Object,
            _mockLogger.Object);

        // Set up user claims for customer ownership validation
        var claims = new[] { new Claim(ClaimTypes.NameIdentifier, "100") };
        var identity = new ClaimsIdentity(claims, "Test");
        var user = new ClaimsPrincipal(identity);
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = user }
        };
    }

    #region Cancel Endpoint Tests

    [Fact]
    public async Task Cancel_OrderNotFound_ReturnsNotFound()
    {
        // Arrange
        _mockScheduledOrderRepo
            .Setup(r => r.GetByIdAsync(999))
            .ReturnsAsync((ScheduledOrder?)null);

        // Act
        var result = await _controller.Cancel(999, new CancelRequest { Reason = "Test" });

        // Assert
        Assert.IsType<NotFoundObjectResult>(result);
    }

    [Fact]
    public async Task Cancel_WrongCustomer_ReturnsForbid()
    {
        // Arrange
        var order = CreateTestOrder(status: "pending", pickupHoursFromNow: 5);
        order.PosCustomerId = 200; // Different from user claim (100)

        _mockScheduledOrderRepo
            .Setup(r => r.GetByIdAsync(1))
            .ReturnsAsync(order);

        // Act
        var result = await _controller.Cancel(1, new CancelRequest { Reason = "Test" });

        // Assert
        Assert.IsType<ForbidResult>(result);
    }

    [Fact]
    public async Task Cancel_StatusNotPending_ReturnsBadRequest()
    {
        // Arrange
        var order = CreateTestOrder(status: "released", pickupHoursFromNow: 5);

        _mockScheduledOrderRepo
            .Setup(r => r.GetByIdAsync(1))
            .ReturnsAsync(order);

        // Act
        var result = await _controller.Cancel(1, new CancelRequest { Reason = "Test" });

        // Assert
        var badRequest = Assert.IsType<BadRequestObjectResult>(result);
        Assert.Contains("status", badRequest.Value?.ToString() ?? "", StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Cancel_WithinTwoHoursOfPickup_ReturnsBadRequest()
    {
        // Arrange - Order is only 1 hour from now (within 2-hour cutoff)
        var order = CreateTestOrder(status: "pending", pickupHoursFromNow: 1);

        _mockScheduledOrderRepo
            .Setup(r => r.GetByIdAsync(1))
            .ReturnsAsync(order);

        // Act
        var result = await _controller.Cancel(1, new CancelRequest { Reason = "Too late" });

        // Assert
        var badRequest = Assert.IsType<BadRequestObjectResult>(result);
        Assert.Contains("2 hours", badRequest.Value?.ToString() ?? "", StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Cancel_VoidSucceeds_ReturnsOkWithRefundedTrue()
    {
        // Arrange
        var order = CreateTestOrder(status: "pending", pickupHoursFromNow: 5);
        order.PaymentAuthorizationNo = "TXN123";
        order.TotalAmount = 25.00m;

        _mockScheduledOrderRepo
            .Setup(r => r.GetByIdAsync(1))
            .ReturnsAsync(order);

        _mockPaymentService
            .Setup(p => p.VoidTransactionAsync("TXN123"))
            .ReturnsAsync(true);

        _mockScheduledOrderRepo
            .Setup(r => r.CancelAsync(1, It.IsAny<string>()))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.Cancel(1, new CancelRequest { Reason = "Changed my mind" });

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var responseJson = System.Text.Json.JsonSerializer.Serialize(okResult.Value);
        Assert.Contains("\"refunded\":true", responseJson);
        Assert.Contains("success", responseJson, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Cancel_VoidFailsRefundSucceeds_ReturnsOkWithRefundedTrue()
    {
        // Arrange
        var order = CreateTestOrder(status: "pending", pickupHoursFromNow: 5);
        order.PaymentAuthorizationNo = "SETTLED_TXN";
        order.TotalAmount = 30.00m;

        _mockScheduledOrderRepo
            .Setup(r => r.GetByIdAsync(1))
            .ReturnsAsync(order);

        _mockPaymentService
            .Setup(p => p.VoidTransactionAsync("SETTLED_TXN"))
            .ReturnsAsync(false);

        _mockPaymentService
            .Setup(p => p.RefundTransactionAsync("SETTLED_TXN", 30.00m))
            .ReturnsAsync(true);

        _mockScheduledOrderRepo
            .Setup(r => r.CancelAsync(1, It.IsAny<string>()))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.Cancel(1, new CancelRequest { Reason = "Order too expensive" });

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var responseJson = System.Text.Json.JsonSerializer.Serialize(okResult.Value);
        Assert.Contains("\"refunded\":true", responseJson);

        // Verify void was attempted first, then refund
        _mockPaymentService.Verify(p => p.VoidTransactionAsync("SETTLED_TXN"), Times.Once);
        _mockPaymentService.Verify(p => p.RefundTransactionAsync("SETTLED_TXN", 30.00m), Times.Once);
    }

    [Fact]
    public async Task Cancel_BothVoidAndRefundFail_ReturnsOkWithRefundedFalseAndOrderStillCancelled()
    {
        // Arrange
        var order = CreateTestOrder(status: "pending", pickupHoursFromNow: 5);
        order.PaymentAuthorizationNo = "PROBLEMATIC_TXN";
        order.TotalAmount = 50.00m;

        _mockScheduledOrderRepo
            .Setup(r => r.GetByIdAsync(1))
            .ReturnsAsync(order);

        _mockPaymentService
            .Setup(p => p.VoidTransactionAsync("PROBLEMATIC_TXN"))
            .ReturnsAsync(false);

        _mockPaymentService
            .Setup(p => p.RefundTransactionAsync("PROBLEMATIC_TXN", 50.00m))
            .ReturnsAsync(false);

        _mockScheduledOrderRepo
            .Setup(r => r.CancelAsync(1, It.IsAny<string>()))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.Cancel(1, new CancelRequest { Reason = "Need refund" });

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var responseJson = System.Text.Json.JsonSerializer.Serialize(okResult.Value);
        Assert.Contains("\"refunded\":false", responseJson);
        Assert.Contains("success", responseJson, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("contact support", responseJson, StringComparison.OrdinalIgnoreCase);

        // Order should still be cancelled even if refund failed
        _mockScheduledOrderRepo.Verify(r => r.CancelAsync(1, It.IsAny<string>()), Times.Once);
    }

    [Fact]
    public async Task Cancel_NoPaymentInfo_ReturnsOkWithRefundedFalse()
    {
        // Arrange - order has no payment info (e.g., cash payment)
        var order = CreateTestOrder(status: "pending", pickupHoursFromNow: 5);
        order.PaymentAuthorizationNo = null;

        _mockScheduledOrderRepo
            .Setup(r => r.GetByIdAsync(1))
            .ReturnsAsync(order);

        _mockScheduledOrderRepo
            .Setup(r => r.CancelAsync(1, It.IsAny<string>()))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.Cancel(1, new CancelRequest { Reason = "Cancel please" });

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var responseJson = System.Text.Json.JsonSerializer.Serialize(okResult.Value);
        Assert.Contains("\"refunded\":false", responseJson);

        // Verify no payment service calls were made
        _mockPaymentService.Verify(p => p.VoidTransactionAsync(It.IsAny<string>()), Times.Never);
        _mockPaymentService.Verify(p => p.RefundTransactionAsync(It.IsAny<string>(), It.IsAny<decimal>()), Times.Never);
    }

    #endregion

    #region Helper Methods

    private ScheduledOrder CreateTestOrder(string status, int pickupHoursFromNow)
    {
        return new ScheduledOrder
        {
            Id = 1,
            PosCustomerId = 100, // Matches user claim
            CustomerFirstName = "Test",
            CustomerLastName = "User",
            CustomerPhone = "555-1234",
            ScheduledDateTime = DateTime.UtcNow.AddHours(pickupHoursFromNow),
            Status = status,
            ItemsJson = "[]",
            Subtotal = 20.00m,
            TaxAmount = 1.20m,
            TotalAmount = 21.20m,
            IdempotencyKey = "test-key-123",
            CreatedAt = DateTime.UtcNow.AddDays(-1)
        };
    }

    #endregion
}
