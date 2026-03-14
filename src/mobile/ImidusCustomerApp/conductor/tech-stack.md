# Tech Stack - INI Restaurant POS Integration

## Overview

This project is a **brownfield** (existing codebase) multi-platform restaurant POS integration.

## Languages

- **TypeScript** — Primary language for frontend (Next.js, React Native)
- **C# (.NET 8)** — Backend integration service
- **SQL/T-SQL** — Legacy POS database queries

## Mobile

- **React Native 0.74.7** — Cross-platform mobile apps (iOS + Android)
- **State Management**: React Context / Hooks (minimal, lightweight)
- **Navigation**: React Navigation (Stack)
- **UI Components**:
  - @gorhom/bottom-sheet ^5.2.8
  - react-native-reanimated ~3.16.7
  - react-native-gesture-handler ~2.20.2
  - react-native-safe-area-context ~4.14.1
  - react-native-screens ~3.37.0
  - react-native-svg ~15.3.0
- **Push Notifications**: Firebase Cloud Messaging (FCM) via @react-native-firebase
- **Payment Integration**: Authorize.net Accept.js (tokenization only)

## Web

- **Next.js 14** — Customer ordering website and admin portal
- **Styling**: CSS Modules + globals.css (theme tokens)
- **State Management**: React Hooks + Context
- **Payment Integration**: Authorize.net (tokenization)
- **Deployment**: AWS S3 (s3://inirestaurant/novatech/)

## Backend

- **.NET 8** — ASP.NET Core Web API
- **Data Access**: Dapper ORM (lightweight SQL mapping)
- **Database**:
  - SQL Server 2005 Express (legacy POS DB — INI_Restaurant)
  - IntegrationService overlay tables for safe expansion
- **Transaction Safety**:
  - SQL Transactions with proper rollback
  - Idempotency keys for duplicate prevention
  - Concurrency checks for ticket state validation
- **Background Services**: .NET Hosted Services for scheduled tasks
- **Logging**: Custom audit tables + transactional logs

## State Management

- **Redux Toolkit** ^2.11.2 — Global state (mobile)
- **React Redux** ^9.2.0 — React bindings
- **React Context/Hooks** — Lightweight local state

## Navigation

- **@react-navigation/native** ^7.1.28
- **@react-navigation/stack** ^7.7.2

## Database Schema

### Source of Truth (INI_Restaurant)

- **tblSales** — Ticket/orders master table
- **tblPendingOrders** — Active order lines
- **tblPayment** — Payment records
- **tblCustomer** — Customer loyalty points
- **tblPointsDetail** — Loyalty transaction history
- **tblAvailableSize** — Menu items and pricing
- **tblMisc** — Configuration (GST, PST, DON, etc.)

### Overlay Tables (IntegrationService DB)

- **CustomerProfile** — Extended customer data
- **MenuOverlay** — Online menu availability flags
- **MarketingRules** — Campaign configuration
- **ScheduledOrders** — Future order queue
- **tblPushNotifications** — Notification campaigns

## Payments

- **Authorize.net** — Tokenization-only (no raw card storage)
- **Verifone/Ingenico Bridge** — Client-provided (pending documentation)

## Infrastructure & Deployment

- **CI/CD**: GitHub Actions
  - iOS builds: macos-latest runners
  - Android builds: ubuntu-latest runners
- **Delivery**: AWS S3 (s3://inirestaurant/novatech/)
- **Backend Hosting**:
  - Option A: Azure App Service (Linux)
  - Option B: Self-hosted Windows MSI (contractual requirement)
- **Packaging**: Self-installing MSI for Windows backend

## Development Tools

- **Linting**: ESLint ^8.19.0 with @react-native/eslint-config
- **Formatting**: Prettier 2.8.8
- **Testing**: Jest ^29.6.3, react-test-renderer 18.2.0
- **Build**: Babel ^7.20.0, TypeScript 5.0.4
- **Package Manager**: pnpm (per CLAUDE.md preference)

## Key Dependencies

### Production

- axios ^1.13.5 — HTTP client
- lucide-react-native ^0.575.0 — Icons
- react-native-skeleton-placeholder ^5.2.4 — Loading states
- @react-native-async-storage/async-storage ^1.24.0 — Local storage
- @react-native-community/slider ^5.1.2 — UI components

### Development

- @types/react ^18.2.6
- @types/react-redux ^7.1.34
- babel-jest ^29.6.3

## Constraints & Notes

- **No EF Core** — Legacy schema incompatible
- **No POS Schema Changes** — All writes follow transaction-safe patterns
- **POS DB is Source of Truth** — Read live rates/config from tblMisc
- **Atomic Writes Required** — BEGIN TRANSACTION / COMMIT for all DB writes
- **Idempotency Keys** — Required for all write operations
- **Never Trust Client Prices** — Always re-validate from tblAvailableSize server-side
- **CashierID**: 999 (online), 998 (test)
- **StationID**: 2 (DESKTOP-DEMO)
- **Online Order Table**: OnlineOrderCompanyID where IntegrationCode='TOAST'
