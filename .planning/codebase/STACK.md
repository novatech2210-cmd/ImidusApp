# Technology Stack

**Analysis Date:** 2026-02-25

## Languages

**Primary:**
- TypeScript 5.x - Web frontend (`src/web/`), mobile app (`src/mobile/ImidusCustomerApp/`)
- C# (.NET 8.0) - Backend API (`src/backend/`)
- JavaScript - Configuration and tooling

**Secondary:**
- SQL (T-SQL) - SQL Server 2005+ database queries in Dapper
- Java - Android native layer
- Swift - iOS native layer

## Runtime

**Environment:**
- .NET 8.0 - Backend API runtime (C# ASP.NET Core 8)
- Node.js 18+ - Web and mobile build environment
- SQL Server 2022 Express - Database engine

**Package Manager:**
- npm (Web) - `src/web/package.json`, `package-lock.json` (228KB)
- yarn (Mobile) - `src/mobile/ImidusCustomerApp/yarn.lock`
- NuGet - .NET dependencies (implicit)

## Frameworks

**Core:**
- Next.js 16.1.6 - Web framework (`src/web/`)
- React 19.2.3 - Web UI library
- React Native 0.73.0 - Mobile cross-platform framework
- ASP.NET Core 8.0 - Backend API framework

**Frontend UI:**
- Tailwind CSS 4.x - Styling (web)
- @tailwindcss/postcss 4.x - PostCSS plugin
- @heroicons/react 2.2.0 - Icon library
- lucide-react-native 0.575.0 - Icons (mobile)

**State Management:**
- @reduxjs/toolkit 2.11.2 - Redux (mobile)
- react-redux 9.2.0 - React bindings (mobile)
- Next.js context/zustand - Web state (via context)

**Navigation & Routing:**
- Next.js built-in routing - Web pages
- @react-navigation/native 7.1.28 - Mobile navigation
- @react-navigation/stack 7.7.2 - Stack navigator (mobile)

**HTTP & API:**
- fetch API - Web client (native)
- axios 1.13.5 - Mobile HTTP client
- Dapper 2.1.66 - Backend ORM for SQL Server

## Key Dependencies

**Critical:**
- Microsoft.AspNetCore.Authentication.JwtBearer 8.0.0 - JWT token validation (backend)
- Microsoft.Data.SqlClient 6.1.4 - SQL Server connection library
- Serilog.AspNetCore 8.0.1 - Structured logging (backend)

**Infrastructure:**
- Swashbuckle.AspNetCore 6.8.1 - Swagger/OpenAPI generation
- Microsoft.AspNetCore.OpenApi 8.0.23 - OpenAPI support
- Microsoft.Extensions.Logging.Abstractions 10.0.3 - Logging interface
- react-native-gesture-handler 2.14.1 - Touch gestures (mobile)
- react-native-safe-area-context 4.8.2 - Safe area handling (mobile)
- react-native-screens 3.29.0 - Native screens (mobile)
- react-native-svg 14.1.0 - SVG support (mobile)

**Development:**
- TypeScript 5.0.4 - Type checking
- eslint 9.x (web), 8.19.0 (mobile) - Linting
- @types/react 19.x (web), 18.2.6 (mobile) - React types
- @types/node 20.x - Node types
- prettier 2.8.8 - Code formatting (mobile)
- babel-jest 29.6.3 - Jest transpiler
- react-test-renderer 18.2.0 - Component testing

## Configuration

**Environment:**
- NEXT_PUBLIC_API_URL - Web API endpoint (default: `http://localhost:5000/api`)
- .env files present in web and mobile projects (not committed)
- Environment configuration for dev/production: `src/mobile/ImidusCustomerApp/src/config/environment.ts`

**Build:**
- next.config.ts - Next.js configuration (`src/web/`)
- tsconfig.json - TypeScript configuration (both web and mobile)
- eslint.config.mjs - ESLint configuration (web)
- .eslintrc.js - ESLint configuration (mobile)
- postcss.config.mjs - PostCSS configuration (`src/web/`)
- babel.config.js - Babel configuration (mobile)
- metro.config.js - Metro bundler configuration (mobile)
- jest.config.js - Jest test configuration (mobile)

**Deployment:**
- Dockerfile - Multi-stage Docker build in `src/backend/IntegrationService.API/`
- docker-compose.yml - Orchestration for SQL Server + API (`src/backend/`)

## Database

**Type:** Microsoft SQL Server 2022 Express

**Version:** 2022-latest (in docker-compose)

**Database Name:** INI_Restaurant (restored from INI_Restaurant.Bak)

**Logical Name:** TPPro (original POS database logical name)

**Source of Truth:** INI_Restaurant database — no schema modifications allowed

**Key Tables:**
- tblItem - Menu items
- tblCategory - Item categories
- tblSales - Orders/transactions
- tblSalesDetail - Order items
- tblPendingOrders - Active order items (transient)
- tblPayment - Payment records
- tblCustomer - Customer profiles
- tblPointsDetail - Loyalty points ledger
- tblPrepaidCards - Gift card balances
- tblMisc - Configuration (tax rates)
- tblAvailableSize - Item sizes and pricing
- tblOnlineOrderCompany - Third-party integrations

**Connection:**
- Connection string via configuration: `ConnectionStrings__PosDatabase` (Docker) or IConfiguration
- Client: Microsoft.Data.SqlClient (6.1.4)
- Query library: Dapper (2.1.66) for parameterized queries

## Platform Requirements

**Development:**
- Node.js 18+ (web and mobile CLI)
- .NET SDK 8.0 (backend compilation)
- SQL Server 2022 or compatible Express instance
- Docker and Docker Compose (for containerized dev environment)
- Android SDK (for mobile development)
- Xcode (for iOS development)

**Production:**
- .NET 8.0 runtime (ASP.NET Core)
- SQL Server 2022 Express or higher
- Container runtime (Docker-compatible)
- Web server/proxy (nginx or equivalent for Next.js)

## Architectural Layers (.NET Backend)

**API Layer:**
- Location: `src/backend/IntegrationService.API/`
- Entry: `Program.cs` - Dependency injection, CORS, Swagger configuration
- Controllers: REST endpoints for Orders, Menu, Health checks
- CORS enabled for web frontend at `http://localhost:3000` (dev)

**Core/Domain Layer:**
- Location: `src/backend/IntegrationService.Core/`
- Entities: Domain models (PosTicket, MenuItem, PosCustomer, etc.)
- Interfaces: Service contracts (IOrderProcessingService, ILoyaltyService, etc.)
- Services: Business logic (OrderService, OrderProcessingService, LoyaltyService, UpsellService)
- Models: DTOs and request/response objects

**Infrastructure Layer:**
- Location: `src/backend/IntegrationService.Infrastructure/`
- Repositories: Data access using Dapper (PosRepository, CustomerRepository)
- Services: External integrations (MockPaymentService, MockNotificationService)
- Data context: SQL Server connection management

**Testing:**
- Location: `src/backend/IntegrationService.Tests/`
- Framework: xUnit with test fixtures

---

*Stack analysis: 2026-02-25*
