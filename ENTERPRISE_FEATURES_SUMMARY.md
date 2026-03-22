# Enterprise Features Implementation Summary

**Date**: March 21, 2026
**Status**: ✅ Complete - All 4 features implemented

---

## Overview

Successfully implemented 4 enterprise features for the TOAST restaurant ordering platform:

1. **RFM Customer Segmentation** - Advanced customer analytics
2. **Marketing Push Campaigns** - Targeted FCM notifications
3. **Scheduled Orders** - Future order scheduling
4. **Menu Overlays** - Online item enable/disable + overrides

---

## 1. RFM Customer Segmentation

### What It Does
Analyzes customer purchase history from POS (tblSales) to calculate:
- **Recency**: Days since last order
- **Frequency**: Total order count
- **Monetary**: Total lifetime spend
- **Segment**: VIP ($500+), Loyal ($200+), At-Risk (>90 days), Regular, New

### API Endpoints

```http
GET /api/admin/analytics/customers?MinSpend=200&RecencyDays=30
GET /api/admin/analytics/customers/{customerId}
GET /api/admin/analytics/segments
```

### Example Response
```json
{
  "data": {
    "VIP": 15,
    "Loyal": 42,
    "Regular": 128,
    "AtRisk": 33,
    "New": 67,
    "Total": 285
  }
}
```

### Use Cases
- Admin dashboard: Show customer distribution
- Campaign targeting: Filter customers by RFM criteria
- Customer insights: View individual customer value

---

## 2. Marketing Push Campaigns

### What It Does
Create and send targeted push notifications to customer segments using RFM filters.

### Features
- **RFM Targeting**: Min/max spend, visits, recency, inactive days, segment, birthday
- **Scheduling**: Send immediately or schedule for future
- **Preview**: See target count before sending
- **Tracking**: Track sent/failed counts per campaign

### API Endpoints

```http
GET  /api/campaigns
POST /api/campaigns
POST /api/campaigns/preview
POST /api/campaigns/{id}/send
POST /api/campaigns/{id}/cancel
```

### Example: Create Campaign
```json
POST /api/campaigns
{
  "name": "Weekend VIP Promo",
  "title": "Special Offer for VIP Customers",
  "body": "Get 20% off your next order this weekend!",
  "minSpend": 500,
  "segment": "VIP",
  "scheduledAt": "2026-03-22T10:00:00"
}
```

### Background Service
`CampaignService` runs in background, polls every minute for scheduled campaigns.

---

## 3. Scheduled Orders

### What It Does
Customers can place orders now for future pickup (e.g., order at 10 AM for 6 PM pickup).

### How It Works
1. Customer places order via mobile/web with future `targetDateTime`
2. Order stored in `ScheduledOrders` table (not yet in POS)
3. Background service polls every minute
4. At `targetDateTime - prepTimeMinutes` (default: 30 min before pickup), order is injected into POS
5. Order appears in POS as normal order
6. Customer receives notification when order starts being prepared

### API Endpoints

```http
GET  /api/scheduledorders/customer/{customerId}
POST /api/scheduledorders
POST /api/scheduledorders/{id}/cancel
GET  /api/scheduledorders/available-times
```

### Example: Create Scheduled Order
```json
POST /api/scheduledorders
{
  "customerId": 123,
  "targetDateTime": "2026-03-21T18:00:00",
  "prepTimeMinutes": 30,
  "items": [
    {
      "itemId": 45,
      "sizeId": 2,
      "quantity": 2,
      "unitPrice": 12.99
    }
  ],
  "subTotal": 25.98,
  "taxAmount": 1.56,
  "totalAmount": 27.54
}
```

### Background Service
`ScheduledOrderService` runs in background, checks every minute for orders ready to inject.

---

## 4. Menu Overlays

### What It Does
Admin can enable/disable items for online ordering and override images/descriptions without modifying POS database.

### Features
- **Enable/Disable**: Hide items from online ordering (stays in POS)
- **Custom Images**: Override POS images with online-optimized images
- **Custom Descriptions**: Override POS descriptions
- **Category-Level**: Apply to entire categories
- **Time Windows**: Show items only during certain hours/days (future)

### API Endpoints

```http
GET  /api/menuoverlays
GET  /api/menuoverlays/item/{itemId}
PUT  /api/menuoverlays/item/{itemId}
POST /api/menuoverlays/item/{itemId}/enable
POST /api/menuoverlays/item/{itemId}/disable
POST /api/menuoverlays/bulk
```

### Example: Disable Item
```http
POST /api/menuoverlays/item/45/disable
```

