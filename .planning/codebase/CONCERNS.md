# Codebase Concerns

**Analysis Date:** 2026-02-25

## Tech Debt

**Unsafe TypeScript Typing (any types):**
- Issue: Multiple components use `any` type, bypassing type safety
- Files:
  - `src/web/app/menu/page.tsx` (line 33): `handleAdd = (item: any)`
  - `src/web/app/merchant/dashboard/page.tsx` (lines 14-16): Dashboard state uses `any` for summary, topProducts, trend
  - `src/web/app/orders/page.tsx` (lines 13-15): Order state typed as `any[]`
- Impact: Type checking failures hidden, prone to runtime errors when API responses change
- Fix approach: Define proper interfaces for all API response types and component props

**Hardcoded Customer ID in Order History:**
- Issue: Customer ID hardcoded to `1` instead of using authenticated user context
- Files: `src/web/app/orders/page.tsx` (line 19): `OrderAPI.getOrderHistory(1)`
- Impact: All users see same order history; breaks multi-user support
- Fix approach: Extract `customerId` from `useAuth()` hook and pass to API

**Inline Styles Throughout Frontend:**
- Issue: Components mix inline styles with Tailwind classes instead of using consistent styling approach
- Files: `src/web/app/login/page.tsx`, `src/web/app/register/page.tsx`, `src/web/app/cart/page.tsx`, `src/web/components/Navbar.tsx`
- Impact: Difficult to maintain, inconsistent styling, accessibility issues, poor component reusability
- Fix approach: Move all styles to Tailwind/CSS classes, extract to separate component files with consistent patterns

**Hardcoded Demo Menu Data:**
- Issue: Fallback demo menu defined inline in component and used when API fails
- Files: `src/web/app/menu/page.tsx` (lines 152-196): `DEMO_MENU` constant
- Impact: Production code contains test data, misleads users when backend unavailable
- Fix approach: Remove demo data or move to proper test fixtures

## Known Bugs

**Login Screen TODO Unimplemented:**
- Symptoms: Mobile login screen doesn't perform actual authentication
- Files: `src/mobile/ImidusCustomerApp/src/screens/LoginScreen.tsx` (line 23): `// TODO: Implement actual login logic`
- Trigger: Any login attempt on mobile app
- Workaround: None - automatically navigates after timeout
- Impact: Mobile app cannot authenticate users

**Tax Calculation Hardcoded:**
- Symptoms: Tax rate hardcoded to 12% in multiple places without configuration
- Files:
  - `src/web/components/OrderPanel.tsx` (line 79): `(total * 1.12)`
  - `src/web/app/cart/page.tsx` (line 32): `tax = subtotal * 0.12`
  - `src/mobile/ImidusCustomerApp/src/store/cartSlice.ts` (line 98): `state.tax = state.subtotal * 0.12`
- Trigger: Any order calculation
- Impact: Incorrect tax when jurisdiction changes, no way to adjust without code changes

**Missing Input Validation:**
- Symptoms: Forms accept invalid input without feedback
- Files:
  - `src/web/app/login/page.tsx`: Email field has `type="email"` only, no validation library
  - `src/web/app/register/page.tsx`: Same issue - password strength not validated
  - `src/mobile/ImidusCustomerApp/src/screens/LoginScreen.tsx`: Email/password validation missing
- Trigger: Submit invalid data in login/register forms
- Impact: Backend receives garbage data, users get confusing server errors

**Unhandled Promise Rejections:**
- Symptoms: Catch blocks swallow errors without proper logging or recovery
- Files:
  - `src/web/context/AuthContext.tsx` (lines 67-72, 92-94): Generic error messages, no specific error handling
  - `src/web/app/menu/page.tsx` (line 25): `.catch()` blocks use generic fallback
- Impact: Difficult to debug issues in production, users see unclear error messages

## Security Considerations

**Sensitive Auth Token in LocalStorage (No Encryption):**
- Risk: JWT tokens stored in plaintext localStorage; vulnerable to XSS attacks
- Files:
  - `src/web/context/AuthContext.tsx` (lines 62-63, 84-85): `localStorage.setItem("auth_token", res.token)`
  - `src/web/lib/api.ts` (line 5): `localStorage.getItem("auth_token")`
- Current mitigation: None
- Recommendations:
  - Use httpOnly cookies with secure flag (requires backend support)
  - If localStorage required, implement XSS protection headers (CSP)
  - Add token expiration and refresh logic

**User Data Persisted to LocalStorage Unencrypted:**
- Risk: Full user profile (email, name, points) stored plaintext in localStorage
- Files: `src/web/context/AuthContext.tsx` (lines 63, 85): `localStorage.setItem("auth_user", JSON.stringify(res.profile))`
- Current mitigation: None
- Recommendations:
  - Store minimal data locally (ID only)
  - Fetch user profile from server on app load
  - Never persist sensitive PII to localStorage

