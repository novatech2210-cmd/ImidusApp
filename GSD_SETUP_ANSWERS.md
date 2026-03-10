# GSD Setup Answers — IMIDUS POS Integration Project

Copy/paste these when GSD asks its questions during `/gsd:new-project`.

---

## PROJECT DESCRIPTION / WHAT ARE YOU BUILDING?

```
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
```

---

## WHAT PROBLEM DOES IT SOLVE?

```
The restaurant currently runs everything through the INI POS terminal at the counter.
There's no online ordering, no mobile app, no web presence for taking orders.

This platform enables:
- Customers to order from their phones or the web
- Orders to appear directly in the POS system as if placed at the terminal
- Payments via Authorize.net that post back to POS system tickets
- Restaurant owner to manage orders, run marketing campaigns, and view analytics
- Loyalty points to work across in-store and online channels
```

---

## TECH STACK

```
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
```

---

## DATABASE DETAILS

```
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
```

---

## CONSTRAINTS / NON-NEGOTIABLES

```
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
```

---

## USERS / PERSONAS

```
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
```

---

## V1 REQUIREMENTS (Must-Have — Current Scope)

```
MOBILE APPS (Milestone 2 — $1,800) ✅ COMPLETE:
- Menu browsing with INI_Restaurant database (source of truth) data (tblItem + tblAvailableSize + tblCategory)
- Cart and order placement (writes to tblSales + tblPendingOrders)
- Authorize.net payment with tokenization
- Order status tracking (read tblSales.TransType)
- Loyalty points display and redemption (tblCustomer.EarnedPoints + tblPointsDetail)
- Push notifications — transactional (order updates) AND marketing campaigns
- Customer account management

WEB ORDERING (Milestone 3 — $1,200) 🔵 CURRENT FOCUS:
- Full feature parity with mobile apps
- Responsive web interface
- Homepage banner carousel (with targeting by customer segment)
- Scheduled/future orders (order now, pickup later)
- Basic cross-sell/upsell ("add a drink?")

ADMIN PORTAL (Milestone 4 — $1,000) 📋 SCHEDULED:
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
```

---

## V2 / NICE-TO-HAVE (Out of Current Scope)

```
- Distance/location-based customer targeting (geofencing)
- Advanced recommendation engine (beyond basic upsell rules)
- Multi-location support
- Full inventory management (current scope is read-only visibility)
- Writing menu changes back to POS (current scope is overlay only)
- Clover integration changes (stays unchanged per SOW)
- Real-time WebSocket order updates (polling is fine for v1)
```

---

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

## MILESTONE STRUCTURE (Map GSD phases to these)

```
Per Master Project Document (Feb 25, 2026) — authoritative source:

Milestone 1: Architecture & Setup — $800 ✅ COMPLETE (Jan 27 - Feb 3)
Milestone 2: Customer Mobile Apps (iOS & Android) — $1,800 ✅ COMPLETE (Feb 3 - Feb 17)
Milestone 3: Customer Web Ordering Platform — $1,200 🔵 IN PROGRESS (Feb 18 - Mar 3)
Milestone 4: Merchant / Admin Portal — $1,000 📋 SCHEDULED (Mar 4 - Mar 10)
Milestone 5: Terminal/Bridge Integration, QA & Deployment — $1,200 ⏳ PENDING DOCS (Mar 11 - Mar 17)

Total: $6,000 | Freelancer commission: $900 | Net: $5,100
Timeline: Jan 27 - Mar 17, 2026
Delivery: AWS S3 s3://inirestaurant/novatech/ (us-east-1) — ONLY authoritative channel
```

---

## SUGGESTED GSD PHASE MAPPING

```
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

MILESTONE 5 PHASES (Terminal/Bridge, QA & Deployment, $1,200):
Phase 16: Terminal bridge integration (Verifone/Ingenico — BLOCKED until client provides docs)
Phase 17: End-to-end testing across all platforms
Phase 18: Performance tuning against SQL Server 2005 Express constraints
Phase 19: Windows MSI packaging for backend (self-installing — contractual)
Phase 20: Production deployment + app store submissions + documentation handover
```

---

## CLIENT CREDENTIALS (Reference Only — Don't Paste Into GSD)

```
AWS S3: Bucket inirestaurant, path /novatech/, region us-east-1
Authorize.net: API Login ID 9JQVwben66U7
Apple/Google: Invites sent to novatech2210@gmail.com
Client: Sung Bin Im — IMIDUS Technologies (Freelancer: @vw8257308vw)
```

