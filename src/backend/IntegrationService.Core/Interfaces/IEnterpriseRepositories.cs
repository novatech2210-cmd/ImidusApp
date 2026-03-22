using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using IntegrationService.Core.Domain.Entities;

namespace IntegrationService.Core.Interfaces
{
    /// <summary>
    /// Repository for marketing push campaigns
    /// </summary>
    public interface ICampaignRepository
    {
        Task<int> CreateCampaignAsync(PushCampaign campaign);
        Task<PushCampaign?> GetByIdAsync(int id);
        Task<IEnumerable<PushCampaign>> GetAllAsync(string? status = null);
        Task<IEnumerable<PushCampaign>> GetScheduledCampaignsAsync(DateTime before);
        Task UpdateStatusAsync(int id, string status, int? sentCount = null, int? failedCount = null);
        Task<bool> DeleteAsync(int id);
    }

    /// <summary>
    /// Repository for scheduled future orders
    /// </summary>
    public interface IScheduledOrderRepository
    {
        Task<int> CreateAsync(ScheduledOrder order);
        Task<ScheduledOrder?> GetByIdAsync(int id);
        Task<IEnumerable<ScheduledOrder>> GetPendingOrdersForInjectionAsync(DateTime asOf);
        Task<IEnumerable<ScheduledOrder>> GetByCustomerIdAsync(int customerId);
        Task UpdateStatusAsync(int id, string status, int? salesId = null, string? errorMessage = null);
        Task<bool> CancelAsync(int id);
    }

    /// <summary>
    /// Repository for menu overlays
    /// </summary>
    public interface IMenuOverlayRepository
    {
        Task<int> CreateOrUpdateAsync(MenuOverlay overlay);
        Task<MenuOverlay?> GetByItemIdAsync(int itemId);
        Task<MenuOverlay?> GetByCategoryIdAsync(int categoryId);
        Task<IEnumerable<MenuOverlay>> GetAllAsync();
        Task<IEnumerable<int>> GetDisabledItemIdsAsync();
        Task<IEnumerable<int>> GetDisabledCategoryIdsAsync();
        Task<bool> DeleteAsync(int id);
    }

    /// <summary>
    /// Repository for marketing/upsell rules
    /// </summary>
    public interface IMarketingRuleRepository
    {
        Task<int> CreateAsync(MarketingRule rule);
        Task<MarketingRule?> GetByIdAsync(int id);
        Task<IEnumerable<MarketingRule>> GetActiveRulesAsync();
        Task<IEnumerable<MarketingRule>> GetRulesForItemAsync(int itemId);
        Task<IEnumerable<MarketingRule>> GetRulesForCategoryAsync(int categoryId);
        Task<IEnumerable<MarketingRule>> GetRulesForCartValueAsync(decimal cartValue);
        Task<bool> UpdateAsync(MarketingRule rule);
        Task<bool> DeleteAsync(int id);
    }

    /// <summary>
    /// Extended customer repository for RFM analysis
    /// </summary>
    public interface ICustomerAnalyticsRepository
    {
        Task<IEnumerable<CustomerRfmData>> GetCustomersWithRfmAsync(RfmFilter? filter = null);
        Task<CustomerRfmData?> GetCustomerRfmAsync(int customerId);
        Task<int> GetCustomerCountByFilterAsync(RfmFilter filter);
        Task<IEnumerable<int>> GetCustomerIdsByFilterAsync(RfmFilter filter);
    }
}
