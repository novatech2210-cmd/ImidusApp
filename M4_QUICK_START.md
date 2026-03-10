# M4 Implementation Quick Start Guide

## 📋 What's Ready (Backend: 80%)

The backend already has:

- ✅ AdminPortalService with all core logic
- ✅ Admin controller with all endpoints
- ✅ Dashboard summary, sales charts, popular items
- ✅ Order queue and refund processing
- ✅ Customer segment/history retrieval
- ✅ Campaign CRUD operations
- ✅ Menu override endpoints
- ✅ Activity logging repository
- ✅ Background services (Birthday rewards, order polling)

**What you need:** Frontend UI to call these endpoints

---

## 🚀 Quick Implementation Path (8 weeks)

### Week 1-2: Dashboard & UI Scaffold

1. Create admin portal Next.js app in `/src/admin`
2. Setup auth pages (login, session management)
3. Build shared components (Sidebar, Header, Tables, Forms)
4. Implement Dashboard page with KPI cards
5. Connect to backend `/api/admin/dashboard/*` endpoints
6. Add sales chart using Recharts

**Deliverable:** Working dashboard showing real KPIs

### Week 3: Order Management

1. Build OrderQueue table component with filtering
2. Implement OrderDetail modal (expand, view items)
3. Create RefundForm with confirmation
4. Handle order cancellation with inventory reversal
5. Add real-time updates (SSE or polling)

**Deliverable:** Fully functional order management

### Week 4: Customer CRM

1. Implement RFM segmentation view (donut chart)
2. Build CustomerList table with segment badges
3. Create CustomerProfile page (history, loyalty points)
4. Add customer search/filtering
5. Bulk actions (export, send campaign)

**Deliverable:** Complete CRM dashboard

### Week 5-6: Campaign Builder

1. Build CampaignList with status badges
2. Create CampaignBuilder multi-step form
3. Implement AudienceBuilder (RFM filters, spend, frequency)
4. Add MessageComposer with preview
5. Implement scheduling (now vs. later)
6. Campaign analytics page

**Deliverable:** Full campaign builder end-to-end

### Week 7: Menu + Rewards + Logs

1. Menu management: Category grid + item cards
2. Real-time inventory display (from backend)
3. Menu overlay (enable/disable, featured)
4. Birthday rewards config UI
5. Activity logs table with filters

**Deliverable:** All remaining features complete

### Week 8: Security + Testing + Deploy

1. JWT authentication (login flow)
2. Role-based access control (middleware)
3. IP whitelisting config UI
4. E2E tests with Playwright
5. Staging deployment
6. Production deployment to AWS S3

**Deliverable:** Production-ready admin portal

---

## 📁 File Structure to Create

```
/src/admin
├── package.json (Next.js 14, TypeScript)
├── tsconfig.json
├── next.config.js
├── .env.local (API_BASE_URL=http://10.0.0.26:5004)
│
├── app/
│   ├── layout.tsx (auth wrapper, sidebar)
│   ├── page.tsx (redirect to /admin/dashboard)
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── logout/route.ts
│   ├── (protected)/
│   │   ├── dashboard/
│   │   ├── orders/
│   │   ├── customers/
│   │   ├── campaigns/
│   │   ├── menu/
│   │   ├── rewards/
│   │   ├── logs/
│   │   └── settings/
│   └── api/
│       └── auth/ (token refresh)
│
├── components/
│   ├── Navigation/
│   ├── Forms/
│   ├── Tables/
│   ├── Charts/
│   ├── Dialogs/
│   └── Loading/
│
├── lib/
│   ├── api-client.ts (axios instance)
│   ├── auth.ts (JWT token management)
│   ├── hooks.ts (useQuery, useMutation)
│   └── utils.ts (formatters, helpers)
│
├── types/
│   ├── api.ts (response types)
│   ├── admin.ts (admin models)
│   └── common.ts
│
└── styles/
    └── globals.css (Tailwind)
```

---

## 🔑 Backend Integration Checklist

**Before starting frontend, verify:**

- [ ] Backend running on http://10.0.0.26:5004
- [ ] POST /api/admin/dashboard/summary returns 200
- [ ] GET /api/admin/dashboard/sales-chart returns chart data
- [ ] GET /api/admin/orders/queue returns orders
- [ ] GET /api/admin/customers/segments returns segments
- [ ] GET /api/admin/campaigns returns campaigns (empty OK)
- [ ] GET /api/admin/menu/overrides returns overrides (empty OK)
- [ ] GET /api/admin/logs returns activity logs (empty OK)

**CORS Configuration:** Backend already has CORS enabled for localhost:3000

---

## 🛠️ Tech Stack Decisions

