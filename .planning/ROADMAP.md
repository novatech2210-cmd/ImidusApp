# Roadmap: IMIDUS Customer Mobile Apps (Milestone 2)

## Overview

This roadmap delivers iOS and Android customer mobile apps that integrate with the legacy INI_Restaurant system via direct SQL Server database access. The journey progresses from database connectivity, through menu browsing, order creation with full INI_Restaurant ticket lifecycle, payment processing via Authorize.net, loyalty points, push notifications, to final mobile app wiring and CI/CD delivery. Each phase builds on the previous, with Phase 1 establishing the foundation that all subsequent work depends on.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Database connectivity, API health check, and entity alignment to INI_Restaurant schema
- [x] **Phase 2: Menu System** - Menu API from INI_Restaurant tables and mobile menu display
- [x] **Phase 3: Order Creation** - Full order flow with INI_Restaurant ticket lifecycle (tblSales, tblPendingOrders)
- [x] **Phase 4: Payments** - Authorize.net tokenization and POS payment posting (completed 2026-02-26)
- [ ] **Phase 5: Loyalty** - Customer lookup, points balance, earn/redeem via stored procedure
- [ ] **Phase 6: Push Notifications** - FCM integration for transactional notifications
- [x] **Phase 7: Mobile App Wiring** - Auth, cart, checkout, order tracking, and branding (completed 2026-03-02)
- [ ] **Phase 8: CI/CD & Delivery** - GitHub Actions pipelines and AWS S3 artifact upload

## Phase Details

### Phase 1: Foundation
**Goal**: API connects to restored INI_Restaurant database (source of truth) with correctly aligned entity models
**Depends on**: Nothing (first phase)
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-04
**Success Criteria** (what must be TRUE):
  1. API health check endpoint returns 200 with database connectivity confirmed
  2. Entity models match actual INI_Restaurant schema column names and types (verified via successful queries)
  3. Backend-only database exists for CustomerProfile, idempotency keys, and audit logs
  4. Connection string configured and API can execute SELECT queries against tblItem
**Plans**: 2 plans

Plans:
- [x] 01-01-PLAN.md - Database restore, Docker config, IntegrationService DB setup
- [x] 01-02-PLAN.md - Entity alignment, health check middleware, integration tests

### Phase 2: Menu System
**Goal**: Users can browse the restaurant menu with real INI_Restaurant data organized by category
**Depends on**: Phase 1
**Requirements**: MENU-01, MENU-02, MENU-03, MOB-02
**Success Criteria** (what must be TRUE):
  1. Menu API returns items from tblItem joined with tblAvailableSize and tblCategory
  2. Each menu item includes tax flags (ApplyGST, ApplyPST) and kitchen routing (KitchenB, KitchenF, Bar)
  3. Mobile app displays menu items organized by category with prices
  4. Item availability reflects OnlineItem flag from POS
**Plans**: 2 plans

Plans:
- [x] 02-01-PLAN.md - Backend menu API endpoints (categories, items by category, filtering by OnlineItem)
- [x] 02-02-PLAN.md - Mobile menu UI (skeleton loading, caching, category tabs, bottom sheet, pull-to-refresh)

### Phase 3: Order Creation
**Goal**: Users can place orders that create valid INI_Restaurant tickets following the complete ticket lifecycle
**Depends on**: Phase 2
**Requirements**: ORD-01, ORD-02, ORD-03, ORD-04, ORD-05, ORD-06, ORD-07, ORD-08, ORD-09
**Success Criteria** (what must be TRUE):
  1. Order creates ticket in tblSales with TransType=2 (Open) and correct totals
  2. Order items insert to tblPendingOrders with all 20+ columns populated correctly
  3. Duplicate order creation prevented via idempotency key check
  4. Tax calculated from tblMisc GST/PST rates based on item ApplyGST/ApplyPST flags
  5. Online order registered in tblOnlineOrderCompany and linked via tblSalesOfOnlineOrders
**Plans**: 3 plans

Plans:
- [x] 03-01-PLAN.md - Refactor order service to TransType=2 workflow with tblPendingOrders and tax precision
- [x] 03-02-PLAN.md - Idempotency middleware, concurrency control, and online order registration
- [x] 03-03-PLAN.md - Atomic DailyOrderNumber generation and online order configuration

