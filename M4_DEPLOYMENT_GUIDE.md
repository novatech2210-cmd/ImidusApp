# Milestone 4: Admin Portal - Complete Deployment Guide

**Status:** Production-Ready  
**Date:** March 7, 2026  
**Target:** AWS S3 → s3://inirestaurant/novatech/admin-portal/

---

## 🏗️ Architecture Overview

### Data Flow (Respecting SSOT)

```
┌─────────────────────────────────────────────────────────────┐
│                     Admin Portal (Next.js)                   │
│                    (Frontend - Port 3001)                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                    HTTP/JSON API
                         │
┌────────────────────────▼────────────────────────────────────┐
│          Backend Integration Service (.NET 8)               │
│                 (Port 5004 - Port 5004)                     │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │          AdminPortalService                          │   │
│  │  • Dashboard summaries                               │   │
│  │  • Order management & refunds                        │   │
│  │  • Customer CRM (RFM segmentation)                   │   │
│  │  • Campaign management                               │   │
│  │  • Menu overlay (enable/disable items)               │   │
│  │  • Birthday reward automation                        │   │
│  │  • Activity logging (all admin actions)              │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
              READ/WRITE (Transactions)
                         │
       ┌─────────────────┼─────────────────┐
       │                 │                 │
   ┌───▼────┐      ┌────▼────┐      ┌────▼─────┐
   │ GROUND │      │ OVERLAY  │      │ BACKUP   │
   │ TRUTH  │      │  DATA    │      │  LOGS    │
   │        │      │          │      │          │
   │INI_    │      │Integration│    │ Activity │
   │Rest.   │      │Service DB │    │  Logs    │
   │        │      │          │      │          │
   │tblSales│      │MenuOverlay│    │ (Audit   │
   │tblSales│      │Campaign   │    │  Trail)  │
   │Detail  │      │Customer   │    │          │
   │tblPay- │      │Profile    │    │          │
   │ment    │      │Birthday   │    │          │
   │tblCust-│      │Reward     │    │          │
   │omer    │      │          │    │          │
   │tblItem │      │          │    │          │
   │...     │      │          │    │          │
   └────────┘      └──────────┘    └──────────┘
   (Source of      (Backend-only  (Security &
    Truth - NEVER   - safe to     Compliance)
    modify schema)  modify)
```

### Data Consistency Rules

**READ Operations:**
- Always read from INI_Restaurant database (LIVE data)
- Never trust cached data older than 5 minutes
- Query using backend endpoints (never direct DB access from frontend)

**WRITE Operations:**
- Writes to INI_Restaurant database (source of truth) ONLY through backend service
- Writes to IntegrationService database (overlay) for menu, campaigns, preferences
- All INI_Restaurant writes must be wrapped in transactions
- Idempotency keys required on all POS database writes
- Ticket state validation before any write (concurrency safety)

**Activity Logging:**
- Every admin action logged to ActivityLog table with:
  - Timestamp (UTC)
  - Admin email/ID
  - Action type (RefundProcessed, MenuOverride, etc.)
  - Resource ID + description
  - IP address (for audit trail)
  - Success/failure status

---

## 📦 Frontend Setup (Admin Portal)

### Installation

```bash
# 1. Navigate to admin portal
cd /home/kali/Desktop/TOAST/src/admin

# 2. Install dependencies
pnpm install

# 3. Build for production
pnpm build

# 4. Start production server
pnpm start
```

### Environment Configuration

Create `.env.local`:

```env
# Backend API
NEXT_PUBLIC_API_BASE_URL=http://10.0.0.26:5004

# Authentication
JWT_SECRET=your-secret-key-generate-this
NEXT_PUBLIC_JWT_EXPIRY=3600

# Firebase Push Notifications
NEXT_PUBLIC_FIREBASE_API_KEY=xxxxx
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxxxx
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxxxx

# Admin Portal Settings
NEXT_PUBLIC_ADMIN_PORTAL_URL=http://10.0.0.26:3001
NEXT_PUBLIC_LOGO_URL=/images/imidus_logo_blue.png
```

### Features by Page

**Dashboard (`/protected/dashboard`)**
- 30-day sales trend chart
- Revenue, order count, average order value KPIs
- Top 10 popular items
- Real-time data refresh every 5 minutes
- Date range picker for custom analysis

**Orders (`/protected/orders`)**
- Live order queue from INI_Restaurant (source of truth) tblSales
- Filter by status: pending, completed, cancelled, refunded
- Search by order number or customer name
- Click to view full order details (items, payment, customer info)
- Refund processor (amount + reason required)
- Cancel order with inventory reversal warning
- Real-time updates (30-second polling)

