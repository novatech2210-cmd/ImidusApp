using IntegrationService.Core.Models.AdminPortal;
using System.Threading.Tasks;

namespace IntegrationService.Core.Interfaces
{
    /// <summary>
    /// Service for communicating with the Verifone/Ingenico terminal bridge
    /// </summary>
    public interface ITerminalBridgeService
    {
        /// <summary>
        /// Request a payment from the terminal bridge
        /// </summary>
        Task<TerminalBridgeTransaction> RequestPaymentAsync(int salesId, string orderNumber, decimal amount);

        /// <summary>
        /// Process a notification from the terminal bridge
        /// </summary>
        Task<bool> ProcessBridgeCallbackAsync(TerminalBridgeCallback callback);

        /// <summary>
        /// Get transaction status
        /// </summary>
        Task<TerminalBridgeTransaction?> GetTransactionStatusAsync(int transactionId);
    }

    public class TerminalBridgeCallback
    {
        public string BridgeRequestId { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string? AuthCode { get; set; }
        public string? TransactionId { get; set; }
        public string? CardLastFour { get; set; }
        public string? CardType { get; set; }
        public string? ErrorMessage { get; set; }
    }
}
