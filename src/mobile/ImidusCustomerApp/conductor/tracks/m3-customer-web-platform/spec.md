# M3 Customer Web Platform - Specification

## Track Metadata

- **Track ID**: `m3-customer-web-platform`
- **Milestone**: M3
- **Status**: IN PROGRESS
- **Milestone Value**: $1,200
- **Goal**: Build and deploy the customer-facing web ordering platform for INI Restaurant

## Context

### Previous Milestones (Complete)

- **M1 Architecture & Setup**: ✅ COMPLETE ($800) - Project scaffolding, tech decisions, database analysis
- **M2 Mobile Apps iOS & Android**: ✅ COMPLETE ($1,800) - React Native apps with core ordering flow

### Current Milestone

- **M3 Customer Web Platform**: 🔄 IN PROGRESS ($1,200) - Next.js customer ordering website

## Requirements

### Functional Requirements

1. **Menu Browsing**

   - Display menu items from `tblAvailableSize` via backend API
   - Category-based navigation (read from `tblMajorGroup`, `tblFamilyGroup`)
   - Item details: name, description, price (re-validated server-side)
   - Availability status from `MenuOverlay` overlay table
   - Search and filter functionality

2. **Cart System**

   - Add items to cart with quantity selection
   - Remove items from cart
   - Update quantities
   - Cart persistence (localStorage/session)
   - Subtotal calculation (validated server-side)

3. **Checkout Flow**

   - Customer information collection (name, phone, email)
   - Pickup/delivery time selection
   - Special instructions field
   - Order review before submission
   - Payment via Authorize.net Accept.js (tokenization only)

4. **Order Placement**

   - POST order to backend API with idempotency key
   - Backend writes to `tblSales`, `tblPendingOrders` via atomic transaction
   - Payment confirmation posts to `tblPayment`
   - Order confirmation display with order number
   - Email confirmation (if configured)

5. **Order History & Tracking**

   - View past orders (requires customer identification)
   - Order status display (Pending, Preparing, Ready, Completed)
   - Re-order functionality

6. **Loyalty Integration**
   - Display current points balance (from `tblCustomer`)
   - Show points earned on current order
   - Option to redeem points during checkout

### Non-Functional Requirements

1. **Performance**

   - Page load < 3 seconds
   - Time to Interactive < 5 seconds
   - Optimized images and lazy loading