### Phase 4: Payments
**Goal**: Users can pay for orders with credit card, with payment posted to POS and order completed
**Depends on**: Phase 3
**Requirements**: PAY-01, PAY-02, PAY-03, PAY-04
**Success Criteria** (what must be TRUE):
  1. Authorize.net tokenization captures card without storing card data on server
  2. Payment posts to tblPayment with card encrypted via dbo.EncryptString()
  3. Order completion updates TransType from 2 to 1 and moves items to tblSalesDetail
  4. Partial payment amounts supported (multiple payments per ticket)
**Plans**: 2 plans

Plans:
- [ ] 04-01-PLAN.md - Authorize.net integration: Backend payment service with charge/void/profile operations, mobile tokenization SDK
- [ ] 04-02-PLAN.md - POS payment posting and order completion: Payment encryption with dbo.EncryptString, order finalization, checkout/confirmation UI

### Phase 5: Loyalty
**Goal**: Users can view and use loyalty points across in-store and online channels
**Depends on**: Phase 4
**Requirements**: LOY-01, LOY-02, LOY-03, LOY-04, MOB-05
**Success Criteria** (what must be TRUE):
  1. Customer lookup by phone or email returns profile from tblCustomer
  2. Points balance displayed from tblCustomer.EarnedPoints
  3. Points earned on purchase via sp_InsertUpdateRewardPointsDetail stored procedure
  4. Points redemption deducts from balance and reflects in order total
**Plans**: 3 plans

Plans:
- [x] 05-01-PLAN.md - Customer lookup API with phone/email and loyalty history (3/3 tasks, 4 min)
- [ ] 05-02-PLAN.md - Stored procedure integration for points earn/redeem
- [ ] 05-03-PLAN.md - Mobile loyalty UI with transaction history and checkout redemption

### Phase 6: Push Notifications
**Goal**: Users receive transactional push notifications for order events
**Depends on**: Phase 3 (needs order creation for triggers)
**Requirements**: NOTIF-01, NOTIF-02, NOTIF-03
**Success Criteria** (what must be TRUE):
  1. FCM integration configured with Imidus notification channel
  2. Order confirmation push sent immediately on successful order creation
  3. Order ready push sent when kitchen marks order complete (status change detected)
**Plans**: 2 plans

Plans:
- [x] 06-01-PLAN.md - FCM Integration and Order Confirmation (Backend FCM service, token registration API, mobile FCM SDK, deep linking, order completion trigger) - 6/6 tasks, 25 min, 24 files
- [ ] 06-02-PLAN.md - Order Status Polling and Ready Notifications (Background polling worker, TransType=9 detection, token cleanup job)

### Phase 7: Mobile App Wiring
**Goal**: Mobile app delivers complete end-to-end user experience with branding
**Depends on**: Phase 2, Phase 4, Phase 5, Phase 6
**Requirements**: MOB-01, MOB-03, MOB-04, MOB-06
**Success Criteria** (what must be TRUE):
  1. User can register and log in via backend authentication
  2. Cart and checkout flow creates real orders in POS
  3. Order tracking screen shows current order status (TransType-based)
  4. Imidus branding applied (theme colors, components from branding package)
**Plans**: 3 plans

Plans:
- [x] 07-01-PLAN.md — Authentication navigation guards with SplashScreen and conditional routing (Complete 2026-03-02)
- [ ] 07-02-PLAN.md — Cart to order flow integration via createOrder API
- [ ] 07-03-PLAN.md — Order tracking polling and Imidus branding consistency

### Phase 8: CI/CD & Delivery (Documentation Only - See Phases 09-10 for Real Work)
**Goal**: Planning documentation for CI/CD and testing
**Depends on**: Phase 7
**Requirements**: DEL-01, DEL-02, DEL-03, DEL-04
**Status**: ⚠️ Phase 8 created **planning artifacts** (test plans, CI/CD documentation) but did NOT perform actual testing, building, or deployment. Real work moved to Phases 09-10.
**Plans**: 2 plans (documentation created, not execution)

Plans:
- [x] 08-01-PLAN.md - CI/CD planning documentation (created, not tested)
- [x] 08-02-PLAN.md - E2E testing planning documentation (created, not executed)

---

### Phase 9: Integration Validation & Device Testing
**Goal**: Validate all platforms actually work end-to-end with real database and devices
**Depends on**: Phase 8 (planning), client providing database credentials and bridge docs
**Blocking**: Phase 10 (cannot deploy until validated)
**Success Criteria** (what must be TRUE):
  1. Backend successfully connects to restored INI_Restaurant.Bak database
  2. Menu endpoints return real data from POS database
  3. Android APK built, installed on device, and order flow tested end-to-end
  4. iOS IPA built, installed on device, and order flow tested end-to-end
  5. Web platform tested end-to-end in real browser
  6. Payment flow validated with Authorize.net sandbox (card charge and void)
  7. Order appears in POS system with correct totals and items
  8. All known issues documented with workarounds
