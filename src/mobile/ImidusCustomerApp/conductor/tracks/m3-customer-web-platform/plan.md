# M3 Customer Web Platform - Implementation Plan

## Track Summary

**Track ID**: `m3-customer-web-platform`  
**Milestone**: M3 ($1,200)  
**Goal**: Build and deploy Next.js 14 customer web ordering platform  
**Estimated Duration**: 3-4 weeks  
**Priority**: HIGH (blocking M4 Admin Portal)

## Technical Approach

### Stack

- **Framework**: Next.js 14 (App Router) with TypeScript
- **Styling**: CSS Modules + globals.css with theme tokens
- **State**: React Hooks + Context (lightweight, no Redux needed for web)
- **HTTP Client**: axios (consistent with mobile)
- **Payments**: Authorize.net Accept.js (tokenization)
- **Icons**: lucide-react (consistent with mobile)

### Project Structure

```
web/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # Root layout with providers
│   │   ├── page.tsx            # Homepage/menu
│   │   ├── menu/
│   │   │   └── page.tsx        # Menu browsing
│   │   ├── cart/
│   │   │   └── page.tsx        # Cart page
│   │   ├── checkout/
│   │   │   └── page.tsx        # Checkout flow
│   │   ├── orders/
│   │   │   └── page.tsx        # Order history
│   │   └── confirmation/
│   │       └── page.tsx        # Order confirmation
│   ├── components/
│   │   ├── ui/                 # Reusable UI components
│   │   ├── menu/               # Menu-specific components
│   │   ├── cart/               # Cart components
│   │   ├── checkout/           # Checkout components
│   │   └── orders/             # Order components
│   ├── lib/
│   │   ├── api.ts              # API client configuration
│   │   ├── theme.ts            # Theme tokens (colors, spacing)
│   │   └── utils.ts            # Utility functions
│   ├── hooks/
│   │   ├── useCart.ts          # Cart state management
│   │   ├── useMenu.ts          # Menu data fetching
│   │   └── useOrders.ts        # Order operations
│   ├── types/
│   │   └── index.ts            # TypeScript types
│   └── styles/
│       └── globals.css         # Global styles + CSS variables
├── public/
│   └── images/                 # Static assets
├── .eslintrc.js
├── .prettierrc.js
├── next.config.js
├── package.json
└── tsconfig.json
```

## Implementation Phases

### Phase 1: Project Setup & Configuration

**Duration**: 2-3 days

#### Tasks

- [ ] 1.1 Initialize Next.js 14 project with TypeScript
  - `npx create-next-app@14 web --typescript --eslint --tailwind --app`
  - Configure absolute imports (`@/` alias)
- [ ] 1.2 Configure ESLint and Prettier

  - Extend existing `.eslintrc.js` rules
  - Configure Prettier with project settings
  - Add pre-commit hooks

- [ ] 1.3 Setup Theme Tokens

  - Create `globals.css` with CSS variables:
    ```css
    :root {
      --brand-blue: #1e5aa8;
      --brand-gold: #d4af37;
      --dark-bg: #1a1a2e;
      --white: #ffffff;
      --light-blue: #d6e4f7;
      --light-gold: #fdf6e3;
      --mid-gray: #dddddd;
      --error: #c62828;
      --success: #2e7d32;
      --warning: #e65100;
    }
    ```
  - Typography scale
  - Spacing scale

- [ ] 1.4 Configure API Client

  - Create `src/lib/api.ts` with axios instance
  - Base URL from environment variables
  - Request/response interceptors for auth and error handling

- [ ] 1.5 Setup CI/CD Pipeline
  - GitHub Actions workflow for build
  - S3 deployment script
  - Configure AWS credentials

**TDD Required**: N/A (setup phase)

**Verification**:

- Project builds without errors
- ESLint passes
- Theme tokens applied correctly
- API client can make test requests

---

### Phase 2: Menu & Product Pages

