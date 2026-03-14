using IntegrationService.Core.Domain.Entities;

namespace IntegrationService.Core.Interfaces;

public interface ICustomerRepository
{
    Task<PosCustomer?> GetCustomerByIdAsync(int id);
    Task<PosCustomer?> GetCustomerByPhoneAsync(string phone);
    Task<int> InsertCustomerAsync(PosCustomer customer);
    Task<bool> UpdateLoyaltyPointsAsync(int customerId, decimal points);
}