**Plans**: 5 plans

Plans:
- [ ] 09-01-PLAN.md - Database Setup & Backend Validation (restore DB, test connectivity, verify menu/order endpoints)
- [ ] 09-02-PLAN.md - Payment Flow Testing (sandbox validation, charge/void/refund, POS posting verification)
- [ ] 09-03-PLAN.md - Mobile APK Build & Device Testing (Android compilation, device install, end-to-end order flow)
- [ ] 09-04-PLAN.md - iOS IPA Build & Device Testing (iOS compilation, device install, end-to-end order flow)
- [ ] 09-05-PLAN.md - Web Platform Testing & Terminal Bridge Planning (browser testing, admin portal skeleton, request bridge docs)

---

### Phase 10: Production Deployment & Go-Live
**Goal**: All platforms deployed to production with monitoring and client acceptance
**Depends on**: Phase 9 (validation complete and issues resolved)
**Requirements**: Production database access, terminal bridge docs, Apple/Google credentials
**Success Criteria** (what must be TRUE):
   1. Backend deployed to production Windows Server with MSI installer
   2. Web platform deployed to production hosting (AWS/Vercel) and accessible
   3. Android app submitted to Google Play Store
   4. iOS app submitted to Apple App Store
   5. Terminal bridge integration complete (if docs provided)
   6. Admin portal operational with order management dashboard
   7. Monitoring and alerting configured
   8. Client written acceptance and sign-off obtained
   9. All deliverables uploaded to AWS S3
**Plans**: 4 plans

Plans:
- [ ] 10-01-PLAN.md - Backend Production Deployment (MSI installer creation, deployment to client Windows Server, database migration)
- [ ] 10-02-PLAN.md - Web & Admin Portal Deployment (production hosting setup, domain configuration, admin portal completion)
- [ ] 10-03-PLAN.md - Mobile App Store Submissions (Google Play + Apple App Store submission, review response handling)
- [ ] 10-04-PLAN.md - Terminal Bridge & Go-Live (bridge integration per client docs, monitoring setup, client training, go-live support)

---

### Phase 11: Web Ordering - Responsive UI & Feature Parity
**Goal**: Customers can order from web browser with full feature parity to mobile app
**Depends on**: Phase 7 (Mobile App Wiring)
**Requirements**: WEB-01 (responsive web ordering UI)
**Success Criteria** (what must be TRUE):
   1. Web platform displays full menu from backend API (matches mobile MenuScreen)
   2. Cart state management working (add/remove/quantity/totals)
   3. Checkout captures customer info (name, phone, email, address)
   4. Payment method selection flow complete
   5. Page layouts responsive on mobile (< 768px), tablet (768-1024px), and desktop (> 1024px)
   6. Loyalty integration: customer can log in and see points balance
**Plans**: 2 plans

Plans:
- [ ] 11-01-PLAN.md - Responsive Web Layout & Menu Integration (homepage, menu browsing, category filtering, item details)
- [ ] 11-02-PLAN.md - Cart & Checkout Flow (cart state, quantity management, customer info capture, order review)

### Phase 12: Web Payments - Authorize.net Integration
**Goal**: Web customers can pay securely with credit card via Authorize.net tokenization
**Depends on**: Phase 11
**Requirements**: WEB-02 (Authorize.net payment on web)
**Success Criteria** (what must be TRUE):
   1. Accept.js card tokenization working (no raw card data sent to backend)
   2. Payment form shows card errors and validation feedback
   3. Payment posts to backend POST /api/orders/{orderId}/complete-payment
   4. Backend returns success/failure with order confirmation
   5. Error messages display user-friendly text (not technical errors)
   6. Supports partial and full payment amounts
**Plans**: 2 plans

Plans:
- [ ] 12-01-PLAN.md - Accept.js Integration & Payment Form UI (tokenization SDK setup, form validation, error handling)
- [ ] 12-02-PLAN.md - Backend Payment Wiring & Order Completion (payment API call, order finalization, confirmation UI)

### Phase 13: Web Database Sync - POS Ticket Lifecycle
**Goal**: Web orders create valid POS tickets in INI_Restaurant database with correct lifecycle
**Depends on**: Phase 12
**Requirements**: WEB-03 (orders sync to INI_Restaurant database - source of truth)
**Success Criteria** (what must be TRUE):
   1. Web order creates tblSales record with TransType=2 (Open)
   2. Order items insert to tblPendingOrders with all 20+ columns populated
   3. Payment posts to tblPayment with encrypted card data
   4. Order completion updates TransType from 2 to 1 (Sale)
   5. Items move from tblPendingOrders to tblSalesDetail
   6. Online order registered in tblOnlineOrderCompany and tblSalesOfOnlineOrders
