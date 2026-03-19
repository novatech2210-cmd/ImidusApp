---
trigger: always_on
---

# GSD Setup Answers — IMIDUS POS Integration Project

Copy/paste these when GSD asks its questions during `/gsd:new-project`.


## PROJECT DESCRIPTION / WHAT ARE YOU BUILDING?

A full-stack restaurant platform for IMIDUS Technologies that integrates with a legacy
INI POS (Point of Sale) system. The platform includes:

1. Customer mobile apps (iOS & Android) — React Native
2. Customer online ordering website — Next.js
3. Merchant/Admin portal — Next.js
4. Backend integration service — .NET 8 Web API

The critical challenge: INI POS is a Delphi-based Windows desktop app with NO API or SDK.
All integration is via direct read/write to a Microsoft SQL Server 2005 Express database.
The POS source code is not available. The database schema cannot be modified.
The INI_Restaurant database (source of truth) remains the single source of truth for all data.

The backend integration service acts as the bridge between the modern apps and the
INI_Restaurant database (source of truth).

## WHAT PROBLEM DOES IT SOLVE?

The restaurant currently runs everything through the INI POS terminal at the counter.
There's no online ordering, no mobile app, no web presence for taking orders.

This platform enables:
- Customers to order from their phones or the web
- Orders to appear directly in the POS system as if placed at the terminal
- Payments via Authorize.net that post back to POS system tickets
- Restaurant owner to manage orders, run marketing campaigns, and view analytics
- Loyalty points to work across in-store and online channels

## TECH STACK

Backend: .NET 8 Web API (IntegrationService.API) on Linux
Database: Microsoft SQL Server 2005 Express (legacy, no changes allowed)
Mobile: React Native (cross-platform iOS/Android)
Web Frontend: Next.js (customer ordering + admin portal)
Payments: Authorize.net (tokenization only, no card storage)
ORM: Dapper (direct SQL, not EF Core — needed for legacy schema compatibility)
Push Notifications: Firebase Cloud Messaging (FCM)
Deployment: Azure App Service (Linux) for API, AWS S3 for delivery artifacts
CI/CD: GitHub Actions (iOS builds on macos-latest runner)
Final Delivery: Self-installing Windows MSI for backend (contractual requirement)

## DATABASE DETAILS

Engine: Microsoft SQL Server 2005 Express
Source file: INI_Restaurant.Bak (8.6MB backup file — single source of truth)
Database name: INI_Restaurant database (logical name: TPPro) (referenced in stored procedures as TPPro.dbo)

Key constraints:
- NO schema changes allowed
- NO stored procedure modifications
- All writes must follow existing POS business rules
- All writes must be transaction-safe, idempotent, and auditable
- SQL Server 2005 limitations: no MERGE, no OFFSET/FETCH, no window functions
- 4GB database size limit, 1GB RAM limit

Core tables (80+ total, these are critical):

TRANSACTIONS:
- tblSales — Ticket/order header (TransType: 0=Refund, 1=Sale, 2=Open)
- tblSalesDetail — Completed order line items
- tblPendingOrders — ACTIVE order line items (items in kitchen)
- tblPayment — Payment records (encrypted card data via dbo.EncryptString)

MENU:
- tblItem — Menu items (IName, CategoryID, Alcohol flag, Taste flag, OnlineItem flag)
- tblAvailableSize — Item sizes and prices (UnitPrice, OnHandQty)
- tblCategory — Menu categories
- tblSize — Size definitions (Regular, Large, Glass, Pitcher, etc.)
- tblDayHourDiscount — Automated time-based discounts

CUSTOMERS:
- tblCustomer — Customer profiles (CustomerNum, FName, LName, Phone, EarnedPoints)
- tblPointsDetail — Loyalty point transactions (PointUsed, PointSaved)
- tblPointReward — Reward configuration
- tblCustomerGroup, tblCustomerType — Segmentation

