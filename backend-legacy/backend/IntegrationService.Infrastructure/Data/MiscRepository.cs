using IntegrationService.Core.Interfaces;
using Microsoft.Extensions.Logging;

namespace IntegrationService.Infrastructure.Data;

public class MiscRepository : IMiscRepository
{
    private readonly IPosRepository _posRepo;
    private readonly ILogger<MiscRepository> _logger;

    public MiscRepository(IPosRepository posRepo, ILogger<MiscRepository> logger)
    {
        _posRepo = posRepo;
        _logger = logger;
    }

    public async Task<Dictionary<string, decimal>> GetTaxRatesAsync()
    {
        var taxRates = await _posRepo.GetTaxRatesAsync();
        return new Dictionary<string, decimal>
        {
            { "GST", taxRates.GST },
            { "PST", taxRates.PST },
            { "PST2", taxRates.PST2 }
        };
    }

    public async Task<decimal> GetTaxRateAsync(string taxCode)
    {
        return await _posRepo.GetTaxRateAsync(taxCode);
    }
}
