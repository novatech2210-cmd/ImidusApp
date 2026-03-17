namespace IntegrationService.Core.Interfaces;

public interface IMiscRepository
{
    Task<Dictionary<string, decimal>> GetTaxRatesAsync();
    Task<decimal> GetTaxRateAsync(string taxCode);
}
