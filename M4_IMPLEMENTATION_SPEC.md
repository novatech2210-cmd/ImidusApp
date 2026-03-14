# Milestone 4: Merchant Admin Portal - Implementation Specification

**Date:** March 6, 2026  
**Status:** Planning Phase  
**Value:** $1,000  

---

## 📋 Executive Summary

M4 delivers a comprehensive admin portal for restaurant merchants to manage orders, customers, marketing campaigns, menu availability, and operational analytics. All features maintain strict SSOT (Single Source of Truth) compliance: reading from INI_Restaurant POS database and writing only through backend services to IntegrationService overlay database.

---

## 🏗️ Architecture Overview

### Technology Stack
- **Frontend:** Next.js 14 (TypeScript + React Server Components)
- **Backend:** .NET 8 (already 80% implemented via AdminPortalService)
- **Database - Ground Truth:** INI_Restaurant (SQL Server 2005 Express)
- **Database - Overlay:** IntegrationService (custom admin data)
- **Auth:** JWT tokens (admin role-based)
- **Notifications:** Firebase FCM

### SSOT Compliance Model
```
POS Orders          ← READ ONLY (ground truth)
    ↓
IntegrationService  ← Overlay layer (custom business rules)
    ↓
Admin Portal UI     ← Display & analytics
```

---

## 📊 Feature Breakdown

### 1. Order Management Dashboard (40% backend ready)

**Endpoints Already Implemented:**
- `GET /api/admin/dashboard/summary` - KPIs (total revenue, orders, customers)
- `GET /api/admin/dashboard/sales-chart` - Sales trends (day/week/month grouping)
- `GET /api/admin/dashboard/popular-items` - Top items by quantity
- `GET /api/admin/orders/queue` - Real-time order queue with status
- `POST /api/admin/orders/{salesId}/refund` - Process refund with audit trail

**Database Tables:**
- Read: `tblSales`, `tblSalesDetail`, `tblPayment`
- Write: `tblActivityLog` (refund reason, admin user)

**Missing Implementation:**
- ❌ Filter/search order queue by order number, customer, status
- ❌ Order cancellation with inventory reversal
- ❌ Void/adjust items in completed orders
- ❌ Print receipt generation

**UI Components Needed:**
```
OrderDashboard/
  ├── DashboardSummary (KPI cards: Revenue, Orders, AOV)
  ├── SalesChart (Chart.js: revenue trend)
  ├── PopularItemsTable (top 10 items)
  └── OrderQueue/
      ├── LiveOrderList (filterable)
      ├── OrderDetail modal (items, payment, actions)
      ├── RefundDialog (amount, reason)
      └── CancelOrderDialog (confirm + inventory rollback)
```

**API Enhancements:**
```csharp
POST /api/admin/orders/{salesId}/cancel
  → Reverses stock in tblAvailableSize
  → Records cancellation reason in tblActivityLog
  → Updates TransType to 0 (refund/void)

GET /api/admin/orders/queue?status=open&searchTerm=ORD001
  → Filter by: status (open/completed), customer name, order number
  → Real-time updates via Server-Sent Events (SSE) or WebSocket
```

---

### 2. Customer CRM with RFM Segmentation (10% backend ready)

**Endpoints Already Implemented:**
- `GET /api/admin/customers/segments` - RFM segments (High-Value, At-Risk, Loyal, etc.)
- `GET /api/admin/customers/{customerId}/history` - Order history + metrics

**Missing Implementation:**
- ❌ RFM calculation queries (Recency, Frequency, Monetary)
- ❌ Customer search/filtering by segment
- ❌ Bulk customer actions (email export, targeted campaigns)
- ❌ Loyalty points balance visibility

**Database Schema:**
```sql
-- NEW: Customer overlay table for CRM data
CREATE TABLE tblCustomerProfile (
    ID INT PRIMARY KEY IDENTITY,
    CustomerID INT FOREIGN KEY,
    Segment NVARCHAR(50), -- 'VIP', 'Regular', 'At-Risk', 'New'
    LastVisitDate DATETIME,
    VisitCount INT,
    TotalSpend DECIMAL(10,2),
    AverageOrderValue DECIMAL(10,2),
    LoyaltyPointsBalance INT,
    PreferredItems NVARCHAR(MAX), -- JSON: [ItemID, ItemID, ...]
    Notes NVARCHAR(MAX),
    CreatedDate DATETIME,
    ModifiedDate DATETIME
);

-- Calculated on demand via view
CREATE VIEW vwCustomerRFM AS
SELECT 
    c.ID,
    c.FName, c.LName, c.Phone, c.Email,
    DATEDIFF(day, MAX(s.SaleDateTime), GETDATE()) as RecencyDays,
    COUNT(DISTINCT s.ID) as Frequency,
    SUM(s.SubTotal + s.GSTAmt + s.PSTAmt + s.PST2Amt - s.DSCAmt) as Monetary,
    CASE 
        WHEN SUM(...) > 500 AND DATEDIFF(day, MAX(...), GETDATE()) < 30 THEN 'VIP'
        WHEN SUM(...) > 250 THEN 'Loyal'
        WHEN DATEDIFF(day, MAX(...), GETDATE()) > 90 THEN 'At-Risk'
        ELSE 'Regular'
    END as Segment
FROM tblCustomer c
LEFT JOIN tblSales s ON c.ID = s.CustomerID AND s.TransType = 1
GROUP BY c.ID, ...
```

