# External Integrations

**Analysis Date:** 2026-02-25

## APIs & External Services

**INI_Restaurant Database (Source of Truth):**
- Direct integration with INI POS legacy system via INI_Restaurant database
  - Connection: SQL Server 2005 Express (logical name: TPPro, restored as INI_Restaurant)
  - Integration method: Dapper ORM with parameterized SQL queries
  - Location: `src/backend/IntegrationService.Infrastructure/Data/PosRepository.cs`
  - Purpose: Menu management, orders, inventory, customer data, loyalty points, prepaid cards
  - **CRITICAL:** INI_Restaurant is the single source of truth — no schema modifications allowed

**Payment Processing (Placeholder):**
- Authorize.net (mentioned in UI as "PCI-Compliant sandbox")
  - Status: Not yet implemented (using mock service)
  - Mock service: `src/backend/IntegrationService.Infrastructure/Services/MockPaymentService.cs`
  - Interface: `src/backend/IntegrationService.Core/Interfaces/IPaymentService.cs`
  - Expected integration: Card tokenization and payment authorization
  - Authorization format: Returns mock auth codes (e.g., `MOCK_AUTH_XXXXXXXX`)

**Notifications (Placeholder):**
- Firebase Cloud Messaging (FCM) - Referenced in csproj but not implemented
  - Package: FirebaseAdmin 2.4.0 (included in `IntegrationService.Infrastructure.csproj`)
  - Status: Mock service only
  - Mock service: `src/backend/IntegrationService.Infrastructure/Services/MockNotificationService.cs`
  - Interface: `src/backend/IntegrationService.Core/Interfaces/INotificationService.cs`
  - Capability: Customer notifications, broadcast messages

## Data Storage

**Databases:**
- Microsoft SQL Server 2022 Express
  - Connection: `ConnectionStrings__PosDatabase`
  - Client: Microsoft.Data.SqlClient 6.1.4
  - ORM: Dapper 2.1.66 (lightweight query mapper)
  - Database name: `INI_Restaurant` (default, configurable)
  - Location: Docker container `imidus-sqlserver` (dev environment)
  - Port: 1433 (internal in Docker, mapped to 1433 on host)

**File Storage:**
- Local filesystem only
  - Menu item images: Paths stored in `tblItem.ImageFilePath` (referenced but not served)
  - Category images: Paths stored in `tblCategory.CategoryImageFilePath`
  - Storage location: Not externalized (no S3, Azure Blob, etc.)

**Caching:**
- None configured
  - Frontend uses browser localStorage for auth tokens only
  - Backend has no Redis or distributed cache configured

## Authentication & Identity

**Auth Provider:**
- Custom JWT-based implementation
  - Tokens stored in client localStorage (`auth_token`)
  - Token validation: `Microsoft.AspNetCore.Authentication.JwtBearer` 8.0.0
  - Token usage: Bearer token in `Authorization` header
  - Excluded from token injection: `/auth/login`, `/auth/register` endpoints
  - Implementation: `src/web/lib/api.ts` (frontend token injection)

**Session Management:**
- Client-side only
  - Web: localStorage with key `auth_token`
  - Mobile: Redux auth store
  - No server-side session store

## Monitoring & Observability

**Logging:**
- Serilog 8.0.1 (structured logging)
  - Configuration: Console output in development
  - Logger setup: `src/backend/IntegrationService.API/Program.cs`
  - Log level: Information and above for business events
  - Mobile: console.log statements (development only)
  - Web: No centralized logging configured

**Error Tracking:**
- None configured (no Sentry, Application Insights, etc.)
  - Error responses passed to client as JSON
  - Client displays error messages from API response

**Health Check:**
- HTTP health endpoint: `GET /health`
  - Location: `src/backend/IntegrationService.API/Controllers/HealthController.cs`
  - Docker health check: Curl-based check on health endpoint
  - Check interval: 30s, timeout: 10s, retries: 3

## CI/CD & Deployment

**Hosting:**
- Docker containers (development)
  - API container: `imidus-api` on port 5004 (mapped to 8080 internal)
  - SQL Server container: `imidus-sqlserver` on port 1433
  - Orchestration: docker-compose.yml in `src/backend/`