---

## IMPORTANT CONTEXT FOR GSD

```
When GSD researches, it should know:
- INI POS v14.06.11 is a Canadian POS system (GST/PST tax system, Canadian penny rounding)
- The spws_ prefixed stored procedures indicate INI POS system has existing web service hooks
- tblOnlineOrderCompany already exists — we register as a new online order company
- The POS system already handles online orders from platforms like UberEats/SkipTheDishes
- dbo.EncryptString() is a custom SQL function for card number encryption
- tblPendingOrders has 20+ columns — ALL must be populated correctly on insert
- The POS system uses PersonIndex for split bills (separate checks per guest at same table)
- Kitchen routing uses KitchenB (back/kitchen), KitchenF (front/bar), Bar flags
- DailyOrderNumber auto-increments per day and resets
```

---

## MASTER PROJECT DOCUMENT (Authoritative Reference)

```
The file Imidus_POS_MasterProjectDocument.docx is the SINGLE AUTHORITATIVE REFERENCE
for this project. It supersedes all previous chat messages, individual documents, and
informal scope discussions. Key sections:

DOCUMENT AUTHORITY:
- Prepared Feb 25, 2026 from INI_Restaurant.Bak, approved proposal, and all client comms
- Supersedes all prior scope documents, chat messages, and feature outlines

WHAT IS NOT IN SCOPE (explicitly excluded):
- POS source code modifications of any kind
- SQL Server schema changes (no new tables added to INI_Restaurant database (source of truth))
- Building the Verifone/Ingenico terminal bridge (client-provided)
- Clover terminal — remains POS system-initiated, unchanged
- Stock count / inventory management (read-only availability display only)
- Advanced AI-based recommendation engine (rule-based upselling only)

BACKEND-ONLY TABLES (Per Master Doc — created in SEPARATE backend database, NOT INI_Restaurant):
- CustomerProfile — Overlay for INI_Restaurant database (source of truth) tblCustomer: birthday, FCM token, app login
  credentials, email address (INI_Restaurant database (source of truth) tblCustomer doesn't store these)
- MarketingRules — Upselling rules (If ItemID=Burger, suggest ItemID=Fries).
  Configurable in Admin Portal
- ScheduledOrders — Holds scheduled future orders until prep-time injection into INI_Restaurant database (source of truth)
  (e.g., order at 10AM for 6PM pickup, released at 5:30PM)
- tblPushNotifications — Push campaign records, target criteria, delivery statistics,
  notification history
- MenuOverlay — Online enable/disable flags for items and categories. Overrides INI_Restaurant database (source of truth)
  display without touching INI_Restaurant database (source of truth) tables

CRITICAL: These tables do NOT go into INI_Restaurant.Bak / INI_Restaurant database (logical name: TPPro).
They live in a separate IntegrationService database alongside idempotency keys
and audit logs.

MILESTONE ACCEPTANCE CRITERIA (all must be satisfied):
1. All functionality listed for that milestone is implemented and demonstrable
2. Orders and payments appear correctly in INI_Restaurant database (source of truth) tables using correct lifecycle
3. Authorize.net and/or bridge flows produce consistent, auditable outcomes
4. No INI_Restaurant database (source of truth) schema changes; all writes are transaction-safe and stable
5. Deliverables uploaded to AWS S3 (s3://inirestaurant/novatech/)
6. Client review completed and written acceptance provided

Note: GitHub and Freelancer uploads do NOT constitute milestone completion.
Only AWS S3 uploads count.

SAFETY PROTOCOLS (Contractually Binding):
- Idempotency: Unique key per write, check before executing
- Concurrency: Ticket state re-validation immediately before write
- Transaction Safety: All multi-table writes in SQL transactions, rollback on failure
- Audit Logging: Every action logged with timestamp, type, params, result

CUSTOMER TARGETING (Push + Banners):
- Admin Portal builds SQL queries against INI_Restaurant database (source of truth) at send-time
- RFM targeting: Spend > $X, Frequency > N visits, Recency < N days
- Birthday targeting from tblCustomer birth date fields
- Segments stored in backend DB, recipient lists generated dynamically

BINDING TECHNICAL COMMITMENTS:
- Backend: Self-Installing Windows MSI
- Mobile: Push-button CI pipelines
- Web: Single Scripted Deployment
- Safety: Idempotency Keys + Ticket State Re-validation
- Schema: $6,000 includes full legacy schema mapping
- No POS system modifications: database-only integration
```