**UI Components:**
```
CustomerSegmentation/
  ├── SegmentationChart (donut: VIP%, Regular%, At-Risk%)
  ├── SegmentList
  │   ├── VIPCustomers
  │   ├── RegularCustomers
  │   ├── AtRiskCustomers (churned > 90 days)
  │   └── NewCustomers (first purchase < 30 days)
  └── CustomerDetail/
      ├── Profile (name, phone, email, join date)
      ├── PurchaseHistory (orders, dates, totals)
      ├── LoyaltyPoints (current balance, redemption history)
      ├── PreferredItems (items they order most)
      └── Actions (send campaign, manual notes, edit profile)
```

**RFM Algorithm:**
```
Recency: Days since last purchase (0-30=5pts, 31-60=4pts, ...)
Frequency: Orders in last 12 months (1=1pt, 5+=5pts)
Monetary: Total spend (0-100=1pt, 500+=5pts)
Segment = weighted score (R×40% + F×30% + M×30%)
```

---

### 3. Push Notification Campaign Builder (20% backend ready)

**Endpoints Already Implemented:**
- `GET /api/admin/campaigns` - List campaigns
- `POST /api/admin/campaigns` - Create campaign
- `POST /api/admin/campaigns/{campaignId}/send` - Send campaign

**Missing Implementation:**
- ❌ Audience targeting SQL builder (Spend > $X, Frequency > N, Recency < 60)
- ❌ Campaign scheduling (send now vs. scheduled)
- ❌ A/B testing (variant messages)
- ❌ Campaign analytics (delivery rate, open rate via FCM metrics)
- ❌ Template management (transactional + marketing)

**Database Schema:**
```sql
CREATE TABLE tblPushCampaign (
    ID INT PRIMARY KEY IDENTITY,
    CampaignName NVARCHAR(255),
    CampaignType NVARCHAR(50), -- 'Transactional', 'Marketing', 'Birthday'
    TargetSegment NVARCHAR(MAX), -- JSON: {"minSpend": 50, "minFrequency": 3}
    MessageTitle NVARCHAR(255),
    MessageBody NVARCHAR(1000),
    ActionURL NVARCHAR(500),
    ScheduledTime DATETIME NULL, -- NULL = send immediately
    Status NVARCHAR(50), -- 'Draft', 'Scheduled', 'Sent', 'Failed'
    RecipientsCount INT DEFAULT 0,
    OpenedCount INT DEFAULT 0,
    CreatedBy INT FOREIGN KEY tblAdminUser,
    CreatedDate DATETIME,
    SentDate DATETIME NULL
);

CREATE TABLE tblCampaignRecipient (
    ID INT PRIMARY KEY IDENTITY,
    CampaignID INT FOREIGN KEY,
    CustomerID INT FOREIGN KEY,
    DeviceToken NVARCHAR(500),
    Status NVARCHAR(50), -- 'Queued', 'Sent', 'Failed'
    SentDate DATETIME,
    OpenedDate DATETIME NULL
);
```

**UI Components:**
```
CampaignBuilder/
  ├── CampaignList (draft, scheduled, sent)
  ├── CreateCampaign/
  │   ├── BasicInfo (name, type, scheduling)
  │   ├── AudienceBuilder
  │   │   ├── RFMSelector (segment: VIP, Loyal, At-Risk)
  │   │   ├── SpendFilter (min: $0-$1000)
  │   │   ├── FrequencyFilter (min: 1-50 purchases)
  │   │   ├── RecencyFilter (days: 0-365)
  │   │   ├── LoyaltyTierFilter (bronze, silver, gold)
  │   │   └── Preview (matching customers count)
  │   ├── MessageComposer
  │   │   ├── TitleInput (max 255 chars)
  │   │   ├── BodyInput (max 1000 chars, FCM limit)
  │   │   ├── ActionURLInput
  │   │   ├── Template library (re-use past messages)
  │   │   └── Preview (iOS/Android rendering)
  │   ├── Scheduling
  │   │   ├── SendNow radio
  │   │   ├── ScheduleForLater radio + date/time picker
  │   │   └── RecurrenceOption (one-time, weekly, monthly)
  │   └── Review & Send (confirm button, final preview)
  └── CampaignAnalytics
      ├── DeliveryRate (sent/failed)
      ├── OpenRate (opened/sent)
      ├── TimeToOpen (avg hours)
      └── SegmentPerformance (VIP open rate vs Loyal)
```