| Layer         | Technology                    | Why                                       |
| ------------- | ----------------------------- | ----------------------------------------- |
| Framework     | Next.js 14 App Router         | SSR, built-in routing, API routes         |
| UI Components | shadcn/ui (Radix + Tailwind)  | Accessible, customizable, dark mode       |
| Forms         | React Hook Form + Zod         | Type-safe validation, minimal re-renders  |
| Data Fetching | TanStack Query (React Query)  | Caching, auto-refetch, background updates |
| Charts        | Recharts                      | Simple, declarative, responsive           |
| Tables        | TanStack Table (React Table)  | Headless, sortable, paginated             |
| Auth          | NextAuth.js or JWT (httpOnly) | Secure, standard approach                 |
| CSS           | Tailwind CSS                  | Utility-first, rapid development          |
| HTTP Client   | Axios (configured)            | Interceptors, global error handling       |

---

## 📊 Key Endpoints to Connect

### Dashboard

```
GET /api/admin/dashboard/summary?startDate=2026-02-06&endDate=2026-03-06
Response: { totalOrders, totalRevenue, averageOrderValue, totalCustomers }

GET /api/admin/dashboard/sales-chart?startDate=2026-02-06&endDate=2026-03-06&groupBy=day
Response: [{ label: "Mar 01", orderCount: 5, revenue: 150.50 }]

GET /api/admin/dashboard/popular-items?limit=10
Response: [{ itemId: 101, itemName: "Pizza", quantity: 45, revenue: 450 }]
```

### Orders

```
GET /api/admin/orders/queue?status=open&limit=50&searchTerm=ORD001
Response: [{ id, customerName, items, total, status, createdAt }]

POST /api/admin/orders/{id}/refund
Body: { amount: 50.00, reason: "Customer requested" }
Response: { success: true, message: "Refund processed" }
```

### Customers

```
GET /api/admin/customers/segments
Response: { VIP: 5, Loyal: 25, Regular: 100, AtRisk: 8 }

GET /api/admin/customers?segment=VIP
Response: [{ id, name, email, spend, frequency, lastVisit }]

GET /api/admin/customers/{id}/history
Response: { profile, orders: [], loyaltyPoints: 450 }
```

### Campaigns

```
GET /api/admin/campaigns
Response: [{ id, name, status, recipientsCount, sentDate }]

POST /api/admin/campaigns
Body: { name, type, targetSegment: {}, messageTitle, messageBody, scheduledTime }
Response: { id: 123, ... }

POST /api/admin/campaigns/{id}/send
Response: { success: true, deliveredCount: 45 }
```

### Menu

```
GET /api/admin/menu/overrides
Response: [{ itemId, itemName, isAvailable, displayPrice, stock }]

PUT /api/admin/menu/overrides/{itemId}
Body: { isAvailable: true, displayPrice: 12.99 }
Response: { success: true }
```

### Logs

```
GET /api/admin/logs?limit=100&action=RefundProcessed
Response: [{ id, timestamp, adminUser, action, resourceType, resourceId }]
```

---

## 🔐 Authentication Flow

1. User visits `/admin/login`
2. Enters email + password
3. Frontend POST `/api/auth/admin-login` (backend validates, returns JWT)
4. JWT stored in secure httpOnly cookie
5. All subsequent requests include JWT in Authorization header
6. Backend validates JWT + role, returns 401 if invalid
7. Frontend redirects to login if 401

---

## 🧪 Testing Checklist

- [ ] Login/logout flow works
- [ ] Dashboard loads and displays real data
- [ ] Order queue filters work (status, search)
- [ ] Refund processes and creates activity log
- [ ] Customer segmentation calculates correctly
- [ ] Campaign builder validates inputs
- [ ] Campaign targeting filters apply correctly
- [ ] Menu overlay saves without POS changes
- [ ] Activity logs record all actions with IP
- [ ] Role-based access control (Manager can't access logs)
- [ ] Performance: dashboard < 2 seconds load
- [ ] Mobile responsive (tablet + mobile admin)
- [ ] Dark mode support
- [ ] Error states and empty states handled

---

## 📈 Performance Targets

- Dashboard load: < 2 seconds
- Order queue load: < 1 second
- Campaign creation: < 3 seconds
- Real-time order updates: < 500ms latency
- Database queries: < 200ms (indexed)

---

## 🚢 Deployment Checklist

- [ ] Environment variables configured (API_BASE_URL, JWT_SECRET)
- [ ] CORS origins whitelist updated
- [ ] Database migrations run (new tables created)
- [ ] Seed data: test admin user created
- [ ] SSL/TLS certificate installed
- [ ] Monitoring/logging setup (Sentry for errors)
- [ ] Backup strategy defined
- [ ] Disaster recovery tested
- [ ] Load testing completed
- [ ] Security audit passed
- [ ] User documentation written
- [ ] Admin training completed

---

## 📞 Support & Escalation

**If backend endpoint returns error:**

1. Check backend logs: `tail -f /tmp/backend.log`
2. Verify database connection in appsettings.json
3. Test endpoint directly: `curl http://10.0.0.26:5004/api/admin/dashboard/summary`
4. Check if table exists in IntegrationService DB

**If frontend won't connect to backend:**

1. Verify backend is running: `ps aux | grep dotnet`
2. Check CORS config in Program.cs
3. Check network connectivity: `ping 10.0.0.26`
4. Check firewall rules on port 5004

---

**Next Step:** Start building Dashboard page + navigation scaffold (Week 1)