**Duration**: 4-5 days

#### Tasks

- [ ] 2.1 Create Menu Data Types

  ```typescript
  interface MenuItem {
    id: string;
    name: string;
    description: string;
    price: number;
    categoryId: number;
    availableOnline: boolean;
    imageUrl?: string;
  }

  interface Category {
    id: number;
    name: string;
    items: MenuItem[];
  }
  ```

- [ ] 2.2 Implement Menu Fetching Hook

  - `useMenu()` hook with React Query or SWR
  - Fetch from `/api/menu` endpoint
  - Loading and error states
  - Caching strategy

- [ ] 2.3 Build Category Navigation

  - Horizontal scroll or sidebar navigation
  - Active category highlighting
  - Mobile-friendly (bottom sheet or drawer)

- [ ] 2.4 Create Item Card Component

  - Display image, name, description, price
  - "Add to Cart" button
  - Responsive grid layout
  - Loading skeleton placeholder

- [ ] 2.5 Implement Search & Filter

  - Search bar with debounce
  - Filter by category
  - Sort options (price, name)
  - Results count display

- [ ] 2.6 Build Menu Page
  - Combine category nav + item grid
  - Loading states
  - Empty states
  - Error handling with retry

**TDD Required**:

- Unit tests for menu data transformation
- Integration tests for API fetching

**Verification**:

- Menu displays with categories
- Items show correct prices
- Search returns results
- Responsive on mobile/tablet/desktop
- Brand colors applied

---

### Phase 3: Cart System

**Duration**: 3-4 days

#### Tasks

- [ ] 3.1 Create Cart Types

  ```typescript
  interface CartItem extends MenuItem {
    quantity: number;
  }

  interface Cart {
    items: CartItem[];
    subtotal: number;
    tax: number;
    total: number;
  }
  ```

- [ ] 3.2 Implement Cart Context

  - `CartProvider` with React Context
  - State: items array, loading, error
  - localStorage persistence

- [ ] 3.3 Build Cart Actions

  - `addItem(item, quantity)`
  - `removeItem(itemId)`
  - `updateQuantity(itemId, quantity)`
  - `clearCart()`
  - `calculateTotals()`

- [ ] 3.4 Create Cart Item Component

  - Item image, name, price
  - Quantity stepper (+/- buttons)
  - Remove button
  - Line total display

- [ ] 3.5 Build Cart Summary

  - Subtotal, tax, total breakdown
  - "Proceed to Checkout" button
  - Continue shopping link

- [ ] 3.6 Implement Cart Page/Drawer

  - Mobile: Bottom sheet or full page
  - Desktop: Side drawer or dedicated page
  - Empty cart state

- [ ] 3.7 Add Cart Badge to Header
  - Display item count
  - Animate on add

**TDD Required**:

- Unit tests for cart calculations
- Tests for localStorage persistence
- Edge cases (max quantity, negative values)

**Verification**:

- Items add to cart correctly
- Quantities update
- Totals calculate correctly
- Persistence works across reloads
- Badge updates in real-time

---

### Phase 4: Checkout Flow

**Duration**: 4-5 days

#### Tasks

- [ ] 4.1 Create Customer Form

  - Fields: name, phone, email
  - Validation with Zod
  - Error messages (brand voice)
  - Auto-save to localStorage

- [ ] 4.2 Build Time Selection

  - Pickup time slots (ASAP + scheduled)
  - Date/time picker
  - Validation (future times only)

- [ ] 4.3 Add Special Instructions

  - Textarea for order notes
  - Character limit

- [ ] 4.4 Create Order Review Page

  - Item summary with quantities
  - Customer info display
  - Pickup time display
  - Total breakdown
  - Edit buttons for each section

- [ ] 4.5 Integrate Authorize.net Accept.js

  - Load SDK script
  - Create payment form
  - Tokenize card data
  - Handle nonce generation
  - Error handling for declined cards

