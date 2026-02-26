using System;
using System.Collections.Generic;
using System.Data;
using System.Threading.Tasks;
using IntegrationService.Core.Domain.Entities;

namespace IntegrationService.Core.Interfaces
{
    /// <summary>
    /// Repository interface for INI POS database operations
    ///
    /// ORDER LIFECYCLE:
    /// 1. Create tblSales with TransType=2 (Open) via CreateOpenOrderAsync
    /// 2. Insert items into tblPendingOrders via InsertPendingOrderItemAsync
    /// 3. Process payment via InsertPaymentAsync
    /// 4. Complete order via MovePendingOrdersToSalesDetailAsync + UpdateSaleTransTypeAsync
    /// </summary>
    public interface IPosRepository
    {
        // =============================================================================
        // TRANSACTION MANAGEMENT
        // =============================================================================

        Task<IDbTransaction> BeginTransactionAsync();

        // =============================================================================
        // MENU ITEMS
        // =============================================================================

        Task<IEnumerable<MenuItem>> GetActiveMenuItemsAsync();
        Task<MenuItem?> GetMenuItemByIdAsync(int itemId);
        Task<IEnumerable<AvailableSize>> GetItemSizesAsync(int itemId);
        Task<IEnumerable<Category>> GetCategoriesAsync();
        Task<Dictionary<int, int>> GetCategoryItemCountsAsync();
        Task<IEnumerable<MenuItem>> GetMenuItemsByCategoryAsync(int categoryId);
        Task<int?> GetItemStockAsync(int itemId, int sizeId);
        Task<bool> IsItemInStockAsync(int itemId, int sizeId, decimal quantity);
        Task<bool> DecreaseStockAsync(int itemId, int sizeId, decimal quantity, IDbTransaction? transaction = null);

        // =============================================================================
        // ORDERS (tblSales)
        // =============================================================================

        Task<int> GetNextDailyOrderNumberAsync();
        Task<int> CreateOpenOrderAsync(PosTicket ticket, IDbTransaction? transaction = null, string? customerName = null);
        Task<PosTicket?> GetTicketByIdAsync(int salesId);
        Task CompleteOrderAsync(int salesId, IDbTransaction transaction);
        Task<bool> UpdateSaleTransTypeAsync(int salesId, int transType, IDbTransaction? transaction = null);
        Task<bool> UpdateSaleTotalsAsync(int salesId, decimal subTotal, decimal gstAmt, decimal pstAmt, decimal pst2Amt, decimal dscAmt, IDbTransaction? transaction = null);
        Task<IEnumerable<PosTicket>> GetOrdersByDateRangeAsync(DateTime startDate, DateTime endDate);

        // =============================================================================
        // PENDING ORDERS (tblPendingOrders) - Active items in kitchen
        // =============================================================================

        Task InsertPendingOrderItemAsync(PendingOrderItem item, IDbTransaction? transaction = null);
        Task<IEnumerable<PendingOrderItem>> GetPendingOrderItemsAsync(int salesId);
        Task MovePendingOrdersToSalesDetailAsync(int salesId, IDbTransaction? transaction = null);
        Task DeletePendingOrderItemsAsync(int salesId, IDbTransaction? transaction = null);

        // =============================================================================
        // SALES DETAIL (tblSalesDetail) - Completed order items
        // =============================================================================

        Task<IEnumerable<PosTicketItem>> GetSalesDetailItemsAsync(int salesId);
        Task InsertSalesDetailItemAsync(PosTicketItem item, IDbTransaction? transaction = null);

        // =============================================================================
        // PAYMENTS (tblPayment)
        // =============================================================================

        Task InsertPaymentAsync(PosTender payment, IDbTransaction? transaction = null);
        Task UpdateSalePaymentTotalsAsync(int salesId, PosTender payment, IDbTransaction? transaction = null);
        Task<IEnumerable<PosTender>> GetPaymentsAsync(int salesId);
        Task<bool> VoidPaymentAsync(int paymentId, IDbTransaction? transaction = null);

        // =============================================================================
        // ONLINE ORDERS
        // =============================================================================

        Task InsertOnlineSalesLinkAsync(SalesOfOnlineOrder link, IDbTransaction? transaction = null);
        Task<IEnumerable<OnlineOrderCompany>> GetOnlineOrderCompaniesAsync();

        // =============================================================================
        // TAX CONFIGURATION
        // =============================================================================

        Task<decimal> GetTaxRateAsync(string taxCode);
        Task<TaxRates> GetTaxRatesAsync();

        // =============================================================================
        // CUSTOMERS
        // =============================================================================

        Task<PosCustomer?> GetCustomerByPhoneAsync(string phone);
        Task<PosCustomer?> GetCustomerByIdAsync(int id);
        Task<int> InsertCustomerAsync(PosCustomer customer);
        Task<bool> UpdateLoyaltyPointsAsync(int customerId, int points, IDbTransaction? transaction = null);
        Task InsertPointsDetailAsync(PointsDetail detail, IDbTransaction? transaction = null);

        // =============================================================================
        // GIFT CARDS
        // =============================================================================

        Task<PrepaidCard?> GetPrepaidCardAsync(string barcode);
        Task<bool> UpdatePrepaidCardBalanceAsync(int cardId, decimal amount, IDbTransaction? transaction = null);
    }
}
