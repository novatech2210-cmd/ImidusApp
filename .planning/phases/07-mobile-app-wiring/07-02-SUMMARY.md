---
phase: 07-mobile-app-wiring
plan: 02
subsystem: Mobile App / Order Creation
tags: [cart-integration, order-api, mobile-ui]
dependencies:
  requires: [07-01, 03-02, 04-02]
  provides: [cart-to-order-flow, server-validated-totals]
  affects: [CheckoutScreen]
tech_stack:
  added: []
  patterns: [idempotency-keys, server-validation]
key_files:
  created: []
  modified:
    - src/mobile/ImidusCustomerApp/src/services/orderService.ts
    - src/mobile/ImidusCustomerApp/src/screens/CartScreen.tsx
decisions:
  - Server-validated totals used (not client-calculated) per research pitfall #5
  - Standard Idempotency-Key header (not X-Idempotency-Key) per Phase 03-02
  - user.customerId (not user.id) for POS customer link per Phase 05-01
metrics:
  duration_minutes: 3
  tasks_completed: 2
  files_modified: 2
  commits: 2
completed: 2026-03-02
---

# Phase 07 Plan 02: Cart to Order API Integration Summary

**One-liner:** Wire CartScreen to backend OrdersController to create real POS orders (TransType=2) with server-validated totals before payment.

## What Was Built

### Task 1: Add createOrder function to orderService
**Commit:** 52266bb

Created `createOrder()` function in orderService.ts that:
- Generates unique idempotency key per request (`cart-{timestamp}-{random}`)
- Maps CartItem[] to OrderItemRequest[] with server price validation
- Calls POST /api/Orders with Idempotency-Key header
- Returns server-validated totals (orderTotal, gstTotal, pstTotal) + salesId + dailyOrderNumber
- Uses existing apiClient with JWT interceptor for authenticated requests

**Key interfaces added:**
```typescript
export interface CreateOrderRequest {
  customerId: number | null;
  items: {
    menuItemId: number;
    sizeId: number;
    quantity: number;
    unitPrice: number;
  }[];
  tipAmount: number;
}

export interface CreateOrderResponse {
  salesId: number;
  dailyOrderNumber: number;
  orderTotal: number;
  gstTotal: number;
  pstTotal: number;
}
```

### Task 2: Refactor CartScreen to create real orders
**Commit:** 989f8d3

Refactored CartScreen.tsx to:
- Replace `handlePlaceOrder()` with `handleCheckout()` using createOrder service
- Navigate to CheckoutScreen with salesId and server-validated totals
- Remove client-side tax calculation (GST/PST now calculated by server)
- Remove loyalty discount toggle (handled in CheckoutScreen per Phase 05-03)
- Remove placeholder payment logic (paymentAuthorizationNo, paymentTypeId)
- Add loading state with "Creating Order..." feedback
- Use `user?.customerId` (not `user?.id`) for POS customer link

**Flow:**
1. User taps "Proceed to Checkout" button
2. CartScreen calls `createOrder(customerId, cartItems, tipAmount)`
3. Backend creates tblSales + tblPendingOrders entries (TransType=2)
4. Server validates prices from tblAvailableSize and calculates GST/PST
5. Response includes salesId + server totals
6. Navigate to CheckoutScreen with: `{ salesId, dailyOrderNumber, orderTotal, gstTotal, pstTotal, orderItems }`

## Deviations from Plan

None - plan executed exactly as written.

## Decisions Made

