# IMIDUS Admin Portal - Login Credentials

**Created:** March 28, 2026 at 2:35 AM GMT+2

---

## 🔐 Admin Login Credentials

### Primary Admin Account (SuperAdmin)
```
Email:    admin@imidus.com
Password: Admin123!
Role:     SuperAdmin (Full Access)
```

### Test Admin Account
```
Email:    admin@example.com
Password: Admin123!
Role:     SuperAdmin (Full Access)
```

### Manager Account
```
Email:    manager@imidus.com
Password: Manager123!
Role:     SuperAdmin (Full Access)
```

---

## 🌐 Admin Portal Access

**URL:** http://localhost:3001

**Features Available:**
- Dashboard with sales analytics
- Order management queue
- Customer CRM and segmentation
- RFM (Recency, Frequency, Monetary) analytics
- Birthday reward automation
- Push notification campaigns
- Menu item enable/disable overlay
- Imperial Onyx design system

---

## 🎯 How to Login

1. **Open Admin Portal:**
   ```
   http://localhost:3001
   ```

2. **Enter Credentials:**
   - Email: `admin@imidus.com`
   - Password: `Admin123!`

3. **Click Login**

4. **Access Dashboard:**
   - You'll be redirected to the admin dashboard
   - All features will be available with SuperAdmin privileges

---

## 👥 Available Admin Users

The database contains 5 admin accounts:

| Email | Name | Role | Status |
|-------|------|------|--------|
| admin@imidus.com | Super Admin | SuperAdmin | Active ✅ |
| admin@example.com | Test Admin | SuperAdmin | Active ✅ |
| manager@imidus.com | Manager User | SuperAdmin | Active ✅ |
| admin@test.imidus.com | System Administrator | admin | Active ✅ |
| e2e_3@example.com | E2E Tester | admin | Active ✅ |

---

## 🔧 Technical Details

### Database
- **Server:** localhost:1433
- **Database:** IntegrationService
- **Table:** AdminUsers
- **Password Hashing:** SHA256

### Authentication
- **Method:** JWT (JSON Web Tokens)
- **Controller:** AuthController.cs
- **Endpoints:**
  - POST `/api/auth/admin/login` - Admin login
  - POST `/api/auth/admin/register` - Admin registration
  - GET `/api/auth/admin/profile` - Get profile
  - POST `/api/auth/admin/logout` - Logout

### Authorization
- **Roles:**
  - SuperAdmin: Full access to all features
  - Manager: Management access (orders, customers)
  - Cashier: Order processing only

- **Permissions:**
  - SuperAdmin: `["*"]` (all permissions)
  - Manager: `["orders.read", "orders.write", "customers.read"]`
  - Cashier: `["orders.read"]`

---

## 🧪 Testing the Login

### Via Browser
1. Navigate to http://localhost:3001
2. Use credentials above
3. Should redirect to `/admin/dashboard`

### Via API (curl)
```bash
# Login and get JWT token
curl -X POST 'http://localhost:5004/api/auth/admin/login' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "admin@imidus.com",
    "password": "Admin123!"
  }'

# Use token for authenticated requests
curl -X GET 'http://localhost:5004/api/admin/dashboard/summary' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN_HERE'
```

---

## 🔒 Security Notes

1. **Password Complexity:**
   - Minimum 8 characters
   - Contains uppercase, lowercase, numbers, and special characters
   - Hashed with SHA256 before storage

2. **Session Management:**
   - JWT tokens expire after configured time
   - Refresh tokens available for extended sessions
   - Logout invalidates tokens

3. **Access Control:**
   - Role-based permissions
   - Route guards on admin pages
   - API endpoints protected with `[Authorize]` attribute

4. **Production Recommendations:**
   - Change default passwords immediately
   - Use environment-specific secrets
   - Enable HTTPS/TLS
   - Implement rate limiting
   - Add MFA (Multi-Factor Authentication)
   - Regular password rotation policy

---

## 📝 Script Used

The admin accounts were created using:
```bash
node /home/kali/Desktop/TOAST/create-admin.js
```

This script:
1. Creates AdminRoles table entries (SuperAdmin, Manager, Cashier)
2. Hashes passwords using SHA256
3. Inserts/updates AdminUsers table
4. Verifies creation was successful

---

## 🚨 Important Notes

- **Default Passwords:** All accounts use simple default passwords for development
- **Production Warning:** CHANGE THESE PASSWORDS before production deployment
- **Database:** Admin users are in `IntegrationService` database, NOT `INI_Restaurant`
- **Customer vs Admin:** Admin users are separate from customer accounts
- **Backup:** Current credentials are saved in this file for reference

---

## 🎯 Next Steps

1. ✅ Login to admin portal with credentials above
2. ✅ Test all dashboard features
3. ✅ Verify order management works
4. ✅ Test RFM segmentation
5. ✅ Configure birthday rewards
6. ✅ Send test push notifications
7. 🔒 Change passwords before client delivery
8. 📝 Document any additional features or issues

---

**Admin portal is ready for use! Login and explore the Imperial Onyx dashboard.** 🎨