**Production Endpoints:**
- Web API: Mobile app configured for ngrok tunnel (temporary test endpoint)
  - Dev: `http://10.0.2.2:5004/api` (Android emulator)
  - Prod: `https://eda7-105-184-203-108.ngrok-free.app/api` (test deployment)
  - Web: `http://localhost:5000/api` (fallback from NEXT_PUBLIC_API_URL)

**CI Pipeline:**
- None detected (GitHub Actions, GitLab CI, Jenkins not configured)

**Dockerfile:**
- Multi-stage build in `src/backend/IntegrationService.API/Dockerfile`
  - Build stage: mcr.microsoft.com/dotnet/sdk:8.0
  - Runtime stage: mcr.microsoft.com/dotnet/aspnet:8.0
  - Non-root user: `appuser` (security best practice)
  - Health check: HTTP curl to port 8080/health
  - Entrypoint: `dotnet IntegrationService.API.dll`

## Environment Configuration

**Required env vars (Backend):**
- `ConnectionStrings__PosDatabase` - SQL Server connection string
  - Format: `Server=sqlserver;Database=INI_Restaurant;User Id=sa;Password=...;TrustServerCertificate=True;`
  - Required: Yes
- `ASPNETCORE_ENVIRONMENT` - Development, Staging, Production

**Required env vars (Web):**
- `NEXT_PUBLIC_API_URL` - API base URL (default: `http://localhost:5000/api`)

**Required env vars (Mobile):**
- Not environment-based; hardcoded in `src/mobile/ImidusCustomerApp/src/config/environment.ts`
- Dev: `http://10.0.2.2:5004/api`
- Prod: ngrok tunnel URL

**Secrets location:**
- Docker: Environment section of docker-compose.yml (SA_PASSWORD: YourStrong@Passw0rd)
  - NOTE: Hardcoded in development; should use Docker secrets in production
- Web/Mobile: .env files (gitignored)

## Webhooks & Callbacks

**Incoming:**
- None configured (no external services calling back into TOAST)

**Outgoing:**
- None configured (no calls to external webhooks)

## Background Services

**Birthday Reward Service:**
- Location: `src/backend/IntegrationService.API/BackgroundServices/BirthdayRewardBackgroundService.cs`
- Type: Hosted service (IHostedService)
- Purpose: Send loyalty rewards on customer birthdays
- Trigger: Scheduled at application startup
- Dependency: BirthdayRewardService (core service)

## API Endpoints

**Menu Management:**
- `GET /Menu/full` - Fetch complete menu with categories and items
- `GET /Menu/tax-rate` - Get current tax configuration

**Orders:**
- `POST /orders` - Create new order
  - Idempotency key: `X-Idempotency-Key` header
  - Payload: Items array with menuItemId, sizeId, quantity, pricing
- `GET /orders/{id}/status` - Check order status
- `GET /orders/history/{customerId}` - Customer order history

**Loyalty:**
- `GET /loyalty/balance` - Get customer loyalty points balance

**Analytics (Web Dashboard):**
- `GET /Analytics/summary` - Sales summary by date range
- `GET /Analytics/top-products` - Top selling items
- `GET /Analytics/sales-trend` - Sales trend over time

## CORS Policy

**Current Configuration:**
- Origin: `http://localhost:3000` (development only)
- Methods: Any (AllowAnyMethod)
- Headers: Any (AllowAnyHeader)
- Credentials: Not explicitly configured

**File:** `src/backend/IntegrationService.API/Program.cs` (lines 40-49)

## Data Flow

**Order Processing Workflow:**
1. Customer selects items from menu (fetched from `/Menu/full`)
2. Frontend sends `POST /orders` with items, customer info, and payment token
3. Backend creates entry in `tblSales` with `TransType=2` (Open order)
4. Items inserted into `tblPendingOrders` (active kitchen items)
5. Payment processed via `IPaymentService` (currently mock)
6. Loyalty points calculated and awarded via `ILoyaltyService`
7. Order completion: Move items from `tblPendingOrders` to `tblSalesDetail`
8. Update `tblSales` TransType to 1 (Completed)
9. Notification sent via `INotificationService` (currently mock via Serilog)

**Loyalty Points Workflow:**
- Earned: On order completion (points_earned = order_subtotal * 0.1)
- Used: Customer can redeem for discounts or rewards
- Tracked in `tblPointsDetail` ledger with transaction date

---

*Integration audit: 2026-02-25*
