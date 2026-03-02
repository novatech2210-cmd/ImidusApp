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
        private readonly Mock<INotificationService> _mockNotificationService;
        private readonly Mock<ILogger<OrderProcessingService>> _mockLogger;
        private readonly OrderProcessingService _service;

        public OrderProcessingServiceTests()
        {
            _mockPosRepo = new Mock<IPosRepository>();
            _mockPaymentService = new Mock<IPaymentService>();
            _mockNotificationService = new Mock<INotificationService>();
            _mockLogger = new Mock<ILogger<OrderProcessingService>>();

            _service = new OrderProcessingService(
                _mockPosRepo.Object,
                _mockPaymentService.Object,
                _mockNotificationService.Object,
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
            var customerId = 42;
            var paymentRequest = new PaymentRequest
            {
                SalesId = salesId,
                CustomerId = customerId,
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

            // Verify notification was sent
            _mockNotificationService.Verify(n => n.SendNotificationAsync(
                customerId,
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.Is<Dictionary<string, string>>(d =>
                    d["type"] == "order_confirmed" &&
                    d["orderId"] == salesId.ToString() &&
                    d["screen"] == "OrderTracking"
                )
            ), Times.Once);
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

        // ========================================================================
        // LOYALTY POINTS INTEGRATION TESTS
        // ========================================================================

        /// <summary>
        /// Test 6: Order with customer ID records points earned (1:1 ratio)
        /// </summary>
        [Fact]
        public async Task OrderWithCustomerId_RecordsPointsEarned()
        {
            // Arrange
            var salesId = 123;
            var paymentRequest = new PaymentRequest
            {
                SalesId = salesId,
                Amount = 45.75m,
                CustomerId = 456,
                PointsToRedeem = 0,
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
            _mockPaymentService.Setup(s => s.ChargeCardAsync(It.IsAny<PaymentRequest>())).ReturnsAsync(paymentResult);
            _mockPosRepo.Setup(r => r.InsertPaymentAsync(It.IsAny<PosTender>(), It.IsAny<IDbTransaction>())).Returns(Task.CompletedTask);
            _mockPosRepo.Setup(r => r.UpdateSalePaymentTotalsAsync(salesId, It.IsAny<PosTender>(), It.IsAny<IDbTransaction>())).Returns(Task.CompletedTask);
            _mockPosRepo.Setup(r => r.CompleteOrderAsync(salesId, It.IsAny<IDbTransaction>())).Returns(Task.CompletedTask);

            // Mock RecordPointsTransactionAsync to return true
            _mockPosRepo.Setup(r => r.RecordPointsTransactionAsync(
                salesId,
                456,
                0,  // pointsUsed = 0
                45,  // pointsSaved = Math.Floor(45.75) = 45
                It.IsAny<IDbTransaction>()
            )).ReturnsAsync(true);

            // Act
            var result = await _service.ProcessPaymentAndCompleteOrderAsync(salesId, paymentRequest);

            // Assert
            Assert.True(result.Success);

            // Verify RecordPointsTransactionAsync was called with correct parameters
            _mockPosRepo.Verify(r => r.RecordPointsTransactionAsync(
                salesId,
                456,
                0,
                45,  // Math.Floor(45.75)
                It.IsAny<IDbTransaction>()
            ), Times.Once);
        }

        /// <summary>
        /// Test 7: Order with points redemption applies discount to charge amount
        /// </summary>
        [Fact]
        public async Task OrderWithPointsRedemption_AppliesDiscount()
        {
            // Arrange
            var salesId = 123;
            var paymentRequest = new PaymentRequest
            {
                SalesId = salesId,
                Amount = 50.00m,
                CustomerId = 456,
                PointsToRedeem = 500,  // 500 points = $5 discount
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
            _mockPosRepo.Setup(r => r.InsertPaymentAsync(It.IsAny<PosTender>(), It.IsAny<IDbTransaction>())).Returns(Task.CompletedTask);
            _mockPosRepo.Setup(r => r.UpdateSalePaymentTotalsAsync(salesId, It.IsAny<PosTender>(), It.IsAny<IDbTransaction>())).Returns(Task.CompletedTask);
            _mockPosRepo.Setup(r => r.GetTicketByIdAsync(salesId)).ReturnsAsync(new PosTicket { SubTotal = 50m, GSTAmt = 0m, PSTAmt = 0m, PST2Amt = 0m });
            _mockPosRepo.Setup(r => r.UpdateSaleTotalsAsync(It.IsAny<int>(), It.IsAny<decimal>(), It.IsAny<decimal>(), It.IsAny<decimal>(), It.IsAny<decimal>(), It.IsAny<decimal>(), It.IsAny<IDbTransaction>())).ReturnsAsync(true);
            _mockPosRepo.Setup(r => r.CompleteOrderAsync(salesId, It.IsAny<IDbTransaction>())).Returns(Task.CompletedTask);
            _mockPosRepo.Setup(r => r.RecordPointsTransactionAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<IDbTransaction>())).ReturnsAsync(true);

            // Mock payment service to capture the adjusted amount
            PaymentRequest? capturedRequest = null;
            _mockPaymentService.Setup(s => s.ChargeCardAsync(It.IsAny<PaymentRequest>()))
                .Callback<PaymentRequest>(req => capturedRequest = req)
                .ReturnsAsync(paymentResult);

            // Act
            var result = await _service.ProcessPaymentAndCompleteOrderAsync(salesId, paymentRequest);

            // Assert
            Assert.True(result.Success);

            // Verify charge amount was reduced by points discount
            Assert.NotNull(capturedRequest);
            Assert.Equal(45.00m, capturedRequest.Amount);  // 50 - (500/100) = 45

            // Verify RecordPointsTransactionAsync was called with redeemed points
            _mockPosRepo.Verify(r => r.RecordPointsTransactionAsync(
                salesId,
                456,
                500,  // pointsUsed
                50,   // pointsSaved = Math.Floor(50.00)
                It.IsAny<IDbTransaction>()
            ), Times.Once);
        }

        /// <summary>
        /// Test 8: Points recording fails but order still completes (graceful failure)
        /// </summary>
        [Fact]
        public async Task PointsRecordingFails_OrderStillCompletes()
        {
            // Arrange
            var salesId = 123;
            var paymentRequest = new PaymentRequest
            {
                SalesId = salesId,
                Amount = 30.00m,
                CustomerId = 456,
                PointsToRedeem = 0,
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
            _mockPaymentService.Setup(s => s.ChargeCardAsync(It.IsAny<PaymentRequest>())).ReturnsAsync(paymentResult);
            _mockPosRepo.Setup(r => r.InsertPaymentAsync(It.IsAny<PosTender>(), It.IsAny<IDbTransaction>())).Returns(Task.CompletedTask);
            _mockPosRepo.Setup(r => r.UpdateSalePaymentTotalsAsync(salesId, It.IsAny<PosTender>(), It.IsAny<IDbTransaction>())).Returns(Task.CompletedTask);
            _mockPosRepo.Setup(r => r.CompleteOrderAsync(salesId, It.IsAny<IDbTransaction>())).Returns(Task.CompletedTask);

            // Mock RecordPointsTransactionAsync to return false (graceful failure)
            _mockPosRepo.Setup(r => r.RecordPointsTransactionAsync(
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<IDbTransaction>()
            )).ReturnsAsync(false);

            // Act
            var result = await _service.ProcessPaymentAndCompleteOrderAsync(salesId, paymentRequest);

            // Assert
            Assert.True(result.Success);  // Order completes despite points failure

            // Verify warning was logged
            _mockLogger.Verify(
                x => x.Log(
                    LogLevel.Warning,
                    It.IsAny<EventId>(),
                    It.Is<It.IsAnyType>((v, t) => v.ToString().Contains("points recording failed")),
                    It.IsAny<Exception>(),
                    It.IsAny<Func<It.IsAnyType, Exception, string>>()),
                Times.Once);

            // Verify transaction still committed (not rolled back)
            mockTransaction.Verify(t => t.Commit(), Times.Once);
            mockTransaction.Verify(t => t.Rollback(), Times.Never);
        }

        /// <summary>
        /// Test 9: Order without customer ID skips points recording
        /// </summary>
        [Fact]
        public async Task OrderWithoutCustomerId_SkipsPointsRecording()
        {
            // Arrange
            var salesId = 123;
            var paymentRequest = new PaymentRequest
            {
                SalesId = salesId,
                Amount = 30.00m,
                CustomerId = null,  // No customer
                PointsToRedeem = 0,
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
            _mockPaymentService.Setup(s => s.ChargeCardAsync(It.IsAny<PaymentRequest>())).ReturnsAsync(paymentResult);
            _mockPosRepo.Setup(r => r.InsertPaymentAsync(It.IsAny<PosTender>(), It.IsAny<IDbTransaction>())).Returns(Task.CompletedTask);
            _mockPosRepo.Setup(r => r.UpdateSalePaymentTotalsAsync(salesId, It.IsAny<PosTender>(), It.IsAny<IDbTransaction>())).Returns(Task.CompletedTask);
            _mockPosRepo.Setup(r => r.CompleteOrderAsync(salesId, It.IsAny<IDbTransaction>())).Returns(Task.CompletedTask);

            // Act
            var result = await _service.ProcessPaymentAndCompleteOrderAsync(salesId, paymentRequest);

            // Assert
            Assert.True(result.Success);

            // Verify RecordPointsTransactionAsync was NOT called
            _mockPosRepo.Verify(r => r.RecordPointsTransactionAsync(
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<IDbTransaction>()
            ), Times.Never);
        }

        /// <summary>
        /// Test: Notification failure does not block order completion
        /// </summary>
        [Fact]
        public async Task ProcessPaymentAndCompleteOrderAsync_NotificationFails_OrderStillCompletes()
        {
            // Arrange
            var salesId = 123;
            var customerId = 42;
            var paymentRequest = new PaymentRequest
            {
                SalesId = salesId,
                CustomerId = customerId,
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
            _mockPosRepo.Setup(r => r.InsertPaymentAsync(It.IsAny<PosTender>(), It.IsAny<IDbTransaction>())).Returns(Task.CompletedTask);
            _mockPosRepo.Setup(r => r.UpdateSalePaymentTotalsAsync(salesId, It.IsAny<PosTender>(), It.IsAny<IDbTransaction>())).Returns(Task.CompletedTask);
            _mockPosRepo.Setup(r => r.CompleteOrderAsync(salesId, It.IsAny<IDbTransaction>())).Returns(Task.CompletedTask);

            // Mock notification service to throw exception
            _mockNotificationService.Setup(n => n.SendNotificationAsync(
                It.IsAny<int>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<Dictionary<string, string>>()
            )).ThrowsAsync(new Exception("FCM service unavailable"));

            // Act
            var result = await _service.ProcessPaymentAndCompleteOrderAsync(salesId, paymentRequest);

            // Assert
            Assert.True(result.Success);  // Order completes despite notification failure
            Assert.Equal("AUTH_123456", result.TransactionId);

            // Verify warning was logged
            _mockLogger.Verify(
                x => x.Log(
                    LogLevel.Warning,
                    It.IsAny<EventId>(),
                    It.Is<It.IsAnyType>((v, t) => v.ToString().Contains("Failed to send order confirmation notification")),
                    It.IsAny<Exception>(),
                    It.IsAny<Func<It.IsAnyType, Exception, string>>()),
                Times.Once);

            // Verify transaction committed (not rolled back)
            mockTransaction.Verify(t => t.Commit(), Times.Once);
            mockTransaction.Verify(t => t.Rollback(), Times.Never);
        }
    }
}
