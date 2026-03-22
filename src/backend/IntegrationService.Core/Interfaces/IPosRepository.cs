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
        Task<int> CreateOpenOrderAsync(PosTicket sale, IDbTransaction? transaction = null);
        Task CompleteOrderAsync(int salesId, IDbTransaction transaction);
        Task<IEnumerable<PosTicketItem>> GetSalesDetailItemsAsync(int salesId);
        Task<IEnumerable<PendingOrderItem>> GetPendingOrderItemsAsync(int salesId);
        Task MovePendingOrdersToSalesDetailAsync(int salesId, IDbTransaction? transaction = null);
        Task UpdateSaleTransTypeAsync(int salesId, int transType, IDbTransaction? transaction = null);
        Task InsertPendingOrderItemAsync(PendingOrderItem item, IDbTransaction? transaction = null);
        Task<int> GetNextDailyOrderNumberAsync();
        Task<ItemStock?> GetItemStockAsync(int itemId, int sizeId);
        Task<bool> DecreaseStockAsync(int itemId, int sizeId, decimal quantity, IDbTransaction? transaction = null);
        Task<IEnumerable<AvailableSize>> GetItemSizesAsync(int itemId);
        Task<IEnumerable<MenuItem>> GetActiveMenuItemsAsync();
        Task<TaxRates> GetTaxRatesAsync();
        Task<PosTicket?> GetTicketByIdAsync(int salesId);
        Task<IEnumerable<PosTender>> GetPaymentsAsync(int salesId);
        Task InsertPaymentAsync(PosTender tender, IDbTransaction? transaction = null);
        Task UpdateSalePaymentTotalsAsync(int salesId, PosTender tender, IDbTransaction? transaction = null);
        Task UpdateSaleTotalsAsync(int salesId, decimal subTotal, decimal gstAmt, decimal pstAmt, decimal pst2Amt, decimal dscAmt, IDbTransaction? transaction = null);
        Task DeletePendingOrderItemsAsync(int salesId, IDbTransaction? transaction = null);
        Task InsertOnlineSalesLinkAsync(SalesOfOnlineOrder link, IDbTransaction? transaction = null);
        Task<int?> GetOnlineOrderCompanyIdAsync(int salesId);
        Task<bool> RecordPointsTransactionAsync(int salesId, int customerId, int pointsRedeemed, int pointsSaved, IDbTransaction? transaction = null);
        Task<PosCustomer?> GetCustomerByIdAsync(int id);
        Task<int> UpdateLoyaltyPointsAsync(int customerId, int pointsDelta, IDbTransaction? transaction = null);
        Task<MenuItem?> GetMenuItemByIdAsync(int itemId);
        Task<PosCustomer?> GetCustomerByPhoneAsync(string phone);
        Task<decimal> GetTaxRateAsync(string taxCode);
        Task<int> InsertCustomerAsync(PosCustomer customer);
        Task<IEnumerable<PosTicket>> GetOrdersByDateRangeAsync(DateTime startDate, DateTime endDate);
        Task InsertSalesDetailItemAsync(PosTicketItem item, IDbTransaction? transaction = null);
        Task<bool> IsItemInStockAsync(int itemId, int sizeId, decimal quantity);
        Task<IEnumerable<PosTicket>> GetCompletedOnlineOrdersAsync();
        Task<IEnumerable<Category>> GetCategoriesAsync();
        Task<Dictionary<int, int>> GetCategoryItemCountsAsync();
        Task<IEnumerable<MenuItem>> GetMenuItemsByCategoryAsync(int categoryId);
        Task<PosCustomer?> GetCustomerByEmailAsync(string email);
        Task<IEnumerable<PointsDetail>> GetLoyaltyHistoryAsync(int customerId, int limit = 50);
        Task<IEnumerable<CustomerSegment>> GetCustomerSegmentsAsync();
    }
}