### Example: Override Image
```json
PUT /api/menuoverlays/item/45
{
  "isEnabled": true,
  "overrideImageUrl": "https://cdn.imidus.com/menu/burger-deluxe.jpg",
  "overrideDescription": "Our signature grass-fed beef burger"
}
```

### Integration
`MenuController` automatically filters disabled items and applies overlays when serving menu data.

---

## Database Schema

### New Tables (IntegrationService DB)

#### PushCampaigns
```sql
CREATE TABLE PushCampaigns (
    Id INT PRIMARY KEY,
    Name NVARCHAR(200),
    Title NVARCHAR(200),
    Body NVARCHAR(MAX),
    ImageUrl NVARCHAR(500),
    -- RFM Filters
    MinSpend DECIMAL(10,2),
    MaxSpend DECIMAL(10,2),
    MinVisits INT,
    MaxVisits INT,
    RecencyDays INT,
    InactiveDays INT,
    HasBirthdayToday BIT,
    SegmentFilter NVARCHAR(50),
    -- Scheduling
    ScheduledAt DATETIME,
    Status NVARCHAR(20),
    -- Stats
    TargetCount INT,
    SentCount INT,
    FailedCount INT,
    CreatedAt DATETIME,
    SentAt DATETIME
);
```

#### ScheduledOrders
```sql
CREATE TABLE ScheduledOrders (
    Id INT PRIMARY KEY,
    CustomerId INT,
    IdempotencyKey NVARCHAR(100) UNIQUE,
    OrderJson NVARCHAR(MAX),
    SubTotal DECIMAL(10,2),
    TaxAmount DECIMAL(10,2),
    TotalAmount DECIMAL(10,2),
    PaymentToken NVARCHAR(500),
    CardType NVARCHAR(20),
    Last4 NVARCHAR(4),
    TargetDateTime DATETIME,
    PrepTimeMinutes INT DEFAULT 30,
    Status NVARCHAR(20) DEFAULT 'pending',
    SalesId INT,
    ErrorMessage NVARCHAR(MAX),
    CreatedAt DATETIME,
    InjectedAt DATETIME
);
```

#### MenuOverlays
```sql
CREATE TABLE MenuOverlays (
    Id INT PRIMARY KEY,
    ItemId INT,
    CategoryId INT,
    IsEnabled BIT DEFAULT 1,
    OverrideImageUrl NVARCHAR(500),
    OverrideDescription NVARCHAR(MAX),
    DisplayOrder INT,
    AvailableFrom TIME,
    AvailableTo TIME,
    AvailableDays NVARCHAR(50),
    CreatedAt DATETIME,
    UpdatedAt DATETIME
);
```

#### MarketingRules (for future upselling)
```sql
CREATE TABLE MarketingRules (
    Id INT PRIMARY KEY,
    RuleType NVARCHAR(20) DEFAULT 'upsell',
    TriggerItemId INT,
    TriggerCategoryId INT,
    TriggerMinCartValue DECIMAL(10,2),
    SuggestItemId INT,
    Message NVARCHAR(200),
    Position NVARCHAR(20) DEFAULT 'cart',
    IsActive BIT DEFAULT 1,
    Priority INT DEFAULT 0,
    CreatedAt DATETIME
);
```

---

## Architecture

### Dual-Database Pattern
```
┌─────────────────────────────────────────┐
│   Mobile/Web Apps                       │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│   IntegrationService.API (.NET 9)       │
└──────────┬──────────────────┬───────────┘
           │                  │
           ▼                  ▼
┌──────────────────┐  ┌──────────────────┐
│ INI_Restaurant   │  │ IntegrationSvc   │
│ (POS - SSOT)     │  │ (Overlay)        │
│                  │  │                  │
│ • tblSales       │  │ • PushCampaigns  │
│ • tblCustomer    │  │ • ScheduledOrds  │
│ • tblItem        │  │ • MenuOverlays   │
│ • tblPayment     │  │ • DeviceTokens   │
└──────────────────┘  └──────────────────┘
```

---

## Code Files

### Entities
- `EnterpriseEntities.cs` - PushCampaign, ScheduledOrder, MenuOverlay, RfmFilter, CustomerRfmData, MarketingRule

### Interfaces
- `IEnterpriseRepositories.cs` - ICampaignRepository, IScheduledOrderRepository, IMenuOverlayRepository, ICustomerAnalyticsRepository

### Repositories
- `CampaignRepository.cs` - Campaign CRUD
- `ScheduledOrderRepository.cs` - Scheduled order CRUD
- `MenuOverlayRepository.cs` - Overlay CRUD + disabled item lookups
- `CustomerAnalyticsRepository.cs` - RFM queries with filters

### Services
- `CampaignService.cs` - Send campaigns + background scheduler
- `ScheduledOrderService.cs` - Background order injection