**Audience Targeting SQL:**
```sql
-- Dynamic audience calculation
DECLARE @minSpend DECIMAL = 50.00
DECLARE @minFrequency INT = 3
DECLARE @maxRecencyDays INT = 60

SELECT DISTINCT c.ID, d.DeviceToken
FROM tblCustomer c
INNER JOIN tblDeviceToken d ON c.ID = d.CustomerID AND d.IsActive = 1
WHERE EXISTS (
    SELECT 1 FROM tblSales s
    WHERE s.CustomerID = c.ID
    GROUP BY s.CustomerID
    HAVING 
        SUM(s.SubTotal) >= @minSpend
        AND COUNT(*) >= @minFrequency
        AND DATEDIFF(day, MAX(s.SaleDateTime), GETDATE()) <= @maxRecencyDays
)
```

---

### 4. Menu Management Overlay (15% backend ready)

**Endpoints Already Implemented:**
- `GET /api/admin/menu/overrides` - List menu overrides
- `PUT /api/admin/menu/overrides/{itemId}` - Update override

**Constraint:** No POS schema changes. This is a read-only + overlay approach.

**Missing Implementation:**
- ❌ Real-time inventory visibility (OnHandQty from tblAvailableSize)
- ❌ Enable/disable items (overlay flag, not POS change)
- ❌ Price override (display alternative price without changing POS)
- ❌ Item recommendations (mark seasonal items, featured)
- ❌ Stock alert thresholds

**Database Schema:**
```sql
CREATE TABLE tblMenuOverlay (
    ID INT PRIMARY KEY IDENTITY,
    ItemID INT FOREIGN KEY tblItem,
    IsAvailable BIT DEFAULT 1, -- 1 = show in app, 0 = hide
    DisplayName NVARCHAR(255), -- Override POS name if different
    DisplayPrice DECIMAL(10,2) NULL, -- Override display (admin only, read-only to customer)
    IsSeasonalItem BIT DEFAULT 0,
    IsFeatured BIT DEFAULT 0,
    RecommendationReason NVARCHAR(500), -- "Popular on weekends", "Chef's special"
    LowStockThreshold INT DEFAULT 5,
    OutOfStockWarning BIT DEFAULT 0,
    ModifiedDate DATETIME,
    ModifiedBy INT FOREIGN KEY tblAdminUser
);

-- Read inventory real-time from POS
SELECT i.ID, i.IName, a.OnHandQty, o.IsAvailable
FROM tblItem i
INNER JOIN tblAvailableSize a ON i.ID = a.ItemID
LEFT JOIN tblMenuOverlay o ON i.ID = o.ItemID
WHERE i.Status = 1 AND i.OpenItem = 1
ORDER BY i.CategoryID, i.PrintOrder
```

**UI Components:**
```
MenuManagement/
  ├── CategoryList (from tblCategory)
  ├── ItemGrid (with real-time stock)
  │   ├── ItemCard
  │   │   ├── ItemImage (from ImageFilePath)
  │   │   ├── ItemName
  │   │   ├── StockBadge (red if < threshold)
  │   │   ├── AvailabilityToggle (enable/disable)
  │   │   ├── FeatureToggle (featured item badge)
  │   │   └── Actions (edit overlay, set threshold)
  │   └── BulkActions (enable all in category, export inventory)
  └── ItemDetailModal
      ├── BasicInfo (name, category, POS ID)
      ├── Pricing (POS price read-only, display override optional)
      ├── StockInfo (current qty, threshold, alerts)
      ├── Availability (enable/disable, reason)
      ├── Recommendation (seasonal?, featured?, reason)
      └── ActivityLog (last modified by, when)
```

**Real-time Stock Updates:**
```csharp
// New endpoint: Get current inventory
GET /api/Menu/inventory
Response:
{
  "items": [
    {
      "itemId": 101,
      "itemName": "Pizza Margherita",
      "stockQty": 2,
      "threshold": 5,
      "lowStockAlert": true,
      "isAvailable": true,
      "lastModified": "2026-03-06T14:30:00Z"
    }
  ]
}
```

