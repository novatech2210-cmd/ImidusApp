using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using IntegrationService.Core.Domain.Entities;
using IntegrationService.Core.Interfaces;

namespace IntegrationService.Core.Services
{
    public class BirthdayRewardService
    {
        private readonly IPosRepository _posRepo;

        public BirthdayRewardService(IPosRepository posRepository)
        {
            _posRepo = posRepository;
        }

        public async Task<IEnumerable<PosCustomer>> GetCustomersWithBirthdayTodayAsync()
        {
            // Placeholder: real implementation would query tblCustomer
            return new List<PosCustomer>(); 
        }

        public async Task ApplyBirthdayPointsAsync(int customerId)
        {
            var customer = await _posRepo.GetCustomerByIdAsync(customerId);
            if (customer != null)
            {
                // Give 500 bonus points for birthday
                await _posRepo.UpdateLoyaltyPointsAsync(customerId, customer.EarnedPoints + 500);
            }
        }
    }
}
