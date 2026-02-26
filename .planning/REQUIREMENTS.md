# Requirements: IMIDUS Customer Mobile Apps (Milestone 2)

**Defined:** 2026-02-25
**Core Value:** Customers can order from their phones and have orders appear in the POS terminal exactly as if placed at the counter — with payment already posted.

## v1 Requirements

Requirements for Milestone 2 delivery. Each maps to roadmap phases.

### Infrastructure

- [x] **INFRA-01**: Database restored from INI_Restaruant.Bak and accessible via connection string
- [x] **INFRA-02**: API health check returns 200 with database connectivity confirmed
- [x] **INFRA-03**: Entity models aligned to actual POS schema (correct column names/types)
- [x] **INFRA-04**: Backend-only database created for CustomerProfile, idempotency keys, and audit logs (separate from POS DB)

### Menu

- [x] **MENU-01**: Menu API returns items from tblItem + tblAvailableSize + tblCategory
- [x] **MENU-02**: Menu items include tax flags (ApplyGST, ApplyPST) and kitchen routing
- [x] **MENU-03**: Mobile app displays menu organized by category with real POS data

### Orders

- [ ] **ORD-01**: Order creates ticket in tblSales with TransType=2 (Open)
- [ ] **ORD-02**: Order items insert to tblPendingOrders with all required columns
- [x] **ORD-03**: Idempotency key prevents duplicate order creation
- [x] **ORD-04**: Concurrency check validates ticket state before writes
- [ ] **ORD-05**: Completed order moves items from tblPendingOrders to tblSalesDetail
- [x] **ORD-06**: Online order registered in tblOnlineOrderCompany and linked via tblSalesOfOnlineOrders
- [ ] **ORD-07**: DailyOrderNumber incremented via tblOrderNumber (resets daily, no POS conflicts)
- [ ] **ORD-08**: Tax calculated from tblMisc GST/PST rates based on item ApplyGST/ApplyPST flags
- [ ] **ORD-09**: Dedicated online CashierID, StationID, and TableID configured for online order identification

### Payments

- [ ] **PAY-01**: Authorize.net tokenization captures card without storing card data
- [ ] **PAY-02**: Payment posts to tblPayment with card encrypted via dbo.EncryptString()
- [ ] **PAY-03**: Order completion updates TransType from 2 to 1
- [ ] **PAY-04**: Partial and full payment amounts supported

### Loyalty

- [ ] **LOY-01**: Customer lookup by phone/email from tblCustomer
- [ ] **LOY-02**: Points balance displayed from tblCustomer.EarnedPoints
- [ ] **LOY-03**: Points earned/redeemed via sp_InsertUpdateRewardPointsDetail stored procedure
- [ ] **LOY-04**: Points redemption reflected in order total

### Notifications

- [ ] **NOTIF-01**: FCM integration sends transactional push notifications
- [ ] **NOTIF-02**: Order confirmation push sent on successful order creation
- [ ] **NOTIF-03**: Order ready push sent when kitchen marks complete

### Mobile

- [ ] **MOB-01**: Login/registration connected to backend authentication
- [x] **MOB-02**: Menu screen fetches and displays real POS menu data
- [ ] **MOB-03**: Cart and checkout flow creates real orders
- [ ] **MOB-04**: Order tracking screen shows order status
- [ ] **MOB-05**: Loyalty points balance displayed on profile/home
- [ ] **MOB-06**: Imidus branding applied (theme, components from branding package)

### Delivery

- [ ] **DEL-01**: Android APK built via GitHub Actions CI pipeline
- [ ] **DEL-02**: iOS TestFlight build via GitHub Actions (macos runner)
- [ ] **DEL-03**: Test API environment deployed and accessible
- [ ] **DEL-04**: All artifacts uploaded to AWS S3 (s3://inirestaurant/novatech/)

## v2 Requirements

Deferred to future milestones. Tracked but not in current roadmap.

### Web Ordering (Milestone 3)

- **WEB-01**: Responsive web ordering UI with mobile feature parity
- **WEB-02**: Homepage banner carousel with customer segment targeting
- **WEB-03**: Scheduled/future orders (order now, pickup later)
- **WEB-04**: Rule-based upselling engine

### Admin Portal (Milestone 4)

- **ADMIN-01**: Order management dashboard
- **ADMIN-02**: Customer CRM with RFM segmentation
- **ADMIN-03**: Push notification campaign builder
- **ADMIN-04**: Menu enable/disable overlay
- **ADMIN-05**: Birthday reward automation

### Deployment (Milestone 5)

- **DEPLOY-01**: Windows MSI packaging for backend
- **DEPLOY-02**: Terminal bridge integration (Verifone/Ingenico)
- **DEPLOY-03**: Production deployment and app store submissions

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| POS schema modifications | Contractually prohibited |
| POS source code changes | Source not available |
| Real-time WebSocket updates | Polling acceptable for v1 |
| AI recommendation engine | Rule-based upselling only (M3) |
| Multi-location support | Single restaurant for v1 |
| Full inventory management | Read-only availability display |
| Marketing push campaigns | M4 deliverable (transactional only in M2) |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 | Phase 1 | Complete |
| INFRA-02 | Phase 1 | Pending |
| INFRA-03 | Phase 1 | Pending |
| INFRA-04 | Phase 1 | Complete |
| MENU-01 | Phase 2 | Complete |
| MENU-02 | Phase 2 | Complete |
| MENU-03 | Phase 2 | Complete |
| MOB-02 | Phase 2 | Complete |
| ORD-01 | Phase 3 | Pending |
| ORD-02 | Phase 3 | Pending |
| ORD-03 | Phase 3 | Complete |
| ORD-04 | Phase 3 | Complete |
| ORD-05 | Phase 3 | Pending |
| ORD-06 | Phase 3 | Complete |
| ORD-07 | Phase 3 | Pending |
| ORD-08 | Phase 3 | Pending |
| ORD-09 | Phase 3 | Pending |
| PAY-01 | Phase 4 | Pending |
| PAY-02 | Phase 4 | Pending |
| PAY-03 | Phase 4 | Pending |
| PAY-04 | Phase 4 | Pending |
| LOY-01 | Phase 5 | Pending |
| LOY-02 | Phase 5 | Pending |
| LOY-03 | Phase 5 | Pending |
| LOY-04 | Phase 5 | Pending |
| MOB-05 | Phase 5 | Pending |
| NOTIF-01 | Phase 6 | Pending |
| NOTIF-02 | Phase 6 | Pending |
| NOTIF-03 | Phase 6 | Pending |
| MOB-01 | Phase 7 | Pending |
| MOB-03 | Phase 7 | Pending |
| MOB-04 | Phase 7 | Pending |
| MOB-06 | Phase 7 | Pending |
| DEL-01 | Phase 8 | Pending |
| DEL-02 | Phase 8 | Pending |
| DEL-03 | Phase 8 | Pending |
| DEL-04 | Phase 8 | Pending |

**Coverage:**
- v1 requirements: 29 total
- Mapped to phases: 29
- Unmapped: 0

---
*Requirements defined: 2026-02-25*
*Last updated: 2026-02-25 after roadmap creation*
