# End-to-End Test Plan - IMIDUS POS Integration

Complete test plan for verifying order flow across all three platforms: web, mobile (Android), and mobile (iOS), with backend integration validation.

## Test Environment Setup

### System Requirements
- **Backend:** .NET 8 Windows Service running at http://10.0.0.26:5000
- **Web:** Next.js 14 at http://10.0.0.26:3000
- **Mobile:** APK v0.0.1+ for Android, IPA v0.0.1+ for iOS
- **Database:** MS SQL Server 2005 Express with INI_Restaurant.Bak
- **Payments:** Authorize.net Sandbox credentials configured
- **Firebase:** FCM configured for push notifications

### Test Data Requirements

#### Customers
- Create at least 2 test customers with different email addresses
- One customer with existing loyalty points balance (for loyalty testing)
- One customer with no prior order history

#### Menu Items
- Verify all 7 categories are present:
  1. Appetizers
  2. Entrees
  3. Sides
  4. Beverages
  5. Desserts
  6. Special Items
  7. Combo Meals
- All size-based pricing configured
- At least one item marked out-of-stock (for inventory testing)

#### Payment Credentials
- Authorize.net Test Card: 4111111111111111
- Expiration: 12/25 (any future month/year)
- CVV: 123 (any 3 digits)
- Postal Code: 12345 (any 5 digits)

#### CashierID Mapping
- **999:** Online orders (permanent)
- **998:** Test orders (for this test cycle)

---

## Test Scenarios & Expected Results

### Scenario 1: Web Platform - New Customer Registration

**Objective:** Verify customer can register and access menu

**Steps:**
1. Navigate to http://10.0.0.26:3000
2. Click "Register" or create account link
3. Enter email: `test-web-{timestamp}@imidus.local`
4. Enter password: `TestPassword123!`
5. Confirm password
6. Click "Create Account"
7. Verify email confirmation sent
8. Check email and verify/confirm registration
9. Navigate back to login
10. Login with new credentials

**Expected Results:**
- Registration form validates email format
- Password requirements enforced (minimum 8 chars, mixed case, number)
- Confirmation email sent within 30 seconds
- Email link redirects back to login
- Login succeeds with correct credentials
- Menu page displays after login

**Success Criteria:**
- [ ] Registration completes without errors
- [ ] Confirmation email received
- [ ] Login successful
- [ ] Menu displays all 7 categories

---

### Scenario 2: Web Platform - Menu Browsing & Item Selection

**Objective:** Verify menu displays correctly and items can be added to cart

**Prerequisites:** Logged in as test customer on web

**Steps:**
1. Verify menu page displays all 7 categories
2. Count items in each category:
   - Appetizers: verify count
   - Entrees: verify count
   - Sides: verify count
   - Beverages: verify count
   - Desserts: verify count
   - Special Items: verify count
   - Combo Meals: verify count
3. Click on an Entree item
4. Verify item details display (name, description, price, sizes)
5. Select Medium size if available
6. Click "Add to Cart"
7. Verify item added (cart badge updates to 1)
8. Select different Appetizer
9. Click "Add to Cart"
10. Verify cart now shows 2 items

**Expected Results:**
- All 7 categories visible and scrollable
- Item counts match database
- Item detail panel displays correctly
- Prices reflect size selection
- Out-of-stock items show disabled state
- Cart updates in real-time

**Success Criteria:**
- [ ] All 7 categories visible with correct item counts
- [ ] Item details display correctly
- [ ] Size selection updates price
- [ ] Cart adds items correctly
- [ ] Cart badge shows item count

---

### Scenario 3: Web Platform - Checkout & Payment

**Objective:** Verify checkout flow and payment processing

**Prerequisites:** Cart contains 2-3 items on web

**Steps:**
1. Click "Checkout" button
2. Verify order summary shows:
   - All items with quantities
   - Subtotal
   - GST calculation (6%)
   - Total amount
3. Verify mathematical accuracy:
   - Subtotal = sum of (price × quantity)
   - GST = Subtotal × 0.06
   - Total = Subtotal + GST
4. Click "Proceed to Payment" or similar
5. Fill in card details:
   - Card Number: 4111111111111111
   - Expiration: 12/25
   - CVV: 123
   - Postal Code: 12345
