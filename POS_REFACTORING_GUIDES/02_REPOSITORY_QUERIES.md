# Step 2: Repository SQL Queries Update

## 🎯 Goal
Rewrite all SQL queries in the repository layer to use correct table/column names from the INI_Restaurant database (source of truth).

**File:** `backend/IntegrationService.Infrastructure/Data/PosRepository.cs`

**Estimated time:** 2-3 hours

---

## 🔴 CRITICAL CHANGES

### Table Name Mapping
```
Tickets      → tblSales
TicketItems  → tblSalesDetail
Tenders      → tblPayment
MenuItems    → tblItem
             → tblAvailableSize (NEW - for pricing)
             → tblSize (NEW - for size names)
Categories   → tblCategory
Customers    → tblCustomer
```

### Key Column Changes
```
TicketID     → ID (in tblSales)
TicketItemID → ID (in tblSalesDetail)
MenuItemId   → ItemID
ItemName     → IName
CreatedDate  → SaleDateTime
BasePrice    → UnitPrice (in tblAvailableSize)
Status       → Multiple boolean flags
```

---

## 📝 Complete Updated Repository

Replace your `PosRepository.cs` with this updated version:

```csharp
using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
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
            _connectionString = configuration.GetConnectionString("INI_Restaurant")
                ?? throw new ArgumentNullException("INI_Restaurant connection string not found");
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
        /// UPDATED: Joins tblAvailableSize for pricing and stock
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
        /// CRITICAL: This is where pricing and stock information comes from
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

            // Use multi-mapping to populate Size navigation property
            var sizeDict = new Dictionary<int, AvailableSize>();

            await connection.QueryAsync<AvailableSize, Size, AvailableSize>(
                sql,
                (availableSize, size) =>
                {
                    availableSize.Size = size;
                    return availableSize;
                },
                new { ItemId = itemId },
                splitOn: "SizeID"
            );

            return sizeDict.Values;
        }

        /// <summary>
        /// Get stock quantity for specific item and size
        /// NULL return means unlimited stock
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
        /// Only updates if inventory is tracked (OnHandQty is NOT NULL)
        /// </summary>
        public async Task<bool> DecreaseStockAsync(int itemId, int sizeId, decimal quantity, IDbTransaction? transaction = null)
        {
            const string sql = @"
                UPDATE dbo.tblAvailableSize
                SET OnHandQty = OnHandQty - @Quantity
                WHERE ItemID = @ItemId
                  AND SizeID = @SizeId
                  AND OnHandQty IS NOT NULL  -- Only update tracked inventory
                  AND OnHandQty >= @Quantity"; -- Ensure sufficient stock

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
        /// CRITICAL: This generates the user-facing order number
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
        /// Returns the new SalesID
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
                  AND TransType = 0  -- Sales only (not refunds)
                ORDER BY SaleDateTime DESC";

            using var connection = CreateConnection();
            return await connection.QueryAsync<PosTicket>(sql, new { StartDate = startDate, EndDate = endDate });
        }

        #endregion

        #region Ticket Items

        /// <summary>
        /// Insert line item into tblSalesDetail
        /// CRITICAL: Now includes SizeID and kitchen routing flags
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
                    0,  -- Not voided
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
        /// Returns decimal percentage (e.g., 0.05 for 5%)
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
                    0,  -- Initial points
                    1   -- Manage points
                )";

            using var connection = CreateConnection();
            return await connection.QuerySingleAsync<int>(sql, customer);
        }

        #endregion
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
```

---

## ✅ Key Changes Summary

### 1. Menu Items Query
```sql
-- BEFORE
SELECT * FROM MenuItems WHERE IsActive = 1

-- AFTER
SELECT * FROM dbo.tblItem
WHERE Status = 1 AND OnlineItem = 1
```

### 2. Item Pricing (CRITICAL)
```sql
-- BEFORE
SELECT ItemID, ItemName, BasePrice FROM MenuItems

-- AFTER
SELECT
    a.ItemID,
    a.SizeID,
    a.UnitPrice,    -- ← Price is here now
    a.OnHandQty,    -- ← Stock is here now
    s.SizeName
FROM dbo.tblAvailableSize a
INNER JOIN dbo.tblSize s ON a.SizeID = s.SizeID
WHERE a.ItemID = @ItemId
```

