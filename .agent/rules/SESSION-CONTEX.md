# SESSION-CONTEXT.md — IMIDUS / TOAST Project
**Last Updated:** March 22, 2026
**Agency:** Novatech | **Developer:** Chris | **Client:** Sung Bin Im — Imidus Technologies

---

## Project Identity

**Project Codename:** TOAST
**Full Name:** IMIDUS Restaurant POS Integration Platform
**Contract Value:** $6,000 | **Repo:** https://github.com/novatech642/pos-integration
**Delivery Target:** AWS S3 → `s3://inirestaurant/novatech/` → Azure (Production)

---

## Critical Architecture Constraint (Read First)

> **The `backend-legacy` service IS the backend and database.**

The backend is a **.NET 9 Web API** (`IntegrationService.API`) that integrates directly with **SQL Server 2005 Express** (`INI_Restaurant`) — a legacy Delphi-based POS system. There is **no separate modern database**. The POS SQL Server is the single source of truth (SSOT) for all data: menu, orders, customers, loyalty.

- **Never** reference a separate backend or secondary database.
- **Never** modify the POS schema or source code.
- The backend overlay (`IntegrationService` DB) holds only ephemeral state: scheduled orders, FCM tokens, notification campaigns.
- All reads/writes go through the `.NET 9 API` → `Dapper` → `INI_Restaurant` SQL Server.

---

## Technology Stack

| Layer | Technology | Notes |
|---|---|---|
| Backend API | .NET 9 Web API | `src/backend/IntegrationService.API/` |
| Legacy DB | SQL Server 2005 Express | `INI_Restaurant` — POS SSOT |
| Overlay DB | SQL Server | `IntegrationService` — ephemeral state only |
| ORM | Dapper | Direct SQL, no schema changes |
| Web Frontend | Next.js 16 | `src/web/` — customer ordering |
| Admin Portal | Next.js 14 | `src/admin/` — merchant dashboard |
| Mobile | React Native 0.74 | `src/mobile/ImidusCustomerApp/` |
| Payments | Authorize.net | Tokenization, sandbox: card `4111111111111111` |
| Push | Firebase FCM | Notification campaigns |
| Infra | AWS S3 + Azure | Static assets → S3, backend → Azure |

---

## Milestone Status (as of March 17, 2026)

| # | Milestone | Value | Status | % |
|---|---|---|---|---|
| M1 | Architecture & Setup | $800 | ✅ Complete | 100% |
| M2 | Mobile Apps (iOS & Android) | $1,800 | ⚠️ APK v2 exists, rebuild blocked | 85% |
| M3 | Customer Web Platform | $1,200 | 🔄 In Progress | 70% |
| M4 | Merchant / Admin Portal | $1,000 | 📅 Scheduled | 20% |
| M5 | Bridge, QA & Deployment | $1,200 | ⏳ Partial (S3 uploaded) | 10% |

**Overall: ~65% complete**

---

## Current Build & Service Status

| Component | Build | Runtime | Port | Notes |
|---|---|---|---|---|
| Backend (.NET 9) | ✅ PASS | ✅ Running | :5004 | Upgraded from .NET 8 |
| Web (Next.js 16) | ✅ PASS | ✅ Running | :3000 | 31 routes |
| Admin (Next.js 14) | ✅ PASS | ✅ Running | :3001 | 12 routes |
| Mobile (RN 0.74) | ❌ TS errors | ⚠️ APK v2 | — | Last built Mar 5, 59MB |

### Local URLs
- Backend: `http://localhost:5004`
- Web: `http://localhost:3000`
- Admin: `http://localhost:3001`

### Tunnel URLs (temporary)
- Web: `https://foolish-swan-30.loca.lt`
- Admin: `https://cuddly-bullfrog-25.loca.lt`

### S3 Artifacts
- Web: `https://inirestaurant.s3.amazonaws.com/novatech/web/`
- Admin: `https://inirestaurant.s3.amazonaws.com/novatech/admin/`

---

## API Endpoint Status

| Endpoint | Status | Notes |
|---|---|---|
| `GET /api/Sync/status` | ✅ (503 without DB) | SyncController added |
| `GET /health` | ✅ | Added in latest update |
| `GET /stats` | ✅ | Added in latest update |
| `GET /api/Menu/categories` | ⚠️ 500 without DB | Expected dev behavior |
| `POST /api/Auth/login` | ⚠️ 400 | Requires `Idempotency-Key` header |
| `POST /api/Orders/process` | ⚠️ 400 | Requires `Idempotency-Key` header |

> **Note:** 503/500 errors are expected in dev — no SQL Server connected. In production with `INI_Restaurant` connected, all endpoints resolve correctly.

---

## Known Issues

| Issue | Impact | Fix |
|---|---|---|
| No DB connected | API 503/500 | Connect production SQL Server |
| Mobile TS errors (24+) | Cannot rebuild APK | Fix missing theme exports: `gray`, `goldButton`, `elevation0`, `FontFamily`, etc. |
| M4 features incomplete | Admin portal partial | RFM queries, birthday automation, SSE/WebSocket pending |