---

## BRANDING & DESIGN SYSTEM

```
A complete branding package exists at: imidus-branding.zip
This includes drop-in theme files, logo assets, UI components, and backend constants
for ALL platforms. GSD should enforce these brand tokens across every phase.

BRAND IDENTITY:
- Company: Imidus Technologies Inc.
- App Name: IMIDUSAPP
- Tagline: "Order · Track · Earn"
- Support Email: support@imidus.com

COLOR PALETTE:
- Brand Blue:    #1E5AA8  (nav bar, buttons, headings, splash background)
- Brand Gold:    #D4AF37  (CTA, prices, loyalty points, active tabs)
- Dark BG:       #1A1A2E  (splash overlay, modal backdrop, sidebar)
- White:         #FFFFFF  (card backgrounds, input fields)
- Light Blue:    #D6E4F7  (alternate rows, info cards, secondary button bg)
- Light Gold:    #FDF6E3  (loyalty/rewards surfaces, birthday offer cards)
- Light Gray:    #F5F5F5  (list item bg, dividers, disabled fills)
- Mid Gray:      #DDDDDD  (input borders, card separators)
- Error:         #C62828  (failed payments, out-of-stock, form errors)
- Success:       #2E7D32  (order confirmed, payment success, loyalty earned)
- Warning:       #E65100  (pending, low stock, caution notices)

TYPOGRAPHY:
- System fonts (iOS/Android defaults) for body text
- Georgia font ONLY for "IMIDUSAPP" wordmark display
- Courier New for order numbers and monospaced price contexts
- Headings: Bold, Brand Blue color
- Prices: Bold, Brand Gold color
- Points balance: 40px bold Brand Gold

LOGO ASSETS (7 variants):
- imidus_logo_white.png — White logo for dark backgrounds
- imidus_logo_blue_gradient.png — Blue gradient banner logo
- imidus_logo_pen_colored.png — Full color wordmark
- logo_imidus_alt.png — Compact alternate logo
- logo_imidus_triangle.png — Triangle mark
- app-icon-512.png — App store icon (512x512)
- splash.png — Splash screen artwork

LOGO LOCATIONS ON S3:
- Bucket: inirestaurant (us-east-1)
- Path: /novatech/assets/{filename}
- Used in emails, push notifications, and PDF receipts

PLATFORM FILES PROVIDED:

React Native Mobile:
- src/theme/colors.ts — Complete color system (import { Colors } from '@/theme')
- src/theme/typography.ts — Font scale + pre-built TextStyles
- src/theme/spacing.ts — Spacing scale, border radius, shadows, layout helpers
- src/components/common/LoginScreen.tsx — Branded login screen
- src/components/common/ImidusHeader.tsx — Branded navigation header
- src/components/common/LoyaltyCard.tsx — Loyalty points display card
- android/res/values/colors.xml — Android color resources
- android/res/values/styles.xml — Android theme with splash
- android/res/drawable/splash_background.xml — Splash screen drawable
- ios/LaunchScreen.storyboard — iOS launch screen

Next.js Web + Admin:
- src/styles/globals.css — CSS custom properties matching mobile colors
- src/components/layout/SiteHeader.tsx — Branded website header
- src/components/layout/SiteHeader.module.css — Header styles
- src/components/layout/SiteFooter.tsx — Branded website footer
- admin/src/components/layout/AdminSidebar.tsx — Admin portal sidebar

Backend .NET:
- ImidusConstants.cs — Brand constants (colors, S3 paths, FCM config, company info)
- BaseEmailTemplate.html — Branded email template with {{PLACEHOLDERS}}

FCM PUSH NOTIFICATION CONFIG:
- Channel ID: imidus_notifications
- Channel Name: Imidus Notifications
- Notification accent color: #D4AF37 (Brand Gold)
- Small icon name: ic_imidus_notify (Android drawable)
- Title prefix: "IMIDUS | " (e.g., "IMIDUS | Your order is ready")

DESIGN RULES FOR GSD:
- NEVER hardcode colors — always reference theme tokens
- Prices always use Brand Gold (#D4AF37), bold weight
- Primary buttons: Brand Blue background, white text
- CTA/gold buttons: Brand Gold background, dark text
- Card shadows use brand blue tint: rgba(30, 90, 168, 0.12)
- Loyalty surfaces use Light Gold bg with Brand Gold border
- Status badges: colored pill with uppercase text
- Input focus: Brand Blue border + blue glow ring
- Links: Brand Blue default, Brand Gold on hover
```