### 3. Insert Order
```sql
-- BEFORE
INSERT INTO Tickets (TicketID, CreatedDate, TotalAmount, Status)

-- AFTER
INSERT INTO dbo.tblSales (
    ID,                 -- Auto-generated
    SaleDateTime,       -- Not CreatedDate
    SubTotal,           -- Not TotalAmount (calculated)
    GSTAmt, PSTAmt, PST2Amt, DSCAmt,  -- Tax breakdown
    TransType,          -- NEW: 0=Sale
    DailyOrderNumber    -- NEW: User-facing order #
)
```

### 4. Insert Line Item
```sql
-- BEFORE
INSERT INTO TicketItems (TicketID, MenuItemId, Quantity, Price)

-- AFTER
INSERT INTO dbo.tblSalesDetail (
    SalesID,     -- Not TicketID
    ItemID,      -- Not MenuItemId
    SizeID,      -- ← NOW REQUIRED
    ItemName,    -- Denormalized
    SizeName,    -- Denormalized
    Quantity,
    UnitPrice,
    KitchenB, KitchenF, KitchenE  -- Kitchen routing
)
```

---

## 🧪 Testing

### 1. Test Database Connection
```bash
cd /home/kali/Desktop/TOAST/backend
dotnet test --filter "Category=Database"
```

### 2. Test Menu Retrieval
```sql
-- Run this in SQL Server Management Studio to verify query works
SELECT
    i.ItemID,
    i.IName,
    a.SizeID,
    s.SizeName,
    a.UnitPrice,
    a.OnHandQty
FROM dbo.tblItem i
INNER JOIN dbo.tblAvailableSize a ON i.ItemID = a.ItemID
INNER JOIN dbo.tblSize s ON a.SizeID = s.SizeID
WHERE i.Status = 1 AND i.OnlineItem = 1
ORDER BY i.CategoryID, i.IName, s.DisplayOrder
```

### 3. Test Order Creation
```csharp
// Integration test
[Fact]
public async Task CanCreateOrderInRealDatabase()
{
    // Arrange
    var ticket = new PosTicket
    {
        SaleDateTime = DateTime.Now,
        TransType = 0,
        SubTotal = 10.00m,
        GSTAmt = 0.50m,
        PSTAmt = 0.70m,
        PST2Amt = 0,
        DSCAmt = 0,
        CustomerID = 1,
        Guests = 1,
        TakeOutOrder = true,
        DailyOrderNumber = 1
    };

    // Act
    var salesId = await _repository.InsertTicketAsync(ticket);

    // Assert
    Assert.True(salesId > 0);
}
```

---

## ⚠️ Common Errors

### "Invalid object name 'Tickets'"
**Solution:** You have a query still using the old table name. Search for it:
```bash
grep -r "FROM Tickets" .
grep -r "INSERT INTO Tickets" .
```

### "Invalid column name 'TicketID'"
**Solution:** Update to use `ID`:
```bash
grep -r "TicketID" . | grep -v ".git"
```

### "Cannot insert NULL into column 'SizeID'"
**Solution:** Ensure all item inserts include SizeID:
```csharp
// WRONG
new PosTicketItem { ItemID = 101, Quantity = 1 }

// RIGHT
new PosTicketItem { ItemID = 101, SizeID = 1, Quantity = 1 }
```

---

## 📝 Migration Checklist

- [ ] Backup original `PosRepository.cs`
- [ ] Replace with updated code above
- [ ] Update connection string in `appsettings.json` to point to INI_Restaurant database
- [ ] Run `dotnet build` and fix any compilation errors
- [ ] Run database integration tests
- [ ] Verify queries work in SQL Server Management Studio
- [ ] Commit: `git add . && git commit -m "Update POS repository to match real schema"`

---

## 🚀 Next Step

Once repository is updated and tests pass, proceed to:

**[Step 3: Service Layer Updates →](./03_SERVICE_LAYER.md)**

---

**Generated by Novatech** 🚀
