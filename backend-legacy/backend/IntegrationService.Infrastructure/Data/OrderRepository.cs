using System;
using System.Collections.Generic;
using System.Data;
using System.Threading.Tasks;
using IntegrationService.Core.Domain.Entities;
using IntegrationService.Core.Interfaces;

namespace IntegrationService.Infrastructure.Data
{
    /// <summary>
    /// Order repository that delegates to PosRepository for order-related operations
    /// </summary>
    public class OrderRepository : IOrderRepository
    {
        private readonly IPosRepository _posRepository;

        public OrderRepository(IPosRepository posRepository)
        {
            _posRepository = posRepository;
        }

        public Task<IDbTransaction> BeginTransactionAsync()
        {
            return _posRepository.BeginTransactionAsync();
        }

        public Task<int> GetNextDailyOrderNumberAsync()
        {
            return _posRepository.GetNextDailyOrderNumberAsync();
        }

        public Task<int> InsertTicketAsync(PosTicket ticket, IDbTransaction? transaction = null)
        {
            // For backward compatibility - maps to CreateOpenOrderAsync or direct insert based on TransType
            if (ticket.TransType == 2)
            {
                return _posRepository.CreateOpenOrderAsync(ticket, transaction);
            }
            // For completed sales, would use different method - but for now delegate
            throw new NotImplementedException("Direct completed sale insert not implemented - use CreateOpenOrderAsync");
        }

        public Task<int> CreateOpenOrderAsync(PosTicket ticket, IDbTransaction? transaction = null)
        {
            return _posRepository.CreateOpenOrderAsync(ticket, transaction);
        }

        public Task<PosTicket?> GetTicketByIdAsync(int salesId)
        {
            return _posRepository.GetTicketByIdAsync(salesId);
        }

        public Task<IEnumerable<PosTicket>> GetOrdersByDateRangeAsync(DateTime startDate, DateTime endDate)
        {
            return _posRepository.GetOrdersByDateRangeAsync(startDate, endDate);
        }

        public Task InsertTicketItemAsync(PosTicketItem item, IDbTransaction? transaction = null)
        {
            return _posRepository.InsertSalesDetailItemAsync(item, transaction);
        }

        public Task InsertPendingOrderItemAsync(PendingOrderItem item, IDbTransaction? transaction = null)
        {
            return _posRepository.InsertPendingOrderItemAsync(item, transaction);
        }

        public Task<IEnumerable<PosTicketItem>> GetTicketItemsAsync(int salesId)
        {
            return _posRepository.GetSalesDetailItemsAsync(salesId);
        }

        public Task InsertPaymentAsync(PosTender payment, IDbTransaction? transaction = null)
        {
            return _posRepository.InsertPaymentAsync(payment, transaction);
        }

        public Task<IEnumerable<PosTender>> GetPaymentsAsync(int salesId)
        {
            return _posRepository.GetPaymentsAsync(salesId);
        }
    }
}
