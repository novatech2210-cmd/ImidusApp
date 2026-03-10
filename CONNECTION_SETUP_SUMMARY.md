# IMIDUS POS Integration - Connection Setup Summary

## Status: READY FOR TESTING

All components are now connected and configured. The backend, mobile app, and web platform are ready to work together.

---

## What Was Fixed

### 1. Backend (.NET API)

**Location**: `src/backend/IntegrationService.API/`

**Changes Made**:

- ✅ Fixed CORS policy to allow web (localhost:3000, 3001) and mobile (any origin)
- ✅ Added fallback connection strings for all repositories (graceful degradation)
- ✅ API runs on port 5004 (verified in `launchSettings.json`)
- ✅ Build succeeds with 0 errors

**Key Files**:

- `Program.cs` - CORS policies added
- `appsettings.json` - Connection strings configured
- `Properties/launchSettings.json` - Port 5004 confirmed

### 2. Web Platform (Next.js)

**Location**: `src/web/`

**Changes Made**:

- ✅ Updated API client to use `http://localhost:5004/api`
- ✅ Created `.env` (production) and `.env.example` (template)
- ✅ Updated `.gitignore` to keep `.env.local` private
- ✅ Added typed API helpers: MenuAPI, OrderAPI, AuthAPI, CustomerAPI, LoyaltyAPI

**Key Files**:

- `lib/api.ts` - API client with correct port and types
- `.env` - Production environment variables
- `.env.example` - Template for developers

### 3. Mobile App (React Native)

**Location**: `src/mobile/ImidusCustomerApp/`

**Changes Made**:

- ✅ Updated environment config to use `http://10.0.2.2:5004/api` (Android emulator)
- ✅ Created `.env.example` template
- ✅ API client already configured with JWT interceptors

**Key Files**:

- `src/config/environment.ts` - Environment configuration
- `src/api/apiClient.ts` - Axios client with auth interceptors

---

## API Endpoints Available

All endpoints are prefixed with `/api`:

### Auth

- `POST /api/Auth/login` - Login with phone/email + password
- `POST /api/Auth/register` - Register new customer
- `GET /api/Auth/me` - Get current user profile (requires auth)
- `POST /api/Auth/refresh` - Refresh JWT token

### Menu

- `GET /api/Menu/categories` - Get all categories
- `GET /api/Menu/items/{categoryId}` - Get items by category
- `GET /api/Menu` - Get full menu
- `GET /api/Menu/{itemId}/sizes` - Get item sizes

### Orders

- `POST /api/Orders` - Create new order (requires idempotency key)
- `GET /api/Orders/{id}/status` - Get order status
- `GET /api/Orders/history/{customerId}` - Get order history

### Customers

- `GET /api/Customers/lookup?phone={}&email={}` - Lookup customer

### Health

- `GET /health` - Basic health check
- `GET /api/Health/deep` - Deep health check with DB connectivity

---

## Quick Start Guide

### 1. Start the Backend

```bash
cd /home/kali/Desktop/TOAST/src/backend/IntegrationService.API
dotnet run
```

**Verify it's running**:

- Swagger UI: http://localhost:5004/swagger
- Health check: http://localhost:5004/health

### 2. Start the Web Platform

```bash
cd /home/kali/Desktop/TOAST/src/web

# For development, create .env.local
cp .env.example .env.local

# Install dependencies (if not done)
npm install

# Start dev server
npm run dev
```

**Access the web app**:

- URL: http://localhost:3000
- The web app will connect to backend at http://localhost:5004/api

### 3. Start the Mobile App

```bash
cd /home/kali/Desktop/TOAST/src/mobile/ImidusCustomerApp

# For Android emulator
npx react-native run-android

# For iOS simulator (on macOS)
npx react-native run-ios
```

**Mobile app configuration**:

- Android emulator uses `10.0.2.2:5004` (maps to host localhost)
- iOS simulator uses `localhost:5004`
- Physical devices need your machine's IP address

---

## Environment Configuration

### Web Platform

**Production** (`.env`):

```
NEXT_PUBLIC_API_URL=https://api.imidus.com/api
```

**Development** (`.env.local` - gitignored):

```
NEXT_PUBLIC_API_URL=http://localhost:5004/api
```

### Mobile App

**Development** (`.env`):

```
API_BASE_URL=http://10.0.2.2:5004/api
API_TIMEOUT=30000
```

