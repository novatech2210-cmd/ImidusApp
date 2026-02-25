# Codebase Concerns

**Analysis Date:** 2026-02-25

## Tech Debt

**Incomplete Login Implementation:**
- Issue: Mobile login screen has placeholder logic that doesn't connect to backend
- Files: `/home/kali/Desktop/TOAST/src/mobile/ImidusCustomerApp/src/screens/LoginScreen.tsx` (line 23)
- Impact: Mobile app login bypasses authentication with hardcoded 1.5s delay; app navigates regardless of credentials
- Fix approach: Implement proper authentication flow connecting to `/auth/login` endpoint with real credential validation

**Type Safety Issues with `any` Type:**
- Issue: Widespread use of `any` type across mobile app eliminates TypeScript type checking
- Files:
  - `/home/kali/Desktop/TOAST/src/mobile/ImidusCustomerApp/src/store/authSlice.ts` (line 4, 27)
  - `/home/kali/Desktop/TOAST/src/mobile/ImidusCustomerApp/src/screens/LoginScreen.tsx` (line 16)
  - `/home/kali/Desktop/TOAST/src/mobile/ImidusCustomerApp/src/screens/MenuScreen.tsx` (lines 19, 64)
  - `/home/kali/Desktop/TOAST/src/mobile/ImidusCustomerApp/src/screens/CartScreen.tsx` (lines 18, 91)
  - `/home/kali/Desktop/TOAST/src/mobile/ImidusCustomerApp/src/screens/ProfileScreen.tsx` (line 16)
  - `/home/kali/Desktop/TOAST/src/mobile/ImidusCustomerApp/src/screens/ItemDetailScreen.tsx` (lines 17, 60)
- Impact: Prevents compile-time error detection; navigation props and API responses lack type safety; refactoring risk increases
- Fix approach: Define proper TypeScript interfaces for navigation props (`RootStackParamList`, etc.) and API response types; migrate all `any` to concrete types

**Inconsistent Error Handling in Mobile API Calls:**
- Issue: API errors logged but not consistently presented to user; silent failures possible
- Files: `/home/kali/Desktop/TOAST/src/mobile/ImidusCustomerApp/src/screens/MenuScreen.tsx` (lines 44-48, 56-60)
- Impact: Network failures or API errors may not display user feedback; loading state not always reset
- Fix approach: Standardize error handling pattern; add error state to all API call sites; ensure loading flag resets on both success and error

## Security Considerations

**Plain-Text Token Storage in localStorage:**
- Risk: Auth tokens stored in browser localStorage accessible to XSS attacks
- Files:
  - `/home/kali/Desktop/TOAST/src/web/context/AuthContext.tsx` (lines 62-63, 84-85, 100-101)
  - `/home/kali/Desktop/TOAST/src/web/lib/api.ts` (line 5)
- Current mitigation: None; tokens stored as plain JSON strings
- Recommendations:
  - Use httpOnly cookies for token storage (inaccessible to JavaScript)
  - Implement CSRF token rotation
  - Add token expiration and refresh token mechanism
  - Validate token signature on backend before accepting claims

**Hardcoded API Endpoints in Environment Configuration:**
- Risk: Production API URL exposed in mobile source code (ngrok endpoint visible)
- Files: `/home/kali/Desktop/TOAST/src/mobile/ImidusCustomerApp/src/config/environment.ts` (line 14)
- Current mitigation: Environment variable switching (`__DEV__` check)
- Recommendations:
  - Remove test ngrok endpoint from production builds
  - Use proper API gateway or reverse proxy URL in production
  - Implement API endpoint configuration via build-time environment variables
  - Consider certificate pinning for mobile app

**Missing Request Input Validation on Web Frontend:**
- Risk: User input not validated before sending to API; relies solely on backend validation
- Files:
  - `/home/kali/Desktop/TOAST/src/web/app/login/page.tsx` (lines 95-102, 116-123)
  - `/home/kali/Desktop/TOAST/src/web/context/AuthContext.tsx` (lines 53-95)
- Current mitigation: HTML5 `required` attributes only
- Recommendations:
  - Add client-side schema validation (Zod, Yup)
  - Validate email format, password strength, field lengths
  - Display validation errors before API call
  - Match backend validation rules

**Unencrypted Cart Data in localStorage:**
- Risk: Shopping cart with prices stored in plain text localStorage
- Files: `/home/kali/Desktop/TOAST/src/web/context/CartContext.tsx` (lines 29, 34)
- Impact: User prices can be locally modified before checkout; customer data exposed in browser history
- Fix approach:
  - Calculate prices server-side at checkout (never trust client price)
  - Consider removing price from cart state; fetch from API on checkout
  - Add data integrity checks (HMAC signatures for sensitive state)

## Performance Bottlenecks

