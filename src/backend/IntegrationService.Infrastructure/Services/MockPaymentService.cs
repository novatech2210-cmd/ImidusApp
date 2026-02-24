using IntegrationService.Core.Interfaces;

namespace IntegrationService.Infrastructure.Services;

public class MockPaymentService : IPaymentService
{
    public Task<(bool Success, string? AuthorizationCode, string? Message)> ProcessPaymentAsync(decimal amount, string paymentToken)
    {
        // For testing: any token starting with 'tok_error' fails
        if (paymentToken.StartsWith("tok_error"))
        {
            return Task.FromResult<(bool Success, string? AuthorizationCode, string? Message)>((false, null, "Card declined (Mock)"));
        }

        return Task.FromResult<(bool Success, string? AuthorizationCode, string? Message)>((true, "MOCK_AUTH_" + Guid.NewGuid().ToString("N").Substring(0, 8).ToUpper(), null));
    }
}
