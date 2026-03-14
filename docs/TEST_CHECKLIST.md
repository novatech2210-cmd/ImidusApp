# E2E Test Execution Checklist

Copy this checklist and fill it in as you execute the E2E test plan.

```
TEST EXECUTION CHECKLIST - IMIDUS POS Integration E2E Testing
Date: _______________
Tester: _______________
Environment: Dev/Staging/Production

═══════════════════════════════════════════════════════════════════════

SETUP & PREREQUISITES
  [ ] Backend running at http://10.0.0.26:5000
  [ ] Web running at http://10.0.0.26:3000
  [ ] Database (INI_Restaurant) connected
  [ ] Menu items loaded (7 categories)
  [ ] Test card credentials available (4111111111111111)
  [ ] Android APK v0.0.1+ available
  [ ] iOS IPA v0.0.1+ available

═══════════════════════════════════════════════════════════════════════

AUTHENTICATION TESTS

Web Platform - Registration
  [ ] Registration form displays
  [ ] Email validation enforced
  [ ] Password requirements enforced (8 chars, mixed case, number)
  [ ] Confirmation email sent
  [ ] Email link works
  [ ] Confirmation completes
  [ ] Login works with new account
  [ ] Session created after login

Mobile Platform (Android) - Registration
  [ ] Sign up link visible
  [ ] Registration form displays
  [ ] Email validation works
  [ ] Password validation works
  [ ] Registration succeeds
  [ ] Auto-login after registration works
  [ ] Menu displays immediately after login
  [ ] Session persisted on app restart

Mobile Platform (iOS) - Registration
  [ ] Sign up link visible
  [ ] Registration form displays
  [ ] Email validation works
  [ ] Password validation works
  [ ] Registration succeeds
  [ ] Auto-login after registration works
  [ ] Menu displays immediately after login
  [ ] Session persisted on app restart

═══════════════════════════════════════════════════════════════════════

MENU & INVENTORY TESTS

Web Platform - Menu Display
  [ ] All 7 categories visible
  [ ] Categories: Appetizers, Entrees, Sides, Beverages, Desserts, Special Items, Combos
  [ ] Appetizer count: ____ (expected: ____)
  [ ] Entree count: ____ (expected: ____)
  [ ] Side count: ____ (expected: ____)
  [ ] Beverage count: ____ (expected: ____)
  [ ] Dessert count: ____ (expected: ____)
  [ ] Special Items count: ____ (expected: ____)
  [ ] Combo count: ____ (expected: ____)
  [ ] Item descriptions display
  [ ] Prices display correctly
  [ ] Size options show for applicable items
  [ ] Out-of-stock items disabled/marked

Android Platform - Menu Display
  [ ] All 7 categories visible in scroll view
  [ ] Category names match web
  [ ] Item counts match web
  [ ] Item details display on tap
  [ ] Sizes display with price updates
  [ ] Out-of-stock items marked
  [ ] App responsive (< 1 sec tap-to-response)
  [ ] Branding colors correct (gold #D4AF37, blue #002366)
  [ ] No hardcoded localhost URLs visible

iOS Platform - Menu Display
  [ ] All 7 categories visible in scroll view
  [ ] Category names match web
  [ ] Item counts match web
  [ ] Item details display on tap
  [ ] Sizes display with price updates
  [ ] Out-of-stock items marked
  [ ] App responsive (< 1 sec tap-to-response)
  [ ] Branding colors correct (gold #D4AF37, blue #002366)
  [ ] No hardcoded localhost URLs visible

═══════════════════════════════════════════════════════════════════════

CART & ORDER CREATION TESTS

Web Platform - Cart Operations
  [ ] Add item to cart increases badge
  [ ] Cart badge shows correct count
  [ ] Add multiple items updates count correctly
  [ ] Modify quantity updates total
  [ ] Remove item updates totals
  [ ] Empty cart shows "no items" message
  [ ] Cart persists on page reload
  [ ] Subtotal calculates correctly
  [ ] GST calculates to exactly 6%
  [ ] Total = Subtotal + (Subtotal × 0.06)

Android Platform - Cart Operations
  [ ] Add item to cart shows badge
  [ ] Badge updates with correct count
  [ ] Tap cart icon shows items
  [ ] Cart totals match web
  [ ] Subtotal calculation correct
  [ ] Tax calculation correct (6%)
  [ ] Total matches calculated amount
  [ ] Cart persistent across screens
  [ ] Quantity modifications update totals

iOS Platform - Cart Operations
  [ ] Add item to cart shows badge
  [ ] Badge updates with correct count
  [ ] Tap cart icon shows items
  [ ] Cart totals match web
  [ ] Subtotal calculation correct
  [ ] Tax calculation correct (6%)
  [ ] Total matches calculated amount
  [ ] Cart persistent across screens
  [ ] Quantity modifications update totals

═══════════════════════════════════════════════════════════════════════

CHECKOUT & PAYMENT TESTS

Web Platform - Checkout
  [ ] Checkout page accessible from cart
  [ ] Order summary displays all items
  [ ] Quantities correct
  [ ] Subtotal displays: $________
  [ ] GST rate shows 6%: $________
  [ ] Total displays: $________
  [ ] Math verified: Subtotal + GST = Total ✓
  [ ] Payment form loads
  [ ] Card field accepts 4111111111111111
  [ ] Expiration accepts 12/25
  [ ] CVV accepts 123
  [ ] Postal code accepts 12345
  [ ] Pay button clickable
  [ ] Payment processes
  [ ] Order confirmation displays
  [ ] Order number generated: ORD-________
  [ ] Order date/time correct
  [ ] Order items match cart

Android Platform - Checkout
  [ ] Checkout button visible from cart
  [ ] Totals match web calculation
  [ ] Payment form displays
  [ ] Card field accepts test card
  [ ] CVV and expiration fields work
  [ ] Pay button processes payment
  [ ] Order confirmation displays
  [ ] Order number unique and incrementing
  [ ] Confirmation shows correct total
  [ ] User can tap "Track Order" or navigate to tracking

iOS Platform - Checkout
  [ ] Checkout button visible from cart
  [ ] Totals match web calculation
  [ ] Payment form displays
  [ ] Card field accepts test card
  [ ] CVV and expiration fields work
  [ ] Pay button processes payment
  [ ] Order confirmation displays
  [ ] Order number unique and incrementing
  [ ] Confirmation shows correct total
  [ ] User can tap "Track Order" or navigate to tracking

═══════════════════════════════════════════════════════════════════════

ORDER TRACKING TESTS

Web Platform - Order Tracking
  [ ] Order tracking page accessible after confirmation
  [ ] Order appears in list
  [ ] Initial status is "Pending"
  [ ] Order number matches previous page
  [ ] Can manually update order status in backend
  [ ] Tracking page reflects status change within 30 sec
  [ ] Status changed to "Ready for Pickup"
  [ ] Notification or status message displayed
  [ ] Multiple orders show correctly in list
  [ ] Can view previous orders

Android Platform - Order Tracking
  [ ] Order tracking accessible after confirmation
  [ ] Order shows as "Pending"
  [ ] Order number matches
  [ ] Refresh triggers status check
  [ ] Status changes reflected after backend update
  [ ] Order transitions to "Ready for Pickup"
  [ ] Multiple orders visible in list
  [ ] Previous orders visible in history

iOS Platform - Order Tracking
  [ ] Order tracking accessible after confirmation
  [ ] Order shows as "Pending"
  [ ] Order number matches
  [ ] Refresh triggers status check
  [ ] Status changes reflected after backend update
  [ ] Order transitions to "Ready for Pickup"
  [ ] Multiple orders visible in list
  [ ] Previous orders visible in history

═══════════════════════════════════════════════════════════════════════

LOYALTY POINTS TESTS (if enabled)

Prerequisites:
  [ ] Loyalty system enabled in tblMisc
  [ ] Test customer has loyalty account
  [ ] Starting points balance noted: ________

Earn Points
  [ ] Place order for $100+
  [ ] Order completes
  [ ] Points balance updated within 30 seconds
  [ ] Expected points: (Order Total / 10) rounded down
  [ ] Actual points added: ________
  [ ] Points calculation verified: ✓ Match / ✗ Mismatch
  [ ] tblPointsDetail shows transaction
  [ ] TransType documented in database

Redeem Points
  [ ] Place new order with sufficient points
  [ ] At checkout, find "Redeem Points" option
  [ ] Slider shows current point balance
  [ ] Redemption rate: $0.40 per point
  [ ] Redeem X points = $_____ discount applied
  [ ] Order total reduced by discount
  [ ] Payment succeeds with reduced amount
  [ ] tblPointsDetail logs redemption
  [ ] Points balance correctly reduced

═══════════════════════════════════════════════════════════════════════

PUSH NOTIFICATIONS TESTS

Prerequisites:
  [ ] Firebase FCM configured
  [ ] Device tokens registered after login

Android Push Notifications
  [ ] Device token registered after login
  [ ] Order placed and noted
  [ ] App running in foreground
  [ ] Update order status to "Ready for Pickup" in backend
  [ ] Notification appears within 30 seconds
  [ ] Notification displays order number
  [ ] Notification displays status message
  [ ] Tap notification navigates to order tracking
  [ ] Close app and place another order
  [ ] Update status while app is backgrounded
  [ ] Notification appears even with app closed
  [ ] Notification visible in notification center
  [ ] Tap notification from notification center opens app

iOS Push Notifications
  [ ] Device token registered after login
  [ ] Order placed and noted
  [ ] App running in foreground
  [ ] Update order status to "Ready for Pickup" in backend
  [ ] Notification appears within 30 seconds
  [ ] Notification displays order number
  [ ] Notification displays status message
  [ ] Tap notification navigates to order tracking
  [ ] Close app and place another order
  [ ] Update status while app is backgrounded
  [ ] Notification appears even with app closed
  [ ] Notification visible in notification center
  [ ] Tap notification from notification center opens app

═══════════════════════════════════════════════════════════════════════

BACKEND INTEGRATION TESTS

API Health Check
  [ ] GET /api/Sync/status returns 200 OK
  [ ] Response: status = "online"
  [ ] Response: database = "connected"
  [ ] Latency: _______ ms (expected: < 5ms)

Menu API
  [ ] GET /api/Menu/categories returns 200 OK
  [ ] Response includes all 7 categories
  [ ] Category item counts match UI
  [ ] Response time: _______ ms (expected: < 200ms)

Order History API
  [ ] GET /api/Orders/history/{customerId} returns 200 OK
  [ ] Orders placed during test appear in response
  [ ] Order details correct (ID, date, status, total)
  [ ] Response time: _______ ms (expected: < 200ms)

Order Idempotency
  [ ] POST /api/Orders with Idempotency-Key succeeds
  [ ] Repeat with same key returns same order ID
  [ ] No duplicate orders created
  [ ] Idempotency cache working correctly

Backend Logs
  [ ] No SQL Server connection errors
  [ ] No unhandled exceptions
  [ ] No N+1 query warnings
  [ ] No transaction rollbacks
  [ ] Queries executing efficiently

═══════════════════════════════════════════════════════════════════════

CROSS-PLATFORM CONSISTENCY TESTS

Totals Verification
  [ ] Web platform Order Total: $________
  [ ] Android platform Order Total: $________
  [ ] iOS platform Order Total: $________
  [ ] All totals match: ✓ Yes / ✗ No

Category Counts Verification
  [ ] Web Appetizers: ____ / Android: ____ / iOS: ____
  [ ] Web Entrees: ____ / Android: ____ / iOS: ____
  [ ] Web Sides: ____ / Android: ____ / iOS: ____
  [ ] Web Beverages: ____ / Android: ____ / iOS: ____
  [ ] Web Desserts: ____ / Android: ____ / iOS: ____
  [ ] All counts consistent: ✓ Yes / ✗ No

Order Numbers Verification
  [ ] Web order number: ORD-________
  [ ] Android order number: ORD-________
  [ ] iOS order number: ORD-________
  [ ] All order numbers unique and incrementing: ✓ Yes / ✗ No

═══════════════════════════════════════════════════════════════════════

UI/UX TESTS

Web Platform
  [ ] No JavaScript console errors
  [ ] Page transitions smooth
  [ ] Forms responsive and usable
  [ ] Error messages clear and helpful
  [ ] Success messages displayed

Android Platform
  [ ] No app crashes during test
  [ ] Buttons responsive (tap registers immediately)
  [ ] Transitions smooth (< 500ms between screens)
  [ ] Text readable on screen
  [ ] Images load without artifacts

iOS Platform
  [ ] No app crashes during test
  [ ] Buttons responsive (tap registers immediately)
  [ ] Transitions smooth (< 500ms between screens)
  [ ] Text readable on screen
  [ ] Images load without artifacts

═══════════════════════════════════════════════════════════════════════

ISSUES FOUND

Issue #1: ___________________________________________________________________
Severity: [ ] Critical [ ] High [ ] Medium [ ] Low
Steps to Reproduce: ________________________________________________________
Expected vs Actual: ________________________________________________________
Workaround: ________________________________________________________________

Issue #2: ___________________________________________________________________
Severity: [ ] Critical [ ] High [ ] Medium [ ] Low
Steps to Reproduce: ________________________________________________________
Expected vs Actual: ________________________________________________________
Workaround: ________________________________________________________________

Issue #3: ___________________________________________________________________
Severity: [ ] Critical [ ] High [ ] Medium [ ] Low
Steps to Reproduce: ________________________________________________________
Expected vs Actual: ________________________________________________________
Workaround: ________________________________________________________________

═══════════════════════════════════════════════════════════════════════

OVERALL ASSESSMENT

Total Tests: 100+
Tests Passed: _____
Tests Failed: _____
Pass Rate: _____%

Critical Issues: _____
High Priority Issues: _____
Medium Priority Issues: _____
Low Priority Issues: _____

OVERALL RESULT: [ ] PASS (Ready for Production)
                [ ] PASS WITH CAVEATS (Known issues documented)
                [ ] FAIL (Critical issues blocking deployment)

═══════════════════════════════════════════════════════════════════════

SIGN-OFF

Tester: ___________________________  Date: _______________

Reviewed by: _____________________  Date: _______________

Status: [ ] Approved for Production
        [ ] Approved for Staging (Known issues)
        [ ] Rejected (See issues above)

Notes: __________________________________________________________________

═══════════════════════════════════════════════════════════════════════
```

**How to Use This Checklist:**

1. **Print or Copy:** Make a copy of this checklist for each test run
2. **Fill As You Go:** Check boxes as you complete each test
3. **Record Issues:** Document any failures immediately with exact steps
4. **Note Numbers:** For expected values (like order totals), write exact numbers
5. **Cross-Platform:** Compare results across web, Android, iOS
6. **Sign Off:** Have tester and reviewer sign when complete
7. **Archive:** Keep completed checklists in test results folder

**Quick Pass/Fail Determination:**

- **PASS:** All boxes checked, no critical issues
- **PASS WITH CAVEATS:** All boxes checked, only known documented issues
- **FAIL:** Any critical issues found, or major feature not working

---

**Last Updated:** 2026-03-07  
**Version:** 1.0
