# Step 6: Testing & Verification

## 🎯 Goal
Verify that all POS integration updates work correctly with the real INI Restaurant database.

**Estimated time:** 2-3 hours

---

## 📋 Testing Phases

### Phase 1: Database Connectivity (15 minutes)
### Phase 2: Menu Retrieval (30 minutes)
### Phase 3: Order Creation (1 hour)
### Phase 4: End-to-End Integration (1 hour)

---

## Phase 1: Database Connectivity

### Test SQL Connection

```sql
-- Run in SQL Server Management Studio or Azure Data Studio

-- 1. Connect to TPPro database
USE TPPro;
GO

-- 2. Verify tables exist
SELECT TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_NAME IN ('tblSales', 'tblSalesDetail', 'tblPayment', 'tblItem', 'tblAvailableSize')
ORDER BY TABLE_NAME;

-- Expected: 5 tables returned

-- 3. Check data exists
SELECT COUNT(*) AS ItemCount FROM tblItem WHERE Status = 1 AND OnlineItem = 1;
SELECT COUNT(*) AS SizeCount FROM tblSize;
SELECT COUNT(*) AS AvailableSizeCount FROM tblAvailableSize;

-- Expected: Non-zero counts
```

### Test .NET Connection

```bash
cd /home/kali/Desktop/TOAST/backend
dotnet test --filter "Category=Database&TestName~Connection"
```

---

## Phase 2: Menu Retrieval

### SQL Test Queries

```sql
-- Test 1: Get items with sizes
SELECT
    i.ItemID,
    i.IName,
    a.SizeID,
    s.SizeName,
    a.UnitPrice,
    a.OnHandQty
FROM tblItem i
INNER JOIN tblAvailableSize a ON i.ItemID = a.ItemID
INNER JOIN tblSize s ON a.SizeID = s.SizeID
WHERE i.Status = 1
  AND i.OnlineItem = 1
  AND (a.OnHandQty > 0 OR a.OnHandQty IS NULL)
ORDER BY i.CategoryID, i.IName, s.DisplayOrder;

-- Test 2: Verify size-based pricing
SELECT
    i.IName AS ItemName,
    COUNT(DISTINCT a.SizeID) AS SizeCount,
    MIN(a.UnitPrice) AS MinPrice,
    MAX(a.UnitPrice) AS MaxPrice
FROM tblItem i
INNER JOIN tblAvailableSize a ON i.ItemID = a.ItemID
WHERE i.Status = 1 AND i.OnlineItem = 1
GROUP BY i.IName
HAVING COUNT(DISTINCT a.SizeID) > 1
ORDER BY i.IName;

-- Expected: Items with multiple sizes and different prices
```

### API Test (Postman/curl)

```bash
# Test menu endpoint
curl -X GET "http://localhost:5000/api/menu" \
  -H "accept: application/json" | jq '.'

# Verify response structure:
# - items array exists
# - each item has sizes array
# - each size has sizeId, sizeName, price
```

---

## Phase 3: Order Creation

### Test Tax Rates

```sql
-- Verify tax configuration
SELECT Code, Value
FROM tblMisc
WHERE Code IN ('GST', 'PST', 'PST2');

-- Expected output:
-- GST   0.05 (or your rate)
-- PST   0.07 (or your rate)
-- PST2  0.00
```

### Test Order Creation (SQL)

