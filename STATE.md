# STATE.md - Current Project State

**Last Updated:** March 17, 2026

---

## Running Services

| Service | Port | URL | Status |
|---------|------|-----|--------|
| Backend API | 5004 | http://localhost:5004 | ✅ Running |
| Web App | 3000 | http://localhost:3000 | ✅ Running |
| Admin Portal | 3001 | http://localhost:3001 | ✅ Running |

---

## Build Status

| Component | Build | Runtime | Notes |
|-----------|-------|---------|-------|
| **Backend (.NET 9)** | ✅ PASS | ✅ Running | Upgraded from .NET 8 |
| **Web (Next.js 16)** | ✅ PASS | ✅ Running | 31 routes |
| **Admin (Next.js 14)** | ✅ PASS | ✅ Running | 12 routes |
| **Mobile (RN 0.74)** | ⚠️ APK v2 | ⚠️ APK exists | Last built Mar 5 |

---

## Completed Features

### M1 - Architecture & Setup ✅
- .NET 9 Web API framework
- Dapper repositories for SQL Server
- Entity models for POS tables
- JWT authentication
- Authorize.net integration

### M2 - Mobile Apps ✅
- React Native app with Expo
- Menu browsing
- Cart and checkout
- Order tracking
- Loyalty points display
- Push notifications (FCM)
- APK built (v2, 59MB)

### M3 - Web Platform 🔄
- Next.js 16 responsive design
- Menu display
- Shopping cart
- Checkout flow
- Order tracking
- User authentication
- Banner carousel
- Scheduled ordering
- Upsell rules engine

### M4 - Admin Portal 📅
- Dashboard with KPIs
- Order management
- Customer CRM
- Menu overlay controls
- Push notification campaigns

---

## Known Issues

### Database Connection
- **Status:** Not connected
- **Impact:** API returns 503/500 for most endpoints
- **Solution:** Connect to production SQL Server (INI_Restaurant)

### Mobile App Rebuild
- **Status:** TypeScript errors
- **Impact:** Cannot rebuild APK
- **Errors:** Missing theme colors, typography exports
- **Workaround:** Existing APK v2 works

### Missing Features (M4)
- RFM segmentation queries
- Customer search/filter
- Birthday reward automation background service
- Real-time order updates (SSE/WebSocket)

---

## API Endpoints

| Endpoint | Status | Notes |
|----------|--------|-------|
| GET /api/Sync/status | ✅ | Returns 503 without DB |
| GET /api/Menu/categories | ⚠️ | Returns 500 without DB |
| POST /api/Auth/login | ⚠️ | Requires Idempotency-Key |
| POST /api/Orders/process | ⚠️ | Requires Idempotency-Key |
| GET /api/Customers/lookup | ⚠️ | DI issue - needs fix |

---

## Deployment Status

### Local
- Backend: http://localhost:5004 ✅
- Web: http://localhost:3000 ✅
- Admin: http://localhost:3001 ✅

### Test URLs (Temporary)
- Web: https://foolish-swan-30.loca.lt
- Admin: https://cuddly-bullfrog-25.loca.lt
- API: https://5e1d-105-184-203-108.ngrok-free.app

### AWS S3
- Web: https://inirestaurant.s3.amazonaws.com/novatech/web/
- Admin: https://inirestaurant.s3.amazonaws.com/novatech/admin/

---

## Code Quality

- **Backend Warnings:** 40 (nullable reference types)
- **Backend Errors:** 0 ✅
- **Web Build:** Success ✅
- **Admin Build:** Success ✅

---

## Dependencies

### Backend
- .NET 9.0
- Dapper 2.1+
- AuthorizeNet 2.0.5
- Microsoft.Data.SqlClient

### Frontend
- Next.js 16 / 14
- React 18+
- Tailwind CSS
- TypeScript 5+

### Mobile
- React Native 0.74
- Expo SDK 51