1. **Server-validated totals:** Client displays subtotal for preview, but CheckoutScreen receives and displays server-calculated orderTotal, gstTotal, pstTotal. This prevents client-side price manipulation (research pitfall #5).

2. **Idempotency-Key header format:** Used standard `Idempotency-Key` (not `X-Idempotency-Key`) per Phase 03-02 decision (STATE.md line 78).

3. **Customer ID field:** Used `user?.customerId` (not `user?.id`) because CustomerProfile.CustomerId is the foreign key to tblCustomer.CustomerID in POS database (Phase 05-01 decision).

4. **Loyalty handling deferred:** Removed loyalty toggle from CartScreen. Loyalty redemption is handled in CheckoutScreen per Phase 05-03 implementation.

## Technical Notes

### Idempotency Key Format
```typescript
const idempotencyKey = `cart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
```
Format: `cart-1772464674-a3x9k2m1` (prefix + epoch timestamp + random string)

### Navigation Params
```typescript
navigation.navigate('Checkout', {
  salesId,           // POS ticket ID (tblSales.SalesID)
  dailyOrderNumber,  // Invoice number for display
  orderTotal,        // Server-calculated final total
  gstTotal,          // Server-calculated GST (6%)
  pstTotal,          // Server-calculated PST (0% for Maryland)
  orderItems,        // Cart items for display
});
```

### Error Handling
- Empty cart: Alert user before attempting order creation
- Network error: Display user-friendly message from backend or generic fallback
- Loading state: Button shows "Creating Order..." and is disabled during API call

## Verification Results

All verification checks passed:

```bash
# TypeScript compilation
npx tsc --noEmit --project src/mobile/ImidusCustomerApp/tsconfig.json
# Result: No errors (MenuScreen errors excluded per plan)

# createOrder function exists
grep "export const createOrder" src/mobile/ImidusCustomerApp/src/services/orderService.ts
# Result: export const createOrder = async (

# Idempotency key used
grep "Idempotency-Key" src/mobile/ImidusCustomerApp/src/services/orderService.ts
# Result: 'Idempotency-Key': idempotencyKey,

# CartScreen calls createOrder
grep "createOrder" src/mobile/ImidusCustomerApp/src/screens/CartScreen.tsx
# Result: import { createOrder } from '../services/orderService';
#         const orderResponse = await createOrder(

# Navigation to Checkout with salesId
grep "salesId" src/mobile/ImidusCustomerApp/src/screens/CartScreen.tsx
# Result: const { salesId, dailyOrderNumber, orderTotal, gstTotal, pstTotal } = orderResponse;
#         salesId,

# Server totals used
grep "orderTotal.*gstTotal.*pstTotal" src/mobile/ImidusCustomerApp/src/screens/CartScreen.tsx
# Result: const { salesId, dailyOrderNumber, orderTotal, gstTotal, pstTotal } = orderResponse;
```

## Success Criteria Met

- [x] orderService.createOrder() function calls POST /api/Orders with idempotency key
- [x] CartScreen.handleCheckout() creates order and receives salesId + server totals
- [x] Navigation to CheckoutScreen includes salesId, orderTotal, gstTotal, pstTotal, orderItems
- [x] Server-validated totals displayed (client doesn't calculate GST/PST for checkout)
- [x] Loading state shows "Creating Order..." during API call
- [x] Error handling displays user-friendly message on order creation failure
- [x] TypeScript compiles without new errors
- [x] Placeholder payment/order logic removed from CartScreen

## Files Modified

### src/mobile/ImidusCustomerApp/src/services/orderService.ts
- Added `CreateOrderRequest` and `CreateOrderResponse` interfaces
- Added `createOrder()` function with idempotency key generation
- Imported `apiClient` for authenticated requests

### src/mobile/ImidusCustomerApp/src/screens/CartScreen.tsx
- Replaced `handlePlaceOrder()` with `handleCheckout()`
- Removed client-side tax calculation (gst, pst variables)
- Removed loyalty toggle and discount logic (usePoints, loyaltyDiscount, pointsUsed)
- Removed placeholder payment fields (paymentAuthorizationNo, paymentTypeId)
- Added loading state management
- Updated button to "Proceed to Checkout" with loading indicator
- Removed unused imports (apiClient, clearCart)
- Removed unused styles (pointsToggle, checkbox, discountValue, totalRow, etc.)
- Added footerNote style for tax calculation message

## Impact on Other Components

### CheckoutScreen (Future Implementation)
CheckoutScreen must now:
- Accept navigation params: `{ salesId, dailyOrderNumber, orderTotal, gstTotal, pstTotal, orderItems }`
- Display server-validated totals (not recalculate)
- Handle payment tokenization and completion via POST /orders/{salesId}/complete-payment
- Handle loyalty redemption if user chooses to redeem points

### Backend OrdersController (Already Implemented in Phase 03-02)
- POST /api/Orders endpoint creates tblSales + tblPendingOrders entries
- Validates item prices from tblAvailableSize (ignores client unitPrice)
- Calculates GST/PST using server-side tax rates
- Returns salesId + dailyOrderNumber + validated totals
- Idempotency-Key header prevents duplicate orders

## Self-Check

Verifying all claimed work exists:

```bash
# Check created/modified files exist
[ -f "src/mobile/ImidusCustomerApp/src/services/orderService.ts" ] && echo "FOUND: orderService.ts" || echo "MISSING"
# Result: FOUND: orderService.ts

[ -f "src/mobile/ImidusCustomerApp/src/screens/CartScreen.tsx" ] && echo "FOUND: CartScreen.tsx" || echo "MISSING"
# Result: FOUND: CartScreen.tsx

# Check commits exist
git log --oneline --all | grep -q "52266bb" && echo "FOUND: 52266bb" || echo "MISSING"
# Result: FOUND: 52266bb

git log --oneline --all | grep -q "989f8d3" && echo "FOUND: 989f8d3" || echo "MISSING"
# Result: FOUND: 989f8d3
```

## Self-Check: PASSED

All files and commits verified successfully.

## Next Steps

1. **Plan 07-03:** Implement MenuScreen category display with live menu data
2. **Future enhancement:** Add tip amount input to CartScreen before checkout
3. **Future enhancement:** Implement CheckoutScreen to accept these navigation params
4. **Testing:** E2E test for cart → order creation → checkout navigation flow
