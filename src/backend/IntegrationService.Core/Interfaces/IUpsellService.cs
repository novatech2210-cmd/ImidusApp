using IntegrationService.Core.Domain.Entities;

namespace IntegrationService.Core.Interfaces;

public interface IUpsellService
{
    Task<IEnumerable<MenuItem>> GetUpsellSuggestionsAsync(int[] currentItemIds);
}
