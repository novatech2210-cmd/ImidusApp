using IntegrationService.Core.Interfaces;
using IntegrationService.Core.Domain.Entities;
using IntegrationService.Core.Services;
using Moq;
using Xunit;

namespace IntegrationService.Tests;

public class LoyaltyServiceTests
{
    private readonly Mock<ICustomerRepository> _customerRepoMock = new();
    private readonly LoyaltyService _loyaltyService;

    public LoyaltyServiceTests()
    {
        _loyaltyService = new LoyaltyService(_customerRepoMock.Object);
    }

    [Fact]
    public async Task UpdatePointsAfterSale_ShouldAddPointsCorrectly()
    {
        // Arrange
        var customer = new PosCustomer { ID = 1, EarnedPoints = 100 };
        _customerRepoMock.Setup(r => r.GetCustomerByIdAsync(1)).ReturnsAsync(customer);

        // Act
        await _loyaltyService.UpdatePointsAfterSaleAsync(1, 45.75m);

        // Assert
        _customerRepoMock.Verify(r => r.UpdateLoyaltyPointsAsync(1, 145m), Times.Once);
    }
}
