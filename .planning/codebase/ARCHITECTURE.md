# Architecture

**Analysis Date:** 2026-02-25

## Pattern Overview

**Overall:** Layered N-tier architecture with Clean Architecture principles

**Key Characteristics:**
- Repository pattern for data access abstraction
- Dependency injection throughout service layer
- Transaction-based order lifecycle management
- Separated frontend (React/Next.js, React Native) and backend (ASP.NET Core)
- Direct legacy database integration via Dapper ORM

## Layers

**Presentation Layer (Web Frontend):**
- Purpose: Customer-facing order interface, merchant dashboard, authentication
- Location: `src/web/`
- Contains: Next.js App Router routes, React components, context providers
- Depends on: Backend API via `lib/api.ts` client
- Used by: Web browsers

**Presentation Layer (Mobile Frontend):**
- Purpose: Mobile customer ordering and tracking
- Location: `src/mobile/ImidusCustomerApp/`
- Contains: React Native screens, Redux store, navigation stacks
- Depends on: Backend API via Axios client
- Used by: iOS and Android devices

**API Controller Layer:**
- Purpose: HTTP endpoint routing and request validation
- Location: `src/backend/IntegrationService.API/Controllers/`
- Contains: `HealthController`, `MenuController`, `OrdersController`
- Depends on: Core services, repositories
- Used by: Frontend applications

**Business Logic Layer (Services):**
- Purpose: Order processing, loyalty, payment, upselling, notifications
- Location: `src/backend/IntegrationService.Core/Services/`
- Contains: `OrderProcessingService`, `LoyaltyService`, `OrderService`, `UpsellService`, `BirthdayRewardService`
- Depends on: Repositories, domain entities
- Used by: Controllers, background services

**Data Access Layer (Repositories):**
- Purpose: Encapsulate database queries and transactions against INI_Restaurant (source of truth)
- Location: `src/backend/IntegrationService.Infrastructure/Data/`
- Contains: `PosRepository`, `CustomerRepository`
- Depends on: Direct SQL via Dapper, INI_Restaurant schema
- Used by: Services

**Domain/Entity Layer:**
- Purpose: Business entity definitions and interfaces
- Location: `src/backend/IntegrationService.Core/Domain/Entities/` and `IntegrationService.Core/Interfaces/`
- Contains: `PosEntities.cs` (all domain models), service interfaces
- Depends on: .NET types only
- Used by: All layers above

## Data Flow

**Order Creation Flow:**

1. Client submits order via `POST /orders` (web or mobile)
2. `OrdersController` receives `CreateOrderRequest` with idempotency key
3. Controller calls `OrderProcessingService.CreateOrderAsync()`
4. Service validates:
   - Order has at least one item
   - All items have valid `SizeID`
   - Inventory stock available
   - Tax rates and menu items fetched
5. Service begins database transaction via `PosRepository.BeginTransactionAsync()`
6. Service creates open order in `tblSales` with `TransType=2` (Open)
7. Service inserts items into `tblPendingOrders` (not `tblSalesDetail` yet)
8. Service decreases inventory in `tblItemSize` via stock tables
9. If payment auth code provided:
   - Records payment in `tblPayment`
   - Completes order: moves items from `tblPendingOrders` → `tblSalesDetail`
   - Updates `TransType` from 2 (Open) → 1 (Completed)
10. If online order company specified, links via `tblSalesOfOnlineOrder`
11. Transaction commits or rolls back on error
12. Returns `OrderResult` with `SalesID` and `DailyOrderNumber`

**Menu Fetch Flow:**

1. Client calls `GET /Menu/full`
2. `MenuController` invokes repository
3. `PosRepository.GetActiveMenuItemsAsync()` queries database with tax flags, kitchen routing
4. Returns `List<MenuItem>` with `categoryId`, `isAvailable`, tax/kitchen metadata
5. Frontend organizes by category and displays

**State Management:**
- Web: React Context (`AuthContext`, `CartContext`) for client-side state
- Mobile: Redux Toolkit store for client-side state
- Backend: Transaction-based for data consistency (no in-memory state for orders)

## Key Abstractions

**IPosRepository (Data Access):**
- Purpose: Abstracts all database operations related to POS entities
- Examples: `src/backend/IntegrationService.Infrastructure/Data/PosRepository.cs`
- Pattern: Active Record-like with Dapper raw SQL execution
- Methods: `CreateOpenOrderAsync()`, `GetActiveMenuItemsAsync()`, `MovePendingOrdersToSalesDetailAsync()`, `BeginTransactionAsync()`

**IOrderProcessingService (Business Logic):**
- Purpose: Orchestrates multi-step order creation, completion, cancellation
- Examples: `src/backend/IntegrationService.Core/Services/OrderProcessingService.cs`
- Pattern: Service-oriented with transaction management
- Methods: `CreateOrderAsync()`, `CompleteOrderAsync()`, `CancelOrderAsync()`, `GetOrderAsync()`

**MenuItem Entity:**
- Purpose: Represents menu item with tax/kitchen routing metadata
- Contains: `ItemID`, `IName`, `ApplyGST`, `ApplyPST`, `KitchenB`, `KitchenF`, `Bar`
- Pattern: Flat entity mirroring legacy database schema

**PosTicket (Order Aggregate):**
- Purpose: Root aggregate for order lifecycle
- Contains: `SalesID`, `TransType` (0=Refund, 1=Complete, 2=Open), `tblSalesDetail` items, payment list
- Pattern: Aggregate root with associated `PendingOrderItem` and `PosTender` entities

## Entry Points

**Web Frontend:**
- Location: `src/web/app/page.tsx`
- Triggers: Browser navigation to `/`
- Responsibilities: Renders hero landing page with feature grid, links to `/menu`, `/login`

**Web API:**
- Location: `src/backend/IntegrationService.API/Program.cs`
- Triggers: Application startup
- Responsibilities: Configures DI container, Swagger docs, CORS policy, service registrations

**Mobile App:**
- Location: `src/mobile/ImidusCustomerApp/App.tsx`
- Triggers: App launch on iOS/Android
- Responsibilities: Sets up React Navigation stack, Redux provider, entry to auth/home screens

**Health Check:**
- Location: `src/backend/IntegrationService.API/Controllers/HealthController.cs`
- Endpoints: `GET /health` (basic), `GET /api/health/deep` (database connectivity test)
- Responsibilities: Diagnostics and monitoring

## Error Handling

**Strategy:** Try-catch with transaction rollback, structured logging via Serilog, HTTP status codes

**Patterns:**
- Database errors trigger `transaction.Rollback()` in `OrderProcessingService`
- Stock validation throws `InsufficientStockException` with item/size context
- API returns `OrderResult { Success=false, ErrorMessage="..." }` for business errors
- HTTP 503 on health check failure indicates database down
- Frontend `apiClient` throws on non-2xx responses, consumed by components

## Cross-Cutting Concerns

**Logging:** Serilog configured in `Program.cs` with console output; structured logging in services (e.g., `_logger.LogInformation("Creating order with idempotency key: {IdempotencyKey}"`)

**Validation:** Input validation at controller level (idempotency key, order items) and service level (inventory, tax rates)

**Authentication:** JWT Bearer tokens, Auth context in web frontend holds user token in localStorage, mobile uses Redux auth store. Backend checks `Authorization` header in `apiClient`.

**Transactions:** Database transactions via `IDbTransaction` passed through repository methods; used for order creation, completion, cancellation to ensure ACID compliance

**CORS:** AllowWebApp policy in `Program.cs` permits `http://localhost:3000` for development

---

*Architecture analysis: 2026-02-25*