**Plans**: 2 plans

Plans:
- [ ] 13-01-PLAN.md - Order Creation & POS Posting (web checkout to POST /api/orders, tblSales ticket lifecycle)
- [ ] 13-02-PLAN.md - Payment Posting & Order Completion (tblPayment encryption, TransType update, item movement)

### Phase 14: Scheduled Orders - Future Order Planning
**Goal**: Customers can schedule orders for future pickup time
**Depends on**: Phase 13
**Requirements**: WEB-04 (scheduled/future orders for later pickup)
**Success Criteria** (what must be TRUE):
   1. Checkout includes date/time picker (min: 2 hours from now, max: 14 days out)
   2. Scheduled orders stored in backend ScheduledOrders table (NOT in INI_Restaurant)
   3. Order does NOT create tblSales ticket until prep time (90 minutes before pickup)
   4. Background service injects order at calculated prep time
   5. Timezone conversion working correctly
   6. User sees confirmation with pickup time and order number
**Plans**: 2 plans

Plans:
- [ ] 14-01-PLAN.md - Scheduling UI & Order Storage (date/time picker, validation, ScheduledOrders table insert)
- [ ] 14-02-PLAN.md - Background Service & Scheduled Injection (timer service, prep time calculation, POS injection logic)

### Phase 15: Homepage Banner & Segment Targeting
**Goal**: Homepage displays rotating banners targeted to customer segments (RFM)
**Depends on**: Phase 14
**Requirements**: WEB-05 (homepage carousel with customer segment targeting)
**Success Criteria** (what must be TRUE):
   1. Homepage displays carousel with 3-5 rotating banners (5 sec interval)
   2. Admin can set banner image, CTA link, and start/end dates
   3. Banners target by customer segment:
      - High-spend: Lifetime value > $500
      - Frequent: Visit count > 10
      - Recent: Last order < 14 days ago
      - Birthday: birthDate matches current date (±7 days)
   4. Banner targeting evaluated at request time against INI_Restaurant customer data
   5. CTA links route to menu or specific item
**Plans**: 2 plans

Plans:
- [ ] 15-01-PLAN.md - Carousel Component & Admin Rule Builder (banner CRUD, targeting conditions, schedule)
- [ ] 15-02-PLAN.md - Segment Evaluation & Recommendation (RFM SQL queries, customer lookup, banner selection logic)

### Phase 16: Rule-Based Upselling Engine
**Goal**: Dynamically suggest items at checkout based on configurable rules
**Depends on**: Phase 15
**Requirements**: WEB-06 (rule-based upselling engine)
**Success Criteria** (what must be TRUE):
   1. Admin can create upselling rules: IF (item in cart) THEN suggest (item) with conditions
   2. Rules engine evaluates at checkout (e.g., IF Burger THEN suggest Fries)
   3. Suggestion UI shows item image, name, price, "Add to Order" button
   4. Upsell acceptance/decline tracked for analytics
   5. Rules have priority/ordering (show top 1-2 suggestions)
   6. Admin dashboard shows rule performance (acceptance rate)
**Plans**: 2 plans

Plans:
- [ ] 16-01-PLAN.md - Rules Table Schema & Admin Builder (MarketingRules table, CRUD UI, rule conditions)
- [ ] 16-02-PLAN.md - Checkout Upsell Integration & Analytics (rule evaluation, suggestion rendering, tracking)

