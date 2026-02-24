using System.Data;
using IntegrationService.Core.Domain.Entities;

namespace IntegrationService.Core.Interfaces;

public interface IOrderRepository
{
    Task<IDbTransaction> BeginTransactionAsync();
    Task<int> GetNextDailyOrderNumberAsync();
    Task<int> InsertTicketAsync(PosTicket ticket, IDbTransaction? transaction = null);
    Task<PosTicket?> GetTicketByIdAsync(int salesId);
    Task<IEnumerable<PosTicket>> GetOrdersByDateRangeAsync(DateTime startDate, DateTime endDate);
    Task InsertTicketItemAsync(PosTicketItem item, IDbTransaction? transaction = null);
    Task<IEnumerable<PosTicketItem>> GetTicketItemsAsync(int salesId);
    Task InsertPaymentAsync(PosTender payment, IDbTransaction? transaction = null);
    Task<IEnumerable<PosTender>> GetPaymentsAsync(int salesId);
}
