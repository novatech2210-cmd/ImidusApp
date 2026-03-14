using IntegrationService.Core.Interfaces;
using IntegrationService.Core.Models;

namespace IntegrationService.Infrastructure.Services;

public class MockPaymentService : IPaymentService
{
    public Task<PaymentResult> ChargeCardAsync(PaymentRequest request)
    {
        // For testing: any token value starting with 'error' fails
        if (request.Token.DataValue.StartsWith("error"))
        {
            return Task.FromResult(new PaymentResult
            {
                Success = false,
                ErrorMessage = "Card declined (Mock)",
                ErrorCode = "DECLINED"
            });
        }

        return Task.FromResult(new PaymentResult
        {
            Success = true,
            TransactionId = "MTX_" + Guid.NewGuid().ToString("N").Substring(0, 12).ToUpper(),
            AuthorizationCode = "MA_" + Guid.NewGuid().ToString("N").Substring(0, 6).ToUpper(),
            Last4Digits = "1234",
            CardType = "Visa"
        });
    }

    public Task<bool> VoidTransactionAsync(string transactionId)
    {
        // Mock always succeeds unless transaction ID contains "settled"
        if (transactionId.Contains("SETTLED"))
        {
            return Task.FromResult(false);
        }

        return Task.FromResult(true);
    }

    public Task<CustomerProfileResult> CreateCustomerProfileAsync(SavedCardRequest request)
    {
        return Task.FromResult(new CustomerProfileResult
        {
            Success = true,
            ProfileId = "MOCK_PROFILE_" + request.CustomerId,
            PaymentProfileId = "MOCK_PAYMENT_" + Guid.NewGuid().ToString("N").Substring(0, 8)
        });
    }
}
