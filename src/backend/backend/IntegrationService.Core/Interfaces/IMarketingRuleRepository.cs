using IntegrationService.Core.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace IntegrationService.Core.Interfaces
{
    /// <summary>
    /// Repository interface for Marketing Rules - stored in IntegrationService database (overlay)
    /// NOT in INI_Restaurant database (source of truth) - SSOT compliant
    /// </summary>
    public interface IMarketingRuleRepository
    {
        Task<MarketingRule?> GetByIdAsync(int id);
        Task<IEnumerable<MarketingRule>> GetAllAsync(bool activeOnly = true);
        Task<IEnumerable<MarketingRule>> GetActiveRulesAsync();
        Task<int> CreateAsync(MarketingRule rule);
        Task<bool> UpdateAsync(MarketingRule rule);
        Task<bool> DeleteAsync(int id);
        Task<bool> IncrementTimesShownAsync(int id);
        Task<bool> IncrementTimesAcceptedAsync(int id);
        Task<IEnumerable<UpsellTracking>> GetTrackingByOrderIdAsync(int scheduledOrderId);
        Task<int> AddTrackingAsync(UpsellTracking tracking);
        Task<bool> UpdateTrackingAcceptedAsync(int trackingId);
    }
}