---

### 5. Birthday Reward Automation (50% backend ready)

**Existing Implementation:**
- `BirthdayRewardBackgroundService` - Daily background task
- `BirthdayRewardService` - Core logic
- `tblCustomerProfile` overlay table for tracking

**Missing Implementation:**
- ❌ Birthday reward UI to configure rules
- ❌ Manual birthday reward trigger (admin can send to specific customer)
- ❌ Birthday message template management
- ❌ Opt-in/opt-out tracking

**Database Schema:**
```sql
CREATE TABLE tblBirthdayRewardConfig (
    ID INT PRIMARY KEY IDENTITY,
    RewardType NVARCHAR(50), -- 'Points', 'Discount', 'FreeBeverage'
    RewardValue INT, -- Points or discount %
    RewardExpiryDays INT DEFAULT 30, -- Expires in N days from birthday
    IsActive BIT DEFAULT 1,
    MessageTemplate NVARCHAR(MAX), -- "{FirstName}, here's your birthday reward!"
    CreatedBy INT FOREIGN KEY tblAdminUser,
    CreatedDate DATETIME,
    ModifiedDate DATETIME
);

CREATE TABLE tblBirthdayRewardRecipient (
    ID INT PRIMARY KEY IDENTITY,
    CustomerID INT FOREIGN KEY,
    RewardConfigID INT FOREIGN KEY,
    BirthdayDate DATE,
    RewardSentDate DATETIME,
    RewardUsedDate DATETIME NULL,
    OptedOut BIT DEFAULT 0,
    CreatedDate DATETIME
);
```

**UI Components:**
```
BirthdayRewards/
  ├── RewardConfigList
  │   ├── ConfigCard (type, value, status)
  │   ├── Edit button (modify rules)
  │   └── ToggleActive (enable/disable)
  ├── CreateConfig/
  │   ├── RewardType (Points, Discount %, Free Item)
  │   ├── RewardValue input
  │   ├── ExpiryDays input
  │   ├── MessageTemplate textarea (with preview)
  │   └── Save button
  └── ManualTrigger
      ├── CustomerSearch/autocomplete
      ├── SelectReward config
      ├── Preview (customer name, message)
      └── Send button (records in tblBirthdayRewardRecipient)
```

**Background Service Improvements:**
```csharp
// Already implemented: runs daily at midnight
// Check for birthdays in next 2 days
// Send FCM notification + record reward

// Missing: webhook confirmation (customer opened reward)
// Missing: audit trail (admin manual triggers)
```

---

### 6. Terminal Bridge Integration UI (0% ready - blocked)

**Status:** ⏳ BLOCKED - Awaiting client API documentation

**Requirements:**
- Client must provide: Verifone/Ingenico bridge API documentation
- Client must provide: Test credentials + sandbox environment
- Client must provide: POS posting rules (how bridge results integrate)

**Placeholder UI Structure:**
```
TerminalBridge/
  ├── BridgeStatus (connected/disconnected)
  ├── TransactionLog (recent bridge transactions)
  │   ├── TransactionID
  │   ├── Amount, Auth Code
  │   ├── Status (success/failed/pending)
  │   ├── POS PostStatus (posted/not posted)
  │   └── Timestamp
  └── Settings/
      ├── BridgeIPAddress input
      ├── BridgePort input
      ├── ApiKey input
      ├── TestConnection button
      └── Save settings
```

**Blocked Dependencies:**
- [ ] Bridge API documentation from client
- [ ] Test credentials and sandbox access
- [ ] POS posting integration rules (TransType, tender mapping)
- [ ] Error handling scenarios (timeout, declined, etc.)

---

### 7. Security & Authorization

**Authentication:**
```csharp
// JWT token stored in secure cookie (httpOnly)
// Roles: Admin, Manager, Cashier, Viewer
POST /api/auth/admin-login
  Credentials: email, password
  Returns: { token: "jwt...", expiresIn: 86400, user: { id, role } }

// Token verification middleware
[Authorize(Roles = "Admin")]
```

**Authorization Matrix:**
```
Feature                 Admin  Manager  Cashier  Viewer
─────────────────────────────────────────────────────
View Dashboard          ✓      ✓                  ✓
Refund/Cancel Order     ✓      ✓        ✓
Manage Campaigns        ✓      ✓
View Customer CRM       ✓      ✓        ✓        ✓
Manage Menu Overlay     ✓      ✓
Access Activity Logs    ✓
```