**Cart Persisted Across Users:**
- Risk: Cart stored in localStorage with no user isolation; shared devices leak previous customer's orders
- Files: `src/web/context/CartContext.tsx` (lines 29-30, 34)
- Current mitigation: None
- Recommendations:
  - Clear cart on logout
  - Use session-scoped storage or server-side cart
  - Add explicit user confirmation on login if cart exists

**Missing CSRF Protection:**
- Risk: No CSRF tokens in POST requests (create order, login, register)
- Files:
  - `src/web/lib/api.ts`: `apiClient()` doesn't include CSRF token
  - Forms in login/register/cart pages send POST without protection
- Current mitigation: None
- Recommendations:
  - Implement CSRF token validation with backend
  - Use SameSite cookie attribute (requires backend)

**No API Rate Limiting on Client:**
- Risk: Frontend doesn't throttle requests; could hammer backend during demo mode
- Files: Multiple API calls without request debouncing or rate limiting
- Current mitigation: None
- Recommendations:
  - Implement request throttling for sensitive endpoints
  - Add exponential backoff for failed requests

**Environment Variables Exposed to Client:**
- Risk: If `NEXT_PUBLIC_API_URL` is set to local dev URL in production, internal infrastructure exposed
- Files: `src/web/lib/api.ts` (line 1): `process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"`
- Current mitigation: Fallback to localhost (somewhat safe but confusing)
- Recommendations:
  - Never use localhost in production
  - Validate environment is properly set during build
  - Consider API gateway/proxy instead

## Performance Bottlenecks

**Inefficient Menu Rendering:**
- Problem: Menu page renders entire category and items on every render, no memoization
- Files: `src/web/app/menu/page.tsx`: ProductGrid maps all items for every category switch
- Cause: Missing React.memo on menu item components
- Improvement path:
  - Wrap item components in React.memo
  - Memoize category filtering logic
  - Implement virtual scrolling if categories are large

**Cart Recalculation on Every State Change:**
- Problem: Total/count recalculated for entire cart on each item modification
- Files: `src/web/context/CartContext.tsx` (lines 65-66): Runs reduce on every item update
- Cause: Totals computed in component render, not memoized
- Improvement path:
  - Use useMemo for total/count calculations
  - Move calculation to reducer (already done in mobile cartSlice, web should match)

**Large Page Components (200+ lines):**
- Problem: Cart, menu, orders pages are monolithic with inline styles and logic
- Files:
  - `src/web/app/cart/page.tsx` (233 lines)
  - `src/web/app/orders/page.tsx` (203 lines)
  - `src/web/app/menu/page.tsx` (196 lines)
- Cause: No component extraction, mixed concerns
- Improvement path:
  - Extract cart item row into CartItemRow component
  - Extract order summary into OrderSummary component
  - Extract menu category selector into CategoryNav component
  - Target: <100 lines per page component

**API Calls Without Caching:**
- Problem: Menu fetched every time menu page loads, no caching or SWR
- Files: `src/web/app/menu/page.tsx` (useEffect): `MenuAPI.getFullMenu()` runs on every mount
- Cause: No query caching library (React Query, SWR)
- Improvement path:
  - Integrate React Query or SWR
  - Cache menu data for session
  - Invalidate cache on logout

## Fragile Areas

**Auth Context Initialization Race Condition:**
- Files: `src/web/context/AuthContext.tsx` (lines 43-51)
- Why fragile: `useEffect` reads localStorage but doesn't check if app is hydrated; SSR/client mismatch possible
- Safe modification:
  - Add explicit hydration check
  - Set `isLoading` state initially to prevent component render before hydration
  - Consider moving to layout component after auth check
- Test coverage: No tests for auth flow

**Order History with Any Types:**
- Files: `src/web/app/orders/page.tsx` (lines 13-15, 127)
- Why fragile: Uses `any` for orders and details; accessing `order.details.map()` could fail if API response structure changes
- Safe modification:
  - Define OrderResponse interface with required fields
  - Add optional chaining for safety
  - Test with mock API that returns different structures
- Test coverage: No integration tests for orders page

**Inline Date Formatting:**
- Files: `src/web/app/orders/page.tsx` (line 88): `.toLocaleDateString()`, (line 122): `.toLocaleString()`
- Why fragile: Browser locale affects output; no timezone handling, breaks in different regions
- Safe modification:
  - Extract to utility function with consistent locale/timezone
  - Test with different Intl.DateTimeFormat options
- Test coverage: No tests

**Naive JSON.parse on LocalStorage:**
- Files: `src/web/context/CartContext.tsx` (line 30): `JSON.parse(saved)`
- Why fragile: Throws if stored data is corrupted, no try/catch
- Safe modification:
  - Wrap in try/catch, clear cart if parse fails
  - Add version field to stored data for migrations