**Inefficient Loading State Logic in MenuScreen:**
- Problem: Loading state set but never properly reset in one branch
- Files: `/home/kali/Desktop/TOAST/src/mobile/ImidusCustomerApp/src/screens/MenuScreen.tsx` (lines 37-62)
- Cause: Line 61 `setLoading(false)` called unconditionally even if already in loading state from line 52
- Impact: Component may appear stuck loading after switching categories
- Improvement path: Remove redundant `setLoading(false)` call after try/catch; consolidate in finally block

**Duplicate API Calls on Component Mount:**
- Problem: Double fetch calls possible on React strict mode or re-renders
- Files: `/home/kali/Desktop/TOAST/src/mobile/ImidusCustomerApp/src/screens/MenuScreen.tsx` (lines 27-35)
- Cause: Dependent useEffect (lines 31-35) triggers fetchItems but no guard against double-triggering
- Impact: Unnecessary API calls; slower perceived performance; higher API cost
- Improvement path: Use useCallback with proper dependency array; add isMounted guard; implement request deduplication

**Large Repository Query Without Pagination:**
- Problem: `GetActiveMenuItemsAsync()` retrieves all menu items into memory
- Files: `/home/kali/Desktop/TOAST/src/backend/IntegrationService.Infrastructure/Data/PosRepository.cs` (lines 59-94)
- Impact: Memory usage grows with menu size; slow API response time; potential timeout for large menus
- Improvement path: Implement pagination or lazy-loading; add limit/offset parameters; cache frequently accessed categories

**Synchronous Layout Calculations in Mobile Styles:**
- Problem: StyleSheet.create() called on every component render
- Files: Multiple screen files use inline StyleSheet.create() in render scope
- Impact: Style object recreated on each render, preventing React.memo optimization
- Improvement path: Move StyleSheet definitions outside component function; use memoization

## Fragile Areas

**Cart State Management Without Persistence Boundaries:**
- Files: `/home/kali/Desktop/TOAST/src/web/context/CartContext.tsx` (lines 28-35)
- Why fragile: Direct localStorage writes on every item change; no error handling if storage quota exceeded
- Safe modification: Add try/catch around localStorage operations; implement localStorage quota check; debounce writes
- Test coverage: No unit tests for cart persistence/restoration scenarios

**Order Processing Transaction Management:**
- Files: `/home/kali/Desktop/TOAST/src/backend/IntegrationService.Core/Services/OrderProcessingService.cs` (lines 61-150+)
- Why fragile: Transaction rollback on exception, but partial payment processing possible if payment service fails mid-transaction
- Safe modification: Ensure payment service calls atomic; implement compensating transactions for failed payments; add idempotency key validation for deduplication
- Test coverage: Transaction rollback scenarios not covered

**PosRepository Connection Management:**
- Files: `/home/kali/Desktop/TOAST/src/backend/IntegrationService.Infrastructure/Data/PosRepository.cs` (lines 37-46)
- Why fragile: Manual SqlConnection management; BeginTransactionAsync opens connection without guaranteed disposal on exception
- Safe modification: Use using statement wrapper; implement proper async disposal; add connection pooling configuration
- Test coverage: Connection leak and timeout scenarios missing

**Loyalty Points Calculation Without Overflow Checks:**
- Files: `/home/kali/Desktop/TOAST/src/backend/IntegrationService.Core/Services/OrderService.cs` (line 98)
- Why fragile: Points redemption calculation (points / 100) has no bounds checking; rounding errors possible
- Safe modification: Validate redemption amount doesn't exceed customer balance; use decimal arithmetic with explicit rounding; add audit logging
- Test coverage: Edge cases (negative points, max int values) not tested

## Scaling Limits

**Fixed Hardcoded CORS Origin:**
- Current capacity: Single hardcoded origin (`http://localhost:3000`)
- Limit: Cannot support multiple environments (staging, production) or domains
- Files: `/home/kali/Desktop/TOAST/src/backend/IntegrationService.API/Program.cs` (lines 40-49)
- Scaling path:
  - Move CORS origins to configuration
  - Support multiple origins via environment variable
  - Implement dynamic origin validation based on environment

**Mock Payment Service Won't Scale to Production:**
- Current capacity: Development/testing only
- Limit: No real payment processing; randomly fails with `tok_error` prefix
- Files: `/home/kali/Desktop/TOAST/src/backend/IntegrationService.Infrastructure/Services/MockPaymentService.cs`
- Impact: Cannot accept real payments; blocks production deployment
- Scaling path:
  - Implement real Authorize.net or Stripe integration
  - Add payment service factory for environment-specific selection
  - Implement PCI compliance and tokenization

**Fixed Daily Order Number Without Multi-Instance Support:**
- Current capacity: Single instance only
- Limit: Multiple API instances will generate duplicate daily order numbers (race condition)
- Files: `/home/kali/Desktop/TOAST/src/backend/IntegrationService.Core/Services/OrderProcessingService.cs` (line 78)
- Scaling path:
  - Implement database-level sequence with locking
  - Use IDENTITY column with application logic for daily reset
  - Consider distributed counter pattern for multi-region

