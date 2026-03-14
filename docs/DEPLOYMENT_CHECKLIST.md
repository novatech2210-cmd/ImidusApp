# Milestone 3 - Deployment Readiness Checklist

## ✅ READY FOR DEPLOYMENT

**Date:** 2026-03-05  
**Milestone:** M3 Customer Web Platform  
**Value:** $1,200

---

## Pre-Deployment Verification

### 1. Code Quality ✅

- [x] Frontend builds successfully (13 pages, 0 errors)
- [x] Backend builds successfully (0 errors, 6 nullable warnings)
- [x] No TypeScript errors in web app
- [x] No compilation errors in backend
- [x] All API endpoints registered

### 2. SSOT Compliance ✅

- [x] Read from POS anytime - Verified
- [x] Write to POS only via backend - Verified
- [x] Never modify POS schema - Verified
- [x] Never modify POS code - Verified
- [x] Overlay data in IntegrationService - Verified

### 3. Feature Completeness ✅

#### Core Features:
- [x] Homepage Banner Carousel with customer segments
- [x] Menu system with categories and items
- [x] Item detail page with size selection
- [x] Shopping cart with LocalStorage
- [x] Checkout flow with customer info
- [x] Authorize.net Accept.js payment
- [x] Order confirmation page
- [x] Order history with API integration
- [x] Real-time sync indicator

#### Advanced Features:
- [x] Scheduled orders (future pickup)
- [x] Rule-based upselling engine
- [x] Background scheduled order release service
- [x] Idempotency protection
- [x] Print receipt functionality

### 4. Security ✅

- [x] PCI-DSS compliance via Accept.js
- [x] No raw card data on server
- [x] Atomic database transactions
- [x] Idempotency keys for duplicate prevention
- [x] Dapper parameterized queries (SQL injection safe)

### 5. Documentation ✅

- [x] README.md
- [x] SSOT Architecture Guide
- [x] Authorize.net Testing Report
- [x] Order Pages Implementation
- [x] Real-time Sync Documentation
- [x] Milestone 3 Verification (this document)

---

## Deployment Steps

### Phase 1: Frontend (S3)

```bash
# 1. Build production bundle
cd /home/kali/Desktop/TOAST/src/web
npm run build

# 2. Verify build output
ls -la dist/

# 3. Deploy to S3
aws s3 sync dist/ s3://inirestaurant/novatech/web/ \
  --delete \
  --cache-control "max-age=31536000,immutable"

# 4. Verify deployment
aws s3 ls s3://inirestaurant/novatech/web/
```

### Phase 2: Backend (Windows Service MSI)

```bash
# 1. Build self-contained Windows executable
cd /home/kali/Desktop/TOAST/src/backend
dotnet publish IntegrationService.API/IntegrationService.API.csproj \
  -c Release \
  -r win-x64 \
  --self-contained true \
  -p:PublishSingleFile=true \
  -p:IncludeNativeLibrariesForSelfExtract=true \
  -o ./publish

# 2. Create MSI installer (requires WiX Toolset on Windows)
# Or use existing MSI build process

# 3. Sign the MSI (if code signing cert available)
# signtool sign /f certificate.pfx /p password /t http://timestamp.digicert.com IntegrationService.API.msi
```

### Phase 3: Configuration

#### Frontend Environment:
```bash
# .env.production
NEXT_PUBLIC_API_URL=https://api.imidus.com/api
NEXT_PUBLIC_AUTH_TOKEN_KEY=imidus_auth_token
```

#### Backend Configuration:
```json
// appsettings.Production.json
{
  "ConnectionStrings": {
    "PosConnection": "Server=POS_SERVER;Database=INI_Restaurant;User=...;Password=...;",
    "IntegrationConnection": "Server=DB_SERVER;Database=IntegrationService;..."
  },
  "AuthorizeNet": {
    "ApiLoginId": "PRODUCTION_LOGIN_ID",
    "TransactionKey": "PRODUCTION_TRANSACTION_KEY",
    "IsSandbox": false
  },
  "Cors": {
    "AllowedOrigins": ["https://imidus.com", "https://www.imidus.com"]
  }
}
```

---

## Post-Deployment Verification

### 1. Health Checks

```bash
# Test API health
curl https://api.imidus.com/api/Health/live

# Test sync status
curl https://api.imidus.com/api/Sync/status

# Test menu endpoint
curl https://api.imidus.com/api/Menu/categories
```

### 2. End-to-End Test

1. Open https://imidus.com
2. Navigate to Menu
3. Select item, add to cart
4. Proceed to checkout
5. Enter test card: 4111111111111111 (sandbox) or real card (production)
6. Complete order
7. Verify order appears in confirmation page
8. Check order history
9. Verify order in POS database (if accessible)

### 3. Monitoring Setup

- [ ] Application Insights / CloudWatch configured
- [ ] Error logging (Sentry) enabled
- [ ] Database performance monitoring
- [ ] API response time alerts
- [ ] POS connectivity alerts

---

## Rollback Plan

### Frontend Rollback:
```bash
# Restore previous version from S3 backup
aws s3 sync s3://inirestaurant/novatech/web-backup/ s3://inirestaurant/novatech/web/
```

### Backend Rollback:
1. Stop IntegrationService Windows Service
2. Restore previous MSI backup
3. Install previous version
4. Restart service

---

## Milestone Acceptance Criteria

| Criteria | Status | Evidence |
|----------|--------|----------|
| Responsive web ordering UI | ✅ | 13 pages, mobile-first design |
| Authorize.net payment integration | ✅ | Accept.js tokenization implemented |
| POS ticket sync | ✅ | Writes to tblSales/tblSalesDetail |
| Future scheduled ordering | ✅ | ScheduledOrders table + background service |
| Rule-based upselling | ✅ | MarketingRules table, deterministic logic |
| Branding integration | ✅ | IMIDUSAPP theme applied |
| SSOT compliance | ✅ | Full documentation |

---

## Sign-Off

**Developer:** Chris (Novatech Build Team)  
**Date:** 2026-03-05  
**Status:** ✅ **READY FOR CLIENT ACCEPTANCE**

**Pending:**
- Client review and acceptance
- S3 deployment execution
- Windows Service MSI installation

---

**Document Version:** 1.0  
**Classification:** Internal - Deployment Ready
