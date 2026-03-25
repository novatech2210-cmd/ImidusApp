using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using IntegrationService.Core.Domain.Entities;
using IntegrationService.Core.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace IntegrationService.API.Middleware
{
    /// <summary>
    /// Middleware for idempotency protection on POST requests
    /// Prevents duplicate order creation from network retries
    ///
    /// Usage:
    /// - Client sends Idempotency-Key header with unique value (e.g., UUID)
    /// - First request: Processes normally, caches response
    /// - Duplicate request (same key, same body): Returns cached response
    /// - Key collision (same key, different body): Returns 409 Conflict
    /// </summary>
    public class IdempotencyMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<IdempotencyMiddleware> _logger;

        public IdempotencyMiddleware(RequestDelegate next, ILogger<IdempotencyMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context, IIdempotencyRepository repository)
        {
            // Only intercept POST requests (GET/PUT/DELETE don't need idempotency)
            if (!HttpMethods.IsPost(context.Request.Method))
            {
                await _next(context);
                return;
            }

            // Exclude Auth endpoints (login, register, admin-login)
            var path = context.Request.Path.Value?.ToLower() ?? "";
            if (path.Contains("/api/auth/"))
            {
                await _next(context);
                return;
            }

            // Extract Idempotency-Key header (accept both X-Idempotency-Key and Idempotency-Key)
            string? idempotencyKey = null;
            if (context.Request.Headers.TryGetValue("X-Idempotency-Key", out var xKey) && !string.IsNullOrWhiteSpace(xKey))
            {
                idempotencyKey = xKey.ToString();
            }
            else if (context.Request.Headers.TryGetValue("Idempotency-Key", out var headerKey) && !string.IsNullOrWhiteSpace(headerKey))
            {
                idempotencyKey = headerKey.ToString();
            }

            if (string.IsNullOrWhiteSpace(idempotencyKey))
            {
                context.Response.StatusCode = 400;
                await context.Response.WriteAsJsonAsync(new
                {
                    error = "Idempotency-Key header is required for POST requests"
                });
                return;
            }

            var key = idempotencyKey.ToString();

            // Read request body for hashing
            context.Request.EnableBuffering();
            string requestBody;
            using (var reader = new StreamReader(context.Request.Body, Encoding.UTF8, leaveOpen: true))
            {
                requestBody = await reader.ReadToEndAsync();
                context.Request.Body.Position = 0; // Reset for next middleware
            }

            // Hash request body for collision detection
            var requestHash = ComputeSha256Hash(requestBody);

            // Check for existing idempotency record
            var existingRecord = await repository.GetByKeyAsync(key);
            if (existingRecord != null)
            {
                // Key collision check: same key but different request body
                if (existingRecord.RequestHash != requestHash)
                {
                    _logger.LogWarning("Idempotency key collision detected. Key: {Key}", key);
                    context.Response.StatusCode = 409;
                    await context.Response.WriteAsJsonAsync(new
                    {
                        error = "Idempotency key already used with different request body",
                        idempotencyKey = key
                    });
                    return;
                }

                // Duplicate request: return cached response
                _logger.LogInformation("Returning cached response for idempotency key: {Key}", key);
                context.Response.StatusCode = existingRecord.StatusCode;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsync(existingRecord.ResponseJson ?? "{}");
                return;
            }

            // First request: capture response and store in cache
            var originalBodyStream = context.Response.Body;
            using var responseBodyStream = new MemoryStream();
            context.Response.Body = responseBodyStream;

            try
            {
                // Process request through pipeline
                await _next(context);

                // Capture response
                responseBodyStream.Seek(0, SeekOrigin.Begin);
                var responseBody = await new StreamReader(responseBodyStream).ReadToEndAsync();
                responseBodyStream.Seek(0, SeekOrigin.Begin);

                // Store in idempotency cache with 24-hour expiration
                var record = new IdempotencyRecord
                {
                    IdempotencyKey = key,
                    RequestHash = requestHash,
                    ResponseJson = responseBody,
                    StatusCode = context.Response.StatusCode,
                    CreatedAt = DateTime.UtcNow,
                    ExpiresAt = DateTime.UtcNow.AddHours(24)
                };

                await repository.StoreAsync(record);
                _logger.LogInformation("Stored idempotency record for key: {Key}", key);

                // Copy captured response to original stream
                await responseBodyStream.CopyToAsync(originalBodyStream);
            }
            finally
            {
                context.Response.Body = originalBodyStream;
            }
        }

        /// <summary>
        /// Compute SHA256 hash of request body for collision detection
        /// </summary>
        private static string ComputeSha256Hash(string input)
        {
            var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(input));
            return Convert.ToHexString(bytes);
        }
    }
}
