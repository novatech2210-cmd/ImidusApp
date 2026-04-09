using System;
using System.Threading.Tasks;
using IntegrationService.Core.Interfaces;

namespace IntegrationService.Core.Services
{
    public class LoyaltyService : ILoyaltyService
    {
        private readonly ICustomerRepository _customerRepo;

        public LoyaltyService(ICustomerRepository customerRepository)
        {
            _customerRepo = customerRepository;
        }

        public async Task UpdatePointsAfterSaleAsync(int customerId, decimal saleAmount)
        {
            var customer = await _customerRepo.GetCustomerByIdAsync(customerId);
            if (customer == null) return;

            // Per AGENTS.md: Loyalty earn = 1 pt per $10 spent (tblMisc SRPR = '10@1')
            decimal pointsToAdd = Math.Floor(saleAmount / 10m);
            decimal newPoints = customer.EarnedPoints + pointsToAdd;

            await _customerRepo.UpdateLoyaltyPointsAsync(customerId, newPoints);
        }

        public async Task RedeemPointsAsync(int customerId, decimal points)
        {
            var customer = await _customerRepo.GetCustomerByIdAsync(customerId);
            if (customer == null) return;

            decimal newPoints = Math.Max(0, customer.EarnedPoints - points);
            await _customerRepo.UpdateLoyaltyPointsAsync(customerId, newPoints);
        }
    }
}