2. **Branding**

   - Brand Blue (#1E5AA8) for primary actions, headings
   - Brand Gold (#D4AF37) for prices, points, CTAs
   - IMIDUSAPP wordmark and logos
   - Consistent with mobile app design

3. **Responsiveness**

   - Mobile-first design
   - Tablet and desktop breakpoints
   - Touch-friendly controls

4. **Accessibility**

   - WCAG 2.1 AA compliance
   - Keyboard navigation
   - Screen reader support
   - Color contrast ratios

5. **SEO**
   - Meta tags for menu pages
   - Structured data for restaurant info
   - Canonical URLs

## Acceptance Criteria

### Phase Completion Criteria

**Phase 1 - Setup**

- [ ] Next.js 14 project initialized with TypeScript
- [ ] ESLint/Prettier configured per project standards
- [ ] Theme tokens (colors, typography, spacing) in globals.css
- [ ] API client configured with axios
- [ ] CI/CD configured for S3 deployment

**Phase 2 - Menu**

- [ ] Menu data fetching from backend API
- [ ] Category navigation working
- [ ] Item cards displaying correctly
- [ ] Search/filter functional
- [ ] Responsive layout verified

**Phase 3 - Cart**

- [ ] Add to cart functionality
- [ ] Cart persistence working
- [ ] Quantity updates functional
- [ ] Cart badge showing item count
- [ ] Mobile cart drawer/bottom sheet

**Phase 4 - Checkout**

- [ ] Customer form with validation
- [ ] Authorize.net tokenization integrated
- [ ] Order review page
- [ ] Payment processing flow

**Phase 5 - Order Placement**

- [ ] Order POST to backend with idempotency
- [ ] Success confirmation page
- [ ] Order number display (using `DailyOrderNumber` from `tblMisc`)
- [ ] Error handling with user-friendly messages

**Phase 6 - Order History**

- [ ] Order list view
- [ ] Order detail view
- [ ] Status display
- [ ] Re-order button

**Phase 7 - Polish**

- [ ] All pages responsive
- [ ] Loading states implemented
- [ ] Error boundaries configured
- [ ] Brand compliance verified
- [ ] Performance audited

## Technical Notes

### Constraints

- **No POS Schema Changes**: All writes use existing `tblSales`, `tblPendingOrders`, `tblPayment` structure
- **Atomic Writes**: All DB operations wrapped in `BEGIN TRANSACTION / COMMIT`
- **Idempotency Keys**: Required for all write operations to prevent duplicates
- **Server-Side Validation**: Never trust client prices; always re-validate from `tblAvailableSize`
- **Payment Tokenization Only**: No raw card data stored; use Authorize.net Accept.js

### Database Integration

**Read Operations**:

- Menu items: `tblAvailableSize` JOIN `tblMajorGroup` JOIN `tblFamilyGroup`
- Prices: From `tblAvailableSize` (server-side only)
- Tax rates: Read from `tblMisc` (GST=0.0600, PST=0.0000)
- Online availability: `MenuOverlay` overlay table

**Write Operations** (via Backend API):

- Order creation: Insert into `tblSales`, `tblPendingOrders`
- Payment record: Insert into `tblPayment`
- Order number: Increment `DailyOrderNumber` in `tblMisc` with `UPDLOCK`

### Architecture

```
┌─────────────────┐
│  Customer Web   │  Next.js 14 + React + TypeScript
│   (Browser)     │  CSS Modules + Theme Tokens
└────────┬────────┘
         │ HTTPS/JSON
         ▼
┌─────────────────┐
│  Backend API    │  .NET 8 Web API + Dapper
│ (Integration)   │  Atomic transactions, idempotency
└────────┬────────┘
         │ SQL/T-SQL
         ▼
┌─────────────────┐
│  POS Database   │  SQL Server 2005 Express
│ (INI_Restaurant)│  Source of truth, read-only for us
└─────────────────┘
```

## API Contracts

### GET /api/menu

Response: Array of categories with items

```json
{
  "categories": [
    {
      "id": 1,
      "name": "Appetizers",
      "items": [
        {
          "id": "APP001",
          "name": "Spring Rolls",
          "description": "Crispy vegetable rolls",
          "price": 8.99,
          "availableOnline": true,
          "imageUrl": "/images/spring-rolls.jpg"
        }
      ]
    }
  ]
}
```

### POST /api/orders

Request:

```json
{
  "idempotencyKey": "uuid-v4",
  "customer": {
    "name": "John Doe",
    "phone": "555-1234",
    "email": "john@example.com"
  },
  "items": [
    {
      "itemId": "APP001",
      "quantity": 2,
      "price": 8.99
    }
  ],
  "payment": {
    "nonce": "authorize-net-nonce",
    "amount": 19.07
  },
  "specialInstructions": "Extra sauce please"
}
```

Response:

```json
{
  "orderId": 12345,
  "orderNumber": "20240310-001",
  "status": "confirmed",
  "total": 19.07,
  "pointsEarned": 1
}
```

## Verification Steps

### Pre-Deployment

1. Run full test suite (unit + integration)
2. Verify all API endpoints responding correctly
3. Test order flow end-to-end in staging environment
4. Check responsive design on mobile, tablet, desktop
5. Validate brand compliance (colors, logos, typography)
6. Run accessibility audit (WCAG 2.1 AA)
7. Performance audit (Lighthouse score > 90)

### Client Acceptance

1. Client reviews staging deployment
2. Client places test orders
3. Client verifies orders appear in POS
4. Client confirms payment processing
5. Written acceptance received
6. Deploy to production S3 bucket

## Dependencies

**Blocking Items** (from CLAUDE.md):

- POS ticket lifecycle rules (TransType values, tender mappings) — Currently BLOCKING
- Backend API endpoints for menu fetching and order placement — Must be available

**External Dependencies**:

- Authorize.net API credentials
- Backend integration service running
- POS database accessible (test environment)

## Success Criteria

- Customer can browse full menu online
- Customer can add items to cart and checkout
- Orders appear in POS within 30 seconds of placement
- Payment processing works end-to-end
- Website is responsive and branded correctly
- Client provides written acceptance
- Milestone payment ($1,200) released upon S3 delivery
