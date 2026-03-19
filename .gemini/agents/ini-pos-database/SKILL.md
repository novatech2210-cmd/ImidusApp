---
name: ini-pos-database
description: Activate when writing any SQL queries, Dapper repository methods, or entity mappings that touch the INI_Restaurant (TPPro) database. Provides authoritative column names, schema constraints, SQL Server 2005 compatibility rules, and mandatory patterns for this legacy POS system.
color: purple
icon: database
---

# INI POS Database Skill

## Why This Skill Exists
The **INI_Restaurant** (TPPro) database runs on **SQL Server 2005 Express** for the old Delphi-based INI POS system. Schema is **frozen** — no changes allowed. Column names are quirky, many modern T-SQL features are unavailable. All Dapper/ADO.NET code touching this DB **must** follow these rules to avoid failures or data corruption.

## SQL Server 2005 Restrictions (HARD LIMITS)
| Prohibited Feature          | Use Instead / Workaround                              | Notes |
|-----------------------------|-------------------------------------------------------|-------|
| `MERGE`                     | Explicit `IF EXISTS ... UPDATE` else `INSERT`         | 2008+ |
| `OFFSET / FETCH`            | `SELECT TOP N` + `WHERE ID > @lastId ORDER BY ID`     | 2012+ |
| Advanced window functions (`LEAD`, `LAG`, etc.) | Subqueries or self-joins                              | Only `ROW_NUMBER()`, `RANK()`, `DENSE_RANK()`, `NTILE` available |
| JSON functions              | Handle formatting in C#                               | 2016+ |
| `STRING_AGG`                | `FOR XML PATH('')` + `STUFF`                          | 2017+ |
| `TRY_CONVERT` / `TRY_CAST`  | `CASE WHEN ISNUMERIC(@val)=1 THEN CAST(...) ELSE NULL` | 2012+ |

**Allowed & Useful in 2005**:
- `OUTPUT` clause on INSERT/UPDATE/DELETE (introduced 2005 — prefer over `SCOPE_IDENTITY()` when possible)
- CTEs (`WITH`)
- `ROW_NUMBER() OVER(...)`
- `APPLY` (cross/outer)

## Critical TransType Values (tblSales)
```sql
0 = Refund / Credit
1 = Sale (Completed / Posted)
2 = Open (In Progress / Tendering)
Concurrency safety rule: Before finalizing/completing an order, always verify TransType = 2 inside the transaction. If not → rollback and retry or error.
Authoritative Column Names & Notes
tblSales (Main Orders Header)
SQLID                  -- PK, int, IDENTITY (use this, NOT SalesID)
SaleDateTime        -- datetime
TransType           -- int (see above)
DailyOrderNumber    -- int/varchar?
SubTotal            -- money/decimal
DSCAmt              -- discount amount
AlcoholDSCAmt
GSTAmt / PSTAmt / PST2Amt
GSTRate / PSTRate / PST2Rate
CustomerID          -- fk to tblCustomer.CustomerNum
CashierID
TableID
StationID
Guests              -- int
TakeOutOrder        -- bit?
-- DO NOT USE / Non-existent in 2005: DeliveryChargeAmt, OnlineOrderCompanyID, Locked, PaymentCount
tblItem (Menu Items)
SQLID                  -- PK
IName               -- primary name
IName2              -- secondary/alternate name
ItemDescription
ImageFilePath
CategoryID
Status              -- 1=active, 0=inactive
OnlineItem          -- 1=available for online orders
Alcohol             -- bit?
BarCode
ManageInv           -- bit? (inventory tracked)
ApplyGST / ApplyPST / ApplyPST2 -- bit flags
KitchenB / KitchenF / KitchenE / Kitchen5 / Kitchen6 -- bit? printer routing
Bar                 -- bit?
Taste               -- ?
ScaleItem           -- bit?
-- NO PrintOrder column
tblPendingOrders (Temporary/Open Order Lines – ALL columns required on INSERT)
SQLSalesID             -- FK to tblSales.ID
ItemID
SizeID
Qty
UnitPrice
Tastes              -- varchar, COALESCE(@Tastes, '')
SideDishes          -- varchar, COALESCE(@SideDishes, '')
ItemName
SizeName            -- COALESCE(@SizeName, '')
ApplyGST / ApplyPST / ApplyPST2
DSCAmt
KitchenB / KitchenF / KitchenE
PersonIndex
SeparateBillPrint
Bar
ApplyNoDSC
OpenItem
ItemName2           -- COALESCE(@ItemName2, '')
ExtraChargeItem
DSCAmtEmployee      -- COALESCE(@DSCAmtEmployee, 0)
DSCAmtType1 / DSCAmtType2 -- COALESCE(..., 0)
Status
DayHourDiscountRate -- COALESCE(..., 0)
PricePerWeightUnit  -- COALESCE(..., 0)
MeasuredWeight      -- default 0
DecimalPlaces       -- default 0
DiscountPercent     -- default 0
Kitchen5 / Kitchen6 -- default 0
(Other tables like tblAvailableSize, tblSalesDetail, tblPayment, tblCustomer, tblOnlineOrders — unchanged and accurate in original.)
Payment Type IDs (tblPayment.PaymentTypeID)
text1 = Cash
2 = Debit
3 = Visa
4 = MasterCard
5 = Amex
6 = Gift Card
7 = Other Credit 1
8 = Other Credit 2
Mandatory Dapper Patterns
Preferred: Use OUTPUT for new IDs (safer than SCOPE_IDENTITY)
C#var sql = @"
    INSERT INTO dbo.tblSales (/* columns */) 
    OUTPUT INSERTED.ID 
    VALUES (...);
";
var newId = await connection.QuerySingleAsync<int>(sql, param, transaction);
Fallback: SCOPE_IDENTITY() (if OUTPUT not suitable)
C#var sql = @"
    INSERT INTO dbo.tblSales (...) VALUES (...); 
    SELECT SCOPE_IDENTITY();
";
var newId = await connection.QuerySingleAsync<decimal?>(sql, param, transaction); // cast to int
Note: SCOPE_IDENTITY() can be affected by triggers; OUTPUT avoids this.
Stock / Inventory Check
C#// NULL = not tracked → always allow
return onHandQty == null || onHandQty.Value >= requiredQty;
Connection + Transaction Handling
(Your pattern is perfect — keep it.)
Card Encryption (tblPayment)
SQLINSERT INTO dbo.tblPayment (..., CardNumber, ...) 
VALUES (..., dbo.EncryptString(@CardNumber), ...)
SSOT Non-Negotiables

No schema changes — ever.
POS data is ground truth — do not override.
All writes in transactions — pass IDbTransaction.
Idempotency check first (in IntegrationService DB).
Re-validate TransType=2 before completion inside tx.
Use provided column names exactly — case-sensitive.

Connection Strings Reminder
JSON"ConnectionStrings": {
  "PosDatabase": "Server=...;Database=INI_Restaurant;...",  // or TPPro
  "IntegrationDatabase": "Server=...;Database=IntegrationService;..."
}
POS writes → INI_Restaurant only. Overlay data (tokens, logs, etc.) → IntegrationService.
Last Updated: March 17, 2026 – Added OUTPUT preference, clarified window/OUTPUT availability.
