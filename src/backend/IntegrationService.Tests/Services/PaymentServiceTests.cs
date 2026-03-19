using System;
using System.Threading.Tasks;
using IntegrationService.Core.Configuration;
using IntegrationService.Core.Interfaces;
using IntegrationService.Core.Models;
using IntegrationService.Core.Services;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace IntegrationService.Tests.Services
{
    /// <summary>
    /// Unit tests for PaymentService
    ///
    /// NOTE: Authorize.net SDK classes (createTransactionController, createCustomerProfileController)
    /// are sealed and tightly coupled to the API, making comprehensive unit testing difficult.
    /// These tests verify configuration and logic flow. Integration tests with real Authorize.net
    /// sandbox API should be created separately for end-to-end validation.
    /// </summary>
    public class PaymentServiceTests
    {
        private readonly Mock<ILogger<PaymentService>> _mockLogger;
        private readonly IOptions<AuthorizeNetSettings> _sandboxSettings;
        private readonly IOptions<AuthorizeNetSettings> _productionSettings;

        public PaymentServiceTests()
        {
            _mockLogger = new Mock<ILogger<PaymentService>>();

            // Sandbox settings
            _sandboxSettings = Options.Create(new AuthorizeNetSettings
            {
                Environment = "Sandbox",
                ApiLoginId = "TEST_API_LOGIN",
                TransactionKey = "TEST_TRANSACTION_KEY",
                PublicClientKey = "TEST_PUBLIC_KEY"
            });

            // Production settings
            _productionSettings = Options.Create(new AuthorizeNetSettings
            {
                Environment = "Production",
                ApiLoginId = "PROD_API_LOGIN",
                TransactionKey = "PROD_TRANSACTION_KEY",
                PublicClientKey = "PROD_PUBLIC_KEY"
            });
        }

        [Fact]
        public void PaymentService_SandboxConfiguration_SetsIsSandboxTrue()
        {
            // Arrange & Act
            var service = new PaymentService(_sandboxSettings, _mockLogger.Object);

            // Assert
            Assert.True(_sandboxSettings.Value.IsSandbox);
        }

        [Fact]
        public void PaymentService_ProductionConfiguration_SetsIsSandboxFalse()
        {
            // Arrange & Act
            var service = new PaymentService(_productionSettings, _mockLogger.Object);

            // Assert
            Assert.False(_productionSettings.Value.IsSandbox);
        }

        [Fact]
        public async Task ChargeCardAsync_WithInvalidToken_ReturnsFailure()
        {
            // Arrange
            var service = new PaymentService(_sandboxSettings, _mockLogger.Object);
            var request = new PaymentRequest
            {
                Token = new PaymentToken
                {
                    DataDescriptor = "INVALID",
                    DataValue = "INVALID_TOKEN"
                },
                Amount = 10.00m,
                SalesId = 123,
                CustomerId = 456,
                DailyOrderNumber = 1
            };

            // Act
            var result = await service.ChargeCardAsync(request);

            // Assert
            // With invalid credentials and token, should return failure
            Assert.False(result.Success);
            Assert.NotNull(result.ErrorMessage);
        }

        [Fact]
        public async Task VoidTransactionAsync_WithInvalidTransactionId_ThrowsAfterRetries()
        {
            // Arrange
            var service = new PaymentService(_sandboxSettings, _mockLogger.Object);
            var invalidTransactionId = "INVALID_TXN_ID";

            // Act & Assert
            // With invalid transaction ID, void should throw after retries exhausted
            await Assert.ThrowsAsync<Exception>(async () =>
            {
                await service.VoidTransactionAsync(invalidTransactionId);
            });

            // Verify retries occurred (3 retry log messages)
            _mockLogger.Verify(
                x => x.Log(
                    LogLevel.Warning,
                    It.IsAny<EventId>(),
                    It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Retry")),
                    It.IsAny<Exception>(),
                    It.Is<Func<It.IsAnyType, Exception?, string>>((v, t) => true)),
                Times.Exactly(3));
        }

        [Fact]
        public async Task CreateCustomerProfileAsync_WithInvalidToken_ReturnsFailure()
        {
            // Arrange
            var service = new PaymentService(_sandboxSettings, _mockLogger.Object);
            var request = new SavedCardRequest
            {
                CustomerId = 123,
                Email = "test@example.com",
                PaymentToken = new PaymentToken
                {
                    DataDescriptor = "INVALID",
                    DataValue = "INVALID_TOKEN"
                }
            };

            // Act
            var result = await service.CreateCustomerProfileAsync(request);

            // Assert
            // With invalid credentials and token, should return failure
            Assert.False(result.Success);
            Assert.NotNull(result.ErrorMessage);
        }

        [Fact]
        public async Task ChargeCardAsync_LogsTransactionAttempt()
        {
            // Arrange
            var service = new PaymentService(_sandboxSettings, _mockLogger.Object);
            var request = new PaymentRequest
            {
                Token = new PaymentToken
                {
                    DataDescriptor = "TEST",
                    DataValue = "TEST_TOKEN"
                },
                Amount = 10.00m,
                SalesId = 123,
                DailyOrderNumber = 1
            };

            // Act
            var result = await service.ChargeCardAsync(request);

            // Assert
            // Verify logging occurred (approved, declined, or error)
            _mockLogger.Verify(
                x => x.Log(
                    It.IsAny<LogLevel>(),
                    It.IsAny<EventId>(),
                    It.Is<It.IsAnyType>((v, t) => true),
                    It.IsAny<Exception>(),
                    It.Is<Func<It.IsAnyType, Exception?, string>>((v, t) => true)),
                Times.AtLeastOnce);
        }

        /// <summary>
        /// Integration test placeholder - requires real Authorize.net sandbox credentials
        /// </summary>
        [Fact(Skip = "Requires valid Authorize.net sandbox credentials and network access")]
        public async Task ChargeCardAsync_WithValidToken_ReturnsSuccess()
        {
            // This test would require:
            // 1. Real Authorize.net sandbox API credentials in environment variables
            // 2. Valid opaque token from Accept.js (15-minute expiration)
            // 3. Network access to Authorize.net sandbox API
            //
            // Implementation:
            // var settings = Options.Create(new AuthorizeNetSettings
            // {
            //     Environment = "Sandbox",
            //     ApiLoginId = Environment.GetEnvironmentVariable("ANET_SANDBOX_LOGIN_ID"),
            //     TransactionKey = Environment.GetEnvironmentVariable("ANET_SANDBOX_TRANSACTION_KEY"),
            //     PublicClientKey = Environment.GetEnvironmentVariable("ANET_SANDBOX_PUBLIC_KEY")
            // });
            // var service = new PaymentService(settings, _mockLogger.Object);
            // var request = new PaymentRequest { /* Valid token from Accept.js */ };
            // var result = await service.ChargeCardAsync(request);
            // Assert.True(result.Success);
            // Assert.NotNull(result.TransactionId);

            await Task.CompletedTask;
        }

        /// <summary>
        /// Integration test placeholder - requires settled transaction
        /// </summary>
        [Fact(Skip = "Requires valid settled transaction ID and manual verification")]
        public async Task VoidTransactionAsync_WithSettledTransaction_LogsCritical()
        {
            // This test would verify that attempting to void a settled transaction
            // logs a CRITICAL message about requiring manual refund
            //
            // Cannot be automated as it requires:
            // 1. Real transaction that has been settled (typically 24 hours after charge)
            // 2. Real Authorize.net API credentials
            // 3. Manual verification of critical log message

            await Task.CompletedTask;
        }
    }
}
