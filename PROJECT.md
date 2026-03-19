# PROJECT.md - TOAST Project Overview

**Project Name:** TOAST - IMIDUS Restaurant POS Integration  
**Client:** Sung Bin Im - Imidus Technologies  
**Date:** March 17, 2026  
**Status:** In Development - Milestone 3/5 Complete

---

## Project Description

Full-stack restaurant platform integrating with legacy INI POS (Point of Sale) system:

1. **Customer Mobile Apps** (iOS & Android) - React Native
2. **Customer Web Ordering** - Next.js 16
3. **Merchant/Admin Portal** - Next.js 14
4. **Backend Integration Service** - .NET 9 Web API

### Critical Challenge

INI POS is a Delphi-based Windows desktop app with **NO API or SDK**. All integration is via direct read/write to Microsoft SQL Server 2005 Express database. The POS source code is not available, and the database schema **cannot be modified**.

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Backend API | .NET 9 Web API |
| Database | SQL Server 2005 Express (legacy) |
| Mobile | React Native 0.74 |
| Web Frontend | Next.js 16 |
| Admin Portal | Next.js 14 |
| Payments | Authorize.net (tokenization) |
| ORM | Dapper (direct SQL) |
| Push Notifications | Firebase FCM |

---

## Architecture

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│   Mobile App    │────▶│   .NET 9 Backend     │────▶│  SQL Server    │
│  (React Native) │     │  (Integration API)   │     │  (INI_Restaurant) │
└─────────────────┘     └──────────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌──────────────────────┐
                        │    Next.js Web       │
                        │  (Customer + Admin)   │
                        └──────────────────────┘
```

---

## Milestones

| Milestone | Description | Value | Status |
|-----------|-------------|-------|--------|
| M1 | Architecture & Setup | $800 | ✅ Complete |
| M2 | Mobile Apps (iOS & Android) | $1,800 | ✅ Complete |
| M3 | Customer Web Platform | $1,200 | 🔄 In Progress |
| M4 | Merchant / Admin Portal | $1,000 | 📅 Scheduled |
| M5 | Bridge, QA & Deployment | $1,200 | ⏳ Pending |

**Total Contract Value:** $6,000

---

## Key Constraints (SSOT)

> "INI_Restaurant database remains the single source of truth for all data."

- POS data = Ground truth (prices, inventory, orders, customers)
- Your app = Display layer (reads from POS, writes via backend)
- Backend overlay tables = Temporary state (scheduled orders, notifications, FCM tokens)
- **Never modify POS schema or source code**

---

## Project Structure

```
src/
├── backend/
│   ├── IntegrationService.API/      # .NET 9 Web API
│   ├── IntegrationService.Core/     # Domain entities, interfaces
│   ├── IntegrationService.Infrastructure/  # Dapper repositories
│   └── IntegrationService.Tests/    # Unit tests
├── web/                             # Next.js 16 customer ordering
├── admin/                           # Next.js 14 admin portal
└── mobile/
    └── ImidusCustomerApp/          # React Native app
```

---

## Contact

- **Client:** Sung Bin Im - Imidus Technologies
- **Developer:** Novatech Build Team (Chris)
- **Email:** novatech2210@gmail.com
- **Repo:** https://github.com/novatech642/pos-integration
- **Delivery:** AWS S3 - s3://inirestaurant/novatech/