```sql
-- Test 1: Get next daily order number
SELECT ISNULL(MAX(DailyOrderNumber), 0) + 1 AS NextOrderNumber
FROM tblSales
WHERE CONVERT(date, SaleDateTime) = CONVERT(date, GETDATE());

-- Test 2: Manual order insert (to verify schema)
BEGIN TRANSACTION;

DECLARE @SalesID int;
DECLARE @DailyOrderNumber int = 999;  -- Test number

-- Insert sale
INSERT INTO tblSales (
    SaleDateTime, TransType, SubTotal, DSCAmt,
    GSTAmt, PSTAmt, PST2Amt,
    CustomerID, CashierID, Guests, TakeOutOrder, DailyOrderNumber
)
VALUES (
    GETDATE(), 0, 10.00, 0,
    0.50, 0.70, 0,
    1, 1, 1, 1, @DailyOrderNumber
);

SET @SalesID = SCOPE_IDENTITY();

-- Insert item
INSERT INTO tblSalesDetail (
    SalesID, ItemID, SizeID, Quantity, UnitPrice,
    ItemName, SizeName, DSCAmt, PersonIndex,
    ApplyGST, ApplyPST, ApplyPST2,
    KitchenB, KitchenF, KitchenE, Kitchen5, Kitchen6
)
VALUES (
    @SalesID, 101, 1, 1, 10.00,
    'Test Item', 'Regular', 0, 1,
    1, 1, 0,
    0, 1, 0, 0, 0
);

-- Insert payment
INSERT INTO tblPayment (
    SalesID, PaymentTypeID, PaidAmount, TipAmount,
    Voided, AuthorizationNo, BatchNo
)
VALUES (
    @SalesID, 3, 11.20, 0,
    0, 'TEST123', 'BATCH001'
);

-- Verify inserts
SELECT * FROM tblSales WHERE ID = @SalesID;
SELECT * FROM tblSalesDetail WHERE SalesID = @SalesID;
SELECT * FROM tblPayment WHERE SalesID = @SalesID;

-- Cleanup
ROLLBACK TRANSACTION;
```

### API Test (Create Order)

```bash
# Create order via API
curl -X POST "http://localhost:5000/api/orders" \
  -H "Content-Type: application/json" \
  -H "X-Idempotency-Key: test-key-$(date +%s)" \
  -d '{
    "items": [
      {
        "menuItemId": 101,
        "sizeId": 1,
        "quantity": 1,
        "unitPrice": 10.99
      }
    ],
    "paymentAuthorizationNo": "TEST_AUTH_123",
    "paymentTypeId": 3,
    "tipAmount": 0
  }' | jq '.'

# Expected response:
# {
#   "success": true,
#   "salesId": <number>,
#   "orderNumber": "<daily order number>",
#   "totalAmount": <calculated total>,
#   "message": "Order #X created successfully"
# }
```

### Verify in Database

```sql
-- Check last created order
SELECT TOP 1 *
FROM tblSales
ORDER BY ID DESC;

-- Check items for that order
SELECT *
FROM tblSalesDetail
WHERE SalesID = (SELECT TOP 1 ID FROM tblSales ORDER BY ID DESC);

-- Check payment
SELECT *
FROM tblPayment
WHERE SalesID = (SELECT TOP 1 ID FROM tblSales ORDER BY ID DESC);

-- Verify stock was decreased (if tracked)
SELECT ItemID, SizeID, OnHandQty
FROM tblAvailableSize
WHERE ItemID = 101 AND SizeID = 1;
```

---

## Phase 4: End-to-End Integration

### Mobile App Test Flow

1. **Launch Mobile App**
   ```bash
   cd /home/kali/Desktop/TOAST/mobile
   npx react-native run-android  # or run-ios
   ```

2. **Browse Menu**
   - ✅ Items display correctly
   - ✅ Price ranges shown for multi-size items
   - ✅ "X sizes available" badge visible

3. **Open Product Detail**
   - ✅ Size selector appears
   - ✅ All sizes listed with prices
   - ✅ Out-of-stock sizes disabled
   - ✅ Clicking size updates total price

4. **Add to Cart**
   - ✅ Item added with selected size
   - ✅ Cart shows "Item Name (Size Name)"
   - ✅ Price matches selected size

5. **Checkout**
   - ✅ Total calculates correctly with tax
   - ✅ Payment processes (test mode)
   - ✅ Order confirmation displays
   - ✅ Order number returned

6. **Verify in Database**
   ```sql
   SELECT TOP 1 *
   FROM tblSales
   ORDER BY ID DESC;
   ```
   - ✅ Order appears in POS database
   - ✅ DailyOrderNumber matches app display
   - ✅ All items have correct ItemID and SizeID
   - ✅ Payment recorded

---

## ✅ Test Checklists

### Backend Tests

