using System;
using System.Collections.Generic;
using System.Data;
using System.Threading.Tasks;
using IntegrationService.Core.Domain.Entities;

namespace IntegrationService.Core.Interfaces
{
    public interface IPosRepository
    {
        Task<IDbTransaction> BeginTransactionAsync();

        // Menu Items
        Task<IEnumerable<MenuItem>> GetActiveMenuItemsAsync();
        Task<IEnumerable<AvailableSize>> GetItemSizesAsync(int itemId);
        Task<int?> GetItemStockAsync(int itemId, int sizeId);
        Task<bool> IsItemInStockAsync(int itemId, int sizeId, decimal quantity);
        Task<bool> DecreaseStockAsync(int itemId, int sizeId, decimal quantity, IDbTransaction? transaction = null);

        // Orders
        Task<int> GetNextDailyOrderNumberAsync();
        Task<int> InsertTicketAsync(PosTicket ticket, IDbTransaction? transaction = null);
        Task<PosTicket?> GetTicketByIdAsync(int salesId);
        Task<IEnumerable<PosTicket>> GetOrdersByDateRangeAsync(DateTime startDate, DateTime endDate);

        // Ticket Items
        Task InsertTicketItemAsync(PosTicketItem item, IDbTransaction? transaction = null);
        Task<IEnumerable<PosTicketItem>> GetTicketItemsAsync(int salesId);

        // Payments
        Task InsertPaymentAsync(PosTender payment, IDbTransaction? transaction = null);
        Task<IEnumerable<PosTender>> GetPaymentsAsync(int salesId);

        // Tax Configuration
        Task<decimal> GetTaxRateAsync(string taxCode);
        Task<TaxRates> GetTaxRatesAsync();

        // Customers
        Task<PosCustomer?> GetCustomerByPhoneAsync(string phone);
        Task<PosCustomer?> GetCustomerByIdAsync(int id);
        Task<int> InsertCustomerAsync(PosCustomer customer);
        Task<bool> UpdateLoyaltyPointsAsync(int customerId, decimal points);
    }

    /// <summary>
    /// Helper class for tax rates
    /// </summary>
    public class TaxRates
    {
        public decimal GST { get; set; }
        public decimal PST { get; set; }
        public decimal PST2 { get; set; }
    }
}
