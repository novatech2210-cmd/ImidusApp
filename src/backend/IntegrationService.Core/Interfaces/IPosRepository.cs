using IntegrationService.Core.Domain.Entities;

using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace IntegrationService.Core.Interfaces
{
    public interface IPosRepository
    {
        Task<IDbTransaction> BeginTransactionAsync();
        Task<int> CreateOpenOrderAsync(PosTicket sale, IDbTransaction? transaction);
        Task CompleteOrderAsync(int salesId, IDbTransaction transaction);
        Task<IEnumerable<PosTicketItem>> GetSalesDetailItemsAsync(int salesId);
        Task<IEnumerable<PendingOrderItem>> GetPendingOrderItemsAsync(int salesId);
        Task MovePendingOrdersToSalesDetailAsync(int salesId, IDbTransaction? transaction);
        Task UpdateSaleTransTypeAsync(int salesId, int transType, IDbTransaction? transaction);
        Task InsertPendingOrderItemAsync(PendingOrderItem item, IDbTransaction? transaction);
        Task<int> GetNextDailyOrderNumberAsync();
        Task<ItemStock?> GetItemStockAsync(int itemId, int sizeId);
        Task<bool> DecreaseStockAsync(int itemId, int sizeId, decimal quantity, IDbTransaction? transaction);
        Task<IEnumerable<AvailableSize>> GetItemSizesAsync(int itemId);
        Task<IEnumerable<MenuItem>> GetActiveMenuItemsAsync();
        Task<TaxRates> GetTaxRatesAsync();
        Task<PosTicket?> GetTicketByIdAsync(int salesId);
        Task<IEnumerable<PosTender>> GetPaymentsAsync(int salesId);
        Task InsertPaymentAsync(PosTender tender, IDbTransaction? transaction);
        Task UpdateSalePaymentTotalsAsync(int salesId, PosTender tender, IDbTransaction? transaction);
        Task UpdateSaleTotalsAsync(int salesId, decimal subTotal, decimal gstAmt, decimal pstAmt, decimal pst2Amt, decimal dscAmt, IDbTransaction? transaction);
        Task DeletePendingOrderItemsAsync(int salesId, IDbTransaction? transaction);
        Task InsertOnlineSalesLinkAsync(SalesOfOnlineOrder link, IDbTransaction? transaction);
        Task<int?> GetOnlineOrderCompanyIdAsync(int salesId);
        Task<bool> RecordPointsTransactionAsync(int salesId, int customerId, int pointsRedeemed, int pointsSaved, IDbTransaction? transaction);
        Task<PosCustomer?> GetCustomerByIdAsync(int id);
        Task<int> UpdateLoyaltyPointsAsync(int customerId, int pointsDelta, IDbTransaction? transaction);
    }
}