**Database:**
```sql
CREATE TABLE tblAdminUser (
    ID INT PRIMARY KEY IDENTITY,
    Email NVARCHAR(255) UNIQUE,
    PasswordHash NVARCHAR(MAX),
    FirstName NVARCHAR(255),
    LastName NVARCHAR(255),
    Role NVARCHAR(50), -- Admin, Manager, Cashier, Viewer
    IsActive BIT DEFAULT 1,
    LastLoginDate DATETIME,
    CreatedDate DATETIME
);
```

---

### 8. Activity Logging (30% backend ready)

**Implemented:**
- `IActivityLogRepository` - data access
- `POST /api/admin/logs` - retrieve logs
- Logging for: refunds, campaigns sent, menu changes

**Missing Implementation:**
- ❌ IP whitelisting rules
- ❌ Concurrent session limits (prevent multiple admins from same account)
- ❌ Log retention policies (purge after 90 days)
- ❌ Export logs to CSV

**Database:**
```sql
CREATE TABLE tblActivityLog (
    ID INT PRIMARY KEY IDENTITY,
    AdminUserID INT FOREIGN KEY tblAdminUser,
    Action NVARCHAR(255), -- 'RefundProcessed', 'CampaignSent', 'MenuUpdated'
    ResourceType NVARCHAR(100), -- 'Order', 'Campaign', 'MenuItem'
    ResourceID INT,
    OldValue NVARCHAR(MAX), -- JSON diff
    NewValue NVARCHAR(MAX), -- JSON diff
    IPAddress NVARCHAR(15),
    UserAgent NVARCHAR(500),
    Status NVARCHAR(50), -- Success, Failed
    ErrorMessage NVARCHAR(MAX),
    CreatedDate DATETIME
);

-- Retention policy: delete logs > 90 days old
-- (Configure in scheduled job)
```

**UI Components:**
```
ActivityLogs/
  ├── FilterBar
  │   ├── DateRangePicker
  │   ├── ActionTypeFilter (RefundProcessed, CampaignSent, ...)
  │   ├── AdminUserFilter (select dropdown)
  │   └── SearchBox (ResourceID)
  └── LogTable
      ├── Timestamp
      ├── Admin (who)
      ├── Action (what)
      ├── Resource (which order/campaign)
      ├── Status (success/failed)
      ├── ExpandRow (view diff, IP, user agent)
      └── ExportCSV button
```

---

## 📱 Admin Portal UI Layout

### Page Structure (Next.js App Router)

```
/admin
├── /dashboard
│   ├── page.tsx (KPIs, charts, queue)
│   └── components/
│       ├── SalesChart.tsx
│       ├── PopularItemsCard.tsx
│       └── OrderQueue.tsx
├── /orders
│   ├── page.tsx (orders table)
│   ├── [id]
│   │   └── page.tsx (order detail + refund)
│   └── components/
│       ├── OrderTable.tsx
│       ├── OrderDetailModal.tsx
│       └── RefundForm.tsx
├── /customers
│   ├── page.tsx (RFM segmentation)
│   ├── [id]
│   │   └── page.tsx (customer profile)
│   └── components/
│       ├── RFMChart.tsx
│       ├── CustomerTable.tsx
│       └── CustomerProfile.tsx
├── /campaigns
│   ├── page.tsx (campaign list)
│   ├── /create
│   │   └── page.tsx (campaign builder)
│   ├── [id]
│   │   └── page.tsx (campaign analytics)
│   └── components/
│       ├── CampaignList.tsx
│       ├── CampaignBuilder.tsx
│       ├── AudienceBuilder.tsx
│       └── CampaignAnalytics.tsx
├── /menu
│   ├── page.tsx (menu grid)
│   ├── [id]
│   │   └── page.tsx (item detail)
│   └── components/
│       ├── MenuGrid.tsx
│       ├── ItemCard.tsx
│       └── InventoryBadge.tsx
├── /rewards
│   ├── page.tsx (birthday rewards config)
│   └── components/
│       ├── RewardConfigList.tsx
│       ├── RewardConfigForm.tsx
│       └── ManualRewardTrigger.tsx
├── /logs
│   ├── page.tsx (activity logs)
│   └── components/
│       ├── LogTable.tsx
│       └── LogFilters.tsx
├── /settings
│   ├── page.tsx (admin users, IP whitelist)
│   └── components/
│       ├── AdminUserManager.tsx
│       └── IPWhitelistManager.tsx
└── layout.tsx (auth wrapper, sidebar nav, headers)
```

### Shared Components