---

## OUTSTANDING CLIENT INPUTS (Per Master Doc)

```
BLOCKING:
- POS system Ticket Lifecycle Rules — TransType values, ticket status definitions,
  and tender type mappings for tblSales and tblPayment
  (We've reverse-engineered these from the .bak but need client CONFIRMATION)

NEEDED FOR M5:
- Terminal Bridge API Docs — Verifone/Ingenico bridge endpoint URL, protocol
  (HTTP/TCP), request/response format, and test access
- Production SQL Server Credentials — Host, Username, Password for the local
  SQL Server instance hosting INI_Restaurant database (logical name: TPPro)

RECEIVED:
- Authorize.net Credentials ✅ (API Login 9JQVwben66U7 + keys)
- App Store Accounts ✅ (invited novatech2210@gmail.com Feb 6)
- Branding Assets ✅ (imidus-branding.zip received Jan 28, updated Feb 25)
- Store Rules (Partial) ✅ — Tax rates visible in DB, operating hours TBD
```

---

## DOCUMENT AUTHORITY HIERARCHY (Per Master Doc Section 7.2)

```
AUTHORITATIVE SOURCES (supersede all else):
1. Imidus_POS_MasterProjectDocument.docx (this master doc)
2. INI_Restaurant.Bak (INI_Restaurant database (source of truth) schema — single source of truth)
3. TECHNICAL_SCOPE_FINAL.md (Feb 3, 2026)
4. Novatech Proposal PDF (Jan 25, 2026 — approved Jan 27)

INFORMATIONAL ONLY (NOT binding):
- Chat messages on Freelancer platform
- GitHub repository uploads
- Freelancer file uploads (not AWS S3)
- Verbal/informal scope discussions

Tell GSD: When there's a conflict between documents, the Master Project
Document wins. When there's a conflict between the Master Doc and the
actual database schema, the database schema wins (it's the ground truth).
```

---

## BRANDING INSTALLATION PATHS (For GSD Execution)

```
When GSD executes branding phases, use these exact copy paths:

MOBILE (React Native — src/mobile/ImidusCustomerApp/):
  imidus-branding/mobile/src/theme/           → src/theme/
  imidus-branding/mobile/src/assets/images/   → src/assets/images/
  imidus-branding/mobile/src/components/      → src/components/common/
  imidus-branding/mobile/android/             → android/app/src/main/res/
  imidus-branding/mobile/ios/                 → ios/ImidusCustomerApp/

WEB ORDERING (Next.js — src/web/imidus-ordering/):
  imidus-branding/web/public/images/          → public/images/
  imidus-branding/web/src/styles/globals.css  → src/styles/globals.css
  imidus-branding/web/src/components/layout/  → src/components/layout/

ADMIN PORTAL (Next.js — src/web/imidus-admin/):
  imidus-branding/admin/public/images/        → public/images/
  imidus-branding/admin/src/components/       → src/components/layout/

BACKEND (.NET — src/backend/IntegrationService.API/):
  imidus-branding/backend/ImidusConstants.cs  → Constants/ImidusConstants.cs
  imidus-branding/backend/BaseEmailTemplate.html → Templates/Email/BaseEmailTemplate.html

POST-INSTALL:
- Add @/theme path alias in mobile tsconfig.json / babel.config.js
- Import globals.css in Next.js _app.tsx or layout.tsx
- Set Android splash theme in AndroidManifest.xml
- Generate app icons from app-icon-512.png for both platforms
- Upload logo PNGs to S3: s3://inirestaurant/novatech/assets/
```

---

## FILES TO PROVIDE GSD (Point it at these)

```
Place these in the TOAST project root for GSD to reference:

~/Desktop/TOAST/
├── INI_Restaurant.Bak                    — INI_Restaurant database (source of truth) backup (source of truth)
├── Imidus_POS_MasterProjectDocument.docx — Master project document (authoritative)
├── GSD_SETUP_ANSWERS.md                  — This file (setup reference)
├── imidus-branding/                      — Extracted branding package
│   ├── INSTALL.md                        — Branding installation guide
│   ├── mobile/                           — RN theme + components + assets
│   ├── web/                              — Next.js styles + layout components
│   ├── admin/                            — Admin portal sidebar + assets
│   └── backend/                          — .NET constants + email template
└── docs/
    ├── Client_Communication.md           — Full client chat history
    └── INIRestaurantManual.pdf           — POS system user manual (31 pages)
```