**Mobile App Hardcoded to Single Backend:**
- Current capacity: One API endpoint per build configuration
- Limit: Cannot dynamically switch between backends; requires rebuild
- Files: `/home/kali/Desktop/TOAST/src/mobile/ImidusCustomerApp/src/config/environment.ts` (lines 13-14)
- Scaling path:
  - Implement server discovery endpoint
  - Add runtime configuration fetch
  - Support endpoint switching via deep links

## Missing Critical Features

**No Test Coverage for Web Frontend:**
- Problem: Web application has no unit tests, integration tests, or E2E tests
- Blocks: Cannot confidently refactor frontend; bugs slip through; no regression prevention
- Impact: High risk of breaking changes; slow iteration speed
- Priority: HIGH - Add Jest/Vitest tests for React Context, pages, and components (target 80%+ coverage)

**No Test Coverage for Mobile App Logic:**
- Problem: Mobile app has jest config but no actual test files beyond boilerplate
- Blocks: Cannot validate cart logic, state management, or API integration
- Impact: Regression risk high; Redux state changes may break silently
- Priority: HIGH - Add Redux store tests, navigation tests, and screen component tests

**No Input Validation/Zod Schemas on Backend DTOs:**
- Problem: Backend accepts API requests without strong validation; relies on ModelState
- Blocks: Cannot reject malformed requests early; validation errors unclear
- Impact: API contracts not enforced; frontend may send invalid data without feedback
- Priority: MEDIUM - Add FluentValidation or similar for DTOs

**No Rate Limiting on API Endpoints:**
- Problem: No rate limiting protection on any endpoint
- Blocks: API vulnerable to brute force attacks, DoS
- Impact: Server can be overwhelmed; authentication endpoints unprotected
- Priority: HIGH - Implement rate limiting middleware (Authorize.net-style throttling)

**No Audit Logging for Financial Transactions:**
- Problem: Order creation, payment processing, and loyalty redemption have no audit trail
- Blocks: Cannot investigate disputes or fraud; compliance/audit requirements unmet
- Impact: Cannot prove what happened in production incidents
- Priority: CRITICAL - Add comprehensive transaction logging with customer/operator tracking

## Test Coverage Gaps

**Authentication Flow Not Covered:**
- What's not tested: Login/register happy path, error states, token refresh, logout
- Files: `/home/kali/Desktop/TOAST/src/web/context/AuthContext.tsx`
- Risk: Auth bugs can lock users out or cause privilege escalation
- Priority: HIGH

**Cart State Mutations Under Edge Cases:**
- What's not tested: Adding same item multiple times, removing non-existent items, clearing empty cart, localStorage recovery from corruption
- Files: `/home/kali/Desktop/TOAST/src/web/context/CartContext.tsx`
- Risk: Cart could enter invalid state (negative quantity, NaN total)
- Priority: MEDIUM

**Order Processing Concurrency:**
- What's not tested: Simultaneous order requests from same customer, duplicate idempotency keys, transaction deadlocks
- Files: `/home/kali/Desktop/TOAST/src/backend/IntegrationService.Core/Services/OrderProcessingService.cs`
- Risk: Race conditions could cause duplicate charges or missing orders
- Priority: CRITICAL

**Payment Service Integration:**
- What's not tested: Payment failures, retries, timeout handling, partial payment states
- Files: `/home/kali/Desktop/TOAST/src/backend/IntegrationService.Infrastructure/Services/MockPaymentService.cs`
- Risk: Customers could be charged without order confirmation or not charged when order created
- Priority: CRITICAL

**Loyalty Points Redemption:**
- What's not tested: Insufficient balance handling, negative values, overflow, concurrent redemptions
- Files: `/home/kali/Desktop/TOAST/src/backend/IntegrationService.Core/Services/LoyaltyService.cs`
- Risk: Points could be double-redeemed or negative balances allowed
- Priority: HIGH

**Database Connection Failures:**
- What's not tested: Connection timeouts, SQL Server down, network partition during transaction
- Files: `/home/kali/Desktop/TOAST/src/backend/IntegrationService.Infrastructure/Data/PosRepository.cs`
- Risk: Unhandled exceptions could crash API; transactions left open
- Priority: MEDIUM

## Known Bugs

**Double-Loading in MenuScreen:**
- Symptoms: Final loading state may not clear correctly when switching categories
- Files: `/home/kali/Desktop/TOAST/src/mobile/ImidusCustomerApp/src/screens/MenuScreen.tsx` (line 61)
- Trigger: Rapidly switch categories; setLoading(false) called twice in race condition
- Workaround: Refresh/reload screen to reset state

**Cart Persistence After Failed Login:**
- Symptoms: Cart items remain visible after logout but cannot be purchased
- Files:
  - `/home/kali/Desktop/TOAST/src/web/context/CartContext.tsx` (persists to localStorage)
  - `/home/kali/Desktop/TOAST/src/web/context/AuthContext.tsx` (logout clears auth but not cart)
- Trigger: Login fails; cart remains from previous session
- Workaround: Manually clear cart or reload page

---

*Concerns audit: 2026-02-25*