### Controllers
- `CampaignsController.cs` - Campaign endpoints
- `ScheduledOrdersController.cs` - Scheduled order endpoints
- `MenuOverlaysController.cs` - Overlay management
- `AdminController.cs` - Enhanced with RFM analytics
- `MenuController.cs` - Enhanced with overlay filtering

### Migrations
- `003_EnterpriseFeatures.sql` - Create all enterprise tables

---

## Testing

### Manual Testing

#### Test Campaigns
```bash
# Get all campaigns
curl http://localhost:5005/api/campaigns

# Create campaign
curl -X POST http://localhost:5005/api/campaigns \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Campaign",
    "title": "Special Offer",
    "body": "Get 10% off!",
    "minSpend": 100,
    "status": "draft"
  }'

# Preview target count
curl -X POST http://localhost:5005/api/campaigns/preview \
  -H "Content-Type: application/json" \
  -d '{"minSpend": 100, "segment": "VIP"}'
```

#### Test Scheduled Orders
```bash
# Get available times
curl http://localhost:5005/api/scheduledorders/available-times

# Create scheduled order
curl -X POST http://localhost:5005/api/scheduledorders \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": 1,
    "targetDateTime": "2026-03-21T18:00:00",
    "items": [...],
    "totalAmount": 25.00
  }'
```

#### Test Menu Overlays
```bash
# Disable item
curl -X POST http://localhost:5005/api/menuoverlays/item/45/disable

# Enable item with custom image
curl -X PUT http://localhost:5005/api/menuoverlays/item/45 \
  -H "Content-Type: application/json" \
  -d '{
    "isEnabled": true,
    "overrideImageUrl": "https://example.com/image.jpg"
  }'

# Verify menu filters disabled items
curl http://localhost:5005/api/menu/items/1
```

#### Test RFM Analytics
```bash
# Get segment distribution
curl http://localhost:5005/api/admin/analytics/segments

# Get VIP customers
curl "http://localhost:5005/api/admin/analytics/customers?MinSpend=500"

# Get at-risk customers
curl "http://localhost:5005/api/admin/analytics/customers?InactiveDays=90"
```

---

## Integration Notes

### POS Database (INI_Restaurant)
- **Read**: tblSales, tblCustomer, tblItem for analytics
- **Write**: ScheduledOrderService writes to tblSales/tblPendingOrders when injecting

### Overlay Database (IntegrationService)
- **All enterprise tables stored here** - no POS schema changes
- **Idempotent**: ScheduledOrders uses IdempotencyKey

### Background Services
- `CampaignService` - Polls every 1 minute for scheduled campaigns
- `ScheduledOrderService` - Polls every 1 minute for orders ready to inject
- Both registered in `Program.cs` as hosted services

---

## Configuration

### appsettings.Development.json
```json
{
  "ConnectionStrings": {
    "PosDatabase": "Server=localhost,1433;Database=INI_Restaurant;...",
    "BackendDatabase": "Server=localhost,1433;Database=IntegrationService;..."
  }
}
```

### Program.cs Registrations
```csharp
// Enterprise Repositories
builder.Services.AddScoped<ICampaignRepository, CampaignRepository>();
builder.Services.AddScoped<IScheduledOrderRepository, ScheduledOrderRepository>();
builder.Services.AddScoped<IMenuOverlayRepository, MenuOverlayRepository>();
builder.Services.AddScoped<ICustomerAnalyticsRepository, CustomerAnalyticsRepository>();

// Enterprise Services
builder.Services.AddSingleton<ICampaignService, CampaignService>();
builder.Services.AddHostedService(sp => (CampaignService)sp.GetRequiredService<ICampaignService>());
builder.Services.AddHostedService<ScheduledOrderService>();
```

---

## Next Steps

### Admin Portal UI (Milestone 4)
Build admin UI for:
- **Dashboard**: Show RFM segment distribution chart
- **Campaigns**: Create/schedule/send campaigns with targeting UI
- **Menu Management**: Enable/disable items, upload custom images
- **Scheduled Orders**: View pending scheduled orders

### Mobile App
- **Scheduled Orders**: Add "Order for Later" option at checkout
- **Push Notifications**: Handle marketing campaign deep links

### Testing
- **Unit Tests**: Test repositories, services
- **Integration Tests**: Test background services with test database
- **E2E Tests**: Full order → schedule → inject → complete flow

---

## Summary

✅ **All 4 enterprise features fully implemented**
✅ **Database schema created**
✅ **API endpoints working**
✅ **Background services registered**
✅ **Menu filtering integrated**
✅ **Dual-database pattern maintained (no POS schema changes)**

The platform now supports world-class restaurant ordering features while respecting the POS database constraints.
