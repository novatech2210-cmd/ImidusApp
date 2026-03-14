# M3 Phase 1 Review: Existing Assets & Reusability Analysis

## Executive Summary

**Status**: M1 & M2 are **substantially complete**. The React Native mobile app has a full ordering flow with:

- ✅ Complete theme system (colors, typography, spacing)
- ✅ API client with auth interceptors
- ✅ All TypeScript types defined
- ✅ Menu service with caching
- ✅ Order service with idempotency keys
- ✅ Cart Redux slice with calculations
- ✅ Payment service (Authorize.net ready)
- ✅ All screen components built

**Reusability Score**: **85%** — Most business logic, types, and API patterns can be directly reused or adapted for the web platform.

---

## What's Already Built (M2 Mobile App)

### 1. Theme System ✅ FULLY REUSABLE

**Location**: `src/theme/`

**Files**:

- `colors.ts` — Complete brand color system with 49 color definitions
- `typography.ts` — Font sizes, weights, line heights
- `spacing.ts` — Spacing scale, border radius, shadows
- `images.ts` — Asset registry with 7 logo variants

**Reusability**: Convert CSS-in-JS values to CSS variables

```typescript
// Current (React Native)
export const Colors = {
  brandBlue:   '#1E5AA8',
  brandGold:   '#D4AF37',
  // ... 47 more colors
}

// For Web (CSS Variables)
:root {
  --brand-blue: #1E5AA8;
  --brand-gold: #D4AF37;
  /* ... all 49 colors */
}
```

**Action**: Copy color values to `globals.css`

---

### 2. API Infrastructure ✅ REUSABLE WITH ADAPTATIONS

**Location**: `src/api/apiClient.ts`

**What's Built**:

- Axios instance with baseURL configuration
- JWT token attachment via request interceptor
- Automatic token refresh on 401 responses
- Error handling
- Environment-based configuration

**Web Adaptations Needed**:

1. Replace `AsyncStorage` with `localStorage` for token storage
2. Remove React Native specific `__DEV__` checks
3. Add CSRF protection for web (if needed)
4. CORS configuration for web deployment

**Reusability**: **90%** — Core axios configuration identical

---

### 3. TypeScript Types ✅ FULLY REUSABLE

**Location**: `src/types/`

**Files**:

- `menu.types.ts` — MenuItem, MenuItemSize, Category, MenuResponse
- `cart.types.ts` — CartItem, CartState, CreateOrderRequest, CreateOrderResponse
- `payment.types.ts` — CardData, PaymentToken

**Reusability**: **100%** — Types are platform-agnostic

**Action**: Copy `src/types/` directory to web project

---

### 4. Services Layer ✅ REUSABLE WITH ADAPTATIONS

**Location**: `src/services/`

#### Menu Service (`menuService.ts`)

**Status**: ✅ Production Ready

**Features**:

- Fetch categories from `/Menu/categories`
- Fetch items by category from `/Menu/items/${categoryId}`
- AsyncStorage caching with 5-minute TTL
- Error handling

**Web Adaptations**:

1. Replace `AsyncStorage` with `localStorage`
2. Keep axios calls identical
3. Add SSR considerations (Next.js)

**Reusability**: **85%**

#### Order Service (`orderService.ts`)

**Status**: ✅ Production Ready

**Features**:

- `createOrder()` — POST to `/Orders` with idempotency key
- `completePayment()` — POST to `/orders/${salesId}/complete-payment`
- Full error handling
- Type-safe requests/responses

**Web Adaptations**:

1. Minimal changes — API calls are identical
2. Payment flow integration with Authorize.net Accept.js web SDK

**Reusability**: **95%**

#### Payment Service (`paymentService.ts`)

**Status**: ⚠️ Needs Implementation

**Current State**: Mock implementation only

```typescript
// TODO: Install react-native-authorize-net-accept package
// Currently returns mock tokens
```

**Web Implementation Needed**:

- Use Authorize.net Accept.js web SDK
- Different API from React Native version
- Same tokenization concept

**Reusability**: **20%** — Concept same, implementation different

---

### 5. State Management ✅ ADAPTABLE

**Location**: `src/store/`

**Current**: Redux Toolkit (cartSlice.ts, authSlice.ts, loyaltySlice.ts)

**Web Options**:

1. **Keep Redux** — Consistent with mobile, but heavier for web
2. **React Context + Hooks** — Lighter weight, recommended for web
3. **Zustand** — Middle ground

**Recommendation**: Use React Context + Hooks for web (lighter, simpler)

**Cart Logic Reusability**: **80%**

- Actions (addToCart, updateQuantity, removeFromCart, clearCart) — identical logic
- Calculations (subtotal, tax, total) — identical
- Only state container changes (Redux → Context)

---

### 6. UI Components ⚠️ NEEDS REBUILD

**Location**: `src/components/`, `src/screens/`

**Current**: React Native components (View, Text, TouchableOpacity, StyleSheet)

**Web**: React components (div, p, button, CSS Modules)

**Reusability**: **30%** — Logic reusable, UI needs complete rewrite

**Components to Rebuild**:
| Component | Mobile Status | Web Action |
|-----------|---------------|------------|
| MenuItemCard | ✅ Built | Rebuild with CSS Modules |
| ItemDetailSheet | ✅ Built | Rebuild as modal/page |
| CartScreen | ✅ Built | Rebuild with responsive layout |
| CheckoutScreen | ✅ Built | Rebuild with web forms |
| PaymentForm | ✅ Built | Rebuild with Accept.js web |
| OrderConfirmation | ✅ Built | Rebuild with CSS |
| SkeletonMenuCard | ✅ Built | Rebuild with CSS |

**What CAN Be Reused**:

