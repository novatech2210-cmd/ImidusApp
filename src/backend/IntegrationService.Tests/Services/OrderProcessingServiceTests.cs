using System;
using System.Data;
using System.Threading.Tasks;
using IntegrationService.Core.Domain.Entities;
using IntegrationService.Core.Interfaces;
using IntegrationService.Core.Models;
using IntegrationService.Core.Services;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace IntegrationService.Tests.Services
{
    /// <summary>
    /// Integration tests for OrderProcessingService payment + order completion orchestration
    /// Tests critical error handling scenarios including void-on-failure and rollback
    /// </summary>
    public class OrderProcessingServiceTests
    {
        private readonly Mock<IPosRepository> _mockPosRepo;
        private readonly Mock<IPaymentService> _mockPaymentService;
        private readonly Mock<ILogger<OrderProcessingService>> _mockLogger;
        private readonly OrderProcessingService _service;

        public OrderProcessingServiceTests()
        {
            _mockPosRepo = new Mock<IPosRepository>();
            _mockPaymentService = new Mock<IPaymentService>();
            _mockLogger = new Mock<ILogger<OrderProcessingService>>();

            _service = new OrderProcessingService(
                _mockPosRepo.Object,
                _mockPaymentService.Object,
                _mockLogger.Object
            );
        }

        /// <summary>
        /// Test 1: ProcessPaymentAndCompleteOrderAsync - Successful payment completes order
        /// </summary>
        [Fact]
        public async Task ProcessPaymentAndCompleteOrderAsync_SuccessfulPayment_CompletesOrder()
        {
            // Arrange
            var salesId = 123;
            var paymentRequest = new PaymentRequest
            {
                SalesId = salesId,
                Amount = 50.00m,
                DailyOrderNumber = 42,
                Token = new PaymentToken
                {
                    DataDescriptor = "COMMON.ACCEPT.INAPP.PAYMENT",
                    DataValue = "test_token_value"
                }
            };

            var paymentResult = new PaymentResult
            {
                Success = true,
                TransactionId = "AUTH_123456",
                AuthorizationCode = "ABC123",
                Last4Digits = "1234",
                CardType = "Visa"
            };

            var mockTransaction = new Mock<IDbTransaction>();
            var mockConnection = new Mock<IDbConnection>();
            mockTransaction.Setup(t => t.Connection).Returns(mockConnection.Object);

            _mockPosRepo.Setup(r => r.BeginTransactionAsync())
                .ReturnsAsync(mockTransaction.Object);

            _mockPaymentService.Setup(s => s.ChargeCardAsync(paymentRequest))
                .ReturnsAsync(paymentResult);

            _mockPosRepo.Setup(r => r.InsertPaymentAsync(It.IsAny<PosTender>(), It.IsAny<IDbTransaction>()))
                .Returns(Task.CompletedTask);

            _mockPosRepo.Setup(r => r.UpdateSalePaymentTotalsAsync(salesId, It.IsAny<PosTender>(), It.IsAny<IDbTransaction>()))
                .Returns(Task.CompletedTask);

            _mockPosRepo.Setup(r => r.CompleteOrderAsync(salesId, It.IsAny<IDbTransaction>()))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _service.ProcessPaymentAndCompleteOrderAsync(salesId, paymentRequest);

            // Assert
            Assert.True(result.Success);
            Assert.Equal("AUTH_123456", result.TransactionId);
            Assert.Equal(salesId, result.TicketId);
            Assert.Equal(42, result.DailyOrderNumber);

            // Verify all operations were called once
            _mockPaymentService.Verify(s => s.ChargeCardAsync(paymentRequest), Times.Once);
            _mockPosRepo.Verify(r => r.InsertPaymentAsync(It.IsAny<PosTender>(), It.IsAny<IDbTransaction>()), Times.Once);
            _mockPosRepo.Verify(r => r.UpdateSalePaymentTotalsAsync(salesId, It.IsAny<PosTender>(), It.IsAny<IDbTransaction>()), Times.Once);
            _mockPosRepo.Verify(r => r.CompleteOrderAsync(salesId, It.IsAny<IDbTransaction>()), Times.Once);
            mockTransaction.Verify(t => t.Commit(), Times.Once);
        }

        /// <summary>
        /// Test 2: ProcessPaymentAndCompleteOrderAsync - Payment declined returns error
        /// DB operations should NOT be called
        /// </summary>
        [Fact]
        public async Task ProcessPaymentAndCompleteOrderAsync_PaymentDeclined_ReturnsError()
        {
            // Arrange
            var salesId = 123;
            var paymentRequest = new PaymentRequest
            {
                SalesId = salesId,
                Amount = 50.00m,
                DailyOrderNumber = 42,
                Token = new PaymentToken
                {
                    DataDescriptor = "COMMON.ACCEPT.INAPP.PAYMENT",
                    DataValue = "test_token_value"
                }
            };

            var paymentResult = new PaymentResult
            {
                Success = false,
                ErrorMessage = "Card declined - insufficient funds",
                ErrorCode = "2"
            };

            var mockTransaction = new Mock<IDbTransaction>();
            _mockPosRepo.Setup(r => r.BeginTransactionAsync()).ReturnsAsync(mockTransaction.Object);
            _mockPaymentService.Setup(s => s.ChargeCardAsync(paymentRequest)).ReturnsAsync(paymentResult);

            // Act
            var result = await _service.ProcessPaymentAndCompleteOrderAsync(salesId, paymentRequest);

            // Assert
            Assert.False(result.Success);
            Assert.Contains("declined", result.ErrorMessage, StringComparison.OrdinalIgnoreCase);

            // Verify DB operations were NOT called
            _mockPosRepo.Verify(r => r.InsertPaymentAsync(It.IsAny<PosTender>(), It.IsAny<IDbTransaction>()), Times.Never);
            mockTransaction.Verify(t => t.Rollback(), Times.Once);
        }

        /// <summary>
        /// Test 3: ProcessPaymentAndCompleteOrderAsync - Payment success but DB failure voids charge
        /// CRITICAL: Ensures no orphaned Authorize.net charges
        /// </summary>
        [Fact]
        public async Task ProcessPaymentAndCompleteOrderAsync_PaymentSuccessDbFailure_VoidsCharge()
        {
            // Arrange
            var salesId = 123;
            var paymentRequest = new PaymentRequest
            {
                SalesId = salesId,
                Amount = 50.00m,
                DailyOrderNumber = 42,
                Token = new PaymentToken
                {
                    DataDescriptor = "COMMON.ACCEPT.INAPP.PAYMENT",
                    DataValue = "test_token_value"
                }
            };

            var paymentResult = new PaymentResult
            {
                Success = true,
                TransactionId = "AUTH_123456",
                AuthorizationCode = "ABC123",
                Last4Digits = "1234",
                CardType = "Visa"
            };

            var mockTransaction = new Mock<IDbTransaction>();
            var mockConnection = new Mock<IDbConnection>();
            mockTransaction.Setup(t => t.Connection).Returns(mockConnection.Object);

            _mockPosRepo.Setup(r => r.BeginTransactionAsync()).ReturnsAsync(mockTransaction.Object);
            _mockPaymentService.Setup(s => s.ChargeCardAsync(paymentRequest)).ReturnsAsync(paymentResult);

            // Simulate DB failure on InsertPaymentAsync
            _mockPosRepo.Setup(r => r.InsertPaymentAsync(It.IsAny<PosTender>(), It.IsAny<IDbTransaction>()))
                .ThrowsAsync(new Exception("DB connection lost"));

            _mockPaymentService.Setup(s => s.VoidTransactionAsync("AUTH_123456"))
                .ReturnsAsync(true);

            // Act
            var result = await _service.ProcessPaymentAndCompleteOrderAsync(salesId, paymentRequest);

            // Assert
            Assert.False(result.Success);
            Assert.Contains("voided", result.ErrorMessage, StringComparison.OrdinalIgnoreCase);

            // Verify void was called with correct transaction ID
            _mockPaymentService.Verify(s => s.VoidTransactionAsync("AUTH_123456"), Times.Once);
            mockTransaction.Verify(t => t.Rollback(), Times.Once);
        }

        /// <summary>
        /// Test 4: ProcessPaymentAndCompleteOrderAsync - Void fails logs critical
        /// Manual refund required scenario
        /// </summary>
        [Fact]
        public async Task ProcessPaymentAndCompleteOrderAsync_VoidFails_LogsCritical()
        {
            // Arrange
            var salesId = 123;
            var paymentRequest = new PaymentRequest
            {
                SalesId = salesId,
                Amount = 50.00m,
                DailyOrderNumber = 42,
                Token = new PaymentToken
                {
                    DataDescriptor = "COMMON.ACCEPT.INAPP.PAYMENT",
                    DataValue = "test_token_value"
                }
            };

            var paymentResult = new PaymentResult
            {
                Success = true,
                TransactionId = "AUTH_123456",
                AuthorizationCode = "ABC123",
                Last4Digits = "1234",
                CardType = "Visa"
            };

            var mockTransaction = new Mock<IDbTransaction>();
            var mockConnection = new Mock<IDbConnection>();
            mockTransaction.Setup(t => t.Connection).Returns(mockConnection.Object);

            _mockPosRepo.Setup(r => r.BeginTransactionAsync()).ReturnsAsync(mockTransaction.Object);
            _mockPaymentService.Setup(s => s.ChargeCardAsync(paymentRequest)).ReturnsAsync(paymentResult);

            // Simulate DB failure
            _mockPosRepo.Setup(r => r.InsertPaymentAsync(It.IsAny<PosTender>(), It.IsAny<IDbTransaction>()))
                .ThrowsAsync(new Exception("DB connection lost"));

            // Simulate void failure (e.g., transaction already settled)
            _mockPaymentService.Setup(s => s.VoidTransactionAsync("AUTH_123456"))
                .ThrowsAsync(new Exception("Transaction cannot be voided - already settled"));

            // Act
            var result = await _service.ProcessPaymentAndCompleteOrderAsync(salesId, paymentRequest);

            // Assert
            Assert.False(result.Success);

            // Verify LogCritical was called (indicating manual refund required)
            _mockLogger.Verify(
                x => x.Log(
                    LogLevel.Critical,
                    It.IsAny<EventId>(),
                    It.Is<It.IsAnyType>((v, t) => v.ToString().Contains("MANUAL REFUND REQUIRED")),
                    It.IsAny<Exception>(),
                    It.IsAny<Func<It.IsAnyType, Exception, string>>()),
                Times.Once);
        }

        /// <summary>
        /// Test 5: ProcessPaymentAndCompleteOrderAsync - CompleteOrder fails with concurrency error rolls back
        /// Tests TransType validation failure scenario
        /// </summary>
        [Fact]
        public async Task ProcessPaymentAndCompleteOrderAsync_CompleteOrderFailsConcurrency_RollsBack()
        {
            // Arrange
            var salesId = 123;
            var paymentRequest = new PaymentRequest
            {
                SalesId = salesId,
                Amount = 50.00m,
                DailyOrderNumber = 42,
                Token = new PaymentToken
                {
                    DataDescriptor = "COMMON.ACCEPT.INAPP.PAYMENT",
                    DataValue = "test_token_value"
                }
            };

            var paymentResult = new PaymentResult
            {
                Success = true,
                TransactionId = "AUTH_123456",
                AuthorizationCode = "ABC123",
                Last4Digits = "1234",
                CardType = "Visa"
            };

            var mockTransaction = new Mock<IDbTransaction>();
            var mockConnection = new Mock<IDbConnection>();
            mockTransaction.Setup(t => t.Connection).Returns(mockConnection.Object);

            _mockPosRepo.Setup(r => r.BeginTransactionAsync()).ReturnsAsync(mockTransaction.Object);
            _mockPaymentService.Setup(s => s.ChargeCardAsync(paymentRequest)).ReturnsAsync(paymentResult);

            _mockPosRepo.Setup(r => r.InsertPaymentAsync(It.IsAny<PosTender>(), It.IsAny<IDbTransaction>()))
                .Returns(Task.CompletedTask);

            _mockPosRepo.Setup(r => r.UpdateSalePaymentTotalsAsync(salesId, It.IsAny<PosTender>(), It.IsAny<IDbTransaction>()))
                .Returns(Task.CompletedTask);

            // Simulate CompleteOrderAsync failure (e.g., TransType != 2)
            _mockPosRepo.Setup(r => r.CompleteOrderAsync(salesId, It.IsAny<IDbTransaction>()))
                .ThrowsAsync(new InvalidOperationException("Order cannot be completed. Expected TransType=2, found TransType=1"));

            _mockPaymentService.Setup(s => s.VoidTransactionAsync("AUTH_123456"))
                .ReturnsAsync(true);

            // Act
            var result = await _service.ProcessPaymentAndCompleteOrderAsync(salesId, paymentRequest);

            // Assert
            Assert.False(result.Success);

            // Verify transaction was rolled back and charge was voided
            mockTransaction.Verify(t => t.Rollback(), Times.Once);
            _mockPaymentService.Verify(s => s.VoidTransactionAsync("AUTH_123456"), Times.Once);
        }
    }
}
