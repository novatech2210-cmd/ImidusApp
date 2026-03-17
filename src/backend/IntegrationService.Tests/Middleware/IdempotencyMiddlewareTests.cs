using System;
using System.IO;
using System.Text;
using System.Threading.Tasks;
using IntegrationService.API.Middleware;
using IntegrationService.Core.Domain.Entities;
using IntegrationService.Core.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace IntegrationService.Tests.Middleware
{
    /// <summary>
    /// Unit tests for IdempotencyMiddleware
    /// Tests duplicate request handling, key collision detection, and HTTP method filtering
    /// </summary>
    public class IdempotencyMiddlewareTests
    {
        private readonly Mock<IIdempotencyRepository> _repository;
        private readonly Mock<RequestDelegate> _next;
        private readonly Mock<ILogger<IdempotencyMiddleware>> _logger;
        private readonly IdempotencyMiddleware _middleware;

        public IdempotencyMiddlewareTests()
        {
            _repository = new Mock<IIdempotencyRepository>();
            _next = new Mock<RequestDelegate>();
            _logger = new Mock<ILogger<IdempotencyMiddleware>>();
            _middleware = new IdempotencyMiddleware(_next.Object, _logger.Object);
        }

        [Fact]
        public async Task InvokeAsync_NewKey_StoresResponse()
        {
            // Arrange
            var context = CreateHttpContext(HttpMethods.Post, "test-key-123", "{\"test\":\"data\"}");
            _repository.Setup(r => r.GetByKeyAsync("test-key-123"))
                .ReturnsAsync((IdempotencyRecord?)null);

            _next.Setup(n => n(It.IsAny<HttpContext>()))
                .Callback<HttpContext>(ctx =>
                {
                    ctx.Response.StatusCode = 200;
                    ctx.Response.Body.Write(Encoding.UTF8.GetBytes("{\"orderId\":123}"));
                })
                .Returns(Task.CompletedTask);

            // Act
            await _middleware.InvokeAsync(context, _repository.Object);

            // Assert
            _repository.Verify(r => r.StoreAsync(It.Is<IdempotencyRecord>(rec =>
                rec.IdempotencyKey == "test-key-123" &&
                rec.StatusCode == 200 &&
                rec.ResponseJson == "{\"orderId\":123}"
            )), Times.Once);

            _next.Verify(n => n(context), Times.Once);
        }

        [Fact]
        public async Task InvokeAsync_DuplicateKey_ReturnsCachedResponse()
        {
            // Arrange
            var context = CreateHttpContext(HttpMethods.Post, "test-key-456", "{\"test\":\"data\"}");

            var cachedRecord = new IdempotencyRecord
            {
                IdempotencyKey = "test-key-456",
                RequestHash = ComputeHash("{\"test\":\"data\"}"),
                ResponseJson = "{\"orderId\":456,\"cached\":true}",
                StatusCode = 200,
                CreatedAt = DateTime.UtcNow.AddMinutes(-5),
                ExpiresAt = DateTime.UtcNow.AddHours(23)
            };

            _repository.Setup(r => r.GetByKeyAsync("test-key-456"))
                .ReturnsAsync(cachedRecord);

            // Act
            await _middleware.InvokeAsync(context, _repository.Object);

            // Assert - cached response returned
            Assert.Equal(200, context.Response.StatusCode);
            context.Response.Body.Seek(0, SeekOrigin.Begin);
            var responseBody = await new StreamReader(context.Response.Body).ReadToEndAsync();
            Assert.Equal("{\"orderId\":456,\"cached\":true}", responseBody);

            // Next middleware should NOT be called
            _next.Verify(n => n(It.IsAny<HttpContext>()), Times.Never);
        }

        [Fact]
        public async Task InvokeAsync_KeyCollision_Returns409Conflict()
        {
            // Arrange
            var context = CreateHttpContext(HttpMethods.Post, "test-key-789", "{\"different\":\"data\"}");

            var existingRecord = new IdempotencyRecord
            {
                IdempotencyKey = "test-key-789",
                RequestHash = ComputeHash("{\"original\":\"data\"}"),  // Different hash
                ResponseJson = "{\"orderId\":789}",
                StatusCode = 200,
                CreatedAt = DateTime.UtcNow.AddMinutes(-5),
                ExpiresAt = DateTime.UtcNow.AddHours(23)
            };

            _repository.Setup(r => r.GetByKeyAsync("test-key-789"))
                .ReturnsAsync(existingRecord);

            // Act
            await _middleware.InvokeAsync(context, _repository.Object);

            // Assert - 409 Conflict returned
            Assert.Equal(409, context.Response.StatusCode);

            // Next middleware should NOT be called
            _next.Verify(n => n(It.IsAny<HttpContext>()), Times.Never);

            // Response should NOT be stored
            _repository.Verify(r => r.StoreAsync(It.IsAny<IdempotencyRecord>()), Times.Never);
        }

        [Fact]
        public async Task InvokeAsync_MissingHeader_Returns400BadRequest()
        {
            // Arrange - POST request without Idempotency-Key header
            var context = new DefaultHttpContext();
            context.Request.Method = HttpMethods.Post;
            context.Request.Body = new MemoryStream(Encoding.UTF8.GetBytes("{\"test\":\"data\"}"));
            context.Response.Body = new MemoryStream();

            // Act
            await _middleware.InvokeAsync(context, _repository.Object);

            // Assert - 400 Bad Request returned
            Assert.Equal(400, context.Response.StatusCode);

            // Next middleware should NOT be called
            _next.Verify(n => n(It.IsAny<HttpContext>()), Times.Never);

            // Repository should NOT be accessed
            _repository.Verify(r => r.GetByKeyAsync(It.IsAny<string>()), Times.Never);
        }

        [Fact]
        public async Task InvokeAsync_GetRequest_PassesThrough()
        {
            // Arrange - GET request (no idempotency needed)
            var context = new DefaultHttpContext();
            context.Request.Method = HttpMethods.Get;
            context.Request.Path = "/api/menu";
            context.Response.Body = new MemoryStream();

            _next.Setup(n => n(It.IsAny<HttpContext>()))
                .Returns(Task.CompletedTask);

            // Act
            await _middleware.InvokeAsync(context, _repository.Object);

            // Assert - next middleware called
            _next.Verify(n => n(context), Times.Once);

            // Repository should NOT be accessed (no idempotency check)
            _repository.Verify(r => r.GetByKeyAsync(It.IsAny<string>()), Times.Never);
        }

        [Fact]
        public async Task InvokeAsync_PutRequest_PassesThrough()
        {
            // Arrange - PUT request (no idempotency needed)
            var context = new DefaultHttpContext();
            context.Request.Method = HttpMethods.Put;
            context.Request.Path = "/api/orders/123";
            context.Response.Body = new MemoryStream();

            _next.Setup(n => n(It.IsAny<HttpContext>()))
                .Returns(Task.CompletedTask);

            // Act
            await _middleware.InvokeAsync(context, _repository.Object);

            // Assert - next middleware called
            _next.Verify(n => n(context), Times.Once);

            // Repository should NOT be accessed
            _repository.Verify(r => r.GetByKeyAsync(It.IsAny<string>()), Times.Never);
        }

        /// <summary>
        /// Helper: Create HttpContext with POST request
        /// </summary>
        private DefaultHttpContext CreateHttpContext(string method, string idempotencyKey, string requestBody)
        {
            var context = new DefaultHttpContext();
            context.Request.Method = method;
            context.Request.Headers["Idempotency-Key"] = idempotencyKey;
            context.Request.Body = new MemoryStream(Encoding.UTF8.GetBytes(requestBody));
            context.Response.Body = new MemoryStream();
            return context;
        }

        /// <summary>
        /// Helper: Compute SHA256 hash (matches middleware logic)
        /// </summary>
        private string ComputeHash(string input)
        {
            var bytes = System.Security.Cryptography.SHA256.HashData(Encoding.UTF8.GetBytes(input));
            return Convert.ToHexString(bytes);
        }
    }
}