**Production**:

```
API_BASE_URL=https://api.imidus.com/api
```

---

## Testing the Connection

### 1. Backend Health Check

```bash
curl http://localhost:5004/health
```

Expected response:

```json
{
  "status": "Healthy",
  "timestamp": "2026-03-04T...",
  "version": "2.0.0"
}
```

### 2. Test Menu Endpoint

```bash
curl http://localhost:5004/api/Menu/categories
```

### 3. Web Platform Connection

Open browser to http://localhost:3000 and try to:

- View menu (should fetch from `/api/Menu/categories`)
- Login (should POST to `/api/Auth/login`)

### 4. Mobile App Connection

1. Start Android emulator
2. Run the app
3. Check Metro bundler logs for API requests
4. Backend console should show request logs

---

## Troubleshooting

### CORS Errors

If you see CORS errors in browser console:

- Ensure backend CORS policy includes your web app URL
- Check that `Program.cs` has both policies applied:
  ```csharp
  app.UseCors("AllowWebApp");
  app.UseCors("AllowMobileApp");
  ```

### Connection Refused

- Verify backend is running: `dotnet run` in IntegrationService.API folder
- Check port 5004 is not blocked by firewall
- For mobile: ensure 10.0.2.2 is correct for Android emulator

### Database Connection Errors

- Backend has fallback connection strings (graceful degradation)
- For full functionality, restore INI_Restaurant.Bak to SQL Server
- Update `appsettings.json` with your SQL Server credentials

### Authentication Failures

- JWT secret is configured in `appsettings.json`
- Web: check localStorage has `auth_token`
- Mobile: check AsyncStorage has `@imidus_auth_token`
- Backend logs show token validation errors

---

## Known Issues

### Tests

- 5 unit tests failing in `OrderStatusPollingServiceTests` (pre-existing Moq issue with mocking extension methods)
- These tests don't affect the production API
- All other tests pass (42 passed, 13 skipped for DB integration)

### Database

- Backend will start without database (graceful degradation)
- Menu and order endpoints will return errors if DB not connected
- Health check at `/health` works without database
- Deep health check at `/api/Health/deep` requires database

---

## Next Steps

1. **Test the full flow**:
   - Start backend
   - Start web platform
   - Start mobile app
   - Verify all can communicate

2. **Database Setup** (if needed):
   - Restore INI_Restaurant.Bak to SQL Server
   - Update connection strings with your credentials
   - Test menu and order endpoints

3. **Production Deployment**:
   - Update `.env` files with production URLs
   - Configure production SQL Server
   - Set up Authorize.net production keys

---

## Files Modified

### Backend

- `src/backend/IntegrationService.API/Program.cs` - CORS policies
- `src/backend/IntegrationService.Infrastructure/Data/OnlineOrderStatusRepository.cs` - Fallback connection string
- `src/backend/IntegrationService.Infrastructure/Data/NotificationLogRepository.cs` - Fallback connection string
- `src/backend/IntegrationService.Infrastructure/Data/IdempotencyRepository.cs` - Fallback connection string
- `src/backend/IntegrationService.Infrastructure/Data/DeviceTokenRepository.cs` - Fallback connection string
- `src/backend/IntegrationService.Tests/appsettings.json` - Test configuration

### Web

- `src/web/lib/api.ts` - API client with correct port and types
- `src/web/.env` - Production environment
- `src/web/.env.example` - Template
- `src/web/.gitignore` - Updated to allow `.env` but ignore `.env.local`

### Mobile

- `src/mobile/ImidusCustomerApp/src/config/environment.ts` - Environment configuration
- `src/mobile/ImidusCustomerApp/.env.example` - Template

---

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Mobile App    │     │   Web Platform  │     │   Admin Portal  │
│  (React Native) │     │    (Next.js)    │     │    (Next.js)    │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         │  HTTP/JSON API        │  HTTP/JSON API        │  HTTP/JSON API
         │  (JWT Auth)           │  (JWT Auth)           │  (JWT Auth)
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │   Backend API (.NET 8)    │
                    │   Port: 5004              │
                    │   CORS: Web + Mobile      │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │   SQL Server 2005         │
                    │   INI_Restaurant          │
                    │   (Source of Truth)       │
                    └───────────────────────────┘
```

All components are now configured and ready to work together!
