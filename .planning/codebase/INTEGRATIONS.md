# External Integrations

**Analysis Date:** 2026-02-25

## APIs & External Services

**Payment Processing:**
- Square (payment API) - Referenced in order DTOs
  - SDK/Client: Built-in via opaqueDataValue/opaqueDataDescriptor in `src/web/lib/api.ts` CreateOrderRequest
  - Auth: Token-based via request body (opaque data token)

**Delivery & Order Management:**
- IMIDUS Technologies - Custom integration backend
  - API Base URLs configured per environment
  - Web: `NEXT_PUBLIC_API_URL` environment variable
  - Mobile: `src/mobile/ImidusCustomerApp/src/config/environment.ts`

**Firebase Services:**
- Firebase Admin SDK (version 2.4.0)
  - Location: `src/backend/IntegrationService.Infrastructure/` (declared in IntegrationService.Infrastructure.csproj)
  - Purpose: Likely for authentication, notifications, or real-time database (implementation details in Infrastructure layer)

## Data Storage

**Databases:**
- SQL Server
  - Type: Microsoft SQL Server (on-premises or LocalDB)
  - Connection: `PosDatabase` connection string in appsettings
  - Development connection: `Server=(localdb)\\mssqllocaldb;Database=TPPro;Trusted_Connection=True;`
  - Production connection: Environment-configured via `PosDatabase` in appsettings
  - Client: Dapper ORM with Microsoft.Data.SqlClient
  - Repository: `src/backend/IntegrationService.Infrastructure/Data/PosRepository.cs`
  - Database name (development): `INI_Restaurant` per appsettings.Development.json

**File Storage:**
- Local filesystem only (images served via imageUrl field in MenuItem)
- No external storage provider detected (S3, Azure Blob, etc.)

**Caching:**
- None detected in current stack
- In-memory only via ASP.NET Core defaults

## Authentication & Identity

**Auth Provider:**
- Custom JWT-based authentication
  - Implementation: `src/web/context/AuthContext.tsx` (web) and `src/mobile/ImidusCustomerApp/src/store/authSlice.ts` (mobile)
  - Approach: Bearer token stored in `localStorage` (web) and Redux store (mobile)
  - JWT support: Microsoft.AspNetCore.Authentication.JwtBearer 8.0.0 in backend
  - Token format: Standard Bearer token in Authorization header

**Auth Endpoints:**
- `/auth/login` - Login endpoint (excluded from requiring token in `src/web/lib/api.ts`)
- `/auth/register` - Registration endpoint (excluded from requiring token)
- Tokens persisted in localStorage (web) after login

**Firebase Auth Integration:**
- Firebase Admin SDK available in infrastructure layer (FirebaseAdmin 2.4.0)
- Specific integration pattern not yet implemented or marked for future use

## Monitoring & Observability

**Error Tracking:**
- None detected in current implementation
- Error handling via standard .NET exception mechanisms

**Logs:**
- Serilog (ASP.NET Core 8.0.1)
  - Configuration: `src/backend/IntegrationService.API/Program.cs`
  - Output: Console logging (WriteTo.Console())
  - Log level: Information by default, Warning for ASP.NET Core infrastructure
  - Structured logging enabled
  - Mobile: console logging (React Native standard)

**Request/Response Tracking:**
- None detected (no correlation IDs, tracing headers visible in current config)

## CI/CD & Deployment

**Hosting:**
- Web: Node.js hosting (Next.js application) or static export
- Mobile: iOS App Store and Google Play Store
- Backend: ASP.NET Core hosting (cloud or self-hosted)
- Docker support: `src/backend/IntegrationService.API/Dockerfile` exists

**Deployment Database:**
- Docker Compose configuration: `src/backend/docker-compose.yml` for local development
- Migration/setup scripts: `src/backend/Database/init-db.sh` (SQL Server initialization)

**CI Pipeline:**
- GitHub Actions configured: `.github/workflows/` directory exists
- No detailed workflow analysis available without reading workflow files

## Environment Configuration

**Required env vars:**

**Web Frontend (`src/web/`):**
- `NEXT_PUBLIC_API_URL` - Backend API base URL (default: `http://localhost:5000/api`)

**Mobile App (`src/mobile/ImidusCustomerApp/`):**
- Hardcoded in `src/config/environment.ts`:
  - Development: `http://10.0.2.2:5004/api` (Android emulator)
  - Production: `https://eda7-105-184-203-108.ngrok-free.app/api`

**Backend API (`src/backend/IntegrationService.API/`):**
- `ConnectionStrings:PosDatabase` - SQL Server connection string
- `ConnectionStrings:TPPro` - Alternative database name (dev config shows "TPPro")
- Logging configuration via appsettings.json

**Secrets location:**
- `.env` files (pattern: `.env*` in .gitignore)
- appsettings.Development.json (contains localhost credentials - development only)
- Production credentials managed via hosting platform environment variables

## Webhooks & Callbacks

**Incoming:**
- Order webhook handling: Not yet implemented
- Birthday reward notifications: `BirthdayRewardBackgroundService` runs scheduled checks (`src/backend/IntegrationService.API/BackgroundServices/`)

**Outgoing:**
- None detected in current implementation
- Notification service is mocked: `MockNotificationService` in `src/backend/IntegrationService.Infrastructure/Services/MockNotificationService.cs`

## API Structure

**REST Endpoints:**

**Menu API:**
- `GET /Menu/full` - Retrieve full menu with items
- `GET /Menu/tax-rate` - Get current tax rate

**Order API:**
- `POST /orders` - Create new order (requires idempotency key)
- `GET /orders/{id}/status` - Get order status
- `GET /orders/history/{customerId}` - Get customer order history

**Analytics API:**
- `GET /Analytics/summary` - Analytics summary (query params: start, end)
- `GET /Analytics/top-products` - Top products report
- `GET /Analytics/sales-trend` - Sales trend data

**Loyalty API:**
- `GET /loyalty/balance` - Get customer loyalty balance

**CORS:**
- Enabled for `http://localhost:3000` (web frontend)
- Configured in `src/backend/IntegrationService.API/Program.cs`

---

*Integration audit: 2026-02-25*