6. Click "Pay" or "Submit"
7. Verify payment processing message
8. Wait for success confirmation
9. Verify order confirmation page with:
   - Order number (should be incrementing)
   - Order date/time
   - Items ordered
   - Total amount charged

**Expected Results:**
- Checkout displays correct totals
- GST calculated correctly (6% rate)
- Payment form accepts test card
- Payment succeeds without errors
- Order confirmation displays order number
- Order number is unique and incrementing

**Success Criteria:**
- [ ] All totals calculated correctly
- [ ] GST is exactly 6%
- [ ] Payment succeeds with test card
- [ ] Order number generated and displayed
- [ ] Order confirmation page loads

---

### Scenario 4: Web Platform - Order Tracking

**Objective:** Verify customer can track order status

**Prerequisites:** Order just placed on web

**Steps:**
1. On order confirmation page, click "Track Order" or navigate to order history
2. Find the order just placed
3. Verify it shows "Pending" status initially
4. Note the order number
5. Manually update order status in backend (or simulate backend processing)
6. Return to web and refresh page
7. Verify status changed to "Ready for Pickup"
8. Verify notification or status change message displayed

**Expected Results:**
- Order tracking page shows pending orders
- Status updates within 30 seconds after backend change
- Both platforms show consistent status

**Success Criteria:**
- [ ] Order tracking page accessible
- [ ] Initial status is "Pending"
- [ ] Status updates reflected on page
- [ ] Order number matches previous page

---

### Scenario 5: Mobile Platform (Android) - Installation & Launch

**Objective:** Verify Android APK installs and launches correctly

**Prerequisites:** APK v0.0.1 file available

**Steps:**
1. On Android device/emulator, install APK:
   ```bash
   adb install -r ImidusCustomerApp-v0.0.1.apk
   ```
2. Verify installation completes
3. Launch app from home screen or:
   ```bash
   adb shell am start -n com.imidus.customer/com.imidus.customer.MainActivity
   ```
4. Verify app launches
5. Verify SplashScreen displays with Imidus branding
6. After SplashScreen, verify Login screen appears
7. Verify no errors in logcat:
   ```bash
   adb logcat | grep "com.imidus.customer"
   ```

**Expected Results:**
- APK installs without errors
- App launches successfully
- SplashScreen shows brand colors
- No crashes or unhandled exceptions
- Login screen renders correctly

**Success Criteria:**
- [ ] APK installs successfully
- [ ] App launches without crashes
- [ ] SplashScreen displays
- [ ] Login screen visible
- [ ] No errors in logcat

---

### Scenario 6: Mobile Platform (Android) - Registration & Menu

**Objective:** Verify Android registration and menu browsing

**Prerequisites:** App launched and showing login screen

**Steps:**
1. Click "Sign Up" or "Create Account" link
2. Fill in registration form:
   - Email: `test-android-{timestamp}@imidus.local`
   - Password: `TestPassword123!`
   - Confirm Password: `TestPassword123!`
