---
name: ini-pos-database
description: Activate when writing any SQL queries, Dapper repository methods, or entity mappings that touch the INI_Restaurant (TPPro) database. This skill provides the authoritative column names, schema constraints, and SQL Server 2005 compatibility rules for the legacy POS database.
---

# INI POS Database Skill

## Why This Skill Exists

The INI_Restaurant database runs on **SQL Server 2005 Express** and was designed for the Delphi-based INI POS system. The schema cannot be changed. Many column names differ from modern conventions, and several SQL Server 2005 restrictions apply. Every Dapper query touching TPPro must pass through these rules.

---

## SQL Server 2005 Restrictions (HARD LIMITS)

| Prohibited Feature | Use Instead |
|---|---|
| `MERGE` | Explicit `INSERT` + check existence first |
| `OFFSET / FETCH` | `SELECT TOP N` with `WHERE ID > @lastId` |
| Window functions (`ROW_NUMBER` is OK, but `LEAD/LAG/etc.` are not) | Subqueries |
| `OUTPUT` clause on `UPDATE` | Separate `SELECT` after update |
| `TRY_CONVERT`, `TRY_CAST` | `CASE WHEN ISNUMERIC(@val)=1 THEN CAST(...)` |
| JSON functions | Not available — format in C# |
| `STRING_AGG` | `FOR XML PATH` workaround |

---

## Critical TransType Values (tblSales)

```
0 = Refund
1 = Sale (Completed)
2 = Open (In Progress)
```

**Always verify TransType=2 before completing an order** (concurrency safety rule).

---

## Authoritative Column Names

### tblSales
```sql
ID                  -- PK (not SalesID)
SaleDateTime
TransType           -- 0=Refund, 1=Sale, 2=Open
DailyOrderNumber
SubTotal
DSCAmt
AlcoholDSCAmt
GSTAmt / PSTAmt / PST2Amt
GSTRate / PSTRate / PST2Rate
CustomerID
CashierID
TableID
StationID
Guests
TakeOutOrder
-- DO NOT USE: DeliveryChargeAmt, OnlineOrderCompanyID, Locked, PaymentCount
-- (these don't exist in POS 2005 schema)
```

### tblItem
```sql
ID                  -- PK (not ItemID)
IName               -- primary menu item name
IName2              -- secondary name
ItemDescription
ImageFilePath
CategoryID
Status              -- 1=active, 0=inactive
OnlineItem          -- 1=available online
Alcohol
BarCode
ManageInv
ApplyGST / ApplyPST / ApplyPST2
KitchenB / KitchenF / KitchenE / Kitchen5 / Kitchen6
Bar
Taste
ScaleItem
-- NO PrintOrder column in tblItem
```

### tblPendingOrders (20+ columns, ALL must be provided)
```sql
SalesID             -- FK to tblSales.ID
ItemID
SizeID
Qty
UnitPrice
Tastes              -- use COALESCE(@Tastes, '')
SideDishes          -- use COALESCE(@SideDishes, '')
ItemName
SizeName            -- use COALESCE(@SizeName, '')
ApplyGST / ApplyPST / ApplyPST2
DSCAmt
KitchenB / KitchenF / KitchenE
PersonIndex
SeparateBillPrint
Bar
ApplyNoDSC
OpenItem
ItemName2           -- use COALESCE(@ItemName2, '')
ExtraChargeItem
DSCAmtEmployee      -- use COALESCE(@DSCAmtEmployee, 0)
DSCAmtType1         -- use COALESCE(@DSCAmtType1, 0)
DSCAmtType2         -- use COALESCE(@DSCAmtType2, 0)
Status
DayHourDiscountRate -- use COALESCE(@DayHourDiscountRate, 0)
PricePerWeightUnit  -- use COALESCE(@PricePerWeightUnit, 0)
MeasuredWeight      -- default 0
DecimalPlaces       -- default 0
DiscountPercent     -- default 0
Kitchen5 / Kitchen6 -- default 0
```

### tblAvailableSize
```sql
ItemID
SizeID
UnitPrice
UnitPrice2
UnitPrice3
OnHandQty           -- stock level (NULL means untracked)
ApplyNoDSC
```

### tblSalesDetail (completed order line items)
```sql
ID                  -- PK
SalesID
ItemID
SizeID
Qty
UnitPrice
ItemName
SizeName
Tastes
SideDishes
ApplyGST / ApplyPST / ApplyPST2
DSCAmt
KitchenB / KitchenF / KitchenE
PersonIndex
Bar
ApplyNoDSC
OpenItem
ItemName2
ExtraChargeItem
DSCAmtEmployee / DSCAmtType1 / DSCAmtType2
DayHourDiscountRate
```

### tblPayment
```sql
ID
SalesID
PaymentTypeID       -- 1=Cash,2=Debit,3=Visa,4=MC,5=Amex,6=GiftCard,7=Other1,8=Other2
Amount
CardNumber          -- MUST use dbo.EncryptString(@CardNumber)
AuthCode
RefNum
PaymentDateTime
```

### tblCustomer
```sql
CustomerNum         -- PK (not CustomerID or ID)
FName / LName
Phone
Email
EarnedPoints
-- Use CustomerNum in all foreign key references
```

### tblOnlineOrders / tblOnlineOrderDetail / tblOnlineOrderCompany
```sql
-- tblOnlineOrders.ID, OnlineOrderCompanyID, CustomerID, OrderDateTime
-- tblSalesOfOnlineOrders links SalesID ↔ online order
-- Our app's entry in tblOnlineOrderCompany uses CompanyID=1 (or lookup)
```

---

## Payment Type IDs
```
1 = Cash
2 = Debit
3 = Visa
4 = MasterCard
5 = Amex
6 = Gift Card
7 = Other Credit 1
8 = Other Credit 2
```

---

## Mandatory Dapper Patterns

### Always use `SELECT SCOPE_IDENTITY()` for INSERTs that need the new ID
```csharp
const string sql = @"INSERT INTO dbo.tblSales (...) VALUES (...); SELECT SCOPE_IDENTITY();";
var newId = await connection.QuerySingleAsync<int>(sql, param, transaction);
```

### Stock check pattern (NULL = untracked, not zero)
```csharp
// null OnHandQty means item is not inventory-tracked → always in stock
return stock == null || stock.Value >= quantity;
```

### Transaction-safe connection sharing
```csharp
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
try { /* work */ }
finally { if (shouldDispose) connection.Dispose(); }
```

### Card number encryption (required for tblPayment)
```sql
INSERT INTO dbo.tblPayment (CardNumber, ...) VALUES (dbo.EncryptString(@CardNumber), ...)
```

---

## SSOT Non-Negotiables

1. **Never modify the INI_Restaurant schema** — no ALTER TABLE, no new columns, no new tables.
2. **Never override POS data** — if POS shows a value, that's ground truth.
3. **All writes must use SQL transactions** — always pass `IDbTransaction` through the call chain.
4. **Idempotency check before every write** — look up idempotency key in `IntegrationService` DB first.
5. **Re-validate ticket TransType before completing** — read and assert `TransType=2` inside the transaction.

---

## Database Connection Strings

```json
// appsettings.json
"ConnectionStrings": {
  "PosDatabase":           "Server=...;Database=TPPro;..."
  "IntegrationDatabase":  "Server=...;Database=IntegrationService;..."
}
```

The overlay/integration tables (idempotency, menu overlay, customers, campaigns) live in `IntegrationService` DB. POS data lives in `TPPro`. Never cross-write between them.
