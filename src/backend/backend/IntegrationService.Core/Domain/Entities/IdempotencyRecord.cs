using System;

namespace IntegrationService.Core.Domain.Entities
{
    /// <summary>
    /// Idempotency record for duplicate request detection
    /// Stores request hash and cached response to prevent duplicate order creation
    /// </summary>
    public class IdempotencyRecord
    {
        public string IdempotencyKey { get; set; } = string.Empty;
        public string RequestHash { get; set; } = string.Empty;
        public string? ResponseJson { get; set; }
        public int StatusCode { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime ExpiresAt { get; set; }
    }
}