ONLINE (already in schema!):
- tblOnlineOrders — Online order records
- tblOnlineOrderDetail — Online order line items  
- tblOnlineOrderCompany — Online platform config (our app = new company entry)
- tblSalesOfOnlineOrders — Links sales to online orders

GIFT CARDS:
- tblPrepaidCards — Gift card management
- tblPrepaidCardChargeHistory, tblPrepaidCardUsageHistory

OTHER:
- tblUser — Staff/cashier accounts
- tblTable — Dine-in table definitions
- tblStation — POS terminal stations
- tblTimeStamp — Employee clock in/out
- tblPaymentType — Payment method definitions

Payment Type IDs:
- 1=Cash, 2=Debit, 3=Visa, 4=MasterCard, 5=Amex, 6=GiftCard, 7-8=Other credit

Ticket lifecycle:
1. INSERT tblSales (TransType=2, open ticket)
2. INSERT tblPendingOrders (active line items — 20+ columns!)
3. INSERT tblPayment (payment record)
4. UPDATE tblSales (totals, TransType=1 for completed)
5. Items move from tblPendingOrders → tblSalesDetail on completion

## CONSTRAINTS / NON-NEGOTIABLES

1. INI_Restaurant database (source of truth) is the single source of truth — never override POS data
2. No database schema changes — read/write existing tables only
3. No POS source code available — integrate via database only
4. All writes must be idempotent (idempotency key checks — contractual)
5. All writes must include concurrency checks (ticket state re-validation — contractual)
6. All writes must be wrapped in SQL transactions
7. Card numbers encrypted via dbo.EncryptString() — must use this function
8. Authorize.net tokenization only — no card data stored on our servers
9. Backend must be delivered as self-installing Windows MSI (contractual)
10. Mobile builds via CI pipelines (contractual)
11. Web deployment via single scripted deployment (contractual)
12. Menu enable/disable stored as backend overlay — not written to INI_Restaurant database (source of truth) tables
13. SQL Server 2005 Express compatibility — no modern T-SQL features
14. AWS S3 is the authoritative delivery channel (s3://inirestaurant/novatech/)

## USERS / PERSONAS

1. Customer (mobile app + website)
   - Browse menu, place orders, pay online
   - Track order status, view history
   - Earn/redeem loyalty points
   - Receive push notifications (transactional + marketing)

2. Restaurant Owner/Manager (admin portal)
   - View orders, sales analytics
   - Create marketing push notification campaigns
   - Customer segmentation by Spend/Frequency/Recency (RFM)
   - Enable/disable menu items for online ordering
   - View read-only inventory/item availability
   - Manage birthday reward automation

3. POS Operator (existing INI POS — we don't modify this)
   - Sees online orders appear as regular tickets
   - Processes them like any other order
   - Payment already posted to ticket

## V1 REQUIREMENTS (Must-Have — Current Scope)

MOBILE APPS (Milestone 2 — $1,800) 
- Menu browsing with INI_Restaurant database (source of truth) data (tblItem + tblAvailableSize + tblCategory)
- Cart and order placement (writes to tblSales + tblPendingOrders)
- Authorize.net payment with tokenization
- Order status tracking (read tblSales.TransType)
- Loyalty points display and redemption (tblCustomer.EarnedPoints + tblPointsDetail)
- Push notifications — transactional (order updates) AND marketing campaigns
- Customer account management

WEB ORDERING (Milestone 3 — $1,200) 🔵 
- Full feature parity with mobile apps
- Responsive web interface
- Homepage banner carousel (with targeting by customer segment)
- Scheduled/future orders (order now, pickup later)
- Basic cross-sell/upsell ("add a drink?")

ADMIN PORTAL (Milestone 4 — $1,000) 
- Order management dashboard
- Sales tracking and analytics
- Customer segmentation (RFM: Spend > $X, Frequency > N, Recency < 60 days)
- Push notification campaigns with audience targeting
- Menu enable/disable overlay (backend-managed)
- Read-only inventory/item availability
- Birthday reward automation (annual trigger with predefined reward)

BACKEND INTEGRATION SERVICE:
- .NET 8 API bridging all apps to INI_Restaurant database (source of truth)
- Dapper-based SQL queries (no EF Core)
- Idempotency keys on all write operations
- Concurrency checks (re-validate ticket state before writes)
- Background services (birthday check, order scheduling)

PAYMENT:
- Authorize.net for all mobile/web payments
- Post confirmed payments to INI_Restaurant database (source of truth) tblPayment table
- Support partial and full payments
- Consume/validate results from Verifone/Ingenico bridge (bridge provided by client)

DEPLOYMENT (Milestone 5 — $1,200) ⏳ PENDING DOCS:
- Self-installing Windows MSI for backend
- CI pipelines for iOS/Android builds  
- Scripted deployment for web apps
- Upload all artifacts to AWS S3


## V2 / NICE-TO-HAVE (Out of Current Scope)

- Distance/location-based customer targeting (geofencing)
- Advanced recommendation engine (beyond basic upsell rules)
- Multi-location support
- Full inventory management (current scope is read-only visibility)
- Writing menu changes back to POS (current scope is overlay only)
- Clover integration changes (stays unchanged per SOW)
- Real-time WebSocket order updates (polling is fine for v1)


## EXISTING CODEBASE (Tell GSD after /gsd:map-codebase)

```
Repo: ~/Desktop/TOAST (also on GitHub: novatech642/pos-integration)

Structure:
src/
├── backend/
│   ├── IntegrationService.API/          — .NET 8 Web API (runs on port 5004)
│   ├── IntegrationService.Core/         — Domain entities, interfaces
│   ├── IntegrationService.Infrastructure/ — Dapper repositories, SQL queries
│   └── IntegrationService.Tests/        — Unit tests (some broken)
├── mobile/
│   └── ImidusCustomerApp/               — React Native app
└── web/
    ├── imidus-ordering/                 — Next.js customer ordering site
    └── imidus-admin/                    — Next.js admin portal

Current state:
- Backend runs but returns 404 (no DB connected, no routes hit)
- Entity models exist but some column names don't match real schema
- SQL queries being corrected (i.ID not i.ItemID, s.ID not s.SalesID, etc.)
- TransType mapping was wrong (fixed: 0=Refund, 1=Sale, 2=Open)
- Mobile app shell exists but API URL hardcoded to localhost
- Tests have 5 compilation errors (reference non-existent interfaces)
```

---

## CURRENT STATUS (Updated: March 17, 2026)

### WORKING / COMPLETED
- **Web App (Next.js 16):** ✅ BUILD SUCCESS - compiles, 31 routes generated, running on :3000
- **Admin Portal (Next.js 14):** ✅ BUILD SUCCESS - compiles, 12 routes generated, running on :3001
- **Backend API (.NET 9):** ✅ BUILD SUCCESS - upgraded from .NET 8, running on :5004
- **Mobile APK:** ⚠️ Last built version exists (v2, March 5, 2026, 59MB)
- **Menu System:** ✅ Categories, items, sizes, pricing implemented
- **Payment Integration:** ✅ Authorize.net tokenization implemented
- **SyncController:** ✅ Added to fix 404 on /api/Sync/status
- **AWS S3 Upload:** ✅ Static assets uploaded to s3://inirestaurant/novatech/

### BROKEN / INCOMPLETE
- **Database Connection:** ⚠️ No SQL Server connected - API returns 503
  - Impact: Most endpoints return errors without DB
  - Fix: Connect to production SQL Server
  
- **Mobile App Rebuild:** ❌ TypeScript errors (24+ errors) - cannot rebuild APK
  - Missing theme colors: `gray`, `goldButton`, `elevation0`, `level1`, `level2`, `level3`
  - Missing type exports: `FontFamily`, `FontSize`, `LineHeight` from theme/typography
  - Missing Jest type definitions
  - Note: Existing APK v2 works fine

### BUILD STATUS (March 17, 2026)
| Component | Build | Runtime | Notes |
|-----------|-------|---------|-------|
| Backend (.NET 9) | ✅ PASS | ✅ Running :5004 | Upgraded from .NET 8 |
| Web (Next.js 16) | ✅ PASS | ✅ Running :3000 | 31 routes |
| Admin (Next.js 14) | ✅ PASS | ✅ Running :3001 | 12 routes |
| Mobile (RN 0.74) | ⚠️ APK v2 | ⚠️ APK exists | TypeScript errors, last APK Mar 5 |

### API ENDPOINTS (Running on :5004)
- GET /api/Sync/status → 503 (no DB - expected)
- GET /api/Menu/categories → 500 (no DB - expected)
- POST /api/Auth/login → 400 (needs Idempotency-Key header)
- POST /api/Orders/process → 400 (needs Idempotency-Key header)

### % COMPLETE ESTIMATE
- **M1 Architecture:** 100% ✅
- **M2 Mobile Apps:** 85% ⚠️ (APK exists but can't rebuild)
- **M3 Web Platform:** 70% ⚠️ (builds, needs DB for full functionality)
- **M4 Admin Portal:** 20% 📅 (scheduled)
- **M5 Deployment:** 10% ⏳ (partial S3 upload)

**Overall: ~65% complete**

---

## RUNNING SERVICES (March 17, 2026)

| Service | Port | URL |
|---------|------|-----|
| Backend API | 5004 | http://localhost:5004 |
| Web App | 3000 | http://localhost:3000 |
| Admin Portal | 3001 | http://localhost:3001 |

---

## MILESTONE STRUCTURE (Map GSD phases to these)

Per Master Project Document (Feb 25, 2026) — authoritative source:

Milestone 1: Architecture & Setup — $800 )
Milestone 2: Customer Mobile Apps (iOS & Android) — $1,800 )
Milestone 3: Customer Web Ordering Platform — $1,200 
Milestone 4: Merchant / Admin Portal — $1,000 
Milestone 5: Terminal/Bridge Integration, QA & Deployment — $1,200

## SUGGESTED GSD PHASE MAPPING

MILESTONE 3 PHASES (Current Priority — Web Ordering Platform, $1,200):
Phase 1: Responsive web ordering UI (Next.js — full feature parity with mobile)
Phase 2: Authorize.net payment integration on web
Phase 3: INI_Restaurant database (source of truth) ticket sync from web (tblSales + tblSalesDetail + tblPayment)
Phase 4: Future scheduled ordering (order at 10AM for 6PM pickup)
Phase 5: Homepage banner carousel with customer segment targeting
Phase 6: Rule-based upselling engine (configurable rules, not AI)
Phase 7: Branding integration (Imidus brand assets — see BRANDING section)
Phase 8: Deploy web ordering to test environment + upload to AWS S3

MILESTONE 4 PHASES (Merchant / Admin Portal, $1,000):
Phase 9: Order dashboard + real-time INI_Restaurant database (source of truth) order management
Phase 10: Customer CRM with loyalty visibility
Phase 11: Push notification campaign builder (Spend/Frequency/Recency SQL targeting)
Phase 12: Read-only inventory/item availability from tblAvailableSize.OnHandQty
Phase 13: Menu enable/disable overlay (backend MenuOverlay table — no INI_Restaurant database (source of truth) schema changes)
Phase 14: Birthday reward automation (background service + CustomerProfile overlay table)
Phase 15: Verifone/Ingenico bridge integration UI (client provides API docs)

MILESTONE 5 PHASE
Phase 16: Terminal bridge integration (Verifone/Ingenico — BLOCKED until client provides docs)
Phase 17: End-to-end testing across all platforms
Phase 18: Performance tuning against SQL Server 2005 Express constraints
Phase 19: Windows MSI packaging for backend (self-installing — contractual)
