using IntegrationService.Core.Models;

namespace IntegrationService.Core.Interfaces
{
    /// <summary>
    /// Payment processing service for Authorize.net integration
    /// </summary>
    public interface IPaymentService
    {
        /// <summary>
        /// Charge a credit card using an opaque payment token
        /// </summary>
        /// <param name="request">Payment request with token and amount</param>
        /// <returns>Payment result with transaction ID or error</returns>
        Task<PaymentResult> ChargeCardAsync(PaymentRequest request);

        /// <summary>
        /// Void a transaction (must be done before settlement, typically same day)
        /// </summary>
        /// <param name="transactionId">Authorize.net transaction ID to void</param>
        /// <returns>True if void successful, false otherwise</returns>
        Task<bool> VoidTransactionAsync(string transactionId);

        /// <summary>
        /// Create a customer payment profile for saved card functionality
        /// </summary>
        /// <param name="request">Saved card request with customer info and token</param>
        /// <returns>Customer profile result with profile IDs or error</returns>
        Task<CustomerProfileResult> CreateCustomerProfileAsync(SavedCardRequest request);
    }
}
