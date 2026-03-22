# Milestone 2 Mobile Application Test Plan

## Test Environment

- **Platform**: Android (API 24+)
- **Network**: Test or Production
- **Backend**: http://localhost:5004 (test) or production URL
- **Database**: INI_Restaurant.Bak (test) or production DB

## Feature Test Matrix

### 1. User Authentication
- [ ] Login with valid credentials
- [ ] Create new account
- [ ] Password reset flow
- [ ] Session persistence
- [ ] Logout functionality

### 2. Menu & Catalog
- [ ] View menu categories
- [ ] Filter by category
- [ ] View item details
- [ ] Display item prices from tblAvailableSize
- [ ] Show availability status
- [ ] Search for items

### 3. Shopping Cart
- [ ] Add item to cart
- [ ] Increase quantity
- [ ] Remove item from cart
- [ ] Clear entire cart
- [ ] Cart persists on app exit/relaunch
- [ ] Tax calculation (GST 6%)
- [ ] Total price accuracy

### 4. Checkout & Payment
- [ ] Proceed to checkout
- [ ] Enter delivery address
- [ ] Select payment method
- [ ] Authorize.net payment form loads
- [ ] Payment processes successfully
- [ ] Order confirmation displays
- [ ] Receipt can be saved/shared

### 5. Order Tracking
- [ ] View active orders
- [ ] Check order status updates
- [ ] See estimated delivery time
- [ ] View past orders
- [ ] Download order receipt

### 6. Loyalty Program
- [ ] Display current points balance
- [ ] Redeem points for discount
- [ ] Show points earned on purchase
- [ ] Display points history
- [ ] Birthday rewards available

### 7. Push Notifications
- [ ] Receive order updates
- [ ] Receive marketing notifications
- [ ] Notification formatting correct
- [ ] Tap notification opens relevant section
- [ ] Mute/unmute notifications

### 8. Performance & Stability
- [ ] App launches in <3 seconds
- [ ] Menu loads in <500ms
- [ ] Cart updates instantly
- [ ] Payment completes in <3 seconds
- [ ] No crashes during normal use
- [ ] No memory leaks (monitor RAM)

## Test Data

### Test Account
- Email: test@imidus.com
- Password: [provided separately]

### Test Payment
- Card: 4111 1111 1111 1111 (Visa test card)
- Expires: 12/25
- CVV: 123

## Sign-Off

| Tester | Platform | Date | Status |
|--------|----------|------|--------|
| | Android | | ✅ Pass / ❌ Fail |
| | iOS | | ✅ Pass / ❌ Fail |

