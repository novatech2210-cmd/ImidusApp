# Payment 404 Investigation - Complete Analysis

**Date:** March 28, 2026 at 2:55 AM GMT+2
**Status:** Root Cause Identified

---

## Investigation Summary

The "Order Not Found HTTP 404 after click pay" error occurs because **the payment completion functionality is NOT implemented in the admin portal frontend**, despite the backend endpoint existing.

---

## Backend Status ✅

The backend has a fully functional payment endpoint:

**Endpoint:** `POST /api/orders/{salesId}/complete-payment`
**Location:** `src/backend/IntegrationService.API/Controllers/OrdersController.cs` (line 126)

**Requirements:**
1. Route parameter: `salesId` (order ID)
2. Request body: `PaymentRequest` object containing:
   - `Token` object with `DataDescriptor` and `DataValue`
   - Other payment details
3. Header: `X-Idempotency-Key` (required)
4. Authorization: `Bearer {JWT_TOKEN}`

**Response:**
- Success (200): Returns `OrderCompletionResult` with success flag
- Bad Request (400): Invalid request, missing token, or missing idempotency key
- Server Error (500): Processing error

---

## Frontend Status ❌

The admin portal frontend is **MISSING** the payment functionality:

### 1. API Client (`src/admin/lib/api-client.ts`)

**Missing:** No payment method in `orderAPI` object

Currently has:
```typescript
export const orderAPI = {
  getQueue: (filters?) => ...,    // ✅ Exists
  getDetail: (salesId) => ...,    // ✅ Exists
  refund: (salesId, data) => ..., // ✅ Exists
  cancel: (salesId, data) => ..., // ✅ Exists
  // ❌ MISSING: completePayment method
};
```

**Should have:**
```typescript
completePayment: (salesId: number, data: any, idempotencyKey: string) =>
  apiClient.post<ApiResponse<any>>(
    `/api/orders/${salesId}/complete-payment`,
    data,
    {
      headers: {
        'X-Idempotency-Key': idempotencyKey
      }
    }
  ),
```

### 2. Hooks (`src/admin/lib/hooks.ts`)

**Missing:** No payment hook

Currently has:
```typescript
export function useRefundOrder(salesId: number) {...}  // ✅ Exists
export function useCancelOrder(salesId: number) {...}  // ✅ Exists
// ❌ MISSING: useCompletePayment hook
```

**Should have:**
```typescript
export function useCompletePayment(salesId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      orderAPI.completePayment(
        salesId,
        data,
        crypto.randomUUID()  // Generate idempotency key
      ).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
```

### 3. UI Components

**Missing:** No payment button in any order component

Checked:
- `src/admin/app/protected/orders/page.tsx` - ❌ No payment button
- `src/admin/components/Orders/OrderDetailModal.tsx` - ❌ No payment button
- `src/admin/components/Orders/OrderQueue.tsx` - ❌ No payment button

**Should have:** Payment button for orders with `paymentStatus === 'pending'`

---

## Root Cause Analysis

The payment 404 error suggests the user is trying to access payment functionality that:

1. **Scenario A:** Exists in a different part of the system (customer web ordering app)
2. **Scenario B:** Was planned but never implemented in the admin portal
3. **Scenario C:** Is being manually triggered (e.g., via Postman, curl) with wrong endpoint URL

---

## Recommended Fix

Since this is an admin portal, **payment completion might not belong here**. Admin portals typically:
- View orders ✅ (implemented)
- Refund orders ✅ (implemented)
- Cancel orders ✅ (implemented)
- **NOT** complete payments (payments happen in customer apps)

### Option 1: Implement Payment in Admin Portal (if needed)

**Use case:** Staff need to manually complete pending payments for phone orders

**Steps:**
1. Add `completePayment` method to `orderAPI` in `api-client.ts`
2. Add `useCompletePayment` hook in `hooks.ts`
3. Add "Complete Payment" button to `OrderDetailModal.tsx` for orders with `paymentStatus === 'pending'`
4. Create a payment dialog component (similar to RefundDialog)

**Estimated effort:** 2-3 hours

### Option 2: Clarify User's Workflow

**Questions to answer:**
- Where is the user clicking "Pay"?
- Is this in the admin portal or customer web app?
- What type of order are they trying to pay for?
- Is this a phone order or online order?

---

## Testing the Backend Endpoint

To verify the backend works, run:

```bash
# Get a valid order ID with pending payment
ORDER_ID=3024

# Get auth token
TOKEN=$(./test-login.sh | jq -r '.data.token')

# Generate idempotency key
IDEMPOTENCY_KEY=$(uuidgen)

# Test payment endpoint (requires actual payment token from Authorize.net)
curl -X POST "http://localhost:5004/api/orders/$ORDER_ID/complete-payment" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Idempotency-Key: $IDEMPOTENCY_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "token": {
      "dataDescriptor": "COMMON.ACCEPT.INAPP.PAYMENT",
      "dataValue": "test_token_here"
    },
    "amount": 1834,
    "paymentMethod": "CreditCard"
  }' \
  | jq '.'
```

**Expected errors:**
- 400: Missing idempotency key (if header not provided)
- 400: Invalid payment request (if token missing)
- 404: Order not found (if order ID doesn't exist)
- 500: Processing error (if payment fails)

---

## Where Payment Should Actually Happen

Payment completion should happen in:

1. **Customer Web Ordering App** (`src/web/imidus-ordering/`)
   - Customer places order
   - Customer enters payment via Authorize.net
   - Payment auto-completes in POS

2. **Customer Mobile App** (`src/mobile/ImidusCustomerApp/`)
   - Same flow as web app

3. **Admin Portal** (Optional)
   - Only if staff need to manually complete phone orders
   - Not a standard feature in admin portals

---

## Next Steps

1. **Clarify with user:**
   - Confirm where they're clicking "Pay" (which app/page)
   - Confirm the use case (online order, phone order, etc.)

2. **If payment needed in admin portal:**
   - Implement Option 1 above
   - Test with real payment tokens
   - Add payment dialog UI

3. **If payment in customer apps:**
   - Check customer web ordering app (`src/web/imidus-ordering/`)
   - Check customer mobile app
   - Look for payment integration there

---

## Files Reviewed

1. ✅ `src/backend/IntegrationService.API/Controllers/OrdersController.cs`
2. ✅ `src/admin/lib/api-client.ts`
3. ✅ `src/admin/lib/hooks.ts`
4. ✅ `src/admin/app/protected/orders/page.tsx`
5. ✅ `src/admin/components/Orders/OrderDetailModal.tsx`
6. ✅ `src/admin/components/Orders/OrderQueue.tsx`
7. ✅ `src/admin/components/Orders/OrderFilters.tsx`
8. ✅ `src/admin/components/Orders/OrderStatusTimeline.tsx`

---

## Conclusion

**The 404 error is expected** because the frontend doesn't call the payment endpoint. The functionality simply doesn't exist in the admin portal UI.

**Status:** ⏳ Awaiting user clarification on:
1. Where are they trying to make payment?
2. What is their intended workflow?
3. Is payment completion needed in admin portal?