- [ ] 4.6 Build Checkout Flow State
  - Step indicator (Info → Review → Payment)
  - Navigation guards (can't skip steps)
  - Progress persistence

**TDD Required**:

- Unit tests for form validation
- Tests for Authorize.net integration
- Edge case handling

**Verification**:

- Form validation works
- Credit card tokenizes correctly
- Review page shows accurate summary
- Flow progresses smoothly
- Mobile-responsive checkout

---

### Phase 5: Order Placement

**Duration**: 4-5 days

#### Tasks

- [ ] 5.1 Create Order Submission Service

  - `submitOrder(orderData)` function
  - Generate idempotency key (UUID v4)
  - POST to `/api/orders` endpoint
  - Handle loading state

- [ ] 5.2 Build Order Types

  ```typescript
  interface OrderSubmission {
    idempotencyKey: string;
    customer: CustomerInfo;
    items: CartItem[];
    payment: {
      nonce: string;
      amount: number;
    };
    specialInstructions?: string;
  }

  interface OrderResponse {
    orderId: number;
    orderNumber: string;
    status: 'confirmed' | 'failed';
    total: number;
    pointsEarned: number;
  }
  ```

- [ ] 5.3 Create Confirmation Page

  - Order number display (large, prominent)
  - Order summary
  - Pickup time reminder
  - Points earned (if applicable)
  - "Track Order" button
  - "Order Again" button
  - Share/print receipt

- [ ] 5.4 Implement Error Handling

  - Network errors: "Connection failed. Please try again."
  - Payment errors: "Payment could not be processed. Try another card."
  - Validation errors: Field-specific messages
  - Retry mechanism with idempotency

- [ ] 5.5 Add Loading States

  - Submit button spinner
  - Page transition loading
  - Skeleton for confirmation page

- [ ] 5.6 Clear Cart on Success
  - Clear localStorage cart
  - Reset cart context
  - Prevent re-submission

**TDD Required** (Strict - backend writes):

- Integration tests for order submission
- Idempotency key tests
- Error scenario tests
- Mock backend responses

**Verification**:

- Orders submit successfully
- Idempotency keys prevent duplicates
- Confirmation page shows correct data
- Cart clears after order
- Error messages are user-friendly

---

### Phase 6: Order History & Tracking

**Duration**: 3-4 days

#### Tasks

- [ ] 6.1 Create Order History Types

  ```typescript
  interface Order {
    id: number;
    orderNumber: string;
    date: string;
    status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
    items: CartItem[];
    total: number;
    customer: CustomerInfo;
  }
  ```

- [ ] 6.2 Implement Order Fetching

  - `useOrders()` hook
  - Fetch from `/api/orders/history`
  - Pagination or infinite scroll
  - Filter by date/status

- [ ] 6.3 Build Order List Component

  - Order cards with summary
  - Status badges (color-coded)
  - Date and total
  - "View Details" link

- [ ] 6.4 Create Order Detail Page

  - Full order information
  - Item breakdown
  - Status timeline
  - Re-order button

- [ ] 6.5 Implement Re-order Functionality

  - Copy items to cart
  - Show confirmation modal
  - Navigate to cart

- [ ] 6.6 Add Guest Lookup (Optional)
  - Lookup orders by phone/email
  - No authentication required

**TDD Required**:

- Unit tests for order formatting
- Integration tests for history API

**Verification**:

- Orders display in list
- Status colors correct
- Details page shows all info
- Re-order adds items to cart

---

### Phase 7: Polish & Responsiveness

**Duration**: 3-4 days

#### Tasks

- [ ] 7.1 Responsive Design Audit

  - Mobile (< 640px): Stack layouts, touch targets
  - Tablet (640-1024px): Grid adjustments
  - Desktop (> 1024px): Full layout
  - Test on real devices

- [ ] 7.2 Loading States

  - Skeleton screens for all data
  - Button loading spinners
  - Page transition loading
  - Inline loading for actions

- [ ] 7.3 Error Boundaries

  - React error boundaries
  - Friendly error pages
  - Recovery options

- [ ] 7.4 Brand Compliance Check

  - All buttons use Brand Blue/Gold
  - Typography matches guidelines
  - IMIDUSAPP logos present
  - Color contrast verified

- [ ] 7.5 Performance Optimization

  - Image optimization (next/image)
  - Code splitting
  - Lazy loading for below-fold content
  - Lighthouse audit (target > 90)

- [ ] 7.6 Accessibility Audit

  - Keyboard navigation
  - Screen reader labels
  - Color contrast (WCAG 2.1 AA)
  - Focus indicators
  - ARIA labels where needed

- [ ] 7.7 SEO Setup
  - Meta titles/descriptions
  - Open Graph tags
  - Structured data (JSON-LD)
  - Canonical URLs
  - Sitemap generation

**TDD Required**: N/A (polish phase)

**Verification**:

- Lighthouse score > 90
- WCAG 2.1 AA compliance
- Responsive on all breakpoints
- Brand compliance verified
- All loading states present

---

## Risk Register

| Risk                         | Impact | Mitigation                                                      |
| ---------------------------- | ------ | --------------------------------------------------------------- |
| Backend API not ready        | HIGH   | Coordinate with backend team; mock API for frontend development |
| Authorize.net sandbox issues | MEDIUM | Early integration testing; fallback to test cards               |
| POS lifecycle rules unclear  | HIGH   | Pending client clarification; document assumptions              |
| Responsive design complexity | LOW    | Mobile-first approach; iterative testing                        |
| Performance on slow networks | MEDIUM | Implement skeletons, lazy loading, image optimization           |

## Definition of Done

### Technical Criteria

- [ ] All phases complete and tested
- [ ] TDD coverage for critical paths (> 80% for order submission)
- [ ] ESLint/Prettier passes
- [ ] TypeScript strict mode passes
- [ ] No console errors
- [ ] Build successful

### Functional Criteria

- [ ] Menu displays all items correctly
- [ ] Cart works end-to-end
- [ ] Checkout flows smoothly
- [ ] Orders submit and confirm
- [ ] Order history displays
- [ ] All user flows tested

### Quality Criteria

- [ ] Lighthouse score > 90 (Performance, Accessibility, Best Practices, SEO)
- [ ] WCAG 2.1 AA compliance
- [ ] Responsive on mobile/tablet/desktop
- [ ] Brand compliance verified
- [ ] Manual verification completed

### Delivery Criteria

- [ ] Deployed to staging S3 bucket
- [ ] Client acceptance received
- [ ] Deployed to production S3 (s3://inirestaurant/novatech/)
- [ ] Milestone payment released ($1,200)

## Checkpoint Schedule

| Checkpoint        | Date   | Criteria                               |
| ----------------- | ------ | -------------------------------------- |
| Phase 1 Complete  | Day 3  | Project setup, theme, API client ready |
| Phase 2 Complete  | Day 8  | Menu browsing functional               |
| Phase 3 Complete  | Day 12 | Cart system working                    |
| Phase 4 Complete  | Day 17 | Checkout flow complete                 |
| Phase 5 Complete  | Day 22 | Orders submitting successfully         |
| Phase 6 Complete  | Day 26 | Order history functional               |
| Phase 7 Complete  | Day 30 | Polished, responsive, accessible       |
| Client Demo       | Day 31 | Walkthrough with client                |
| Production Deploy | Day 32 | S3 deployment, acceptance, payment     |

## Resource Requirements

**Development**:

- 1 Frontend developer (Next.js/React)
- Backend API support (as needed)

**Testing**:

- Staging environment with backend
- Test Authorize.net credentials
- POS database sandbox

**Client**:

- Menu content/images
- Brand assets (logos)
- Authorize.net credentials
- Acceptance testing time
