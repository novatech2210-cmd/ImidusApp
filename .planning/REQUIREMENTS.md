# Requirements: IMIDUS Customer Mobile Apps (Milestone 2)

**Defined:** 2026-02-25
**Core Value:** Customers can order from their phones and have orders appear in the POS terminal exactly as if placed at the counter — with payment already posted.

## v1 Requirements

Requirements for Milestone 2 delivery. Each maps to roadmap phases.

### Infrastructure

- [x] **INFRA-01**: Database restored from INI_Restaurant.Bak and accessible via connection string
- [x] **INFRA-02**: API health check returns 200 with database connectivity confirmed
- [x] **INFRA-03**: Entity models aligned to actual INI_Restaurant schema (correct column names/types)
- [x] **INFRA-04**: Backend-only database created for CustomerProfile, idempotency keys, and audit logs (separate from INI_Restaurant database)

### Menu

- [x] **MENU-01**: Menu API returns items from tblItem + tblAvailableSize + tblCategory
- [x] **MENU-02**: Menu items include tax flags (ApplyGST, ApplyPST) and kitchen routing
- [x] **MENU-03**: Mobile app displays menu organized by category with real INI_Restaurant data

### Orders

- [x] **ORD-01**: Order creates ticket in tblSales with TransType=2 (Open)
- [x] **ORD-02**: Order items insert to tblPendingOrders with all required columns
- [x] **ORD-03**: Idempotency key prevents duplicate order creation
- [x] **ORD-04**: Concurrency check validates ticket state before writes
- [x] **ORD-05**: Completed order moves items from tblPendingOrders to tblSalesDetail
- [x] **ORD-06**: Online order registered in tblOnlineOrderCompany and linked via tblSalesOfOnlineOrders
- [x] **ORD-07**: DailyOrderNumber incremented via tblOrderNumber (resets daily, no POS conflicts)
- [x] **ORD-08**: Tax calculated from tblMisc GST/PST rates based on item ApplyGST/ApplyPST flags
- [x] **ORD-09**: Dedicated online CashierID, StationID, and TableID configured for online order identification

### Payments

- [x] **PAY-01**: Authorize.net tokenization captures card without storing card data
- [x] **PAY-02**: Payment posts to tblPayment with card encrypted via dbo.EncryptString()
- [x] **PAY-03**: Order completion updates TransType from 2 to 1
- [x] **PAY-04**: Partial and full payment amounts supported

### Loyalty

- [x] **LOY-01**: Customer lookup by phone/email from tblCustomer
- [x] **LOY-02**: Points balance displayed from tblCustomer.EarnedPoints
- [x] **LOY-03**: Points earned/redeemed via sp_InsertUpdateRewardPointsDetail stored procedure
- [x] **LOY-04**: Points redemption reflected in order total

### Notifications

- [ ] **NOTIF-01**: FCM integration sends transactional push notifications
- [ ] **NOTIF-02**: Order confirmation push sent on successful order creation
- [x] **NOTIF-03**: Order ready push sent when kitchen marks complete

### Mobile

- [x] **MOB-01**: Login/registration connected to backend authentication
- [x] **MOB-02**: Menu screen fetches and displays real INI_Restaurant menu data
- [x] **MOB-03**: Cart and checkout flow creates real orders
- [x] **MOB-04**: Order tracking screen shows order status
- [x] **MOB-05**: Loyalty points balance displayed on profile/home
- [x] **MOB-06**: Imidus branding applied (theme, components from branding package)

### Delivery

- [ ] **DEL-01**: Android APK built via GitHub Actions CI pipeline
- [ ] **DEL-02**: iOS TestFlight build via GitHub Actions (macos runner)
- [ ] **DEL-03**: Test API environment deployed and accessible
- [ ] **DEL-04**: All artifacts uploaded to AWS S3 (s3://inirestaurant/novatech/)

## v2 Requirements

Deferred to future milestones. Tracked but not in current roadmap.

### Web Ordering (Milestone 3)

- [ ] **WEB-01**: Responsive web ordering UI with mobile feature parity (Phase 11)
- [ ] **WEB-02**: Authorize.net payment integration on web (Phase 12)
- [ ] **WEB-03**: Web orders sync to INI_Restaurant database (Phase 13)
- [ ] **WEB-04**: Scheduled/future orders for later pickup (Phase 14)
- [ ] **WEB-05**: Homepage banner carousel with customer segment targeting (Phase 15)
- [ ] **WEB-06**: Rule-based upselling engine (Phase 16)
- [ ] **WEB-07**: Imidus branding applied across web (Phase 17)

### Admin Portal (Milestone 4)

- [ ] **ADMIN-01**: Order management dashboard (Phase 18)
- [ ] **ADMIN-02**: Customer CRM with RFM segmentation (Phase 18)
- [ ] **ADMIN-03**: Push notification campaign builder (Phase 19)
- [ ] **ADMIN-04**: Menu enable/disable overlay (Phase 20)
- [ ] **ADMIN-05**: Birthday reward automation (Phase 21)

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
| ORD-01 | Phase 3 | Complete |
| ORD-02 | Phase 3 | Complete |
| ORD-03 | Phase 3 | Complete |
| ORD-04 | Phase 3 | Complete |
| ORD-05 | Phase 3 | Complete |
| ORD-06 | Phase 3 | Complete |
| ORD-07 | Phase 3 | Complete |
| ORD-08 | Phase 3 | Complete |
| ORD-09 | Phase 3 | Complete |
| PAY-01 | Phase 4 | Complete |
| PAY-02 | Phase 4 | Complete |
| PAY-03 | Phase 4 | Complete |
| PAY-04 | Phase 4 | Complete |
| LOY-01 | Phase 5 | Complete |
| LOY-02 | Phase 5 | Complete |
| LOY-03 | Phase 5 | Complete |
| LOY-04 | Phase 5 | Complete |
| MOB-05 | Phase 5 | Complete |
| NOTIF-01 | Phase 6 | Pending |
| NOTIF-02 | Phase 6 | Pending |
| NOTIF-03 | Phase 6 | Complete |
| MOB-01 | Phase 7 | Complete |
| MOB-03 | Phase 7 | Complete |
| MOB-04 | Phase 7 | Complete |
| MOB-06 | Phase 7 | Complete |
| DEL-01 | Phase 8 | Pending |
| DEL-02 | Phase 8 | Pending |
| DEL-03 | Phase 8 | Pending |
| DEL-04 | Phase 8 | Pending |
| WEB-01 | Phase 11 | Pending |
| WEB-02 | Phase 12 | Pending |
| WEB-03 | Phase 13 | Pending |
| WEB-04 | Phase 14 | Pending |
| WEB-05 | Phase 15 | Pending |
| WEB-06 | Phase 16 | Pending |
| WEB-07 | Phase 17 | Pending |
| ADMIN-01 | Phase 18 | Pending |
| ADMIN-02 | Phase 18 | Pending |
| ADMIN-03 | Phase 19 | Pending |
| ADMIN-04 | Phase 20 | Pending |
| ADMIN-05 | Phase 21 | Pending |

**Coverage:**
- v1 requirements: 29 total (M2 Mobile)
- M3 requirements: 7 total (Web Ordering)
- M4 requirements: 5 total (Admin Portal) — *Phase 18 covers 2, Phases 19-21 TBD*
- Total mapped: 41 (29 + 7 + 5)
- Unmapped: 0

---
*Requirements defined: 2026-02-25*
*Last updated: 2026-02-25 after roadmap creation*
*Updated: 2026-03-08 (added M3-M4 gap closure requirements)*
