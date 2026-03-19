using IntegrationService.Core.Configuration;
using IntegrationService.Core.Interfaces;
using IntegrationService.Core.Models;
using IntegrationService.Core.Domain.Entities;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System;
using System.Threading.Tasks;

namespace IntegrationService.Core.Services
{
    public class PaymentService : IPaymentService
    {
        private readonly AuthorizeNetSettings _settings;
        private readonly ILogger<PaymentService> _logger;

        public PaymentService(
            IOptions<AuthorizeNetSettings> settings,
            ILogger<PaymentService> logger)
        {
            _settings = settings.Value;
            _logger = logger;
        }

        public Task<PaymentResult> ChargeCardAsync(PaymentRequest request)
        {
            _logger.LogWarning("PaymentService.ChargeCardAsync called - STUB MODE (AuthorizeNet not configured)");

            var result = new PaymentResult
            {
                Success = true,
                TransactionId = $"STUB_{DateTime.UtcNow:yyyyMMddHHmmss}",
                AuthorizationCode = "STUB_AUTH",
                Last4Digits = "4242",
                CardType = "VISA"
            };

            _logger.LogInformation("STUB payment approved - TransactionId: {TransactionId}", result.TransactionId);
            return Task.FromResult(result);
        }

        public Task<bool> VoidTransactionAsync(string transactionId)
        {
            _logger.LogWarning("PaymentService.VoidTransactionAsync called - STUB MODE (AuthorizeNet not configured)");
            _logger.LogInformation("STUB void successful - TransactionId: {TransactionId}", transactionId);
            return Task.FromResult(true);
        }

        public Task<CustomerProfileResult> CreateCustomerProfileAsync(SavedCardRequest request)
        {
            _logger.LogWarning("PaymentService.CreateCustomerProfileAsync called - STUB MODE (AuthorizeNet not configured)");

            var result = new CustomerProfileResult
            {
                Success = true,
                ProfileId = $"STUB_PROFILE_{request.CustomerId}",
                PaymentProfileId = $"STUB_PAYMENT_PROFILE_{request.CustomerId}"
            };

            _logger.LogInformation("STUB customer profile created - CustomerId: {CustomerId}, ProfileId: {ProfileId}",
                request.CustomerId, result.ProfileId);
            return Task.FromResult(result);
        }
    }
}
