# Admin Portal Issues - Fix Summary

**Date:** March 28, 2026 at 2:50 AM GMT+2

---

## Issues Reported

1. ❌ **Menu Overrides:** "Failed to load menu overrides. Please try again."
2. ❌ **Payment Error:** "Order Not Found HTTP 404 after click pay"

---

## Issue #1: Menu Overrides - PARTIALLY FIXED ✅

### Root Cause
- MenuOverlay table was missing from IntegrationService database
- Backend endpoint exists but couldn't query non-existent table

### Fix Applied
✅ Created MenuOverlay table with correct schema:
```sql
CREATE TABLE MenuOverlay (
  Id INT IDENTITY(1,1) PRIMARY KEY,
  ItemId INT NOT NULL,
  IsAvailable BIT NOT NULL DEFAULT 1,
  HiddenFromOnline BIT NOT NULL DEFAULT 0,
  OverridePrice DECIMAL(10,2) NULL,
  Reason NVARCHAR(500) NULL,
  CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
  UpdatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
  CONSTRAINT UQ_MenuOverlay_ItemId UNIQUE (ItemId)
);
```

### Status
- ✅ Table created successfully
- ⏳ Backend may need restart to recognize new table
- 📝 Endpoint: `GET /api/admin/menu/overrides`

### Recommendation
**Restart the backend service** to clear any cached database metadata:
```bash
# Stop current backend
pkill -f "dotnet.*IntegrationService"

# Restart backend
cd /home/kali/Desktop/TOAST/src/backend/IntegrationService.API
dotnet run
```

---

## Issue #2: Order Not Found 404 - INVESTIGATING 🔍

### Symptoms
- HTTP 404 error when clicking "Pay" button
- Suggests order ID or payment endpoint issue

### Possible Causes
1. Order ID not being passed correctly from frontend
2. Payment endpoint URL mismatch
3. Order doesn't exist in database
4. Endpoint requires different authentication

### Investigation Needed
```bash
# Check payment-related endpoints
grep -rn "payment\|pay" src/backend/IntegrationService.API/Controllers/

# Check order endpoints
grep -rn "orders.*complete\|orders.*payment" src/backend/IntegrationService.API/Controllers/

# Test order completion endpoint
curl -X POST http://localhost:5004/api/orders/{orderId}/complete \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json"
```

### Next Steps
1. Check frontend code for payment button handler
2. Verify order ID being sent
3. Test payment endpoints with valid order ID
4. Check backend logs during payment attempt

---

## Authentication FIX ✅

### Issue
Admin login was failing due to password hash mismatch

### Fix Applied
✅ Updated all admin passwords to use correct SHA256 hashing:
- Password: `Admin123` (no special characters)
- Hash: `3b612c75a7b5048a435fb6ec81e52ff92d6d795a8b5a9c17070f6a63c97a53b2`

### Updated Accounts
| Email | Password | Role |
|-------|----------|------|
| admin@imidus.com | Admin123 | SuperAdmin |
| admin@example.com | Admin123 | SuperAdmin |
| manager@imidus.com | Admin123 | SuperAdmin |

### Login Endpoint
✅ Working: `POST /api/auth/admin-login`

```json
{
  "email": "admin@imidus.com",
  "password": "Admin123"
}
```

Returns:
```json
{
  "success": true,
  "data": {
    "token": "JWT_TOKEN_HERE",
    "refreshToken": "REFRESH_TOKEN_HERE",
    "user": {...}
  }
}
```

---

## Files Created

1. `/home/kali/Desktop/TOAST/fix-admin-password.js` - Password fix script
2. `/home/kali/Desktop/TOAST/test-login.sh` - Login test script
3. `/home/kali/Desktop/TOAST/test-api-endpoints.sh` - API endpoint tests
4. `/home/kali/Desktop/TOAST/check-menu-overlay.js` - Menu overlay table creation
5. `/home/kali/Desktop/TOAST/ADMIN_LOGIN_CREDENTIALS.md` - Login documentation

---

## Backend Endpoints Tested

| Endpoint | Method | Status | Auth Required |
|----------|--------|--------|---------------|
| `/api/auth/admin-login` | POST | ✅ Working | No |
| `/api/admin/dashboard/summary` | GET | ✅ Working | Yes |
| `/api/admin/orders/queue` | GET | ✅ Working | Yes |
| `/api/admin/menu/overrides` | GET | ⏳ Needs restart | Yes |
| Payment endpoint | POST | 🔍 To investigate | Yes |

---

## Current Status

### ✅ Fixed
1. Admin authentication
2. Password hashing
3. Dashboard access
4. Orders queue access
5. MenuOverlay table creation

### ⏳ Pending
1. Backend restart for menu overrides
2. Payment 404 issue investigation

### 🔍 Next Actions
1. Restart backend service
2. Test menu overrides endpoint
3. Investigate payment endpoint
4. Check frontend payment handler
5. Test end-to-end payment flow

---

## Quick Commands

**Test Login:**
```bash
/home/kali/Desktop/TOAST/test-login.sh
```

**Test All Endpoints:**
```bash
/home/kali/Desktop/TOAST/test-api-endpoints.sh
```

**Restart Backend:**
```bash
# Find and kill process
ps aux | grep "dotnet.*IntegrationService"
pkill -f "dotnet.*IntegrationService"

# Start fresh
cd /home/kali/Desktop/TOAST/src/backend/IntegrationService.API
dotnet run > /home/kali/Desktop/TOAST/backend.log 2>&1 &
```

**Check Backend Status:**
```bash
curl http://localhost:5004/health | jq
```

---

**Summary:** Authentication is fixed, menu overrides table created (restart needed), payment 404 requires investigation.
