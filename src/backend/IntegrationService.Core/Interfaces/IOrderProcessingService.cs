using System.Threading.Tasks;
using IntegrationService.Core.Domain.Entities;

namespace IntegrationService.Core.Interfaces
{
    /// <summary>
    /// Service interface for order processing in INI POS.
    ///
    /// ORDER LIFECYCLE:
    /// 1. CreateOrderAsync - Creates open order with items in tblPendingOrders
    /// 2. CompleteOrderAsync - Moves items to tblSalesDetail, updates TransType=1
    /// 3. CancelOrderAsync - Deletes pending items, updates TransType=0
    /// </summary>
    public interface IOrderProcessingService
    {
        /// <summary>
        /// Create a new order in the POS system.
        /// Creates an OPEN order (TransType=2) with items in tblPendingOrders.
        /// If payment auth code is provided, automatically completes the order.
        /// </summary>
        Task<OrderResult> CreateOrderAsync(CreateOrderRequest request, string idempotencyKey);

        /// <summary>
        /// Complete an open order: move items from tblPendingOrders to tblSalesDetail
        /// and update TransType from 2 (Open) to 1 (Completed)
        /// </summary>
        Task<bool> CompleteOrderAsync(int salesId);

        /// <summary>
        /// Cancel an open order: delete pending items and mark as refund (TransType=0)
        /// </summary>
        Task<bool> CancelOrderAsync(int salesId);

        /// <summary>
        /// Get order details including items (from pending or sales detail based on status)
        /// </summary>
        Task<PosTicket?> GetOrderAsync(int salesId);
    }
}
