# PLAN.md - Implementation Plan

**Last Updated:** March 17, 2026

---

## Immediate Priorities (Today)

### 1. Fix API Endpoints
- [x] Create SyncController - DONE
- [ ] Fix IUserRepository DI registration
- [ ] Connect to production SQL Server

### 2. Mobile App Fixes
- [ ] Fix theme colors (gray, goldButton, elevation0, level1-3)
- [ ] Fix typography exports (FontFamily, FontSize, LineHeight)
- [ ] Add Jest type definitions
- [ ] Rebuild APK

### 3. Database Connection
- [ ] Configure production SQL Server connection string
- [ ] Test INI_Restaurant database connectivity
- [ ] Verify all queries work against real schema

---

## M4 - Admin Portal (Scheduled)

### Phase 1: Order Management
- [ ] Order queue with filtering
- [ ] Order detail modal
- [ ] Refund processing
- [ ] Order cancellation with inventory reversal

### Phase 2: Customer CRM
- [ ] Customer list with search
- [ ] RFM segmentation
- [ ] Loyalty points visibility
- [ ] Customer history

### Phase 3: Marketing
- [ ] Push notification campaign builder
- [ ] Audience targeting (Spend/Frequency/Recency)
- [ ] Banner management

### Phase 4: Menu Management
- [ ] Menu enable/disable overlay
- [ ] Read-only inventory display

### Phase 5: Automation
- [ ] Birthday reward background service
- [ ] Scheduled order processing

---

## M5 - Deployment

### Phase 1: Production Build
- [ ] Fix all TypeScript errors
- [ ] Fix all backend warnings
- [ ] Complete test coverage

### Phase 2: Infrastructure
- [ ] Azure App Service setup (Linux)
- [ ] SQL Server production connection
- [ ] AWS S3 configuration

### Phase 3: CI/CD
- [ ] GitHub Actions for iOS builds
- [ ] GitHub Actions for Android builds
- [ ] Automated deployment scripts

### Phase 4: Terminal Integration
- [ ] Verifone/Ingenico bridge integration
- [ ] Payment terminal sync

---

## Technical Debt

### Backend
- [ ] Remove duplicate CreateOrderRequest classes
- [ ] Add proper null handling
- [ ] Improve error messages
- [ ] Add logging throughout

### Frontend
- [ ] Fix all ESLint warnings
- [ ] Replace img tags with Next/Image
- [ ] Add loading states
- [ ] Improve error handling

### Mobile
- [ ] Fix all TypeScript errors
- [ ] Update theme system
- [ ] Add offline support

---

## Testing Plan

### Unit Tests
- [ ] Backend service layer
- [ ] Repository queries
- [ ] API controllers

### Integration Tests
- [ ] Database connectivity
- [ ] Order flow end-to-end
- [ ] Payment processing

### E2E Tests
- [ ] User registration flow
- [ ] Menu to checkout
- [ ] Order tracking

---

## Timeline

| Week | Focus | Deliverable |
|------|-------|-------------|
| 1 | Fix API/Database | All endpoints working |
| 2 | Mobile APK fix | Rebuild and test |
| 3-4 | M4 Admin Portal | Full admin features |
| 5-6 | M5 Deployment | Production ready |

---

## Blockers

1. **Production SQL Server** - Need connection details
2. **INI_Restaurant.Bak** - For schema verification
3. **Terminal Bridge API Docs** - From client
4. **Firebase Admin Key** - For push notifications
