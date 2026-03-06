using System.Threading.Tasks;
using IntegrationService.Core.Domain.Entities;

namespace IntegrationService.Core.Interfaces
{
    /// <summary>
    /// Repository for managing idempotency records
    /// Provides cache lookup and storage for duplicate request detection
    /// </summary>
    public interface IIdempotencyRepository
    {
        /// <summary>
        /// Get idempotency record by key
        /// Returns null if key not found or expired
        /// </summary>
        Task<IdempotencyRecord?> GetByKeyAsync(string key);

        /// <summary>
        /// Store new idempotency record
        /// </summary>
        Task StoreAsync(IdempotencyRecord record);
    }
}
