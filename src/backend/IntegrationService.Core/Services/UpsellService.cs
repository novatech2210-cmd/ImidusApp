using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using IntegrationService.Core.Domain.Entities;
using IntegrationService.Core.Interfaces;

namespace IntegrationService.Core.Services
{
    public class UpsellService : IUpsellService
    {
        private readonly IPosRepository _posRepo;

        public UpsellService(IPosRepository posRepository)
        {
            _posRepo = posRepository;
        }

        public async Task<IEnumerable<MenuItem>> GetUpsellSuggestionsAsync(int[] currentItemIds)
        {
            // Suggest items from 'Drinks' or 'Sides' categories if they aren't already in the cart.
            var onlineItems = await _posRepo.GetActiveMenuItemsAsync();
            
            // Assume Category ID 3 is Drinks and 4 is Sides
            return onlineItems
                .Where(i => (i.CategoryID == 3 || i.CategoryID == 4) && !currentItemIds.Contains(i.ItemID))
                .Take(3);
        }
    }
}
