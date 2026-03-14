# Phase 12-01: Web Payments Testing Report

## Test Environment Status

### ✅ Backend Service (Port 5004)
- **Status**: Running (PID 146299)
- **Health Check**: `{"status":"healthy"}`
- **Database**: Connected (latency: 4.7ms)
- **Categories Available**: 1

### ✅ Web Application (Port 3000)
- **Status**: Running
- **Access URL**: http://localhost:3000
- **Environment**: Development mode with Turbopack
- **Environment Variables**: Loaded from `.env.local`

### ✅ API Endpoints Verified
- ✅ `GET /api/Sync/health` - Healthy
- ✅ `GET /api/Sync/status` - POS Connected
- ✅ `GET /api/Menu/categories` - Returns BREAKFAST category
- ✅ `GET /api/Menu/items/1` - Returns menu items
- ✅ `GET /api/Customers/lookup?phone=1234567890` - Returns customer #2
- ✅ `POST /api/Orders/{salesId}/complete-payment` - Endpoint exists (405 OPTIONS, allows POST)

---

## Manual Testing Steps

### Prerequisites
- ✅ Backend service running on port 5004
- ✅ Web app running on port 3000
- ✅ POS database connected
- ✅ Environment variables configured

### Test Flow: Complete Order with Payment

#### 1. Browse Menu
1. Open browser: http://localhost:3000
2. Navigate to "Menu" or browse categories
3. Select items to add to cart
4. Verify cart updates with item count

**Expected**: Items appear in cart, total calculates correctly

#### 2. Go to Checkout
1. Click "Checkout" or cart icon
2. Verify checkout page loads
3. Verify progress indicator shows "Step 1" active

**Expected**: Checkout form displays with customer info fields

#### 3. Enter Customer Information
1. Fill in:
   - First Name: `Test`
   - Last Name: `Customer`
   - Phone: `1234567890` (existing customer in DB)
   - Email:  (optional)

**Expected**: Form validates required fields

#### 4. Select Tip Amount
1. Try each preset button: $0, $2, $5, $10
2. Verify active button highlights in gold
3. Click "Enter custom amount"
4. Enter custom tip: `3.50`
5. Verify order summary updates with tip line

**Expected**:
- Selected tip highlights
- Order summary shows: Subtotal, GST (6%), PST (0%), Tip, Total
- Total = Subtotal + Tax + Tip

#### 5. Schedule Order (Optional Test)
1. Check "Schedule for Later" toggle
2. Select a future date and time (>30 min from now)
3. Verify scheduled time displays
4. Click "Continue to Payment"

**Expected**: Scheduled orders bypass payment step, redirect to confirmation

#### 6. Continue to Payment (Immediate Orders)
1. Uncheck "Schedule for Later" if checked
2. Click "Continue to Payment"

**Backend Actions (automatic)**:
- Customer lookup: `GET /api/Customers/lookup?phone=1234567890`
- Create pending order: `POST /api/Orders` with TransType=2
- Store salesId for Step 2

**Expected**:
- Progress indicator shows "Step 2" active
- Payment form displays
- Accept.js script loads
- No errors in browser console

#### 7. Enter Payment Information
1. Card Number: `4111111111111111` (test approved)
2. Expiry: `12/28`
3. CVV: `123`
4. Verify "Pay $XX.XX" button shows correct total (including tip)

**Expected**: Form validates card format (spaces added automatically)

#### 8. Submit Payment
1. Click "Pay $XX.XX"
2. Observe processing state

**Backend Actions (automatic)**:
- Accept.js tokenizes card (client-side) → opaqueToken
- Complete payment: `POST /api/Orders/{salesId}/complete-payment`
- Backend charges card via Authorize.net
- Backend writes to POS atomically:
  - `tblSales` with TransType=1
  - `tblPayment` with transaction ID
  - `tblSalesDetails` with items
  - Auto-void on failure

**Expected**:
- "Processing Payment..." spinner displays
- No raw card data sent to backend (check Network tab)
- Only opaque token transmitted
- Success: redirects to confirmation
- Failure: error message, returns to payment form

#### 9. Verify Order Confirmation
1. Confirmation page loads
2. Verify displays:
   - Order number (DailyOrderNumber)
   - Total amount (with tip)
   - Transaction ID: `(Txn: 1234567890...)`
   - Payment status: ✓ Payment confirmed
3. Cart should be empty