---

## POS Database — Key Tables (Read-Only)

| Table | Purpose |
|---|---|
| `tblItem` | Menu items |
| `tblAvailableSize` | Sizes and prices |
| `tblCategory` | Menu categories |
| `tblSales` | Orders |
| `tblCustomer` | Customer records |
| `tblPointsDetail` | Loyalty points |
| `tblPendingOrders` | Overlay: scheduled orders |
| `tblPayment` | Payment records |

---

## Imperial Onyx — Design System

### Overview
**Creative North Star: The Sovereign Merchant.**
Imperial Onyx is the design system for this platform. It rejects the standard SaaS dashboard aesthetic in favor of a luxury brand experience — deep authoritative navy foundations, gold-accented shimmer, intentional white space, and high-contrast tonal layering for executive clarity.

---

### Colors

| Token | Value | Usage |
|---|---|---|
| Primary (Midnight Navy) | `#0A1F3D` | Backgrounds, buttons, containers |
| Accent (Imperial Gold) | `#D4AF37` | Shimmer, secondary CTAs, highlights |
| Surface | `#FFFFFF` | Pure white canvas |
| Surface Container Low | — | Secondary dashboard modules |
| Surface Container Highest | — | Slate-toned preview backgrounds |
| Outline Variant | 10% opacity | Internal input grouping only |

**Rules:**
- **No-Line Rule:** Section separation via color blocks or background shifts. `1px` borders strictly limited to `outline_variant` at 10% opacity.
- **Glass & Gradient Rule:** `backdrop-blur-xl` (24px) + 80% opacity for persistent nav bars and floating footers.
- **Hero Sections:** Solid primary `#0A1F3D` background with internal 10% white borders ("Blue Container" style).
- **No hard black.** Always use Primary Navy (`#0A1F3D`) for text to maintain tonal depth.
- **No standard blue for links.** Use Navy or Gold only.

---

### Typography

**Font:** Plus Jakarta Sans — geometric, modern-classic.

| Scale | Size | Weight | Tracking | Usage |
|---|---|---|---|---|
| Display | 3rem / 48px | Black | `-0.05em` | Impact numbers |
| Headline | 1.5rem / 24px | Bold | — | Section titles |
| Body | 0.875rem / 14px | Medium | `leading-relaxed` | Campaign messages |
| Label | 9px–11px | Bold | `0.2rem–0.25rem` | Uppercase micro-labels |

**Rules:**
- Mix font weights (Black + Light) within logos/headlines for visual tension.
- All labels under 12px → extreme letter spacing, uppercase.

---

### Elevation & Depth

| Shadow | Usage |
|---|---|
| `shadow-sm` | Standard interactive cards |
| `shadow-xl` | Primary CTA buttons, floating action panels |
| `shadow-2xl` | Persistent mobile nav, modals |

**Glassmorphism:** Navigation headers → `blur(24px)` to ghost content through for scroll context.
**Layering:** Dark containers (`#0A1F3D`) anchor the eye; surrounded by high-elevation white surfaces.

---

### Components

| Component | Spec |
|---|---|
| **Buttons (Primary)** | Solid Navy, uppercase, `letter-spacing: 0.25rem` |
| **Buttons (Secondary)** | Gold shimmer gradient overlay — signals premium |
| **Cards** | `border-radius: 1rem`, `surface_container_low` unselected, solid Primary for metrics |
| **Inputs** | Borderless; `surface_container` background defines the area |
| **Progress Bars** | 4px height. Active: Primary Navy. Inactive: Slate-200 |
| **Phone Frames** | Deep shadows on all preview/mock screens to ground digital in reality |

---

### Do's and Don'ts

| ✅ Do | ❌ Don't |
|---|---|
| Extreme letter spacing on labels < 12px | Use standard blue for links |
| Mix Black + Light weights in headlines | Use hard black `#000000` for text |
| Use phone frames with deep shadows for previews | Use 1px borders for section separation |
| Use navy/gold for all interactive affordances | Use generic SaaS card styles |
| `backdrop-blur-xl` for nav and floating footers | Use flat, zero-depth layouts |

---

## Project File Structure

```
src/
├── backend/
│   ├── IntegrationService.API/          # .NET 9 Web API (backend-legacy)
│   ├── IntegrationService.Core/         # Domain, interfaces
│   ├── IntegrationService.Infrastructure/  # Dapper repos → SQL Server 2005
│   └── IntegrationService.Tests/        # Unit tests
├── web/                                  # Next.js 16 — customer ordering
├── admin/                                # Next.js 14 — merchant portal
└── mobile/
    └── ImidusCustomerApp/               # React Native 0.74
```

---

## Next Steps

1. **Connect SQL Server** — unblock all API endpoints from 503/500.
2. **Fix mobile TS errors** — restore APK rebuild capability.
3. **Complete M4** — RFM segmentation, birthday automation, real-time order updates (SSE/WebSocket).
4. **M5 Deployment** — Azure backend deploy, SSL, domain mapping.
5. **QA & Sign-off** — full checklist against SSOT compliance.