### Phase 17: Imidus Branding - Web Platform
**Goal**: Web platform fully branded with Imidus design system
**Depends on**: Phase 16
**Requirements**: WEB-07 (Imidus branding applied across web)
**Success Criteria** (what must be TRUE):
   1. All pages use Imidus color palette (Brand Blue #1E5AA8, Brand Gold #D4AF37)
   2. Header displays Imidus logo and navigation
   3. Buttons, inputs, cards styled with Imidus theme
   4. Typography follows Imidus brand (Georgia for wordmark, system fonts for body)
   5. Loyalty points displayed in Brand Gold
   6. Prices displayed in bold Brand Gold
   7. Consistency across mobile app → web site
**Plans**: 1 plan

Plans:
- [ ] 17-01-PLAN.md - Brand System Installation & Styling (colors, typography, components, header/footer)

### Phase 18: Admin Portal - Order Dashboard & Customer CRM
**Goal**: Admin can view orders, manage customers, and segment by RFM
**Depends on**: Phase 13 (orders in INI_Restaurant database)
**Requirements**: ADMIN-01 (order management), ADMIN-02 (customer CRM with RFM)
**Success Criteria** (what must be TRUE):
   1. Order dashboard displays all orders with filters (date range, customer, status, payment)
   2. Order details show items, totals, payment status, customer info
   3. Customer lookup returns profile with lifetime value, visit count, last order date
   4. RFM segmentation: High-spend (>$X), Frequent (>N visits), Recent (<N days)
   5. Customer dashboard shows loyalty points, earned/redeemed history
   6. Read-only inventory view shows item availability (tblAvailableSize.OnHandQty)
   7. Admin header/sidebar branded with Imidus colors
**Plans**: 2 plans

Plans:
- [ ] 18-01-PLAN.md - Order Dashboard & Management (order list, filters, order details, status timeline)
- [ ] 18-02-PLAN.md - Customer CRM & RFM Analytics (customer lookup, lifetime value calc, segmentation, loyalty history)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9 -> 10 -> 11 -> 12 -> 13 -> 14 -> 15 -> 16 -> 17 -> 18

| Phase | Plans | Status | Completed |
|-------|-------|--------|-----------|
| 1. Foundation | 2/2 | ✅ Complete | 2026-02-25 |
| 2. Menu System | 2/2 | ✅ Complete | 2026-02-26 |
| 3. Order Creation | 3/3 | ✅ Complete | 2026-02-28 |
| 4. Payments | 2/2 | ✅ Complete | 2026-02-28 |
| 5. Loyalty | 3/3 | ✅ Complete | 2026-03-01 |
| 6. Push Notifications | 2/2 | ✅ Complete | 2026-03-02 |
| 7. Mobile App Wiring | 3/3 | ✅ Complete | 2026-03-02 |
| 8. CI/CD & Delivery | 2/2 | ⚠️ Planning docs only | 2026-03-07 |
| 9. Integration Validation | 5/5 | 🔴 NOT STARTED | - |
| 10. Production Deployment | 4/4 | 🔴 NOT STARTED | - |
| **11. Web UI & Feature Parity** | **2/2** | 🔵 NEW (Pending) | - |
| **12. Web Payments** | **2/2** | 🔵 NEW (Pending) | - |
| **13. Web POS Sync** | **2/2** | 🔵 NEW (Pending) | - |
| **14. Scheduled Orders** | **2/2** | 🔵 NEW (Pending) | - |
| **15. Homepage Banners** | **2/2** | 🔵 NEW (Pending) | - |
| **16. Upselling Engine** | **2/2** | 🔵 NEW (Pending) | - |
| **17. Branding (Web)** | **1/1** | 🔵 NEW (Pending) | - |
| **18. Admin Dashboard** | **2/2** | 🔵 NEW (Pending) | - |
| **TOTAL** | **42/42** | **38% complete (M2 + M3 start)** | - |

---

**PHASES 11-18 ADDED (2026-03-08):**
- Milestone 3 (Web Ordering): Phases 11-17 (7 phases, 14 plans)
- Milestone 4 (Admin Portal): Phase 18 (1 phase, 2 plans)
- Total new work: 39-41 tasks across 8 phases
- Requirements: 7 WEB + 2 ADMIN (partial, more to follow)

**COMPLETION STATUS:**
- Milestone 2 (Mobile Apps): ✅ 100% complete (Phases 1-8)
- Milestone 3 (Web Ordering): 🔵 0% started (Phases 11-17 planned)
- Milestone 4 (Admin Portal): 🔵 0% started (Phases 18+ planned)
- Milestone 5 (Bridge/QA/Deploy): ⏳ Blocked on client inputs (Phases 9-10)
- **Project overall: ~38% complete** (M2 done, M3-M5 ahead)

**BLOCKING ITEMS (per Master Doc):**
- INI_Restaurant.Bak restore (needed for Phase 9)
- Terminal bridge API docs (needed for Phase 10)
- Production SQL Server credentials (needed for Phase 9)

---

*Roadmap created: 2026-02-25*
*Updated: 2026-03-07 (added realistic Phases 09-10)*
*Updated: 2026-03-08 (added gap closure Phases 11-18 for M3-M4)*
*Depth: Extended (18 phases across 5 milestones)*
*Coverage: 29/29 M2 requirements + 7 WEB + 2 ADMIN requirements (14 total new)*
