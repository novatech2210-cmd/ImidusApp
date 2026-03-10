# POS Database Schema (INI_Restaurant)

**Source of Truth:** INI_Restaurant database (restored from INI_Restaurant.Bak)
**Status:** PENDING - Awaiting INI_Restaurant.Bak file

## Instructions

To complete schema discovery:

1. Place the `INI_Restaurant.Bak` file in `src/backend/db/backups/`
2. Start Docker containers: `cd src/backend && docker-compose up -d`
3. Run the restore script: `./db/scripts/restore-pos-db.sh`
4. Re-run schema discovery to generate actual table documentation

## Expected Tables

Based on existing PosEntities.cs in the codebase, the following tables are expected:

### Core Menu Tables

- `tblItem` - Menu items
- `tblCategory` - Item categories
- `tblAvailableSize` - Item size pricing
- `tblSize` - Size definitions

### Order Tables

- `tblSales` - Completed orders
- `tblSalesDetail` - Order line items
- `tblPendingOrders` - In-progress orders (20+ columns - ALL required on insert)
- `tblPayment` - Payment records

### Customer Tables

- `tblCustomer` - Customer records
- `tblMisc` - Miscellaneous data (may include loyalty points)

### Online Order Tables

- `tblOnlineOrderCompany` - Third-party delivery registration
- `tblSalesOfOnlineOrders` - Online order tracking
- `tblTable` - Table assignments

## Schema Discovery Query

Once the database is restored, run this query to discover actual schema:

```sql
SELECT
    TABLE_NAME,
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'dbo'
  AND TABLE_NAME IN (
      'tblItem', 'tblCategory', 'tblAvailableSize', 'tblSize',
      'tblSales', 'tblSalesDetail', 'tblPendingOrders',
      'tblPayment', 'tblCustomer', 'tblMisc',
      'tblOnlineOrderCompany', 'tblSalesOfOnlineOrders', 'tblTable'
  )
ORDER BY TABLE_NAME, ORDINAL_POSITION;
```

## Important Notes

- **SQL Server 2005 Express compatibility level** - Avoid MERGE, OFFSET/FETCH, window functions
- **No POS schema modifications** - All custom tables go in IntegrationService database
- **tblPendingOrders requires ALL columns** - Discovery will reveal exact column requirements
- **Use sp_InsertUpdateRewardPointsDetail** for loyalty points (not direct insert)
- **Card encryption via dbo.EncryptString()** function

---

_Generated: 2026-02-25_
_Last Updated: Pending database restore_