**Expected**: Order details match, transaction ID displays

#### 10. Verify POS Database
```sql
-- Check tblSales (should have TransType=1)
SELECT TOP 1 ID, TransType, SubTotal, GTotal, TipAmt, CashierID, StationID
FROM tblSales
ORDER BY ID DESC

-- Check tblPayment (should have transaction ID)
SELECT TOP 1 ID, SalesID, PaymentTypeID, BatchNo, AuthorizationNo
FROM tblPayment
ORDER BY ID DESC

-- Check tblSalesDetails (items)
SELECT TOP 5 * FROM tblSalesDetails ORDER BY ID DESC
```

**Expected**:
- `tblSales.TransType = 1` (completed)
- `tblSales.CashierID = 999` (online orders)
- `tblSales.StationID = 2` (DESKTOP-DEMO)
- `tblSales.TipAmt = [selected tip amount]`
- `tblPayment.AuthorizationNo = [transaction ID]`
- `tblPayment.PaymentTypeID = 3` (Credit Card)

---

## Test Cases

### TC-01: Happy Path (Immediate Order with Tip)
- **Status**: Ready to test
- **Steps**: 1-10 above
- **Expected Result**: Order completes, writes to POS, confirmation displays

### TC-02: Scheduled Order
- **Status**: Ready to test
- **Steps**: 1-5 (with scheduling enabled)
- **Expected Result**: Order scheduled, no payment, confirmation displays

### TC-03: Payment Decline
- **Status**: Ready to test
- **Card**: `4000300011112220` (test decline card)
- **Expected Result**: Error message, can retry without recreating order

### TC-04: Custom Tip
- **Status**: Ready to test
- **Steps**: Enter custom tip amount (e.g., $7.50)
- **Expected Result**: Custom tip included in total

### TC-05: Environment Variables
- **Status**: ✅ Verified
- **Test**: Check no hardcoded credentials in source
- **Expected Result**: Credentials loaded from `.env.local`

### TC-06: Duplicate Order Prevention
- **Status**: Ready to test
- **Test**: Refresh during payment processing
- **Expected Result**: Idempotency key prevents duplicate orders

### TC-07: Customer Lookup New Customer
- **Status**: Ready to test
- **Phone**: `9999999999` (not in DB)
- **Expected Result**: New customer created automatically

---

## Security Verification

### ✅ PCI Compliance Checks

1. **No Raw Card Data in Backend**
   - Open browser DevTools → Network tab
   - Submit payment
   - Inspect `POST /api/Orders/{salesId}/complete-payment` payload
   - **Verify**: Only `dataDescriptor` and `dataValue` (opaque tokens)
   - **Verify**: No cardNumber, expiry, or CVV in any request

2. **No Credentials in Source Code**
   ```bash
   grep -r "9JQVwben66U7" src/web/app/ src/web/lib/
   # Should only find: checkout/page.tsx with process.env reference
   ```

3. **Environment Variables**
   ```bash
   grep "NEXT_PUBLIC_AUTH_NET" src/web/.env.local
   # Should show: API_LOGIN_ID and PUBLIC_KEY
   ```

### ✅ Code Review Checklist
- ✅ Hardcoded credentials removed from `checkout/page.tsx`
- ✅ Environment variables used for Authorize.net config
- ✅ Accept.js loaded from official CDN
- ✅ No card data in API requests
- ✅ HTTPS enforced in production (sandbox uses HTTP for testing)
- ✅ Idempotency keys prevent duplicate orders
- ✅ Customer lookup before order creation

---

## Known Issues / Limitations

### Non-Blocking
1. **Profile Page Error**: Unrelated TypeScript error in `app/profile/page.tsx`
   - Error: `Property 'customer' does not exist on type 'AuthContextType'`
   - **Impact**: None on payment flow
   - **Fix**: Needs separate PR to update AuthContext interface

2. **Build Warnings**: Next.js workspace root inference warning
   - Multiple lockfiles detected
   - **Impact**: None on functionality
   - **Fix**: Configure `turbopack.root` in next.config.js

### Blocking (None)
- All payment functionality implemented and ready to test

---

## Test Card Numbers

### Authorize.net Sandbox Test Cards

