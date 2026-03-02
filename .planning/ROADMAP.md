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

### Phase 8: CI/CD & Delivery
**Goal**: Automated builds deployed and artifacts uploaded to AWS S3
**Depends on**: Phase 7
**Requirements**: DEL-01, DEL-02, DEL-03, DEL-04
**Success Criteria** (what must be TRUE):
  1. Android APK built successfully via GitHub Actions CI pipeline
  2. iOS TestFlight build created via GitHub Actions on macos runner
  3. Test API environment deployed and accessible
  4. All artifacts uploaded to AWS S3 (s3://inirestaurant/novatech/)
**Plans**: TBD

Plans:
- [ ] 08-01: GitHub Actions CI pipelines (Android and iOS)
- [ ] 08-02: Test environment deployment and S3 upload

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 2/2 | Complete | 2026-02-25 |
| 2. Menu System | 0/2 | Not started | - |
| 3. Order Creation | 2/3 | In Progress|  |
| 4. Payments | 2/2 | Complete   | 2026-02-26 |
| 5. Loyalty | 2/3 | In Progress|  |
| 6. Push Notifications | 0/2 | Not started | - |
| 7. Mobile App Wiring | 3/3 | Complete    | 2026-03-02 |
| 8. CI/CD & Delivery | 0/2 | Not started | - |

---
*Roadmap created: 2026-02-25*
*Depth: Standard (8 phases)*
*Coverage: 29/29 requirements mapped*