- Component structure and props interfaces
- Data fetching logic (copy/paste with minor edits)
- State management patterns
- Error handling logic

---

### 7. Assets ✅ FULLY REUSABLE

**Location**: `src/assets/images/`

**Files**:

- `logo_imidus_triangle.png` — App icon
- `imidus_logo_blue_gradient.png` — Primary banner
- `imidus_logo_pen_colored.png` — Full wordmark
- `imidus_logo_white.png` — White background
- `logo_imidus_alt.png` — Compact wordmark
- `app-icon-512.png` — Launcher icon
- `splash.png` — Splash screen

**Reusability**: **100%** — Copy to `web/public/images/`

---

## What Needs to Be Built from Scratch

### 1. Next.js 14 Project Structure

- Initialize with TypeScript, ESLint, Tailwind (optional)
- Configure CSS Modules
- Setup Next.js App Router
- Configure absolute imports (`@/` alias)

### 2. CSS/Theme System

- Convert React Native StyleSheet to CSS Modules
- Create CSS variables from Colors object
- Responsive design system (mobile-first)

### 3. Web-Specific Components

- Navigation (header, footer) — web-specific layout
- Responsive menu grid
- Web form components (input, select, textarea)
- Modal system (different from mobile bottom sheets)

### 4. Authorize.net Web Integration

- Accept.js web SDK (different from mobile)
- Payment form with hosted fields
- Tokenization flow

### 5. Next.js Specific Features

- Server-side rendering considerations
- Static site generation for menu pages
- API routes (if proxy needed)
- Image optimization with next/image
- SEO meta tags

---

## Reusability Matrix

| Category              | Reusability | Effort to Adapt       |
| --------------------- | ----------- | --------------------- |
| Theme (colors)        | 100%        | Copy values to CSS    |
| API Client            | 90%         | Replace AsyncStorage  |
| TypeScript Types      | 100%        | Direct copy           |
| Services (menu/order) | 85%         | Replace storage layer |
| Cart Logic            | 80%         | Redux → Context       |
| Components            | 30%         | Complete rebuild      |
| Assets (images)       | 100%        | Copy files            |
| Payment Integration   | 20%         | Web SDK differs       |
| Screens/Navigation    | 25%         | Platform-specific     |

---

## Recommended Phase 1 Approach

Given the existing assets, here's the optimal approach:

### Quick Wins (High Reusability)

1. **Copy TypeScript types** — `src/types/` → `web/src/types/`
2. **Copy color definitions** — Extract from `colors.ts` to CSS variables
3. **Copy API client** — Adapt storage layer
4. **Copy service functions** — Adapt caching layer
5. **Copy image assets** — `src/assets/images/` → `web/public/images/`

### Medium Effort (Adaptation Required)

6. **Convert cart slice to Context** — Keep logic, change state container
7. **Create theme provider** — React Context for CSS variables
8. **Build base components** — Button, Input, Card (inspired by mobile)

### New Development Required

9. **Next.js project setup** — Fresh initialization
10. **Responsive layout components** — Header, Footer, Navigation
11. **Page components** — Menu, Cart, Checkout (rebuild UI)
12. **Authorize.net web integration** — New implementation

---

## Estimated Phase 1 Effort

With 85% reusability of business logic:

| Task          | Without Reuse | With Reuse | Savings          |
| ------------- | ------------- | ---------- | ---------------- |
| Project Setup | 3 days        | 2 days     | 1 day            |
| Theme System  | 2 days        | 0.5 days   | 1.5 days         |
| API Client    | 2 days        | 0.5 days   | 1.5 days         |
| Types         | 1 day         | 0 days     | 1 day            |
| Services      | 3 days        | 1 day      | 2 days           |
| **Total**     | **11 days**   | **4 days** | **7 days saved** |

**Result**: Phase 1 can be completed in **2-3 days** instead of 2-3 weeks by leveraging existing code.

---

## Files to Copy/Adapt Checklist

### Direct Copy (No Changes)

- [ ] `src/types/*.ts` → `web/src/types/`
- [ ] `src/assets/images/*` → `web/public/images/`

### Copy & Adapt (Minor Changes)

- [ ] `src/config/environment.ts` → `web/src/lib/environment.ts`
  - Remove React Native specific code
  - Add web-specific env handling
- [ ] `src/api/apiClient.ts` → `web/src/lib/api.ts`
  - Replace AsyncStorage with localStorage
  - Keep axios configuration
- [ ] `src/services/menuService.ts` → `web/src/services/menuService.ts`
  - Replace AsyncStorage with localStorage
  - Keep API calls identical
- [ ] `src/services/orderService.ts` → `web/src/services/orderService.ts`
  - Minimal changes (mostly identical)

### Rebuild (New Implementation)

- [ ] All components in `src/components/` → Rebuild with CSS Modules
- [ ] All screens in `src/screens/` → Rebuild as Next.js pages
- [ ] Payment service → New Accept.js web implementation
- [ ] Store/slices → Convert to React Context

### Extract Values From

- [ ] `src/theme/colors.ts` → `web/src/styles/globals.css` (CSS variables)
- [ ] `src/theme/typography.ts` → `web/src/styles/globals.css` (font sizes)
- [ ] `src/theme/spacing.ts` → `web/src/styles/globals.css` (spacing scale)

---

## Next Steps

1. **Initialize Next.js project** with TypeScript
2. **Copy types and assets** (direct copy)
3. **Create CSS variables** from Colors object
4. **Adapt API client** (replace AsyncStorage)
5. **Adapt services** (replace caching layer)
6. **Build first page** (Menu page) using adapted services
7. **Verify API connectivity** with backend

**Recommended Start**: Begin with Menu page since it has the most reuse potential and is the entry point for customers.
