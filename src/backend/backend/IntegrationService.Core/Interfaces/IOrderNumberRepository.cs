using System.Threading.Tasks;

namespace IntegrationService.Core.Interfaces
{
    /// <summary>
    /// Repository for daily order number generation
    /// Provides atomic increment with race condition handling
    /// </summary>
    public interface IOrderNumberRepository
    {
        /// <summary>
        /// Get next daily order number for today with atomic increment
        /// Handles race conditions with retry logic and exponential backoff
        /// Resets to 1 at midnight daily
        /// </summary>
        /// <returns>Next order number for today (1-based)</returns>
        Task<int> GetNextDailyOrderNumberAsync();
    }
}
