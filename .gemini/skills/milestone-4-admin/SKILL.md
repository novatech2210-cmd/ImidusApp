---
name: milestone-4-admin
description: Quality gate for Milestone 4 (Merchant/Admin Portal). Ensures production-ready admin dashboards, CRM with RFM segmentation, and automated birthday rewards.
---

# Milestone 4: Merchant / Admin Portal

## Production-Ready Checklists

### 1. Data Integrity & Security

- [ ] **Role-Based Access**: Verifying that Managers can view reports while Cashiers/Staff (if added) cannot.
- [ ] **Data Visualization**: Charts (Sales, Order Volume) use aggregated data to avoid performance lag on SQL 2005.
- [ ] **Audit Logs**: Every admin action (e.g., manual item disable) is logged in `IntegrationService.ActivityLog`.

### 2. Marketing & CRM

- [ ] **RFM Engine**: SQL queries for Segmenting customers (Spend/Frequency/Recency) verified as 2005-compatible.
- [ ] **Push Campaign Builder**: Audience count preview works before sending.
- [ ] **Birthday Automation**: Background service `BirthdayRewardService` verified for daily execution.

### 3. Menu Overlay Efficiency

- [ ] **Menu Toggles**: Disabling an item in Admin updates the `MenuOverlay` table without touching POS `tblItem`.
- [ ] **Cache Flushing**: Mobile/Web apps see menu changes within 60 seconds (or manual refresh).

---

## Technical Proof points

### Activity Logging

Every write in the admin portal MUST be logged.

```csharp
await _activityRepo.LogAsync(new ActivityLog {
    AdminId = userId,
    Action = "DISABLE_ITEM",
    Details = $"Item {itemId} disabled for online orders",
    Timestamp = DateTime.UtcNow
});
```

### RFM Performance

Ensure `COUNT` and `SUM` queries on `tblSales` use indexes where possible (likely `SaleDateTime` or `CustomerID`).

> [!WARNING]
> Do NOT run RFM queries on every page load. Cache results for at least 30 minutes in the `IntegrationService` DB.

---

## E2E Test Scenarios (Manual)

| Scenario             | Expected Result                                                                 |
| -------------------- | ------------------------------------------------------------------------------- |
| Create Push Campaign | Preview shows 50 targeted users; Send button triggers FCM broadcast.            |
| Disable Burger Item  | Item immediately disappears from Mobile/Web menus.                              |
| View CRM Detail      | Shows full order history from `tblSales` (completed only).                      |
| Birthday Trigger     | Manual trigger of birthday service sends points to users with today's birthday. |

---

## Delivery Artifacts

- **Admin App**: `.next` build directory.
- **Source**: `src/web/imidus-admin` with secure environment variables.
- **Database**: Migration scripts for `IntegrationService` overlay tables.