```
components/
├── Navigation
│   ├── AdminSidebar.tsx (menu: Dashboard, Orders, Customers, etc.)
│   ├── AdminHeader.tsx (user dropdown, notifications, logout)
│   └── BreadcrumbNav.tsx
├── Tables
│   ├── DataTable.tsx (generic, sortable, paginated)
│   ├── OrderTable.tsx (custom: actions column)
│   └── CustomerTable.tsx (custom: segment badge)
├── Forms
│   ├── RefundForm.tsx
│   ├── CampaignForm.tsx
│   ├── MenuOverrideForm.tsx
│   └── RewardConfigForm.tsx
├── Charts
│   ├── SalesChart.tsx (recharts)
│   ├── RFMChart.tsx (donut: segments)
│   ├── CampaignPerformance.tsx (line: open rate trend)
│   └── InventoryChart.tsx (bar: stock levels)
├── Dialogs
│   ├── ConfirmDialog.tsx (generic)
│   ├── RefundConfirmDialog.tsx
│   └── CancelOrderConfirmDialog.tsx
└── Loading
    ├── Skeleton.tsx
    └── LoadingSpinner.tsx
```

---

## 🗄️ Database Schema Changes

### IntegrationService Database

```sql
-- 1. Admin Users (Auth)
CREATE TABLE tblAdminUser (
    ID INT PRIMARY KEY IDENTITY,
    Email NVARCHAR(255) UNIQUE NOT NULL,
    PasswordHash NVARCHAR(MAX) NOT NULL,
    FirstName NVARCHAR(255),
    LastName NVARCHAR(255),
    Role NVARCHAR(50) NOT NULL, -- Admin, Manager, Cashier, Viewer
    IsActive BIT DEFAULT 1,
    LastLoginDate DATETIME,
    CreatedDate DATETIME DEFAULT GETDATE()
);

-- 2. Menu Overlay
CREATE TABLE tblMenuOverlay (
    ID INT PRIMARY KEY IDENTITY,
    ItemID INT NOT NULL,
    IsAvailable BIT DEFAULT 1,
    DisplayName NVARCHAR(255),
    DisplayPrice DECIMAL(10,2) NULL,
    IsSeasonalItem BIT DEFAULT 0,
    IsFeatured BIT DEFAULT 0,
    RecommendationReason NVARCHAR(500),
    LowStockThreshold INT DEFAULT 5,
    OutOfStockWarning BIT DEFAULT 0,
    ModifiedDate DATETIME DEFAULT GETDATE(),
    ModifiedBy INT FOREIGN KEY REFERENCES tblAdminUser(ID),
    FOREIGN KEY (ItemID) REFERENCES tblItem(ID)
);

-- 3. Customer Profile (RFM & CRM)
CREATE TABLE tblCustomerProfile (
    ID INT PRIMARY KEY IDENTITY,
    CustomerID INT NOT NULL UNIQUE,
    Segment NVARCHAR(50), -- VIP, Loyal, Regular, At-Risk
    LastVisitDate DATETIME,
    VisitCount INT DEFAULT 0,
    TotalSpend DECIMAL(10,2) DEFAULT 0,
    AverageOrderValue DECIMAL(10,2) DEFAULT 0,
    LoyaltyPointsBalance INT DEFAULT 0,
    PreferredItems NVARCHAR(MAX), -- JSON array of ItemIDs
    Notes NVARCHAR(MAX),
    OptedOutBirthday BIT DEFAULT 0,
    OptedOutMarketing BIT DEFAULT 0,
    CreatedDate DATETIME DEFAULT GETDATE(),
    ModifiedDate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (CustomerID) REFERENCES tblCustomer(ID)
);

-- 4. Push Campaigns
CREATE TABLE tblPushCampaign (
    ID INT PRIMARY KEY IDENTITY,
    CampaignName NVARCHAR(255) NOT NULL,
    CampaignType NVARCHAR(50) NOT NULL, -- Transactional, Marketing, Birthday
    TargetSegment NVARCHAR(MAX), -- JSON filter rules
    MessageTitle NVARCHAR(255) NOT NULL,
    MessageBody NVARCHAR(1000) NOT NULL,
    ActionURL NVARCHAR(500),
    ImageURL NVARCHAR(500),
    ScheduledTime DATETIME,
    Status NVARCHAR(50) DEFAULT 'Draft', -- Draft, Scheduled, Sent, Failed
    RecipientsCount INT DEFAULT 0,
    DeliveredCount INT DEFAULT 0,
    FailedCount INT DEFAULT 0,
    OpenedCount INT DEFAULT 0,
    CreatedBy INT FOREIGN KEY REFERENCES tblAdminUser(ID),
    CreatedDate DATETIME DEFAULT GETDATE(),
    SentDate DATETIME,
    FOREIGN KEY (CreatedBy) REFERENCES tblAdminUser(ID)
);

CREATE TABLE tblCampaignRecipient (
    ID INT PRIMARY KEY IDENTITY,
    CampaignID INT NOT NULL,
    CustomerID INT NOT NULL,
    DeviceToken NVARCHAR(500),
    Status NVARCHAR(50) DEFAULT 'Queued', -- Queued, Sent, Failed
    SentDate DATETIME,
    OpenedDate DATETIME,
    ErrorMessage NVARCHAR(MAX),
    FOREIGN KEY (CampaignID) REFERENCES tblPushCampaign(ID),
    FOREIGN KEY (CustomerID) REFERENCES tblCustomer(ID)
);

-- 5. Birthday Rewards Config
CREATE TABLE tblBirthdayRewardConfig (
    ID INT PRIMARY KEY IDENTITY,
    RewardType NVARCHAR(50) NOT NULL, -- Points, Discount, FreeItem
    RewardValue INT NOT NULL,
    RewardExpiryDays INT DEFAULT 30,
    IsActive BIT DEFAULT 1,
    MessageTemplate NVARCHAR(MAX),
    CreatedBy INT FOREIGN KEY REFERENCES tblAdminUser(ID),
    CreatedDate DATETIME DEFAULT GETDATE(),
    ModifiedDate DATETIME DEFAULT GETDATE()
);

CREATE TABLE tblBirthdayRewardRecipient (
    ID INT PRIMARY KEY IDENTITY,
    CustomerID INT NOT NULL,
    RewardConfigID INT NOT NULL,
    BirthdayDate DATE,
    RewardSentDate DATETIME,
    RewardUsedDate DATETIME,
    OptedOut BIT DEFAULT 0,
    CreatedDate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (CustomerID) REFERENCES tblCustomer(ID),
    FOREIGN KEY (RewardConfigID) REFERENCES tblBirthdayRewardConfig(ID)
);

-- 6. Activity Logs (Audit Trail)
CREATE TABLE tblActivityLog (
    ID INT PRIMARY KEY IDENTITY,
    AdminUserID INT FOREIGN KEY REFERENCES tblAdminUser(ID),
    Action NVARCHAR(255), -- RefundProcessed, CampaignSent, MenuUpdated, etc.
    ResourceType NVARCHAR(100), -- Order, Campaign, MenuItem, Customer, etc.
    ResourceID INT,
    OldValue NVARCHAR(MAX), -- JSON before
    NewValue NVARCHAR(MAX), -- JSON after
    IPAddress NVARCHAR(15),
    UserAgent NVARCHAR(500),
    Status NVARCHAR(50) DEFAULT 'Success', -- Success, Failed
    ErrorMessage NVARCHAR(MAX),
    CreatedDate DATETIME DEFAULT GETDATE()
);

-- 7. IP Whitelist (Security)
CREATE TABLE tblIPWhitelist (
    ID INT PRIMARY KEY IDENTITY,
    IPAddress NVARCHAR(15),
    Description NVARCHAR(255),
    IsActive BIT DEFAULT 1,
    CreatedBy INT FOREIGN KEY REFERENCES tblAdminUser(ID),
    CreatedDate DATETIME DEFAULT GETDATE()
);

-- Views for RFM calculation
CREATE VIEW vwCustomerRFM AS
SELECT 
    c.ID,
    c.FName,
    c.LName,
    c.Phone,
    c.Email,
    DATEDIFF(day, ISNULL(MAX(s.SaleDateTime), c.CreateDate), GETDATE()) AS RecencyDays,
    COUNT(DISTINCT s.ID) AS Frequency,
    ISNULL(SUM(s.SubTotal + s.GSTAmt + s.PSTAmt + s.PST2Amt - s.DSCAmt), 0) AS Monetary,
    CASE 
        WHEN ISNULL(SUM(s.SubTotal), 0) > 500 AND DATEDIFF(day, MAX(s.SaleDateTime), GETDATE()) < 30 THEN 'VIP'
        WHEN ISNULL(SUM(s.SubTotal), 0) > 200 THEN 'Loyal'
        WHEN DATEDIFF(day, MAX(s.SaleDateTime), GETDATE()) > 90 THEN 'At-Risk'
        WHEN COUNT(DISTINCT s.ID) = 1 THEN 'New'
        ELSE 'Regular'
    END AS Segment
FROM tblCustomer c
LEFT JOIN tblSales s ON c.ID = s.CustomerID AND s.TransType = 1
WHERE c.CreateDate <= DATEADD(day, -1, GETDATE())
GROUP BY c.ID, c.FName, c.LName, c.Phone, c.Email, c.CreateDate;
```