3. Click "Register" or "Sign Up"
4. Verify registration succeeds
5. Verify automatic login after registration
6. Verify app navigates to Menu screen
7. Scroll through menu categories
8. Verify all 7 categories visible
9. Verify item counts match web platform
10. Verify colors match Imidus branding (gold #D4AF37, blue #002366)

**Expected Results:**
- Registration form validates inputs
- Password requirements enforced
- Auto-login works after registration
- Menu displays immediately
- All 7 categories visible
- Category counts match web
- UI responds quickly (< 1 second per tap)
- Branding colors correct

**Success Criteria:**
- [ ] Registration succeeds
- [ ] Auto-login works
- [ ] Menu shows all 7 categories
- [ ] Category counts match web
- [ ] No hardcoded localhost URLs visible

---

### Scenario 7: Mobile Platform (Android) - Cart & Checkout

**Objective:** Verify Android cart and payment flow

**Prerequisites:** Registered on Android, viewing menu

**Steps:**
1. Browse menu and select 3 items from different categories
2. Add first item to cart
3. Verify cart badge appears and shows "1"
4. Add second item
5. Verify cart badge shows "2"
6. Add third item
7. Verify cart badge shows "3"
8. Tap cart icon to view cart
9. Verify all 3 items listed with:
   - Item names
   - Quantities
   - Prices
   - Subtotal, tax, total
10. Verify totals match web calculations
11. Tap "Checkout" or "Proceed to Payment"
12. Fill payment form:
    - Card: 4111111111111111
    - Exp: 12/25
    - CVV: 123
13. Tap "Pay" or "Submit"
14. Verify order confirmation with order number
15. Navigate to order tracking

**Expected Results:**
- Cart updates in real-time
- Cart badge shows item count
- Totals calculated correctly (including 6% GST)
- Payment form accepts test card
- Payment succeeds
- Order confirmation displays
- Order number matches backend

**Success Criteria:**
- [ ] Cart updates real-time
- [ ] Totals match web calculations
- [ ] Payment succeeds
- [ ] Order confirmation shows order number

---

### Scenario 8: Mobile Platform (Android) - Push Notifications

**Objective:** Verify push notifications for order status

**Prerequisites:** Order placed on Android, Firebase FCM configured

**Steps:**
1. After placing order, note the order number
2. Keep Android app in foreground
3. In backend or admin panel, change order status to "Ready for Pickup"
4. Verify notification appears on Android within 30 seconds
5. Tap notification
6. Verify notification navigates to order tracking
7. Verify order status updated to "Ready for Pickup"
8. Background test: Close app and repeat order status change
9. Verify push notification appears even with app closed
10. Tap notification to open app and jump to order

**Expected Results:**
- Notification appears within 30 seconds of status change
- Notification displays meaningful message (e.g., "Your order is ready!")
- Notification includes order number and status
- Notification handles both foreground and background states
- Tapping notification navigates correctly

**Success Criteria:**
- [ ] Notification received within 30 seconds
- [ ] Notification displays correct information
- [ ] Notification works in background
- [ ] Tapping notification navigates to order tracking

---

### Scenario 9: Mobile Platform (iOS) - Installation & Launch

**Objective:** Verify iOS IPA installs and launches

**Prerequisites:** IPA file available for iOS simulator or device

**Steps:**
1. On iOS simulator:
   ```bash
   xcrun simctl install booted ImidusCustomerApp-v0.0.1.ipa
   ```
2. Or on device: Open TestFlight app and install build
3. Launch app
4. Verify SplashScreen displays
5. After splash, verify Login screen
6. Check console for errors:
   ```bash
   xcrun simctl spawn booted log stream --predicate 'process == "ImidusCustomerApp"'
   ```

**Expected Results:**
- IPA installs without errors
- App launches successfully
- SplashScreen and Login visible
- No crashes or exceptions

**Success Criteria:**
- [ ] IPA installs successfully
- [ ] App launches without crashes
- [ ] Login screen visible

---

### Scenario 10: iOS & Android - Loyalty Points (if enabled)

**Objective:** Verify loyalty points earn and redeem

**Prerequisites:** Loyalty system configured in POS database

**Steps:**
1. Login as customer with existing loyalty balance (or check current balance)
2. Place test order for $100+
3. Note starting points balance
4. Complete payment
5. Wait 30 seconds for backend processing
6. Refresh app or navigate back to profile
7. Verify points balance updated:
   - For $100 order: should earn 10 points (1 per $10)
8. Check database tblPointsDetail for transaction
9. On next order, before checkout, tap "Redeem Points"
10. Verify redemption slider shows current balance
11. Redeem some points (e.g., 10 points = $4 discount)
12. Verify discount applied to total
13. Complete payment
14. Verify redemption logged in tblPointsDetail

**Expected Results:**
- Points earned correctly (1 per $10)
- Points balance updates after order
- Redemption slider works smoothly
- Discount applied correctly ($0.40 per point)
- Transactions logged in database
- No duplicate point transactions

**Success Criteria:**
- [ ] Points earned correctly
- [ ] Points balance updates
- [ ] Redemption works
- [ ] Discount calculated correctly
- [ ] Database transactions atomic

---

## Backend Integration Tests

### API Test 1: Health Check

```bash
curl -X GET http://10.0.0.26:5000/api/Sync/status
```

**Expected Response:**
```json
{
  "status": "online",
  "database": "connected",
  "latency_ms": 2,
  "timestamp": "2026-03-07T11:30:00Z"
}
```

**Success Criteria:**
- [ ] Returns 200 OK
- [ ] Status is "online"
- [ ] Database connected
- [ ] Latency < 5ms

### API Test 2: Menu Categories

```bash
curl -X GET http://10.0.0.26:5000/api/Menu/categories
```

**Expected Response:**
```json
{
  "categories": [
    { "id": 1, "name": "Appetizers", "item_count": X },
    { "id": 2, "name": "Entrees", "item_count": Y },
    ...
  ]
}
```

**Success Criteria:**
- [ ] Returns 200 OK
- [ ] All 7 categories present
- [ ] Item counts match UI
- [ ] Response < 200ms

### API Test 3: Order History

```bash
curl -X GET http://10.0.0.26:5000/api/Orders/history/{customerId}
```

**Expected Response:**
```json
{
  "orders": [
    {
      "order_id": "ORD-001",
      "date": "2026-03-07",
      "status": "completed",
      "total": 25.50
    }
  ]
}
```

**Success Criteria:**
- [ ] Returns 200 OK
- [ ] Orders list non-empty if orders placed
- [ ] Order details correct
- [ ] Response < 200ms

### API Test 4: Order Idempotency

```bash
# Place same order twice with same idempotency key
curl -X POST http://10.0.0.26:5000/api/Orders \
  -H "Idempotency-Key: test-key-123" \
  -H "Content-Type: application/json" \
  -d '{"customer_id": 1, "items": [...], "total": 25.50}'

# Second request with same key
curl -X POST http://10.0.0.26:5000/api/Orders \
  -H "Idempotency-Key: test-key-123" \
  -H "Content-Type: application/json" \
  -d '{"customer_id": 1, "items": [...], "total": 25.50}'
```

**Expected Results:**
- First request: Returns 201 Created with order ID
- Second request: Returns same order ID, no duplicate order created

**Success Criteria:**
- [ ] Idempotency key prevents duplicate orders
- [ ] Same response returned on retry
- [ ] No duplicate DB entries

### API Test 5: No SQL Errors

Check backend logs during tests:

```bash
# On backend server, check Application log
# Should see no errors, only info/debug messages
```

**Success Criteria:**
- [ ] No SQL Server connection errors
- [ ] No transaction rollbacks
- [ ] No N+1 query problems

---

## Known Issues & Workarounds

### Issue: Order History Returns Empty

**Description:** Order history API returns empty list even after orders placed

**Cause:** Schema issue in order history view/query

**Workaround:**
- Verify orders exist in tblOrders via SQL query
- Check customer ID matches in order detail queries
- Manually verify via backend logs

**Impact:** Order history feature unavailable for testing, but order placement works

### Issue: Loyalty Points Calculation Off

**Description:** Points earned don't match 1-per-$10 rule

**Cause:** Tax included in loyalty calculation (should exclude GST)

**Workaround:**
- Check tblMisc SRPR value (should be '10@1')
- Manually verify point math: (Total / 10) rounded down

**Impact:** Points may not match expected count, but system functional

### Issue: iOS Build Requires Production Certificates

**Description:** Cannot build iOS production IPA without valid Apple Developer certificate

**Cause:** Certificates not provided by client

**Workaround:**
- Use Debug or Ad-Hoc certificate for testing
- Skip TestFlight upload, use S3-only deployment

**Impact:** iOS cannot be deployed to App Store until certificates provided

---

## Test Execution Schedule

| Phase | Duration | Testers | Devices |
|-------|----------|---------|---------|
| Setup & Preparation | 15 min | 1 | N/A |
| Web Platform Tests | 45 min | 1 | Desktop/Browser |
| Android Platform Tests | 45 min | 1 | Emulator or Device |
| iOS Platform Tests | 45 min | 1 | Simulator or Device |
| Backend Integration | 30 min | 1 | API Client |
| Cross-Platform Verification | 30 min | 1 | All platforms |
| **Total** | **210 min** | | |

---

## Success Criteria Summary

- [ ] All web platform tests pass
- [ ] All Android platform tests pass
- [ ] All iOS platform tests pass
- [ ] All backend API tests pass
- [ ] Cross-platform totals match
- [ ] Payment processing works with sandbox card
- [ ] Push notifications deliver within 30 seconds
- [ ] Loyalty points (if enabled) earn/redeem correctly
- [ ] No hardcoded localhost URLs in production builds
- [ ] Database transactions atomic (no partial writes)
- [ ] No duplicate orders on retry
- [ ] All known issues documented and workarounds provided

---

**Last Updated:** 2026-03-07  
**Version:** 1.0  
**Test Environment:** Development/Staging  
**Status:** Ready for Execution