**Customers (`/protected/customers`)**
- RFM segmentation: VIP, Loyal, Regular, AtRisk, New
- Segment breakdown pie chart
- Customer list with segment badges
- Click to view detailed profile:
  - Purchase history (last 20 orders)
  - Loyalty points balance & earn/redeem history
  - Contact info
  - Preferred items
- Bulk actions: export list, send campaign

**Campaigns (`/protected/campaigns`)**
- List all push notification campaigns
- Campaign builder (5-step multi-form):
  1. Name + type (marketing/transactional/birthday/retention)
  2. Audience targeting (RFM SQL filters)
  3. Message composer (title + body)
  4. Schedule (now vs. future date/time)
  5. Review + send
- Campaign analytics (sent count, open rate, click rate)
- Pause/resume active campaigns

**Menu (`/protected/menu`)**
- All items from INI_Restaurant (source of truth) tblAvailableSize
- Read-only inventory (OnHandQty displayed)
- Enable/disable overlay (toggle button changes backend MenuOverlay table)
- Edit display price (overlay-managed, doesn't touch POS prices)
- Quick toggle availability
- Batch operations planned (disable category, enable all items)

**Rewards (`/protected/rewards`)**
- Birthday reward automation configuration
- Reward type selector: Points / Discount % / Free Item
- Reward value input
- Enable/disable toggle
- Recent activations log (view birthday rewards sent this month)
- How it works explanation

**Logs (`/protected/logs`)**
- Activity log viewer (last 90 days)
- Filter by action type
- Show: timestamp, admin email, action, description, IP address
- Export functionality (CSV)
- Retention notice (logs kept for compliance)

---

## 🔐 Authentication & Security

### JWT Implementation

```
Login Flow:
1. Admin enters email + password on /auth/login
2. POST /api/auth/admin-login → Backend validates against Admin table
3. Backend returns JWT token + refresh token (30-day expiry)
4. Frontend stores JWT in localStorage (not httpOnly for SPA)
5. All API requests include Authorization: Bearer {token}
6. Backend middleware validates JWT + role
7. Expired token → auto-redirect to /auth/login

Roles & Permissions:
- admin: Full access to all features
- manager: Can view analytics, manage orders, view customers
- staff: Limited to order viewing only (no refunds, no campaigns)

Role Enforcement:
- Frontend: Hide UI elements based on role (client-side)
- Backend: Validate role on EVERY protected endpoint (server-side MUST validate)
- Sensitive actions (refund, campaign send): require admin role + confirmation
```

### Security Headers

```
# All responses include:
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'
```

### IP Whitelisting (Optional)

Backend supports optional IP whitelist for admin portal:

```
POST /api/admin/settings/ip-whitelist
Body: { "allowedIPs": ["203.0.113.1", "198.51.100.2"] }

When enabled:
- Requests from non-whitelisted IPs return 403 Forbidden
- Admin portal can manage whitelist in Settings page
- Logged to ActivityLog with timestamp + IP
```

---

## 🔄 Real-Time Data Synchronization

### Polling Strategy

**Dashboard (5-minute refresh):**
- Summary KPIs
- Sales chart
- Popular items

**Orders Queue (30-second refresh):**
- Live order list
- Order status updates
- Payment confirmation

**Customer List (10-minute refresh):**
- Segmentation counts
- Customer list

**Campaign Status (5-minute refresh):**
- Campaign metrics
- Delivery statistics

### Optimization

```
- Use TanStack Query for automatic caching
- Implement stale-while-revalidate pattern
- Background refetch enabled for all queries
- User can force refresh (manual button)
- Failed requests retry with exponential backoff
```

---

## 📱 API Endpoints

All endpoints require `Authorization: Bearer {jwt_token}` header.

### Dashboard

```
GET /api/admin/dashboard/summary?startDate=2026-03-06&endDate=2026-04-06
Response: { totalOrders, totalRevenue, averageOrderValue, totalCustomers, revenueGrowth }

GET /api/admin/dashboard/sales-chart?startDate=...&endDate=...&groupBy=day|week|month
Response: [{ label: "Mar 07", orderCount: 15, revenue: 450.50, date: "2026-03-07" }, ...]

GET /api/admin/dashboard/popular-items?limit=10
Response: [{ itemId, itemName, quantity, revenue, imageUrl }, ...]
```

### Orders

```
GET /api/admin/orders/queue?status=pending&searchTerm=ORD001&limit=50
Response: [{ id, orderNumber, customerName, items, total, status, paymentStatus, createdAt }, ...]

GET /api/admin/orders/{salesId}
Response: { order details with full line items }

POST /api/admin/orders/{salesId}/refund
Body: { amount: 50.00, reason: "Customer requested", adminNotes: "..." }
Response: { success: true, refundId: 123, message: "Refund processed" }

POST /api/admin/orders/{salesId}/cancel
Body: { reason: "Out of stock", adminNotes: "..." }
Response: { success: true, message: "Order cancelled, inventory reversed" }
```

### Customers

```
GET /api/admin/customers/segments
Response: { VIP: 5, Loyal: 25, Regular: 100, AtRisk: 8, New: 3 }

GET /api/admin/customers?segment=VIP&limit=50&offset=0
Response: [{ id, firstName, lastName, email, segment, totalSpend, visitCount, lastVisitDate, loyaltyPointsBalance }, ...]

GET /api/admin/customers/{customerId}/profile
Response: { customer, purchaseHistory: [], loyaltyTransactions: [], averageOrderValue, recencyDays, frequency, monetary }
```

### Campaigns

```
GET /api/admin/campaigns?status=draft|scheduled|sent|paused
Response: [{ id, name, type, status, recipientsCount, sentCount, openRate, scheduledTime, sentDate, createdAt, createdBy }, ...]

POST /api/admin/campaigns
Body: { name, type, targetSegment: { segments: [], minSpend, maxSpend, minFrequency, maxRecency }, messageTitle, messageBody, scheduledTime }
Response: { id, ... }

POST /api/admin/campaigns/{id}/send
Response: { success: true, deliveredCount: 45, failedCount: 2 }

POST /api/admin/campaigns/target-audience
Body: { segments: ["VIP"], minSpend: 100, maxSpend: 5000, minFrequency: 5, maxRecency: 30 }
Response: { recipientCount: 23, previewList: [...] }
```

### Menu

```
GET /api/admin/menu/overrides
Response: [{ itemId, itemName, displayPrice, isAvailable, imageUrl, stock, lastUpdated }, ...]

PUT /api/admin/menu/overrides/{itemId}
Body: { displayPrice: 12.99, isAvailable: true }
Response: { success: true, message: "Menu item updated" }

GET /api/admin/menu/inventory
Response: [{ itemId, itemName, onHandQty, lowStockThreshold, isLowStock }, ...]
```

### Rewards

```
GET /api/admin/rewards/birthday
Response: { id, rewardType: "points", value: 100, isActive: true, createdAt }

PUT /api/admin/rewards/birthday
Body: { rewardType: "points", value: 100, isActive: true }
Response: { success: true }
```

### Logs

```
GET /api/admin/logs?limit=100&action=RefundProcessed|CampaignSent|MenuOverride|CustomerEdited|BirthdayReward
Response: [{ id, timestamp, adminUser, action, resourceType, resourceId, description, ipAddress, userAgent }, ...]
```

---

## 🚀 Deployment to Production

### Build for Production

```bash
cd /home/kali/Desktop/TOAST/src/admin

# Type check
pnpm type-check

# Build
pnpm build

# Test build locally
pnpm start
```

### Package for S3 Delivery

```bash
# 1. Export static build
pnpm build

# 2. Create deployment package
tar -czf admin-portal-build-$(date +%Y%m%d).tar.gz .next public

# 3. Upload to S3
aws s3 cp admin-portal-build-*.tar.gz s3://inirestaurant/novatech/admin-portal/ \
  --region us-east-1 \
  --profile default

# 4. Create README
cat > DEPLOYMENT_INSTRUCTIONS.md << 'DEPLOY'
# Admin Portal Deployment

## Extract & Install
```
tar -xzf admin-portal-build-20260307.tar.gz
cd admin-portal/
pnpm install
```

## Environment Setup
Copy `.env.local.example` to `.env.local` and fill in:
- NEXT_PUBLIC_API_BASE_URL (backend IP:port)
- JWT_SECRET
- Firebase credentials

## Run
```
pnpm start
```

Server runs on port 3001
DEPLOY

# Upload instructions
aws s3 cp DEPLOYMENT_INSTRUCTIONS.md s3://inirestaurant/novatech/admin-portal/
```

### Production Checklist

- [ ] All environment variables configured
- [ ] Backend API responding on correct IP:port
- [ ] Database connections verified
- [ ] JWT secret generated and secure
- [ ] Firebase credentials configured for push notifications
- [ ] CORS enabled on backend for admin portal domain
- [ ] SSL/TLS certificate installed (if using HTTPS)
- [ ] Error logging configured (Sentry or similar)
- [ ] Performance monitoring setup
- [ ] Admin users created in backend database
- [ ] Test login works with real credentials
- [ ] Dashboard loads real data from backend
- [ ] Order queue displays live orders
- [ ] Refund test transaction succeeds
- [ ] Campaign targeting returns correct audience count
- [ ] Menu overrides persist after page reload
- [ ] Activity logs record admin actions
- [ ] Backup strategy defined
- [ ] Disaster recovery tested

---

## 🧪 Testing Checklist

### Functional Testing

**Dashboard:**
- [ ] Loads without errors
- [ ] KPI numbers match backend summary
- [ ] Sales chart displays correct data
- [ ] Date range filter works
- [ ] Popular items list shows top 10
- [ ] Refresh updates all data

**Orders:**
- [ ] Order queue loads all pending orders
- [ ] Filter by status works
- [ ] Search by order number works
- [ ] Click order shows full details
- [ ] Refund dialog opens
- [ ] Refund processes successfully
- [ ] Refund appears in activity logs
- [ ] Activity log records timestamp and admin email

**Customers:**
- [ ] Segmentation chart displays all segments
- [ ] Customer list filters by segment
- [ ] Click customer shows profile
- [ ] Purchase history loads
- [ ] Loyalty points balance displays
- [ ] Export customer list works

**Campaigns:**
- [ ] Campaign list loads
- [ ] Campaign builder multi-step form works
- [ ] Audience targeting returns count
- [ ] Send campaign succeeds
- [ ] Campaign status updates after send
- [ ] Campaign metrics display

**Menu:**
- [ ] All items load from backend
- [ ] Toggle availability works
- [ ] Edit price saves to backend
- [ ] Inventory shows on-hand quantity
- [ ] Changes persist after page reload

**Security:**
- [ ] Login required to access admin pages
- [ ] Invalid credentials rejected
- [ ] Expired JWT redirects to login
- [ ] Non-admin users cannot access protected endpoints
- [ ] Sensitive actions require confirmation dialog
- [ ] Activity log records all actions with IP

### Performance Testing

- [ ] Dashboard loads in < 2 seconds
- [ ] Order queue loads in < 1 second
- [ ] Campaign creation < 3 seconds
- [ ] No console errors
- [ ] Responsive on mobile/tablet/desktop
- [ ] Images load and cache properly

---

## 📞 Support & Troubleshooting

### Common Issues

**Backend Connection Failed**
```
Error: ECONNREFUSED 10.0.0.26:5004

Fix:
1. Verify backend running: curl http://10.0.0.26:5004/api/Sync/status
2. Check firewall: sudo ufw allow 5004
3. Restart backend: pkill -f dotnet; dotnet run --urls http://0.0.0.0:5004
```

**Authentication Fails**
```
Error: 401 Unauthorized

Fix:
1. Verify admin user created in backend database
2. Check JWT secret configured
3. Verify token not expired: check localStorage
4. Clear localStorage and re-login: localStorage.clear()
```

**No Orders Loading**
```
Error: Order queue shows "No orders found"

Fix:
1. Check INI_Restaurant database connection
2. Verify orders exist: SELECT COUNT(*) FROM tblSales
3. Check transaction types: SELECT DISTINCT TransType FROM tblSales
4. Verify date range: orders outside date range won't show
```

**Performance Degradation**
```
Symptoms: Dashboard slow to load

Fix:
1. Check database query performance: run EXPLAIN PLAN on slow queries
2. Verify indexes exist on tblSales, tblCustomer, tblPayment
3. Check SQL Server CPU/memory: sp_who2 active
4. Implement database statistics updates
```

---

## 📊 Monitoring & Maintenance

### Daily

- [ ] Check error logs: `/var/log/admin-portal/error.log`
- [ ] Monitor API response times
- [ ] Verify backup completion

### Weekly

- [ ] Review activity logs for unusual patterns
- [ ] Check database size and growth
- [ ] Performance report review

### Monthly

- [ ] Security audit of access logs
- [ ] Database maintenance (statistics, indexes)
- [ ] Customer data quality check
- [ ] Disk space cleanup

---

## ✅ Handoff Checklist

- [ ] Admin portal running on production server
- [ ] All features tested and verified
- [ ] Admin users trained on portal features
- [ ] Documentation uploaded to S3
- [ ] Support email/contact established
- [ ] Monitoring and alerting configured
- [ ] Backup and recovery tested
- [ ] Client acceptance obtained in writing
- [ ] Payment released to Novatech Build Team

---

**Status: READY FOR DEPLOYMENT**

Next steps after client acceptance:
1. Upload admin portal build to s3://inirestaurant/novatech/admin-portal/
2. Request payment ($1,000) upon client written acceptance
3. Begin Milestone 5 (Terminal Bridge Integration, QA & Deployment)
