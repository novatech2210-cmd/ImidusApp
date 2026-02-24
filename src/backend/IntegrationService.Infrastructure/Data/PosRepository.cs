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
    public class PosRepository : IPosRepository
    {
        private readonly string _connectionString;
        private readonly ILogger<PosRepository> _logger;

        public PosRepository(IConfiguration configuration, ILogger<PosRepository> logger)
        {
            _connectionString = configuration.GetConnectionString("PosDatabase")
                ?? throw new ArgumentNullException("PosDatabase connection string not found");
            _logger = logger;
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

        #region Menu Items

        /// <summary>
        /// Get all active menu items available for online ordering
        /// </summary>
        public async Task<IEnumerable<MenuItem>> GetActiveMenuItemsAsync()
        {
            const string sql = @"
                SELECT
                    i.ItemID,
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
                    i.KitchenB,
                    i.KitchenF,
                    i.KitchenE,
                    i.Kitchen5,
                    i.Kitchen6
                FROM dbo.tblItem i
                WHERE i.Status = 1              -- Active
                  AND i.OnlineItem = 1          -- Available online
                ORDER BY i.CategoryID, i.IName";

            using var connection = CreateConnection();
            var items = await connection.QueryAsync<MenuItem>(sql);

            _logger.LogInformation("Retrieved {Count} active menu items", items.Count());

            return items;
        }

        /// <summary>
        /// Get all available sizes for a specific menu item
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
                    s.SizeID,
                    s.SizeName,
                    s.ShortName,
                    s.DisplayOrder
                FROM dbo.tblAvailableSize a
                INNER JOIN dbo.tblSize s ON a.SizeID = s.SizeID
                WHERE a.ItemID = @ItemId
                  AND (a.OnHandQty > 0 OR a.OnHandQty IS NULL)  -- In stock
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
        /// Check if item is in stock (considering size)
        /// </summary>
        public async Task<bool> IsItemInStockAsync(int itemId, int sizeId, decimal quantity)
        {
            var stock = await GetItemStockAsync(itemId, sizeId);

            // NULL = unlimited stock
            if (stock == null) return true;

            // Check if sufficient quantity available
            return stock.Value >= quantity;
        }

        /// <summary>
        /// Decrease stock quantity for an item/size
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

            using var connection = transaction?.Connection ?? CreateConnection();

            var rowsAffected = await connection.ExecuteAsync(
                sql,
                new { ItemId = itemId, SizeId = sizeId, Quantity = quantity },
                transaction
            );

            return rowsAffected > 0;
        }

        #endregion

        #region Orders

        /// <summary>
        /// Get next daily order number for today
        /// </summary>
        public async Task<int> GetNextDailyOrderNumberAsync()
        {
            const string sql = @"
                SELECT ISNULL(MAX(DailyOrderNumber), 0) + 1
                FROM dbo.tblSales
                WHERE CONVERT(date, SaleDateTime) = CONVERT(date, GETDATE())";

            using var connection = CreateConnection();
            return await connection.QueryFirstAsync<int>(sql);
        }

        /// <summary>
        /// Insert new sale/order into tblSales
        /// </summary>
        public async Task<int> InsertTicketAsync(PosTicket ticket, IDbTransaction? transaction = null)
        {
            const string sql = @"
                INSERT INTO dbo.tblSales (
                    SaleDateTime,
                    TransType,
                    SubTotal,
                    DSCAmt,
                    GSTAmt,
                    PSTAmt,
                    PST2Amt,
                    CustomerID,
                    CashierID,
                    TableID,
                    Guests,
                    TakeOutOrder,
                    DailyOrderNumber
                )
                OUTPUT INSERTED.ID
                VALUES (
                    @SaleDateTime,
                    @TransType,
                    @SubTotal,
                    @DSCAmt,
                    @GSTAmt,
                    @PSTAmt,
                    @PST2Amt,
                    @CustomerID,
                    @CashierID,
                    @TableID,
                    @Guests,
                    @TakeOutOrder,
                    @DailyOrderNumber
                )";

            using var connection = transaction?.Connection ?? CreateConnection();

            var salesId = await connection.QuerySingleAsync<int>(sql, ticket, transaction);

            _logger.LogInformation("Created sale ID {SalesId} with order number {OrderNumber}",
                salesId, ticket.DailyOrderNumber);

            return salesId;
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
                    GSTAmt,
                    PSTAmt,
                    PST2Amt,
                    CustomerID,
                    CashierID,
                    TableID,
                    Guests,
                    TakeOutOrder
                FROM dbo.tblSales
                WHERE ID = @SalesId";

            using var connection = CreateConnection();
            return await connection.QueryFirstOrDefaultAsync<PosTicket>(sql, new { SalesId = salesId });
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
                    TakeOutOrder
                FROM dbo.tblSales
                WHERE SaleDateTime >= @StartDate
                  AND SaleDateTime < @EndDate
                  AND TransType = 0
                ORDER BY SaleDateTime DESC";

            using var connection = CreateConnection();
            return await connection.QueryAsync<PosTicket>(sql, new { StartDate = startDate, EndDate = endDate });
        }

        #endregion

        #region Ticket Items

        /// <summary>
        /// Insert line item into tblSalesDetail
        /// </summary>
        public async Task InsertTicketItemAsync(PosTicketItem item, IDbTransaction? transaction = null)
        {
            const string sql = @"
                INSERT INTO dbo.tblSalesDetail (
                    SalesID,
                    ItemID,
                    SizeID,
                    Quantity,
                    UnitPrice,
                    ItemName,
                    SizeName,
                    DSCAmt,
                    PersonIndex,
                    ApplyGST,
                    ApplyPST,
                    ApplyPST2,
                    OpenItem,
                    KitchenB,
                    KitchenF,
                    KitchenE,
                    Kitchen5,
                    Kitchen6
                )
                VALUES (
                    @SalesID,
                    @ItemID,
                    @SizeID,
                    @Quantity,
                    @UnitPrice,
                    @ItemName,
                    @SizeName,
                    @DSCAmt,
                    @PersonIndex,
                    @ApplyGST,
                    @ApplyPST,
                    @ApplyPST2,
                    @OpenItem,
                    @KitchenB,
                    @KitchenF,
                    @KitchenE,
                    @Kitchen5,
                    @Kitchen6
                )";

            using var connection = transaction?.Connection ?? CreateConnection();
            await connection.ExecuteAsync(sql, item, transaction);

            _logger.LogDebug("Inserted ticket item: {ItemName} ({SizeName}) x{Quantity}",
                item.ItemName, item.SizeName, item.Quantity);
        }

        /// <summary>
        /// Get all items for a specific sale
        /// </summary>
        public async Task<IEnumerable<PosTicketItem>> GetTicketItemsAsync(int salesId)
        {
            const string sql = @"
                SELECT
                    ID,
                    SalesID,
                    ItemID,
                    SizeID,
                    ItemName,
                    SizeName,
                    Quantity,
                    UnitPrice,
                    DSCAmt,
                    PersonIndex,
                    ApplyGST,
                    ApplyPST,
                    ApplyPST2,
                    KitchenB,
                    KitchenF,
                    KitchenE,
                    Kitchen5,
                    Kitchen6
                FROM dbo.tblSalesDetail
                WHERE SalesID = @SalesId
                ORDER BY ID";

            using var connection = CreateConnection();
            return await connection.QueryAsync<PosTicketItem>(sql, new { SalesId = salesId });
        }

        #endregion

        #region Payments

        /// <summary>
        /// Insert payment tender into tblPayment
        /// </summary>
        public async Task InsertPaymentAsync(PosTender payment, IDbTransaction? transaction = null)
        {
            const string sql = @"
                INSERT INTO dbo.tblPayment (
                    SalesID,
                    PaymentTypeID,
                    PaidAmount,
                    TipAmount,
                    Voided,
                    AuthorizationNo,
                    BatchNo
                )
                VALUES (
                    @SalesID,
                    @PaymentTypeID,
                    @PaidAmount,
                    @TipAmount,
                    0,
                    @AuthorizationNo,
                    @BatchNo
                )";

            using var connection = transaction?.Connection ?? CreateConnection();
            await connection.ExecuteAsync(sql, payment, transaction);

            _logger.LogInformation("Recorded payment of {Amount} for sale {SalesId}",
                payment.PaidAmount, payment.SalesID);
        }

        /// <summary>
        /// Get all payments for a specific sale
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
                    Voided,
                    AuthorizationNo,
                    BatchNo
                FROM dbo.tblPayment
                WHERE SalesID = @SalesId
                  AND Voided = 0
                ORDER BY ID";

            using var connection = CreateConnection();
            return await connection.QueryAsync<PosTender>(sql, new { SalesId = salesId });
        }

        #endregion

        #region Tax Configuration

        /// <summary>
        /// Get tax rate from tblMisc configuration
        /// </summary>
        public async Task<decimal> GetTaxRateAsync(string taxCode)
        {
            const string sql = @"
                SELECT ISNULL(Value, 0)
                FROM dbo.tblMisc
                WHERE Code = @TaxCode";

            using var connection = CreateConnection();
            return await connection.QueryFirstOrDefaultAsync<decimal>(sql, new { TaxCode = taxCode });
        }

        /// <summary>
        /// Get all tax rates at once
        /// </summary>
        public async Task<TaxRates> GetTaxRatesAsync()
        {
            const string sql = @"
                SELECT Code, Value
                FROM dbo.tblMisc
                WHERE Code IN ('GST', 'PST', 'PST2')";

            using var connection = CreateConnection();
            var rates = await connection.QueryAsync<(string Code, decimal Value)>(sql);

            return new TaxRates
            {
                GST = rates.FirstOrDefault(r => r.Code == "GST").Value,
                PST = rates.FirstOrDefault(r => r.Code == "PST").Value,
                PST2 = rates.FirstOrDefault(r => r.Code == "PST2").Value
            };
        }

        #endregion

        #region Customers

        /// <summary>
        /// Get customer by phone number
        /// </summary>
        public async Task<PosCustomer?> GetCustomerByPhoneAsync(string phone)
        {
            const string sql = @"
                SELECT
                    ID,
                    FName,
                    LName,
                    Phone,
                    Email,
                    Address,
                    CustomerNum,
                    EarnedPoints,
                    PointsManaged,
                    Gender
                FROM dbo.tblCustomer
                WHERE Phone = @Phone";

            using var connection = CreateConnection();
            return await connection.QueryFirstOrDefaultAsync<PosCustomer>(sql, new { Phone = phone });
        }

        /// <summary>
        /// Get customer by ID
        /// </summary>
        public async Task<PosCustomer?> GetCustomerByIdAsync(int id)
        {
            const string sql = @"
                SELECT
                    ID,
                    FName,
                    LName,
                    Phone,
                    Email,
                    Address,
                    CustomerNum,
                    EarnedPoints,
                    PointsManaged,
                    Gender
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
                    FName,
                    LName,
                    Phone,
                    Email,
                    Address,
                    CustomerNum,
                    EarnedPoints,
                    PointsManaged
                )
                OUTPUT INSERTED.ID
                VALUES (
                    @FName,
                    @LName,
                    @Phone,
                    @Email,
                    @Address,
                    @CustomerNum,
                    0,
                    1
                )";

            using var connection = CreateConnection();
            return await connection.QuerySingleAsync<int>(sql, customer);
        }

        /// <summary>
        /// Update customer loyalty points
        /// </summary>
        public async Task<bool> UpdateLoyaltyPointsAsync(int customerId, decimal points)
        {
            const string sql = @"
                UPDATE dbo.tblCustomer
                SET EarnedPoints = @Points
                WHERE ID = @CustomerId";

            using var connection = CreateConnection();
            var rows = await connection.ExecuteAsync(sql, new { CustomerId = customerId, Points = (int)points });
            return rows > 0;
        }

        #endregion
    }
}
