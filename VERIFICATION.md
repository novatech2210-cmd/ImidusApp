# VERIFICATION.md - Verification Steps

**Last Updated:** March 17, 2026

---

## Build Verification

### Backend (.NET 9)
```bash
cd /home/kali/Desktop/TOAST/src/backend/IntegrationService.API
dotnet build
```
**Expected:** 0 Errors, 40 Warnings

### Web App (Next.js 16)
```bash
cd /home/kali/Desktop/TOAST/src/web
pnpm build
```
**Expected:** 31 routes generated

### Admin Portal (Next.js 14)
```bash
cd /home/kali/Desktop/TOAST/src/admin
pnpm build
```
**Expected:** 12 routes generated

---

## Runtime Verification

### Start Backend
```bash
cd /home/kali/Desktop/TOAST/src/backend/IntegrationService.API
dotnet run --urls "http://0.0.0.0:5004"
```

### Start Web
```bash
cd /home/kali/Desktop/TOAST/src/web
pnpm dev
```

### Start Admin
```bash
cd /home/kali/Desktop/TOAST/src/admin
pnpm dev
```

---

## API Verification

### Test Endpoints
```bash
# Health check
curl http://localhost:5004/api/Sync/status

# Categories (requires DB)
curl http://localhost:5004/api/Menu/categories

# Auth (requires Idempotency-Key)
curl -H "Idempotency-Key: test-123" \
  -H "Content-Type: application/json" \
  -d '{"phone":"1234567890"}' \
  http://localhost:5004/api/Auth/login
```

### Expected Responses
- `/api/Sync/status` → 503 (no DB) or 200 (with DB)
- `/api/Menu/categories` → JSON array or 500 (no DB)
- `/api/Auth/login` → 400 (missing fields) or 200 (success)

---

## Web Verification

### Test URLs
1. **Homepage:** http://localhost:3000
2. **Menu:** http://localhost:3000/menu
3. **Cart:** http://localhost:3000/cart
4. **Checkout:** http://localhost:3000/checkout

### Admin URLs
1. **Login:** http://localhost:3001/auth/login
2. **Dashboard:** http://localhost:3001/protected/dashboard
3. **Orders:** http://localhost:3001/protected/orders
4. **Customers:** http://localhost:3001/protected/customers

---

## Database Verification

### Connection Test
```bash
# Check if SQL Server is accessible
sqlcmd -S localhost -U sa -P 'ToastSQL@2025!' -Q "SELECT name FROM sys.databases"
```

### Expected Databases
- `INI_Restaurant` - POS data (source of truth)
- `IntegrationService` - Overlay data

### Key Tables
- `tblItem` - Menu items
- `tblAvailableSize` - Sizes and prices
- `tblCategory` - Menu categories
- `tblSales` - Orders
- `tblCustomer` - Customers

---

## SSOT Compliance Verification

### Read Operations ✅
- Menu items from tblItem + tblAvailableSize
- Categories from tblCategory
- Customer data from tblCustomer
- Order history from tblSales

### Write Operations ✅
- Orders → tblSales + tblPendingOrders + tblPayment
- Customer registration → tblCustomer
- Loyalty points → tblPointsDetail

### Prohibited ❌
- No ALTER TABLE
- No new stored procedures
- No schema changes to POS database

---

## Mobile Verification

### APK Test
1. Install `app-release.apk` on Android device
2. Configure API URL: http://[server-ip]:5004
3. Test menu browsing
4. Test checkout flow
5. Verify order appears in POS

---

## Payment Verification

### Authorize.net Sandbox
- **Test Card:** 4111111111111111
- **Expiry:** Any future date
- **CVV:** Any 3 digits

### Verification Steps
1. Add items to cart
2. Proceed to checkout
3. Enter test card
4. Submit order
5. Verify payment in tblPayment

---

## Deployment Verification

### AWS S3
- [ ] Web assets uploaded
- [ ] Admin assets uploaded
- [ ] URLs accessible

### Azure (Production)
- [ ] Backend deployed
- [ ] SSL configured
- [ ] Domain mapped

---

## Sign-off Checklist

- [ ] Backend builds without errors
- [ ] Web app builds without errors
- [ ] Admin builds without errors
- [ ] API endpoints respond
- [ ] Database connected
- [ ] Menu displays correctly
- [ ] Checkout flow works
- [ ] Payment processes
- [ ] Orders sync to POS
- [ ] SSOT compliance verified
