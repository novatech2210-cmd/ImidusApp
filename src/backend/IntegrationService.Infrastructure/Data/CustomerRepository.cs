using IntegrationService.Core.Domain.Entities;
using IntegrationService.Core.Interfaces;

namespace IntegrationService.Infrastructure.Data
{
    /// <summary>
    /// Repository for customer operations, wrapping the main POS repository
    /// </summary>
    public class CustomerRepository : ICustomerRepository
    {
        private readonly IPosRepository _posRepo;

        public CustomerRepository(IPosRepository posRepository)
        {
            _posRepo = posRepository;
        }

        public Task<PosCustomer?> GetCustomerByIdAsync(int id)
        {
            return _posRepo.GetCustomerByIdAsync(id);
        }

        public Task<PosCustomer?> GetCustomerByPhoneAsync(string phone)
        {
            return _posRepo.GetCustomerByPhoneAsync(phone);
        }

        public Task<int> InsertCustomerAsync(PosCustomer customer)
        {
            return _posRepo.InsertCustomerAsync(customer);
        }

        public async Task<bool> UpdateLoyaltyPointsAsync(int customerId, decimal points)
        {
            // Convert decimal to int for the underlying repository
            var result = await _posRepo.UpdateLoyaltyPointsAsync(customerId, (int)points, null);
            return result >= 0; // If it returned points, it was successful
        }
    }
}
