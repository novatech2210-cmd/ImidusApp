The milestone-4-admin.md quality gate document is well-conceived and covers the essential production-readiness aspects for a merchant/admin portal in this legacy POS-integrated project. It correctly emphasizes security (RBAC), performance on SQL Server 2005, overlay pattern for menu changes, RFM caching, audit logging, and automation verification — all critical given the constraints.
Strengths (Keep These)

Strong focus on not touching the POS schema (menu overlay, scheduled orders elsewhere, RFM via cached results).
Correct warning about RFM query performance — 2005-era SQL Server can choke on large tblSales without indexes or caching.
Audit logging requirement → Excellent for compliance and debugging.
Birthday service verification → Ties nicely to earlier FCM skill.
Delivery artifacts realistic for a Next.js admin app.

Corrections / Improvements Needed (March 2026 Context)

RBAC / Roles
The doc mentions "Managers can view reports while Cashiers/Staff cannot" — but earlier skills don't define roles yet.
Clarify: Use JWT claims (e.g., role: "manager" | "admin" | "cashier") or a simple AdminUsers table in IntegrationService.

Menu Overlay
Good pattern, but add cache invalidation strategy (e.g., Redis key TTL, or API endpoint /api/menu/refresh for forced flush).
60-second propagation is ambitious without pub/sub; realistic target: 5–15 min or manual.

RFM & Performance
Add explicit caching recommendation (e.g., store segment counts/members in IntegrationService.RFMCache with LastRefreshed timestamp).
Suggest materialized views or indexed views if possible (2005 supports indexed views, but limited).

Charts / Data Viz
Use aggregated pre-computed data (daily/weekly sales summaries in overlay table) to avoid live SUM/COUNT over years of tblSales.

Security Additions
Rate limiting on admin endpoints.
CSRF protection (Next.js middleware).
No sensitive POS creds in frontend env.

Testing
Add scenario for concurrent admin actions (e.g., two managers disabling same item).


Updated & Refined Milestone 4 Skill File
Here's a polished, accurate version ready to save as milestone-4-admin.md:
Markdown---
name: milestone-4-admin
description: Quality gate for Milestone 4 (Merchant/Admin Portal). Ensures secure Next.js admin dashboards with RBAC, RFM CRM segmentation, push campaign tools, menu overlay management, audit logging, and automated birthday rewards — all without modifying the legacy POS schema.
color: indigo
icon: dashboard
---

# Milestone 4: Merchant / Admin Portal (Next.js)

**Goal**: Provide restaurant owners/managers with tools to monitor sales, manage online menu availability, run targeted marketing (push + loyalty), view CRM/RFM segments, and automate birthday rewards — while respecting SQL Server 2005 constraints.

## Production-Ready Checklists

### 1. Data Integrity & Security
- [ ] **Role-Based Access Control (RBAC)**: JWT claims enforce roles (`admin`, `manager`, `cashier` if implemented).  
  - Managers: View reports, CRM, campaigns  
  - Cashiers/Staff: No access (or read-only order view if added later)
- [ ] **Audit Logging**: Every write/action logged to `IntegrationService.ActivityLog` (AdminId, Action, Details, Timestamp).
- [ ] **Data Visualization**: Charts (daily sales, order volume, top items) use **pre-aggregated** overlay tables (e.g., `DailySalesSummary`) to avoid live heavy SUM/COUNT on `tblSales`.
- [ ] **Security Headers & CSRF**: Next.js middleware enables CSP, X-Frame-Options, strict CSP; CSRF tokens on forms.

### 2. Marketing & CRM Features
- [ ] **RFM Segmentation Engine**: 2005-compatible SQL queries for Recency/Frequency/Monetary segments.  
  - Preview audience count shown before campaign send.  
  - Results cached in `IntegrationService.RFMCache` (TTL ≥30 min, refreshed via cron/job).
- [ ] **Push Campaign Builder**: Form allows title/body/audience selection; preview shows estimated recipients; send triggers FCM multicast via backend.
- [ ] **Birthday Automation**: `BirthdayRewardService` background job runs daily, adds points, sends FCM birthday message, marks sent in `CustomerBirthdayTracking`.

### 3. Menu Overlay & POS Integration Efficiency
- [ ] **Online Menu Toggles**: Disable/enable items/categories via `IntegrationService.MenuOverlay` table (no writes to POS `tblItem`).  
  - Overlay fields: ItemID, IsOnlineDisabled, Reason, UpdatedBy, UpdatedAt.
- [ ] **Cache Invalidation**: Menu changes propagate to mobile/web within reasonable time (target 60s–5min via cache TTL or manual `/api/menu/refresh` endpoint).
- [ ] **Performance**: Admin dashboard loads <3s even on large datasets; no unpaginated full-table scans.

## Technical Proof Points

### Activity Logging (Mandatory on Every Write)
```csharp
// In AdminController or service
await _activityRepo.LogAsync(new ActivityLog
{
    AdminId = currentUser.Id,
    Action = "DISABLE_ITEM",
    EntityType = "MenuItem",
    EntityId = itemId.ToString(),
    Details = $"Item {itemId} disabled for online orders by {currentUser.Name}",
    IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
    Timestamp = DateTime.UtcNow
});
RFM Performance & Caching
Warning: Never run full RFM queries on page load — tblSales can be millions of rows on 2005 hardware.
Correct pattern:

Cron job (every 30–60 min) runs RFM SQL → Stores segment membership/counts in IntegrationService.RFMCache (JSON or normalized table).
Admin UI reads from cache only.
Example cache refresh trigger: BackgroundService or Hangfire job.

Menu Overlay Read Pattern (Backend API)
C#// MenuService.cs
public async Task<bool> IsItemOnlineAvailable(int itemId)
{
    var overlay = await _overlayRepo.GetMenuOverlayAsync(itemId);
    return overlay?.IsOnlineDisabled != true; // default to POS value if no override
}
E2E Manual Test Scenarios

































ScenarioExpected ResultCreate & send targeted push campaignAudience preview shows correct count; send → FCM multicast; logs in ActivityLogDisable item in menu overlayItem hidden in mobile/web within cache TTL; POS tblItem untouchedView customer CRM detailShows aggregated order history (TransType=1 only) from tblSalesManual birthday reward triggerPoints added, FCM sent, CustomerBirthdayTracking marked for today's birthdaysConcurrent admin actionsSecond disable attempt logged; no race conditions (optimistic concurrency)Low-privilege user accessCashier role (if exists) cannot see CRM/reports; 403 on restricted routes
Delivery Artifacts

Admin App Build: .next folder (or next build output) packaged as .tar.gz.
Source Code: src/web/imidus-admin directory with:
.env.example (no secrets committed)
Secure auth setup (JWT middleware, role guards)

Database Overlay: Migration scripts / schema DDL for all IntegrationService tables used:
ActivityLog, RFMCache, MenuOverlay, PushCampaigns, CustomerBirthdayTracking, etc.

Documentation: README.md including:
Setup & run instructions
Required env vars (API base, JWT secret, etc.)
RBAC role definitions
How to trigger/test birthday & RFM jobs


Milestone Sign-Off Gate: All checkboxes green + client-verified RBAC, RFM accuracy, menu overlay propagation, audit trail, and birthday automation. No direct writes to POS tables during testing.
Last Updated: March 17, 2026 – Added RBAC clarity, cache strategy, indexed view suggestion, concurrent test scenario.
text