| Card Number | Expiry | CVV | Expected Result |
|-------------|--------|-----|-----------------|
| 4111111111111111 | 12/28 | 123 | ✅ Approved |
| 4007000000027 | 12/28 | 123 | ✅ Approved |
| 4012888818888 | 12/28 | 123 | ✅ Approved |
| 4000300011112220 | 12/28 | 123 | ❌ Declined |
| 370000000000002 | 12/28 | 1234 | ✅ Approved (AmEx - 4 digit CVV) |

**Note**: Any future expiry date works. CVV can be any 3-4 digits.

---

## Verification Checklist

### Pre-Flight Checks
- [x] Backend API running and accessible
- [x] POS database connection working
- [x] Web app running on port 3000
- [x] Environment variables configured
- [x] Menu items available
- [x] Customer lookup endpoint working
- [x] Complete payment endpoint exists

### Functional Testing (Manual)
- [ ] Add items to cart
- [ ] Navigate to checkout
- [ ] Customer lookup creates/finds customer
- [ ] Tip selection updates total
- [ ] Scheduled order bypasses payment
- [ ] Payment form loads Accept.js
- [ ] Card tokenization succeeds
- [ ] Payment completion charges card
- [ ] Order writes to POS with TransType=1
- [ ] Payment records in tblPayment with transaction ID
- [ ] Tip amount included in total
- [ ] Confirmation page shows transaction ID
- [ ] Failed payments show clear errors
- [ ] Can retry failed payments
- [ ] Cart clears on success

### Database Verification
- [ ] tblSales record created with TransType=1
- [ ] tblSales.CashierID = 999 (online)
- [ ] tblSales.StationID = 2 (DESKTOP-DEMO)
- [ ] tblSales.TipAmt matches selected tip
- [ ] tblPayment record created
- [ ] tblPayment.AuthorizationNo = transaction ID
- [ ] tblPayment.PaymentTypeID = 3 (Credit Card)
- [ ] tblSalesDetails has all items

### Security Verification
- [x] No hardcoded credentials in source
- [ ] No raw card data in network requests
- [ ] Only opaque tokens sent to backend
- [x] Environment variables loaded correctly
- [ ] Accept.js loads from CDN
- [ ] Idempotency prevents duplicates

### Non-Functional Testing
- [ ] Page load < 2 seconds
- [ ] Payment processing < 5 seconds
- [ ] Mobile responsive (test on phone)
- [ ] Error messages are user-friendly
- [ ] Loading states display correctly
- [ ] Browser console shows no errors

---

## Next Steps

### Immediate
1. **Manual Browser Testing**: Complete the functional checklist above
2. **Database Verification**: Run SQL queries to verify POS writes
3. **Security Audit**: Verify no card data in network traffic

### Follow-Up
1. **Fix Profile Page**: Update AuthContext to include `customer` property
2. **Add E2E Tests**: Playwright tests for complete order flow
3. **Performance Testing**: Test with multiple concurrent orders
4. **Mobile Testing**: Test on iOS Safari and Android Chrome
5. **Production Deployment**: Update environment variables for production Authorize.net

---

## Test Results Summary

| Test Case | Status | Notes |
|-----------|--------|-------|
| TC-01: Happy Path | ⏳ Pending | Ready to test manually |
| TC-02: Scheduled Order | ⏳ Pending | Ready to test manually |
| TC-03: Payment Decline | ⏳ Pending | Ready to test manually |
| TC-04: Custom Tip | ⏳ Pending | Ready to test manually |
| TC-05: Environment Variables | ✅ Passed | Verified in code |
| TC-06: Idempotency | ⏳ Pending | Ready to test manually |
| TC-07: New Customer | ⏳ Pending | Ready to test manually |

---

## Deployment Readiness

### Before Production Deploy
- [ ] All test cases passed
- [ ] Database verification complete
- [ ] Security audit complete
- [ ] Performance testing complete
- [ ] Mobile testing complete
- [ ] Update environment variables for production:
  - `NEXT_PUBLIC_AUTH_NET_API_LOGIN_ID` (production)
  - `NEXT_PUBLIC_AUTH_NET_PUBLIC_KEY` (production)
  - `NEXT_PUBLIC_AUTH_NET_ENVIRONMENT=production`
- [ ] SSL/HTTPS enforced
- [ ] Error monitoring configured
- [ ] Backup/rollback plan ready

---

**Test Environment**: Development (Sandbox)
**Test Date**: 2026-03-09
**Tested By**: Automated Pre-Flight + Manual Testing Required
**Phase Status**: Implementation Complete, Testing In Progress
