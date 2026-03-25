using Xunit;
using Moq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using IntegrationService.API.Controllers;
using IntegrationService.Core.Interfaces;
using IntegrationService.Core.Domain.Entities;
using static IntegrationService.API.Controllers.NotificationsController;

namespace IntegrationService.Tests.Controllers;

public class NotificationsControllerTests
{
    private readonly Mock<IDeviceTokenRepository> _mockTokenRepository;
    private readonly Mock<ILogger<NotificationsController>> _mockLogger;
    private readonly NotificationsController _controller;

    public NotificationsControllerTests()
    {
        _mockTokenRepository = new Mock<IDeviceTokenRepository>();
        _mockLogger = new Mock<ILogger<NotificationsController>>();
        _controller = new NotificationsController(_mockTokenRepository.Object, _mockLogger.Object);
    }

    [Fact]
    public async Task RegisterToken_NewToken_CreatesDeviceToken()
    {
        // Arrange
        var request = new RegisterTokenRequest
        {
            Token = "test-fcm-token-123",
            Platform = "android",
            CustomerId = 42
        };

        _mockTokenRepository
            .Setup(r => r.GetByTokenAsync(request.Token))
            .ReturnsAsync((DeviceToken?)null);

        _mockTokenRepository
            .Setup(r => r.InsertAsync(It.IsAny<DeviceToken>()))
            .ReturnsAsync(1);

        // Act
        var result = await _controller.RegisterToken(request);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = okResult.Value as dynamic;
        Assert.NotNull(response);

        _mockTokenRepository.Verify(r => r.InsertAsync(It.Is<DeviceToken>(t =>
            t.Token == request.Token &&
            t.Platform == request.Platform &&
            t.CustomerId == request.CustomerId &&
            t.IsActive == true
        )), Times.Once);
    }

    [Fact]
    public async Task RegisterToken_DuplicateActiveToken_UpdatesLastActive()
    {
        // Arrange
        var request = new RegisterTokenRequest
        {
            Token = "existing-token",
            Platform = "ios",
            CustomerId = 42
        };

        var existingToken = new DeviceToken
        {
            Id = 10,
            Token = request.Token,
            Platform = request.Platform,
            CustomerId = request.CustomerId,
            IsActive = true,
            LastActive = DateTime.UtcNow.AddDays(-1),
            CreatedAt = DateTime.UtcNow.AddDays(-30)
        };

        _mockTokenRepository
            .Setup(r => r.GetByTokenAsync(request.Token))
            .ReturnsAsync(existingToken);

        // Act
        var result = await _controller.RegisterToken(request);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        _mockTokenRepository.Verify(r => r.UpdateAsync(It.Is<DeviceToken>(t =>
            t.Id == existingToken.Id &&
            t.IsActive == true
        )), Times.Once);

        _mockTokenRepository.Verify(r => r.InsertAsync(It.IsAny<DeviceToken>()), Times.Never);
    }

    [Fact]
    public async Task RegisterToken_InactiveToken_ReactivatesToken()
    {
        // Arrange
        var request = new RegisterTokenRequest
        {
            Token = "inactive-token",
            Platform = "android",
            CustomerId = 42
        };

        var existingToken = new DeviceToken
        {
            Id = 20,
            Token = request.Token,
            Platform = request.Platform,
            CustomerId = request.CustomerId,
            IsActive = false,
            LastActive = DateTime.UtcNow.AddDays(-10),
            CreatedAt = DateTime.UtcNow.AddDays(-60)
        };

        _mockTokenRepository
            .Setup(r => r.GetByTokenAsync(request.Token))
            .ReturnsAsync(existingToken);

        // Act
        var result = await _controller.RegisterToken(request);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        _mockTokenRepository.Verify(r => r.ReactivateAsync(existingToken.Id), Times.Once);
        _mockTokenRepository.Verify(r => r.InsertAsync(It.IsAny<DeviceToken>()), Times.Never);
    }

    [Fact]
    public async Task RegisterToken_EmptyToken_ReturnsBadRequest()
    {
        // Arrange
        var request = new RegisterTokenRequest
        {
            Token = "",
            Platform = "ios",
            CustomerId = 42
        };

        // Act
        var result = await _controller.RegisterToken(request);

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
        Assert.NotNull(badRequestResult.Value);
    }

    [Fact]
    public async Task RegisterToken_InvalidPlatform_ReturnsBadRequest()
    {
        // Arrange
        var request = new RegisterTokenRequest
        {
            Token = "test-token",
            Platform = "windows",
            CustomerId = 42
        };

        // Act
        var result = await _controller.RegisterToken(request);

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
        Assert.NotNull(badRequestResult.Value);
    }

    [Fact]
    public async Task RegisterToken_InvalidCustomerId_ReturnsBadRequest()
    {
        // Arrange
        var request = new RegisterTokenRequest
        {
            Token = "test-token",
            Platform = "android",
            CustomerId = 0
        };

        // Act
        var result = await _controller.RegisterToken(request);

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
        Assert.NotNull(badRequestResult.Value);
    }
}
