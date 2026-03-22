namespace IntegrationService.Core.Interfaces;

public interface ILoyaltyService
{
    Task UpdatePointsAfterSaleAsync(int customerId, decimal saleAmount);
    Task RedeemPointsAsync(int customerId, decimal points);
}