- [ ] Database connection successful
- [ ] Can query tblItem, tblAvailableSize, tblSize
- [ ] Menu retrieval returns items with sizes
- [ ] Tax rates loaded from tblMisc
- [ ] Next daily order number calculated correctly
- [ ] Order insert writes to tblSales successfully
- [ ] Line items insert to tblSalesDetail with SizeID
- [ ] Payment insert to tblPayment successful
- [ ] Stock decreases when inventory tracked
- [ ] Transaction rollback works on error

### API Tests

- [ ] GET /api/menu returns items with sizes array
- [ ] Each size has sizeId, sizeName, price, inStock
- [ ] POST /api/orders accepts sizeId parameter
- [ ] Order creation returns salesId and orderNumber
- [ ] Idempotency key prevents duplicate orders
- [ ] Validation rejects missing sizeId
- [ ] Error handling returns clear messages

### Mobile App Tests

- [ ] Menu items display with size options
- [ ] Product detail shows size selector
- [ ] Size selection updates displayed price
- [ ] Out-of-stock sizes are disabled
- [ ] Add to cart includes sizeId
- [ ] Cart displays size name for each item
- [ ] Different sizes treated as separate cart items
- [ ] Checkout sends sizeId to API
- [ ] Order confirmation shows order number

---

## 🐛 Common Issues & Fixes

### Issue: "Invalid object name 'Tickets'"
**Cause:** Old table name still in code
**Fix:** Search for "Tickets" in codebase, replace with "tblSales"
```bash
grep -r "FROM Tickets" backend/
```

### Issue: "Cannot insert NULL into column 'SizeID'"
**Cause:** Code not providing SizeID
**Fix:** Ensure all order items include sizeId
```csharp
new PosTicketItem { ItemID = 101, SizeID = 1, ... }
```

### Issue: "No sizes returned for menu items"
**Cause:** Join to tblAvailableSize missing or incorrect
**Fix:** Verify SQL query includes:
```sql
INNER JOIN tblAvailableSize a ON i.ItemID = a.ItemID
```

### Issue: "Tax calculation incorrect"
**Cause:** Not reading from tblMisc or using hardcoded values
**Fix:** Load tax rates dynamically:
```csharp
var taxRates = await _posRepo.GetTaxRatesAsync();
```

---

## 📝 Verification Checklist

- [ ] All unit tests pass: `dotnet test`
- [ ] Integration tests pass
- [ ] Manual SQL queries return expected data
- [ ] API endpoints respond correctly (Postman/curl)
- [ ] Mobile app displays menu with sizes
- [ ] Can complete full order flow (menu → cart → checkout)
- [ ] Order appears in POS database with correct schema
- [ ] Daily order numbers increment correctly
- [ ] Stock quantities decrease (if tracked)
- [ ] No compilation errors or warnings

---

## 🚀 Final Steps

### 1. Merge to Main Branch

```bash
cd /home/kali/Desktop/TOAST
git add .
git commit -m "Complete POS schema refactoring - size-based pricing"
git checkout main
git merge feature/pos-schema-update
git push origin main
```

### 2. Deploy to Test Environment

Follow the deployment guides in `/workspace/group/DEPLOYMENT_GUIDES/`

### 3. Notify Team

Email/Slack message:
> **TOAST POS Integration Updated**
>
> The POS integration has been updated to match the real INI Restaurant database schema.
>
> **Key Changes:**
> - Menu items now support multiple sizes with different prices
> - Size selection required when ordering
> - All database queries updated to use correct table/column names
>
> **Testing:** End-to-end tested with real TPPro database ✅
>
> **Next Steps:** Continue with Milestone 4 feature development

---

## 🎉 Success!

You've successfully refactored the TOAST POS integration to match the real database schema!

**What's working now:**
✅ Menu retrieval with size-based pricing
✅ Order creation with proper schema
✅ Stock tracking per item+size
✅ Tax calculation from POS config
✅ Daily order number generation
✅ Full integration tested

**Ready for:**
- Milestone 4 features (push notifications, analytics, etc.)
- Production deployment
- Client acceptance testing

---

**Generated by Novatech** 🚀