- Test coverage: No error case testing

## Missing Critical Features

**No Order Management After Creation:**
- Problem: Users can't modify or cancel orders after submission
- Blocks: Restaurant operations (no order rejection), customer satisfaction (no edits)

**No Payment Integration:**
- Problem: "Pay & Finalize" button disabled with no payment processing
- Files: `src/web/components/OrderPanel.tsx` (line 88): Button exists but doesn't call payment API
- Blocks: Cannot actually process payments, entire checkout flow incomplete

**No Inventory/Stock Management:**
- Problem: Menu items show no stock status, no handling for out-of-stock items
- Files: `src/web/app/menu/page.tsx` (line 125): Green dot hardcoded, not real stock
- Blocks: Cannot prevent overselling, no real-time availability

**Mobile Authentication Not Connected:**
- Problem: Mobile LoginScreen has TODO, register flow never implemented
- Files: `src/mobile/ImidusCustomerApp/src/screens/LoginScreen.tsx` (line 23)
- Blocks: Mobile app cannot authenticate users at all

**No Loyalty Points Integration on Mobile:**
- Problem: Mobile app has Redux store for auth but no loyalty balance fetching or redemption
- Blocks: Mobile customers cannot see/use earned points

**Missing Error Boundaries:**
- Problem: App crashes propagate to user if components error; no error recovery UI
- Files: No error boundaries in `src/web/app/layout.tsx`
- Blocks: Component errors take down entire page

## Test Coverage Gaps

**No Unit Tests for Contexts:**
- What's not tested: AuthContext login/register logic, CartContext item operations
- Files: `src/web/context/AuthContext.tsx`, `src/web/context/CartContext.tsx`
- Risk: Auth flow breaks silently, cart calculation errors undetected
- Priority: HIGH - Core functionality

**No Integration Tests for API Calls:**
- What's not tested: Menu API data transformation, error handling, loading states
- Files: `src/web/app/menu/page.tsx`, `src/web/app/orders/page.tsx`
- Risk: API contract changes break UI, error states never triggered
- Priority: HIGH - Data flow

**No E2E Tests for Critical Flows:**
- What's not tested: Login → Menu → Add to Cart → Checkout
- Files: No E2E test files
- Risk: Complete user flows fail unnoticed
- Priority: CRITICAL - User experience

**Mobile App Has Single Test File:**
- What's not tested: Redux state, screen navigation, API integration
- Files: `src/mobile/ImidusCustomerApp/__tests__/App.test.tsx` (likely skeleton)
- Risk: Mobile app quality cannot be verified
- Priority: CRITICAL - Platform

**No Type Tests:**
- What's not tested: API response types match interface definitions
- Files: No `.test-d.ts` or similar
- Risk: Type mismatches surface at runtime
- Priority: MEDIUM

**No Snapshot Tests for UI:**
- What's not tested: Component rendering output, styling changes
- Files: No `__snapshots__` directories
- Risk: Visual regressions undetected
- Priority: MEDIUM

## Scaling Limits

**LocalStorage Cart Limit:**
- Current capacity: ~5-10MB depending on browser
- Limit: With complex cart items (descriptions, images), ~50-100 items max
- Scaling path: Move to server-side session cart

**No Pagination on Order History:**
- Current capacity: ~100 orders in memory before performance degrades
- Limit: Customers with 500+ orders see lag
- Scaling path: Implement pagination in OrderHistoryPage and API

**Menu Data Not Paginated:**
- Current capacity: Menu API returns all items at once
- Limit: 1000+ items cause rendering lag
- Scaling path:
  - Paginate API response
  - Implement virtual scrolling
  - Cache categories separately

**Analytics Dashboard Hard-codes 7-day Trend:**
- Current capacity: Fixed 7 data points
- Limit: No historical analysis beyond 7 days
- Scaling path: Make date range configurable, paginate results

## Dependencies at Risk

**React 19.2.3 Early Adoption:**
- Risk: Bleeding-edge version, limited real-world testing
- Impact: Breaking changes in patch releases, third-party library incompatibilities
- Migration plan: Pin to stable 18.x until React 19 proven in production

**Next.js 16.1.6 (Very Recent):**
- Risk: Latest major version, potential edge cases
- Impact: Turbopack bundler less battle-tested than Webpack
- Migration plan: Monitor release notes, maintain compatibility layer

**No Testing Library Installed:**
- Risk: Cannot run any tests without setting up vitest/jest
- Impact: Testing roadmap blocked
- Migration plan: Install @testing-library/react, vitest, MSW for API mocking

**No Input Validation Library:**
- Risk: Manual validation scattered or missing
- Impact: Security gaps, poor UX
- Migration plan: Install Zod or similar for form validation

---

*Concerns audit: 2026-02-25*
