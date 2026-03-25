using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using IntegrationService.API.Controllers;
using IntegrationService.Core.Domain.Entities;
using IntegrationService.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace IntegrationService.Tests.Integration
{
    /// <summary>
    /// Integration tests for customer lookup and loyalty history endpoints.
    /// Tests use Moq for repository mocking to validate controller logic.
    ///
    /// Test coverage:
    /// - Phone-based customer lookup
    /// - Email-based customer lookup (fallback)
    /// - Phone format stripping (non-digit removal)
    /// - Auto-create new customer profiles
    /// - Loyalty transaction history retrieval
    /// </summary>
    public class CustomerLookupTests
    {
        private readonly Mock<IPosRepository> _mockRepository;
        private readonly Mock<IUserRepository> _mockUserRepository;
        private readonly Mock<IActivityLogRepository> _mockActivityRepo;
        private readonly Mock<ILogger<CustomersController>> _mockLogger;
        private readonly CustomersController _controller;

        public CustomerLookupTests()
        {
            _mockRepository = new Mock<IPosRepository>();
            _mockUserRepository = new Mock<IUserRepository>();
            _mockActivityRepo = new Mock<IActivityLogRepository>();
            _mockLogger = new Mock<ILogger<CustomersController>>();
            _controller = new CustomersController(
                _mockRepository.Object, 
                _mockUserRepository.Object,
                _mockActivityRepo.Object,
                _mockLogger.Object);
        }

        [Fact]
        public async Task LookupByPhone_ExistingCustomer_ReturnsProfile()
        {
            // Arrange
            var existingCustomer = new PosCustomer
            {
                ID = 42,
                FName = "John",
                LName = "Doe",
                Phone = "5551234567",
                EarnedPoints = 500,
                PointsManaged = true
            };

            _mockRepository
                .Setup(r => r.GetCustomerByPhoneAsync("5551234567"))
                .ReturnsAsync(existingCustomer);

            // Act
            var result = await _controller.LookupCustomer(phone: "5551234567", email: null);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<CustomerLookupResponse>(okResult.Value);

            Assert.Equal(42, response.CustomerId);
            Assert.Equal("John Doe", response.FullName);
            Assert.Equal("5551234567", response.Phone);
            Assert.Equal("5551234567", response.Phone);
            Assert.Equal(500, response.EarnedPoints);

            // Verify repository was called exactly once with correct phone
            _mockRepository.Verify(r => r.GetCustomerByPhoneAsync("5551234567"), Times.Once);
        }

        [Fact]
        public async Task LookupByPhone_FormattedPhone_StripsNonDigits()
        {
            // Arrange
            var existingCustomer = new PosCustomer
            {
                ID = 99,
                FName = "Jane",
                LName = "Smith",
                Phone = "5551234567",
                EarnedPoints = 250
            };

            // Repository should receive cleaned phone number (digits only)
            _mockRepository
                .Setup(r => r.GetCustomerByPhoneAsync("5551234567"))
                .ReturnsAsync(existingCustomer);

            // Act - phone with formatting
            var result = await _controller.LookupCustomer(phone: "(555) 123-4567", email: null);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<CustomerLookupResponse>(okResult.Value);

            Assert.Equal(99, response.CustomerId);

            // Verify repository was called with stripped phone (no formatting)
            _mockRepository.Verify(r => r.GetCustomerByPhoneAsync("5551234567"), Times.Once);
        }

        [Fact]
        public async Task LookupByEmail_NoPhone_UsesEmailFallback()
        {
            // Arrange
            var existingCustomer = new PosCustomer
            {
                ID = 123,
                FName = "Alice",
                LName = "Johnson",
                EarnedPoints = 1000
            };

            // Only email lookup should be called (no phone provided)
            _mockUserRepository
                .Setup(r => r.GetByEmailAsync("alice@example.com"))
                .ReturnsAsync(new User { CustomerID = 123 });

            _mockRepository
                .Setup(r => r.GetCustomerByIdAsync(123))
                .ReturnsAsync(new PosCustomer { ID = 123, FName = "Alice", LName = "Johnson", EarnedPoints = 1000 });

            // Act - only email parameter
            var result = await _controller.LookupCustomer(phone: null, email: "alice@example.com");

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<CustomerLookupResponse>(okResult.Value);

            Assert.Equal(123, response.CustomerId);
            Assert.Equal(123, response.CustomerId);
            Assert.Equal(1000, response.EarnedPoints);

            // Verify phone lookup was NOT called
            _mockRepository.Verify(r => r.GetCustomerByPhoneAsync(It.IsAny<string>()), Times.Never);

            // Verify email lookup was called
            _mockUserRepository.Verify(r => r.GetByEmailAsync("alice@example.com"), Times.Once);
        }

        [Fact]
        public async Task LookupNotFound_AutoCreatesProfile()
        {
            // Arrange - no existing customer
            _mockRepository
                .Setup(r => r.GetCustomerByPhoneAsync(It.IsAny<string>()))
                .ReturnsAsync((PosCustomer?)null);

            _mockUserRepository
                .Setup(r => r.GetByEmailAsync(It.IsAny<string>()))
                .ReturnsAsync((User?)null);

            // InsertCustomerAsync should return new customer ID
            _mockRepository
                .Setup(r => r.InsertCustomerAsync(It.IsAny<PosCustomer>()))
                .ReturnsAsync(789);

            // Act
            var result = await _controller.LookupCustomer(phone: "5559876543", email: "newcustomer@example.com");

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<CustomerLookupResponse>(okResult.Value);

            Assert.Equal(789, response.CustomerId);
            Assert.Equal(0, response.EarnedPoints); // New customer should have 0 points

            // Verify InsertCustomerAsync was called with correct data
            _mockRepository.Verify(
                r => r.InsertCustomerAsync(It.Is<PosCustomer>(c =>
                    c.Phone == "5559876543" &&
                    c.EarnedPoints == 0 &&
                    c.PointsManaged == true
                )),
                Times.Once);
        }

        [Fact]
        public async Task GetLoyaltyHistory_ReturnsTransactionList()
        {
            // Arrange
            var customer = new PosCustomer { ID = 50, FName = "Bob", LName = "Wilson" };

            _mockRepository
                .Setup(r => r.GetCustomerByIdAsync(50))
                .ReturnsAsync(customer);

            // Mock 3 transactions: 1 earn, 2 redeem
            var pointsDetails = new List<PointsDetail>
            {
                new PointsDetail
                {
                    ID = 1,
                    SalesID = 101,
                    CustomerID = 50,
                    PointSaved = 50,
                    PointUsed = 0,
                    TransactionDate = new DateTime(2026, 2, 25, 10, 30, 0)
                },
                new PointsDetail
                {
                    ID = 2,
                    SalesID = 102,
                    CustomerID = 50,
                    PointSaved = 0,
                    PointUsed = 25,
                    TransactionDate = new DateTime(2026, 2, 26, 14, 15, 0)
                },
                new PointsDetail
                {
                    ID = 3,
                    SalesID = 103,
                    CustomerID = 50,
                    PointSaved = 0,
                    PointUsed = 10,
                    TransactionDate = new DateTime(2026, 2, 27, 09, 45, 0)
                }
            };

            _mockRepository
                .Setup(r => r.GetLoyaltyHistoryAsync(50, 50))
                .ReturnsAsync(pointsDetails);

            // Act
            var result = await _controller.GetLoyaltyHistory(customerId: 50, limit: 50);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var transactions = Assert.IsType<List<Core.Interfaces.LoyaltyTransactionDto>>(okResult.Value);

            Assert.Equal(3, transactions.Count);

            // Verify first transaction (earn)
            var earnTx = transactions[0];
            Assert.Equal(1, earnTx.Id);
            Assert.Equal("earn", earnTx.Type);
            Assert.Equal(50, earnTx.Points);
            Assert.Contains("Earned on order #101", earnTx.Description);
            Assert.NotEqual(default, earnTx.Date); // DateTime must be set

            // Verify second transaction (redeem)
            var redeemTx1 = transactions[1];
            Assert.Equal(2, redeemTx1.Id);
            Assert.Equal("redeem", redeemTx1.Type);
            Assert.Equal(25, redeemTx1.Points);
            Assert.Contains("Redeemed on order #102", redeemTx1.Description);

            // Verify third transaction (redeem)
            var redeemTx2 = transactions[2];
            Assert.Equal(3, redeemTx2.Id);
            Assert.Equal("redeem", redeemTx2.Type);
            Assert.Equal(10, redeemTx2.Points);
            Assert.Contains("Redeemed on order #103", redeemTx2.Description);

            // Verify repository was called
            _mockRepository.Verify(r => r.GetCustomerByIdAsync(50), Times.Once);
            _mockRepository.Verify(r => r.GetLoyaltyHistoryAsync(50, 50), Times.Once);
        }

        [Fact]
        public async Task GetLoyaltyHistory_CustomerNotFound_Returns404()
        {
            // Arrange - customer doesn't exist
            _mockRepository
                .Setup(r => r.GetCustomerByIdAsync(999))
                .ReturnsAsync((PosCustomer?)null);

            // Act
            var result = await _controller.GetLoyaltyHistory(customerId: 999, limit: 50);

            // Assert
            var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
            Assert.NotNull(notFoundResult.Value);

            // Verify history lookup was NOT called
            _mockRepository.Verify(r => r.GetLoyaltyHistoryAsync(It.IsAny<int>(), It.IsAny<int>()), Times.Never);
        }

        [Fact]
        public async Task LookupCustomer_BothParametersMissing_ReturnsBadRequest()
        {
            // Act
            var result = await _controller.LookupCustomer(phone: null, email: null);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.NotNull(badRequestResult.Value);

            // Verify no repository calls were made
            _mockRepository.Verify(r => r.GetCustomerByPhoneAsync(It.IsAny<string>()), Times.Never);
            _mockRepository.Verify(r => r.GetCustomerByEmailAsync(It.IsAny<string>()), Times.Never);
        }

        [Fact]
        public async Task GetLoyaltyHistory_InvalidCustomerId_ReturnsBadRequest()
        {
            // Act
            var result = await _controller.GetLoyaltyHistory(customerId: 0, limit: 50);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.NotNull(badRequestResult.Value);

            // Verify no repository calls were made
            _mockRepository.Verify(r => r.GetCustomerByIdAsync(It.IsAny<int>()), Times.Never);
        }
    }
}
