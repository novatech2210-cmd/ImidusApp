using System;
using System.Collections.Generic;
using System.Data;
using Microsoft.Data.SqlClient;
using System.Linq;
using System.Threading.Tasks;
using Dapper;
using IntegrationService.Core.Domain.Entities;
using IntegrationService.Core.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace IntegrationService.Infrastructure.Data
{
    /// <summary>
    /// Repository for INI POS database operations
    /// Database: TPPro (SQL Server 2005 Express)
    ///
    /// ORDER LIFECYCLE:
    /// 1. Create tblSales with TransType=2 (Open)
    /// 2. Insert items into tblPendingOrders (active items)
    /// 3. Process payment → Insert tblPayment
    /// 4. Complete order → Update TransType=1, move items to tblSalesDetail
    /// </summary>
    public class PosRepository : IPosRepository
    {
        private readonly string _connectionString;
        private readonly ILogger<PosRepository> _logger;
        private readonly IOrderNumberRepository _orderNumberRepo;

        public PosRepository(
            IConfiguration configuration,
            ILogger<PosRepository> logger,
            IOrderNumberRepository orderNumberRepo)
        {
            _connectionString = configuration.GetConnectionString("PosDatabase")
                ?? throw new ArgumentNullException("PosDatabase connection string not found");
            _logger = logger;
            _orderNumberRepo = orderNumberRepo;
        }

        private IDbConnection CreateConnection()
        {
            return new SqlConnection(_connectionString);
        }

        public async Task<IDbTransaction> BeginTransactionAsync()
        {
            var connection = CreateConnection();
            connection.Open();
            return connection.BeginTransaction();
        }

        // =============================================================================
        // MENU ITEMS
        // =============================================================================

        #region Menu Items

        /// <summary>
        /// Get all active menu items available for online ordering
        /// Joins with tblAvailableSize for pricing and stock
        /// </summary>
        public async Task<IEnumerable<MenuItem>> GetActiveMenuItemsAsync()
        {
            const string sql = @"
                SELECT
                    i.ID AS ItemID,
                    i.IName,
                    i.IName2,
                    i.ItemDescription,
                    i.ImageFilePath,
                    i.CategoryID,
                    i.Status,
                    i.OnlineItem,
                    i.Alcohol,
                    i.BarCode,
                    i.ManageInv,
                    i.ApplyGST,
                    i.ApplyPST,
                    i.ApplyPST2,
                    i.KitchenB,
                    i.KitchenF,
                    i.KitchenE,
                    i.Bar,
                    i.Taste,
                    i.OpenItem,
                    i.ScaleItem
                FROM dbo.tblItem i
                WHERE i.Status = 1
                  AND i.OnlineItem = 1
                ORDER BY i.CategoryID, i.IName";

            using var connection = CreateConnection();
            var items = await connection.QueryAsync<MenuItem>(sql);

            _logger.LogInformation("Retrieved {Count} active menu items", items.Count());
            return items;
        }

        /// <summary>
        /// Get menu item by ID with all sizes
        /// </summary>
        public async Task<MenuItem?> GetMenuItemByIdAsync(int itemId)
        {
            const string sql = @"
                SELECT
                    i.ID AS ItemID,
                    i.IName,
                    i.IName2,
                    i.ItemDescription,
                    i.ImageFilePath,
                    i.CategoryID,
                    i.Status,
                    i.OnlineItem,
                    i.Alcohol,
                    i.ApplyGST,
                    i.ApplyPST,
                    i.ApplyPST2,
                    i.KitchenB,
                    i.KitchenF,
                    i.KitchenE,
                    i.Bar
                FROM dbo.tblItem i
                WHERE i.ID = @ItemId";

            using var connection = CreateConnection();
            var item = await connection.QueryFirstOrDefaultAsync<MenuItem>(sql, new { ItemId = itemId });

            if (item != null)
            {
                item.AvailableSizes = (await GetItemSizesAsync(itemId)).ToList();
            }

            return item;
        }

        /// <summary>
        /// Get all available sizes for a menu item
        /// </summary>
        public async Task<IEnumerable<AvailableSize>> GetItemSizesAsync(int itemId)
        {
            const string sql = @"
                SELECT
                    a.ItemID,
                    a.SizeID,
                    a.UnitPrice,
                    a.UnitPrice2,
                    a.UnitPrice3,
                    a.OnHandQty,
                    a.ApplyNoDSC,
                    s.ID AS SizeID,
                    s.SizeName,
                    s.ShortName,
                    s.DisplayOrder
                FROM dbo.tblAvailableSize a
                INNER JOIN dbo.tblSize s ON a.SizeID = s.ID
                WHERE a.ItemID = @ItemId
                ORDER BY s.DisplayOrder";

            using var connection = CreateConnection();

            var sizes = await connection.QueryAsync<AvailableSize, Size, AvailableSize>(
                sql,
                (availableSize, size) =>
                {
                    availableSize.Size = size;
                    return availableSize;
                },
                new { ItemId = itemId },
                splitOn: "SizeID"
            );

            return sizes;
        }

        /// <summary>
        /// Get all categories that have at least one available online item
        /// Only returns categories with OnlineItem=1 and Status=1 items
        /// </summary>
        public async Task<IEnumerable<Category>> GetCategoriesAsync()
        {
            const string sql = @"
                SELECT DISTINCT
                    c.ID AS CategoryID,
                    c.CatName AS CName,
                    c.PrintOrder,
                    c.CategoryImageFilePath
                FROM dbo.tblCategory c
                INNER JOIN dbo.tblItem i ON c.ID = i.CategoryID
                WHERE c.Status = 1
                  AND i.OnlineItem = 1
                  AND i.Status = 1
                ORDER BY c.PrintOrder";

            using var connection = CreateConnection();
            return await connection.QueryAsync<Category>(sql);
        }

        /// <summary>
        /// Get count of available items per category
        /// Returns dictionary of CategoryID -> item count (only OnlineItem=1, Status=1)
        /// </summary>
        public async Task<Dictionary<int, int>> GetCategoryItemCountsAsync()
        {
            const string sql = @"
                SELECT
                    CategoryID,
                    COUNT(*) AS ItemCount
                FROM dbo.tblItem
                WHERE OnlineItem = 1
                  AND Status = 1
                GROUP BY CategoryID";

            using var connection = CreateConnection();
            var results = await connection.QueryAsync<(int CategoryID, int ItemCount)>(sql);
            return results.ToDictionary(r => r.CategoryID, r => r.ItemCount);
        }

        /// <summary>
        /// Get menu items filtered by category
        /// Returns only items available for online ordering (OnlineItem=1, Status=1)
        /// Ordered by PrintOrder to match POS display order
        /// </summary>
        public async Task<IEnumerable<MenuItem>> GetMenuItemsByCategoryAsync(int categoryId)
        {
            const string sql = @"
                SELECT
                    i.ID AS ItemID,
                    i.IName,
                    i.IName2,
                    i.ItemDescription,
                    i.ImageFilePath,
                    i.CategoryID,
                    i.Status,
                    i.OnlineItem,
                    i.Alcohol,
                    i.BarCode,
                    i.ManageInv,
                    i.ApplyGST,
                    i.ApplyPST,
                    i.ApplyPST2,
                    i.KitchenB,
                    i.KitchenF,
                    i.KitchenE,
                    i.Bar,
                    i.Taste,
                    i.OpenItem,
                    i.ScaleItem,
                    i.PrintOrder
                FROM dbo.tblItem i
                WHERE i.CategoryID = @CategoryId
                  AND i.Status = 1
                  AND i.OnlineItem = 1
                ORDER BY i.PrintOrder";

            using var connection = CreateConnection();
            var items = await connection.QueryAsync<MenuItem>(sql, new { CategoryId = categoryId });

            _logger.LogInformation("Retrieved {Count} menu items for category {CategoryId}", items.Count(), categoryId);
            return items;
        }

        /// <summary>
        /// Get stock quantity for specific item and size
        /// </summary>
        public async Task<int?> GetItemStockAsync(int itemId, int sizeId)
        {
            const string sql = @"
                SELECT OnHandQty
                FROM dbo.tblAvailableSize
                WHERE ItemID = @ItemId AND SizeID = @SizeId";

            using var connection = CreateConnection();
            return await connection.QueryFirstOrDefaultAsync<int?>(sql, new { ItemId = itemId, SizeId = sizeId });
        }

        /// <summary>
        /// Check if item is in stock
        /// </summary>
        public async Task<bool> IsItemInStockAsync(int itemId, int sizeId, decimal quantity)
        {
            var stock = await GetItemStockAsync(itemId, sizeId);
            return stock == null || stock.Value >= quantity;
        }

        /// <summary>
        /// Decrease stock quantity
        /// </summary>
        public async Task<bool> DecreaseStockAsync(int itemId, int sizeId, decimal quantity, IDbTransaction? transaction = null)
        {
            const string sql = @"
                UPDATE dbo.tblAvailableSize
                SET OnHandQty = OnHandQty - @Quantity
                WHERE ItemID = @ItemId
                  AND SizeID = @SizeId
                  AND OnHandQty IS NOT NULL
                  AND OnHandQty >= @Quantity";

            IDbConnection connection;
            bool shouldDispose = false;

            if (transaction?.Connection != null)
            {
                connection = transaction.Connection;
            }
            else
            {
                connection = CreateConnection();
                shouldDispose = true;
            }

            try
            {
                var rowsAffected = await connection.ExecuteAsync(sql,
                    new { ItemId = itemId, SizeId = sizeId, Quantity = quantity },
                    transaction);
                return rowsAffected > 0;
            }
            finally
            {
                if (shouldDispose) connection.Dispose();
            }
        }

        #endregion

        // =============================================================================
        // ORDERS - CREATE & MANAGE
        // =============================================================================

        #region Orders

        /// <summary>
        /// Get next daily order number for today
        /// Delegates to OrderNumberRepository for atomic increment with race condition handling
        /// </summary>
        public async Task<int> GetNextDailyOrderNumberAsync()
        {
            // Delegate to OrderNumberRepository for atomic increment
            // Uses tblOrderNumber table with UPDATE...OUTPUT pattern
            return await _orderNumberRepo.GetNextDailyOrderNumberAsync();
        }

        /// <summary>
        /// Create new sale/order with TransType=2 (Open) and register online order
        /// </summary>
        public async Task<int> CreateOpenOrderAsync(PosTicket ticket, IDbTransaction? transaction = null, string? customerName = null)
        {
            // SQL Server 2005 compatible - no OUTPUT clause in some versions
            const string sql = @"
                INSERT INTO dbo.tblSales (
                    SaleDateTime,
                    TransType,
                    SubTotal,
                    DSCAmt,
                    AlcoholDSCAmt,
                    GSTAmt,
                    PSTAmt,
                    PST2Amt,
                    GSTRate,
                    PSTRate,
                    PST2Rate,
                    CustomerID,
                    CashierID,
                    TableID,
                    StationID,
                    Guests,
                    TakeOutOrder,
                    DailyOrderNumber,
                    DeliveryChargeAmt,
                    OnlineOrderCompanyID,
                    Locked,
                    PaymentCount
                )
                VALUES (
                    @SaleDateTime,
                    2,  -- TransType=2 (Open Order)
                    @SubTotal,
                    @DSCAmt,
                    @AlcoholDSCAmt,
                    @GSTAmt,
                    @PSTAmt,
                    @PST2Amt,
                    @GSTRate,
                    @PSTRate,
                    @PST2Rate,
                    @CustomerID,
                    @CashierID,
                    @TableID,
                    @StationID,
                    @Guests,
                    @TakeOutOrder,
                    @DailyOrderNumber,
                    @DeliveryChargeAmt,
                    @OnlineOrderCompanyID,
                    0,  -- Not locked
                    0   -- No payments yet
                );
                SELECT SCOPE_IDENTITY();";

            IDbConnection connection;
            bool shouldDispose = false;

            if (transaction?.Connection != null)
            {
                connection = transaction.Connection;
            }
            else
            {
                connection = CreateConnection();
                shouldDispose = true;
            }

            try
            {
                var salesId = await connection.QuerySingleAsync<int>(sql, ticket, transaction);

                // Register online order in tblSalesOfOnlineOrders (requirement ORD-06)
                await InsertOnlineSalesLinkAsync(new SalesOfOnlineOrder
                {
                    SalesID = salesId,
                    OnlineOrderCompanyID = ticket.OnlineOrderCompanyID ?? 1,
                    OnlineOrderNumber = ticket.DailyOrderNumber.ToString(),
                    OnlineOrderCustomerName = customerName ?? "Guest",
                    DineInOrder = false,
                    ReservedTipAmt = 0,
                    DeliveryChargeAmt = ticket.DeliveryChargeAmt
                }, transaction);

                _logger.LogInformation("Created open order ID {SalesId} with order number {OrderNumber}, registered online order",
                    salesId, ticket.DailyOrderNumber);
                return salesId;
            }
            finally
            {
                if (shouldDispose) connection.Dispose();
            }
        }

        /// <summary>
        /// Get ticket/sale by ID
        /// </summary>
        public async Task<PosTicket?> GetTicketByIdAsync(int salesId)
        {
            const string sql = @"
                SELECT
                    ID,
                    SaleDateTime,
                    TransType,
                    DailyOrderNumber,
                    SubTotal,
                    DSCAmt,
                    AlcoholDSCAmt,
                    GSTAmt,
                    PSTAmt,
                    PST2Amt,
                    GSTRate,
                    PSTRate,
                    PST2Rate,
                    CustomerID,
                    CashierID,
                    TableID,
                    StationID,
                    Guests,
                    TakeOutOrder,
                    DeliveryChargeAmt,
                    OnlineOrderCompanyID,
                    Locked,
                    PaymentCount,
                    CashPaidAmt,
                    DebitPaidAmt,
                    AmexPaidAmt,
                    McPaidAmt,
                    CashTipPaidAmt,
                    CreditTipPaidAmt,
                    DebitTipPaidAmt
                FROM dbo.tblSales
                WHERE ID = @SalesId";

            using var connection = CreateConnection();
            return await connection.QueryFirstOrDefaultAsync<PosTicket>(sql, new { SalesId = salesId });
        }

        /// <summary>
        /// Complete an order with optimistic concurrency control
        /// Validates TransType=2 (Open) before transitioning to TransType=1 (Completed)
        /// Prevents updating already-completed orders (concurrency safety)
        /// </summary>
        public async Task CompleteOrderAsync(int salesId, IDbTransaction transaction)
        {
            // 1. Read current state
            var ticket = await GetTicketByIdAsync(salesId);
            if (ticket == null)
                throw new InvalidOperationException($"Order {salesId} not found");

            // 2. Verify expected state (CRITICAL: prevents updating already-completed orders)
            if (ticket.TransType != 2)
            {
                throw new InvalidOperationException(
                    $"Order {salesId} cannot be completed. Expected TransType=2 (Open), found TransType={ticket.TransType}");
            }

            // 3. Perform state transition in transaction
            await UpdateSaleTransTypeAsync(salesId, 1, transaction);  // 2 -> 1
            await MovePendingOrdersToSalesDetailAsync(salesId, transaction);

            _logger.LogInformation("Completed order {SalesId}: TransType 2 -> 1, moved items to sales detail", salesId);
        }

        /// <summary>
        /// Update sale TransType (for order completion/refund)
        /// </summary>
        public async Task<bool> UpdateSaleTransTypeAsync(int salesId, int transType, IDbTransaction? transaction = null)
        {
            const string sql = @"
                UPDATE dbo.tblSales
                SET TransType = @TransType
                WHERE ID = @SalesId";

            IDbConnection connection;
            bool shouldDispose = false;

            if (transaction?.Connection != null)
            {
                connection = transaction.Connection;
            }
            else
            {
                connection = CreateConnection();
                shouldDispose = true;
            }

            try
            {
                var rows = await connection.ExecuteAsync(sql,
                    new { SalesId = salesId, TransType = transType },
                    transaction);
                return rows > 0;
            }
            finally
            {
                if (shouldDispose) connection.Dispose();
            }
        }

        /// <summary>
        /// Update sale totals after calculating taxes/discounts
        /// </summary>
        public async Task<bool> UpdateSaleTotalsAsync(int salesId, decimal subTotal, decimal gstAmt,
            decimal pstAmt, decimal pst2Amt, decimal dscAmt, IDbTransaction? transaction = null)
        {
            const string sql = @"
                UPDATE dbo.tblSales
                SET SubTotal = @SubTotal,
                    GSTAmt = @GstAmt,
                    PSTAmt = @PstAmt,
                    PST2Amt = @Pst2Amt,
                    DSCAmt = @DscAmt
                WHERE ID = @SalesId";

            IDbConnection connection;
            bool shouldDispose = false;

            if (transaction?.Connection != null)
            {
                connection = transaction.Connection;
            }
            else
            {
                connection = CreateConnection();
                shouldDispose = true;
            }

            try
            {
                var rows = await connection.ExecuteAsync(sql,
                    new { SalesId = salesId, SubTotal = subTotal, GstAmt = gstAmt,
                          PstAmt = pstAmt, Pst2Amt = pst2Amt, DscAmt = dscAmt },
                    transaction);
                return rows > 0;
            }
            finally
            {
                if (shouldDispose) connection.Dispose();
            }
        }

        /// <summary>
        /// Get orders for a specific date range
        /// </summary>
        public async Task<IEnumerable<PosTicket>> GetOrdersByDateRangeAsync(DateTime startDate, DateTime endDate)
        {
            const string sql = @"
                SELECT
                    ID,
                    SaleDateTime,
                    TransType,
                    DailyOrderNumber,
                    SubTotal,
                    DSCAmt,
                    GSTAmt,
                    PSTAmt,
                    PST2Amt,
                    CustomerID,
                    CashierID,
                    Guests,
                    TakeOutOrder,
                    DeliveryChargeAmt
                FROM dbo.tblSales
                WHERE SaleDateTime >= @StartDate
                  AND SaleDateTime < @EndDate
                ORDER BY SaleDateTime DESC";

            using var connection = CreateConnection();
            return await connection.QueryAsync<PosTicket>(sql, new { StartDate = startDate, EndDate = endDate });
        }

        #endregion

        // =============================================================================
        // PENDING ORDERS - Active items in kitchen
        // =============================================================================

        #region Pending Orders

        /// <summary>
        /// Insert item into tblPendingOrders (for active/open orders)
        /// CRITICAL: Items go here while order is open (TransType=2)
        /// </summary>
        public async Task InsertPendingOrderItemAsync(PendingOrderItem item, IDbTransaction? transaction = null)
        {
            const string sql = @"
                INSERT INTO dbo.tblPendingOrders (
                    SalesID,
                    ItemID,
                    SizeID,
                    Qty,
                    UnitPrice,
                    ItemName,
                    ItemName2,
                    SizeName,
                    Tastes,
                    SideDishes,
                    ApplyGST,
                    ApplyPST,
                    ApplyPST2,
                    DSCAmt,
                    ApplyNoDSC,
                    KitchenB,
                    KitchenF,
                    KitchenE,
                    Bar,
                    PersonIndex,
                    SeparateBillPrint,
                    OpenItem,
                    ExtraChargeItem
                )
                VALUES (
                    @SalesID,
                    @ItemID,
                    @SizeID,
                    @Qty,
                    @UnitPrice,
                    @ItemName,
                    @ItemName2,
                    @SizeName,
                    @Tastes,
                    @SideDishes,
                    @ApplyGST,
                    @ApplyPST,
                    @ApplyPST2,
                    @DSCAmt,
                    @ApplyNoDSC,
                    @KitchenB,
                    @KitchenF,
                    @KitchenE,
                    @Bar,
                    @PersonIndex,
                    @SeparateBillPrint,
                    @OpenItem,
                    @ExtraChargeItem
                )";

            IDbConnection connection;
            bool shouldDispose = false;

            if (transaction?.Connection != null)
            {
                connection = transaction.Connection;
            }
            else
            {
                connection = CreateConnection();
                shouldDispose = true;
            }

            try
            {
                await connection.ExecuteAsync(sql, item, transaction);
                _logger.LogDebug("Inserted pending order item: {ItemName} ({SizeName}) x{Qty}",
                    item.ItemName, item.SizeName, item.Qty);
            }
            finally
            {
                if (shouldDispose) connection.Dispose();
            }
        }

        /// <summary>
        /// Get all pending (active) items for a sale
        /// </summary>
        public async Task<IEnumerable<PendingOrderItem>> GetPendingOrderItemsAsync(int salesId)
        {
            const string sql = @"
                SELECT
                    SalesID,
                    ItemID,
                    SizeID,
                    Qty,
                    UnitPrice,
                    ItemName,
                    ItemName2,
                    SizeName,
                    Tastes,
                    SideDishes,
                    ApplyGST,
                    ApplyPST,
                    ApplyPST2,
                    DSCAmt,
                    ApplyNoDSC,
                    KitchenB,
                    KitchenF,
                    KitchenE,
                    Bar,
                    PersonIndex,
                    SeparateBillPrint,
                    OpenItem,
                    ExtraChargeItem
                FROM dbo.tblPendingOrders
                WHERE SalesID = @SalesId";

            using var connection = CreateConnection();
            return await connection.QueryAsync<PendingOrderItem>(sql, new { SalesId = salesId });
        }

        /// <summary>
        /// Move items from tblPendingOrders to tblSalesDetail
        /// Called when order is completed (TransType changes from 2 to 1)
        ///
        /// NOTE: Uses application-side sequence numbering instead of ROW_NUMBER() OVER
        /// for SQL Server 2005 compatibility (compatibility level 100).
        /// </summary>
        public async Task MovePendingOrdersToSalesDetailAsync(int salesId, IDbTransaction? transaction = null)
        {
            // SQL Server 2005 compatible: Fetch pending items, assign sequence numbers in code,
            // then insert into tblSalesDetail
            const string selectSql = @"
                SELECT
                    SalesID,
                    ItemID,
                    SizeID,
                    Qty,
                    UnitPrice,
                    ItemName,
                    ItemName2,
                    SizeName,
                    Tastes,
                    DSCAmt,
                    PersonIndex
                FROM dbo.tblPendingOrders
                WHERE SalesID = @SalesId";

            const string insertSql = @"
                INSERT INTO dbo.tblSalesDetail (
                    SalesID,
                    ItemID,
                    SizeID,
                    Qty,
                    UnitPrice,
                    ItemName,
                    ItemName2,
                    SizeName,
                    Tastes,
                    DiscountAmt,
                    SequenceNo,
                    PersonIndex,
                    Voided
                )
                VALUES (
                    @SalesID,
                    @ItemID,
                    @SizeID,
                    @Qty,
                    @UnitPrice,
                    @ItemName,
                    @ItemName2,
                    @SizeName,
                    @Tastes,
                    @DSCAmt,
                    @SequenceNo,
                    @PersonIndex,
                    0
                )";

            const string deleteSql = @"
                DELETE FROM dbo.tblPendingOrders
                WHERE SalesID = @SalesId";

            IDbConnection connection;
            bool shouldDispose = false;

            if (transaction?.Connection != null)
            {
                connection = transaction.Connection;
            }
            else
            {
                connection = CreateConnection();
                shouldDispose = true;
            }

            try
            {
                // Fetch pending items
                var pendingItems = await connection.QueryAsync<dynamic>(selectSql, new { SalesId = salesId }, transaction);

                // Insert each item with application-assigned sequence number
                int sequenceNo = 1;
                foreach (var item in pendingItems)
                {
                    await connection.ExecuteAsync(insertSql, new
                    {
                        SalesID = (int)item.SalesID,
                        ItemID = (int)item.ItemID,
                        SizeID = (int)item.SizeID,
                        Qty = (decimal)item.Qty,
                        UnitPrice = (decimal)item.UnitPrice,
                        ItemName = (string?)item.ItemName,
                        ItemName2 = (string?)item.ItemName2,
                        SizeName = (string?)item.SizeName,
                        Tastes = (string?)item.Tastes,
                        DSCAmt = (decimal)item.DSCAmt,
                        SequenceNo = sequenceNo++,
                        PersonIndex = (byte)item.PersonIndex
                    }, transaction);
                }

                // Delete from pending orders
                await connection.ExecuteAsync(deleteSql, new { SalesId = salesId }, transaction);

                _logger.LogInformation("Moved {Count} pending orders to sales detail for SalesID {SalesId}",
                    sequenceNo - 1, salesId);
            }
            finally
            {
                if (shouldDispose) connection.Dispose();
            }
        }

        /// <summary>
        /// Delete pending order items (for order cancellation)
        /// </summary>
        public async Task DeletePendingOrderItemsAsync(int salesId, IDbTransaction? transaction = null)
        {
            const string sql = "DELETE FROM dbo.tblPendingOrders WHERE SalesID = @SalesId";

            IDbConnection connection;
            bool shouldDispose = false;

            if (transaction?.Connection != null)
            {
                connection = transaction.Connection;
            }
            else
            {
                connection = CreateConnection();
                shouldDispose = true;
            }

            try
            {
                await connection.ExecuteAsync(sql, new { SalesId = salesId }, transaction);
            }
            finally
            {
                if (shouldDispose) connection.Dispose();
            }
        }

        #endregion

        // =============================================================================
        // SALES DETAIL - Completed order items
        // =============================================================================

        #region Sales Detail

        /// <summary>
        /// Get all items for a completed sale (from tblSalesDetail)
        /// </summary>
        public async Task<IEnumerable<PosTicketItem>> GetSalesDetailItemsAsync(int salesId)
        {
            const string sql = @"
                SELECT
                    ID,
                    SalesID,
                    ItemID,
                    SizeID,
                    ItemName,
                    ItemName2,
                    SizeName,
                    Qty,
                    UnitPrice,
                    DiscountAmt,
                    DiscountPercent,
                    Tastes,
                    SequenceNo,
                    PersonIndex,
                    Voided
                FROM dbo.tblSalesDetail
                WHERE SalesID = @SalesId
                  AND Voided = 0
                ORDER BY SequenceNo";

            using var connection = CreateConnection();
            return await connection.QueryAsync<PosTicketItem>(sql, new { SalesId = salesId });
        }

        /// <summary>
        /// Direct insert into tblSalesDetail (for immediate completion without pending state)
        /// Use sparingly - prefer the pending orders workflow
        /// </summary>
        public async Task InsertSalesDetailItemAsync(PosTicketItem item, IDbTransaction? transaction = null)
        {
            const string sql = @"
                INSERT INTO dbo.tblSalesDetail (
                    SalesID,
                    ItemID,
                    SizeID,
                    Qty,
                    UnitPrice,
                    ItemName,
                    ItemName2,
                    SizeName,
                    DiscountAmt,
                    Tastes,
                    SequenceNo,
                    PersonIndex,
                    Voided
                )
                VALUES (
                    @SalesID,
                    @ItemID,
                    @SizeID,
                    @Qty,
                    @UnitPrice,
                    @ItemName,
                    @ItemName2,
                    @SizeName,
                    @DiscountAmt,
                    @Tastes,
                    @SequenceNo,
                    @PersonIndex,
                    0
                )";

            IDbConnection connection;
            bool shouldDispose = false;

            if (transaction?.Connection != null)
            {
                connection = transaction.Connection;
            }
            else
            {
                connection = CreateConnection();
                shouldDispose = true;
            }

            try
            {
                await connection.ExecuteAsync(sql, item, transaction);
            }
            finally
            {
                if (shouldDispose) connection.Dispose();
            }
        }

        #endregion

        // =============================================================================
        // PAYMENTS
        // =============================================================================

        #region Payments

        /// <summary>
        /// Encrypt a string using the POS database's dbo.EncryptString function
        /// </summary>
        private async Task<string> EncryptStringAsync(string plainText, IDbTransaction transaction)
        {
            if (string.IsNullOrEmpty(plainText))
                return string.Empty;

            const string sql = "SELECT dbo.EncryptString(@PlainText)";

            var encryptedValue = await transaction.Connection.ExecuteScalarAsync<string>(
                sql,
                new { PlainText = plainText },
                transaction);

            return encryptedValue ?? string.Empty;
        }

        /// <summary>
        /// Insert payment tender into tblPayment with encrypted card data
        /// </summary>
        public async Task InsertPaymentAsync(PosTender payment, IDbTransaction? transaction = null)
        {
            IDbConnection connection;
            bool shouldDispose = false;
            IDbTransaction? localTransaction = transaction;

            if (transaction?.Connection != null)
            {
                connection = transaction.Connection;
            }
            else
            {
                connection = CreateConnection();
                connection.Open();
                localTransaction = connection.BeginTransaction();
                shouldDispose = true;
            }

            try
            {
                // Encrypt authorization token if provided
                string? encryptedToken = null;
                if (!string.IsNullOrEmpty(payment.AuthorizationNo))
                {
                    encryptedToken = await EncryptStringAsync(payment.AuthorizationNo, localTransaction);
                }

                // Map card type to PaymentTypeID if not explicitly set
                if (payment.PaymentTypeID == 0 && !string.IsNullOrEmpty(payment.CardType))
                {
                    payment.PaymentTypeID = payment.CardType.ToUpperInvariant() switch
                    {
                        "VISA" => (byte)PaymentType.Visa,
                        "MASTERCARD" => (byte)PaymentType.MasterCard,
                        "AMEX" or "AMERICANEXPRESS" => (byte)PaymentType.Amex,
                        "DISCOVER" => (byte)PaymentType.Discover,
                        _ => (byte)PaymentType.Visa  // Default to Visa for unknown credit cards
                    };
                }

                const string sql = @"
                    INSERT INTO dbo.tblPayment (
                        SalesID,
                        PaymentTypeID,
                        PaidAmount,
                        TipAmount,
                        CardNumber,
                        AuthorizationNo,
                        BatchNo,
                        SequenceNo,
                        StationName,
                        Voided,
                        TipAdjusted,
                        PaidDateTime
                    )
                    VALUES (
                        @SalesID,
                        @PaymentTypeID,
                        @PaidAmount,
                        @TipAmount,
                        @EncryptedToken,
                        @AuthorizationNo,
                        @BatchNo,
                        @SequenceNo,
                        @StationName,
                        0,  -- Not voided
                        0,  -- Tip not adjusted
                        GETDATE()
                    )";

                await connection.ExecuteAsync(sql,
                    new
                    {
                        payment.SalesID,
                        payment.PaymentTypeID,
                        payment.PaidAmount,
                        payment.TipAmount,
                        EncryptedToken = encryptedToken,
                        payment.AuthorizationNo,
                        payment.BatchNo,
                        payment.SequenceNo,
                        payment.StationName
                    },
                    localTransaction);

                if (shouldDispose && localTransaction != null)
                {
                    localTransaction.Commit();
                }

                _logger.LogInformation(
                    "Recorded payment of {Amount} (Type: {Type}, CardType: {CardType}) for SalesID {SalesId} with encryption",
                    payment.PaidAmount, payment.PaymentTypeID, payment.CardType ?? "N/A", payment.SalesID);
            }
            catch
            {
                if (shouldDispose && localTransaction != null)
                {
                    localTransaction.Rollback();
                }
                throw;
            }
            finally
            {
                if (shouldDispose)
                {
                    localTransaction?.Dispose();
                    connection.Dispose();
                }
            }
        }

        /// <summary>
        /// Update sale payment totals after payment is recorded
        /// Updates both type-specific columns and general PaidAmount/TipAmount
        /// </summary>
        public async Task UpdateSalePaymentTotalsAsync(int salesId, PosTender payment, IDbTransaction? transaction = null)
        {
            string typeSpecificUpdate = payment.PaymentTypeID switch
            {
                1 => "CashPaidAmt = CashPaidAmt + @Amount, CashTipPaidAmt = CashTipPaidAmt + @Tip",
                2 => "DebitPaidAmt = DebitPaidAmt + @Amount, DebitTipPaidAmt = DebitTipPaidAmt + @Tip",
                5 => "AmexPaidAmt = AmexPaidAmt + @Amount, CreditTipPaidAmt = CreditTipPaidAmt + @Tip",
                4 => "McPaidAmt = McPaidAmt + @Amount, CreditTipPaidAmt = CreditTipPaidAmt + @Tip",
                3 => "CreditPaidAmt = COALESCE(CreditPaidAmt, 0) + @Amount, CreditTipPaidAmt = CreditTipPaidAmt + @Tip",  // Visa
                _ => "CreditTipPaidAmt = CreditTipPaidAmt + @Tip"  // Other credit cards
            };

            var sql = $@"
                UPDATE dbo.tblSales
                SET {typeSpecificUpdate},
                    PaidAmount = PaidAmount + @Amount,
                    TipAmount = TipAmount + @Tip,
                    PaymentCount = PaymentCount + 1
                WHERE ID = @SalesId";

            IDbConnection connection;
            bool shouldDispose = false;

            if (transaction?.Connection != null)
            {
                connection = transaction.Connection;
            }
            else
            {
                connection = CreateConnection();
                shouldDispose = true;
            }

            try
            {
                await connection.ExecuteAsync(sql,
                    new { SalesId = salesId, Amount = payment.PaidAmount, Tip = payment.TipAmount },
                    transaction);

                _logger.LogInformation(
                    "Updated sale {SalesId} payment totals: +${Amount} (Type: {PaymentTypeID})",
                    salesId, payment.PaidAmount, payment.PaymentTypeID);
            }
            finally
            {
                if (shouldDispose) connection.Dispose();
            }
        }

        /// <summary>
        /// Get all payments for a sale
        /// </summary>
        public async Task<IEnumerable<PosTender>> GetPaymentsAsync(int salesId)
        {
            const string sql = @"
                SELECT
                    ID,
                    SalesID,
                    PaymentTypeID,
                    PaidAmount,
                    TipAmount,
                    AuthorizationNo,
                    BatchNo,
                    SequenceNo,
                    StationName,
                    Voided,
                    TipAdjusted,
                    PaidDateTime
                FROM dbo.tblPayment
                WHERE SalesID = @SalesId
                  AND Voided = 0
                ORDER BY SequenceNo";

            using var connection = CreateConnection();
            return await connection.QueryAsync<PosTender>(sql, new { SalesId = salesId });
        }

        /// <summary>
        /// Void a payment
        /// </summary>
        public async Task<bool> VoidPaymentAsync(int paymentId, IDbTransaction? transaction = null)
        {
            const string sql = "UPDATE dbo.tblPayment SET Voided = 1 WHERE ID = @PaymentId";

            IDbConnection connection;
            bool shouldDispose = false;

            if (transaction?.Connection != null)
            {
                connection = transaction.Connection;
            }
            else
            {
                connection = CreateConnection();
                shouldDispose = true;
            }

            try
            {
                var rows = await connection.ExecuteAsync(sql, new { PaymentId = paymentId }, transaction);
                return rows > 0;
            }
            finally
            {
                if (shouldDispose) connection.Dispose();
            }
        }

        #endregion

        // =============================================================================
        // ONLINE ORDERS
        // =============================================================================

        #region Online Orders

        /// <summary>
        /// Insert link between sale and online order
        /// </summary>
        public async Task InsertOnlineSalesLinkAsync(SalesOfOnlineOrder link, IDbTransaction? transaction = null)
        {
            const string sql = @"
                INSERT INTO dbo.tblSalesOfOnlineOrders (
                    SalesID,
                    OnlineOrderCompanyID,
                    OnlineOrderNumber,
                    OnlineOrderCustomerName,
                    DineInOrder,
                    ReservedTipAmt,
                    DeliveryChargeAmt
                )
                VALUES (
                    @SalesID,
                    @OnlineOrderCompanyID,
                    @OnlineOrderNumber,
                    @OnlineOrderCustomerName,
                    @DineInOrder,
                    @ReservedTipAmt,
                    @DeliveryChargeAmt
                )";

            IDbConnection connection;
            bool shouldDispose = false;

            if (transaction?.Connection != null)
            {
                connection = transaction.Connection;
            }
            else
            {
                connection = CreateConnection();
                shouldDispose = true;
            }

            try
            {
                await connection.ExecuteAsync(sql, link, transaction);
                _logger.LogInformation("Linked SalesID {SalesId} to online order {OrderNumber}",
                    link.SalesID, link.OnlineOrderNumber);
            }
            finally
            {
                if (shouldDispose) connection.Dispose();
            }
        }

        /// <summary>
        /// Get online order companies
        /// </summary>
        public async Task<IEnumerable<OnlineOrderCompany>> GetOnlineOrderCompaniesAsync()
        {
            const string sql = @"
                SELECT ID, CompanyName, IsActive, CommissionRate
                FROM dbo.tblOnlineOrderCompany
                WHERE IsActive = 1";

            using var connection = CreateConnection();
            return await connection.QueryAsync<OnlineOrderCompany>(sql);
        }

        #endregion

        // =============================================================================
        // TAX CONFIGURATION
        // =============================================================================

        #region Tax Configuration

        /// <summary>
        /// Get tax rate from tblMisc
        /// </summary>
        public async Task<decimal> GetTaxRateAsync(string taxCode)
        {
            // INI POS stores tax rates in tblMisc with MiscName like 'GSTPercentage'
            var miscName = taxCode switch
            {
                "GST" => "GSTPercentage",
                "PST" => "PSTPercentage",
                "PST2" => "PST2Percentage",
                _ => taxCode + "Percentage"
            };

            const string sql = @"
                SELECT CAST(ISNULL(Value, '0') AS DECIMAL(10,5))
                FROM dbo.tblMisc
                WHERE MiscName = @MiscName";

            using var connection = CreateConnection();
            return await connection.QueryFirstOrDefaultAsync<decimal>(sql, new { MiscName = miscName });
        }

        /// <summary>
        /// Get all tax rates at once from tblMisc
        /// INI POS stores these as 'GSTPercentage', 'PSTPercentage', 'PST2Percentage'
        /// </summary>
        public async Task<TaxRates> GetTaxRatesAsync()
        {
            const string sql = @"
                SELECT MiscName, CAST(ISNULL(Value, '0') AS DECIMAL(10,5)) AS Value
                FROM dbo.tblMisc
                WHERE MiscName IN ('GSTPercentage', 'PSTPercentage', 'PST2Percentage')";

            using var connection = CreateConnection();
            var rates = await connection.QueryAsync<(string MiscName, decimal Value)>(sql);

            return new TaxRates
            {
                GST = rates.FirstOrDefault(r => r.MiscName == "GSTPercentage").Value,
                PST = rates.FirstOrDefault(r => r.MiscName == "PSTPercentage").Value,
                PST2 = rates.FirstOrDefault(r => r.MiscName == "PST2Percentage").Value
            };
        }

        #endregion

        // =============================================================================
        // CUSTOMERS
        // =============================================================================

        #region Customers

        /// <summary>
        /// Get customer by phone number
        /// </summary>
        public async Task<PosCustomer?> GetCustomerByPhoneAsync(string phone)
        {
            const string sql = @"
                SELECT
                    ID, FName, LName, Phone, Email, Address,
                    CustomerNum, EarnedPoints, PointsManaged, Gender
                FROM dbo.tblCustomer
                WHERE Phone = @Phone";

            using var connection = CreateConnection();
            return await connection.QueryFirstOrDefaultAsync<PosCustomer>(sql, new { Phone = phone });
        }

        /// <summary>
        /// Get customer by email address
        /// </summary>
        public async Task<PosCustomer?> GetCustomerByEmailAsync(string email)
        {
            const string sql = @"
                SELECT TOP 1
                    ID, FName, LName, Phone, Email, Address,
                    CustomerNum, EarnedPoints, PointsManaged, Gender
                FROM dbo.tblCustomer
                WHERE Email = @Email";

            using var connection = CreateConnection();
            return await connection.QueryFirstOrDefaultAsync<PosCustomer>(sql, new { Email = email });
        }

        /// <summary>
        /// Get customer by ID
        /// </summary>
        public async Task<PosCustomer?> GetCustomerByIdAsync(int id)
        {
            const string sql = @"
                SELECT
                    ID, FName, LName, Phone, Email, Address,
                    CustomerNum, EarnedPoints, PointsManaged, Gender
                FROM dbo.tblCustomer
                WHERE ID = @Id";

            using var connection = CreateConnection();
            return await connection.QueryFirstOrDefaultAsync<PosCustomer>(sql, new { Id = id });
        }

        /// <summary>
        /// Insert new customer
        /// </summary>
        public async Task<int> InsertCustomerAsync(PosCustomer customer)
        {
            const string sql = @"
                INSERT INTO dbo.tblCustomer (
                    FName, LName, Phone, Email, Address,
                    CustomerNum, EarnedPoints, PointsManaged
                )
                VALUES (
                    @FName, @LName, @Phone, @Email, @Address,
                    @CustomerNum, 0, 1
                );
                SELECT SCOPE_IDENTITY();";

            using var connection = CreateConnection();
            return await connection.QuerySingleAsync<int>(sql, customer);
        }

        /// <summary>
        /// Update customer loyalty points
        /// </summary>
        public async Task<bool> UpdateLoyaltyPointsAsync(int customerId, int points, IDbTransaction? transaction = null)
        {
            const string sql = @"
                UPDATE dbo.tblCustomer
                SET EarnedPoints = EarnedPoints + @Points
                WHERE ID = @CustomerId";

            IDbConnection connection;
            bool shouldDispose = false;

            if (transaction?.Connection != null)
            {
                connection = transaction.Connection;
            }
            else
            {
                connection = CreateConnection();
                shouldDispose = true;
            }

            try
            {
                var rows = await connection.ExecuteAsync(sql, new { CustomerId = customerId, Points = points }, transaction);
                return rows > 0;
            }
            finally
            {
                if (shouldDispose) connection.Dispose();
            }
        }

        /// <summary>
        /// Record loyalty point transaction
        /// </summary>
        public async Task InsertPointsDetailAsync(PointsDetail detail, IDbTransaction? transaction = null)
        {
            const string sql = @"
                INSERT INTO dbo.tblPointsDetail (
                    SalesID, CustomerID, PointUsed, PointSaved, TransactionDate
                )
                VALUES (
                    @SalesID, @CustomerID, @PointUsed, @PointSaved, GETDATE()
                )";

            IDbConnection connection;
            bool shouldDispose = false;

            if (transaction?.Connection != null)
            {
                connection = transaction.Connection;
            }
            else
            {
                connection = CreateConnection();
                shouldDispose = true;
            }

            try
            {
                await connection.ExecuteAsync(sql, detail, transaction);
            }
            finally
            {
                if (shouldDispose) connection.Dispose();
            }
        }

        /// <summary>
        /// Get loyalty transaction history for a customer
        /// Returns recent earn/redeem activity from tblRewardPointsDetail
        /// </summary>
        public async Task<IEnumerable<PointsDetail>> GetLoyaltyHistoryAsync(int customerId, int limit)
        {
            const string sql = @"
                SELECT TOP (@Limit)
                    ID, SalesID, CustomerID, PointUsed, PointSaved, TransactionDate
                FROM dbo.tblRewardPointsDetail
                WHERE CustomerID = @CustomerId
                ORDER BY TransactionDate DESC";

            using var connection = CreateConnection();
            return await connection.QueryAsync<PointsDetail>(
                sql,
                new { CustomerId = customerId, Limit = limit });
        }

        #endregion

        // =============================================================================
        // GIFT CARDS
        // =============================================================================

        #region Gift Cards

        /// <summary>
        /// Get gift card by barcode
        /// </summary>
        public async Task<PrepaidCard?> GetPrepaidCardAsync(string barcode)
        {
            const string sql = @"
                SELECT ID, Barcode, Balance, CustomerID, ExpiryDate, IsActive
                FROM dbo.tblPrepaidCards
                WHERE Barcode = @Barcode AND IsActive = 1";

            using var connection = CreateConnection();
            return await connection.QueryFirstOrDefaultAsync<PrepaidCard>(sql, new { Barcode = barcode });
        }

        /// <summary>
        /// Update gift card balance
        /// </summary>
        public async Task<bool> UpdatePrepaidCardBalanceAsync(int cardId, decimal amount, IDbTransaction? transaction = null)
        {
            const string sql = @"
                UPDATE dbo.tblPrepaidCards
                SET Balance = Balance + @Amount
                WHERE ID = @CardId AND Balance + @Amount >= 0";

            IDbConnection connection;
            bool shouldDispose = false;

            if (transaction?.Connection != null)
            {
                connection = transaction.Connection;
            }
            else
            {
                connection = CreateConnection();
                shouldDispose = true;
            }

            try
            {
                var rows = await connection.ExecuteAsync(sql, new { CardId = cardId, Amount = amount }, transaction);
                return rows > 0;
            }
            finally
            {
                if (shouldDispose) connection.Dispose();
            }
        }

        #endregion
    }
}