---

## 🔌 API Endpoints Summary

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/dashboard/summary` | KPI dashboard | Manager+ |
| GET | `/api/admin/dashboard/sales-chart` | Sales trends | Manager+ |
| GET | `/api/admin/dashboard/popular-items` | Top items | Manager+ |
| GET | `/api/admin/orders/queue` | Order queue | Cashier+ |
| POST | `/api/admin/orders/{id}/refund` | Process refund | Manager+ |
| GET | `/api/admin/customers/segments` | RFM segments | Manager+ |
| GET | `/api/admin/customers/{id}/history` | Customer profile | Manager+ |
| GET | `/api/admin/campaigns` | List campaigns | Manager+ |
| POST | `/api/admin/campaigns` | Create campaign | Manager+ |
| POST | `/api/admin/campaigns/{id}/send` | Send campaign | Manager+ |
| GET | `/api/admin/menu/overrides` | Menu overlay | Manager+ |
| PUT | `/api/admin/menu/overrides/{id}` | Update override | Manager+ |
| GET | `/api/admin/logs` | Activity logs | Admin |
| POST | `/api/auth/admin-login` | Admin login | Public |

---

## 📅 Implementation Timeline

| Phase | Features | Duration | Notes |
|-------|----------|----------|-------|
| **Phase 1** | Dashboard + Order Queue + UI Scaffold | 2 weeks | Frontend + connect to backend |
| **Phase 2** | Customer CRM + RFM | 1 week | RFM calculation + segmentation UI |
| **Phase 3** | Campaign Builder + Notification | 1.5 weeks | Audience targeting + scheduling |
| **Phase 4** | Menu Overlay + Birthday Rewards | 1 week | Inventory sync + reward triggers |
| **Phase 5** | Security (Auth, Logs, IP Whitelist) | 1 week | JWT, role-based access, audit trail |
| **Phase 6** | Testing + Deployment | 1 week | E2E tests, staging, prod deploy |

**Total: ~8 weeks**

---

## ✅ Acceptance Criteria for M4

- [ ] All 7 feature areas fully implemented (Terminal Bridge = placeholder only)
- [ ] Admin portal deployed to production
- [ ] All CRUD operations maintain SSOT: read from POS, write through backend
- [ ] Activity logs record all admin actions with IP + timestamp
- [ ] Role-based access control enforced (Admin/Manager/Cashier/Viewer)
- [ ] Dashboard shows real-time KPIs from POS database
- [ ] Order refunds/cancellations reverse inventory and create audit logs
- [ ] RFM segmentation auto-updates weekly
- [ ] Campaign targeting filters work correctly (spend > X, frequency > N, etc.)
- [ ] Menu overlay enables/disables items without modifying POS
- [ ] Birthday rewards trigger automatically for qualifying customers
- [ ] All endpoints tested with Jest + integration tests
- [ ] Performance: dashboard loads in < 2 seconds
- [ ] Mobile responsive (tablet + mobile admin access)
- [ ] Accessibility: WCAG 2.1 Level AA
- [ ] Production ready: error handling, logging, monitoring

---

## 📝 Blocking Dependencies (M4 → M5)

- [ ] Verifone/Ingenico bridge API documentation (blocks Terminal Bridge UI)
- [ ] Bridge sandbox credentials (blocks Terminal Bridge testing)
- [ ] POS posting integration rules (blocks Terminal Bridge implementation)

---

## 💰 Cost Breakdown

- Admin Portal UI (Dashboard, Orders, Customers, Campaigns): $400
- Menu Management + Inventory Integration: $150
- Birthday Rewards + Automation: $150
- Security, Auth, Activity Logs: $150
- Database Migrations + Testing: $150

**Total: $1,000**

---

## 📚 References

- Backend AdminPortalService: `/src/backend/IntegrationService.Core/Services/AdminPortalService.cs`
- Admin Controller: `/src/backend/IntegrationService.API/Controllers/AdminController.cs`
- Activity Log Repo: `/src/backend/IntegrationService.Infrastructure/Data/ActivityLogRepository.cs`
- POS Repository: `/src/backend/IntegrationService.Infrastructure/Data/PosRepository.cs`

---

**Status:** Ready for implementation  
**Prepared by:** Claude Code Assistant  
**Date:** March 6, 2026
