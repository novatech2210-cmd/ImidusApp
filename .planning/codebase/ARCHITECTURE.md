# Architecture

**Analysis Date:** 2026-02-25

## Pattern Overview

**Overall:** Clean Architecture with Layered Domain Design (API-First, Repository Pattern)

**Key Characteristics:**
- Domain-driven Core layer with pure C# entities
- Repository-based data access abstraction
- Dependency injection for service composition
- RESTful API controllers mapping to service interfaces
- Next.js frontend with context-based state management
- Separation of concerns across three tiers (API, Core, Infrastructure)

## Layers

**API Layer (IntegrationService.API):**
- Purpose: HTTP request handling, routing, and response mapping
- Location: `/home/kali/Desktop/TOAST/src/backend/IntegrationService.API/`
- Contains: Controllers, DTOs, Background Services, OpenAPI documentation
- Depends on: Core services, logging (Serilog)
- Used by: Frontend (Next.js), external clients
- Key files: `Program.cs` (dependency injection setup), `Controllers/OrdersController.cs`, `Controllers/MenuController.cs`

**Core Layer (IntegrationService.Core):**
- Purpose: Business logic, domain entities, service interfaces
- Location: `/home/kali/Desktop/TOAST/src/backend/IntegrationService.Core/`
- Contains: Domain entities, repository interfaces, service implementations, models
- Depends on: None (pure domain)
- Used by: API layer, Infrastructure layer
- Key files: `Domain/Entities/PosEntities.cs`, `Interfaces/`, `Services/`

**Infrastructure Layer (IntegrationService.Infrastructure):**
- Purpose: Data persistence, external service implementations
- Location: `/home/kali/Desktop/TOAST/src/backend/IntegrationService.Infrastructure/`
- Contains: Repository implementations, mock external services
- Depends on: Core (implements interfaces)
- Used by: Dependency injection setup in API layer
- Key files: `Data/PosRepository.cs`, `Data/CustomerRepository.cs`, `Services/MockPaymentService.cs`

**Frontend Layer (Next.js):**
- Purpose: User interface for POS operations
- Location: `/home/kali/Desktop/TOAST/src/web/`
- Contains: Pages, components, context providers, API client
- Depends on: Backend API via HTTP
- Used by: Restaurant staff, customers
- Key files: `lib/api.ts`, `context/CartContext.tsx`, `context/AuthContext.tsx`, `app/`

## Data Flow

**Order Creation Flow:**

1. **Frontend UI** (`app/menu/page.tsx`, `app/checkout/page.tsx`)
   - User adds items to cart via CartContext
   - User proceeds to checkout and submits order

2. **API Client** (`lib/api.ts`)
   - `OrderAPI.create()` calls POST `/api/orders` with idempotency key
   - Includes item details (menuItemId, sizeId, quantity, unitPrice)

3. **Controller** (`Controllers/OrdersController.cs`)
   - Validates request (ModelState, idempotency key, sizeIds)
   - Maps DTOs to domain entities (CreateOrderRequest)
   - Calls `IOrderProcessingService.CreateOrderAsync()`

4. **Service Layer** (`Services/OrderProcessingService.cs`, `Services/OrderService.cs`)
   - Validates inventory, applies pricing/taxes
   - Processes payment via `IPaymentService`
   - Applies loyalty discounts via `ILoyaltyService`
   - Calculates totals (SubTotal, GST, PST, PST2, DiscountAmt)

5. **Repository Layer** (implements `IOrderRepository`, `IMenuRepository`, `ICustomerRepository`)
   - Creates PosTicket (order header in tblSales)
   - Inserts PosTicketItem entries (tblSalesDetail)
   - Inserts PosTender payments (tblPayment)
   - Uses transactions for consistency

6. **Database** (INI POS SQL Server)
   - tblSales: Order header with totals
   - tblSalesDetail: Line items with pricing
   - tblPayment: Payment records with authorization codes

**Menu Loading Flow:**

1. Frontend calls `MenuAPI.getFullMenu()`
2. Routes to `MenuController.GetFullMenu()`
3. Returns list of MenuCategory objects (from service)
4. Frontend renders categories and items grouped by category

**State Management:**

- **Cart State**: `CartContext.tsx` - maintained in React state and localStorage
- **Auth State**: `AuthContext.tsx` - maintains user login/token
- **Server State**: Backend API is source of truth for orders, inventory, pricing
- **Derived State**: Tax calculations, totals computed at order creation time

## Key Abstractions

**Order Entity Hierarchy:**

- `PosTicket`: Order header containing totals, transaction metadata, foreign keys
- `PosTicketItem`: Completed line item (moved to tblSalesDetail when order finalized)
- `PendingOrderItem`: Active line item (lives in tblPendingOrders while order is open)
- `PosTender`: Payment record with card details (encrypted), tip, auth codes

Files: `Domain/Entities/PosEntities.cs`

**Menu/Inventory Abstraction:**

- `MenuItem`: Menu item with pricing flags, kitchen routing, tax configuration
- `AvailableSize`: Size-specific pricing tiers and stock levels (composite key: ItemID + SizeID)
- `Category`: Menu category grouping
- `Size`: Size definitions

Files: `Models/MenuItem.cs`, `Domain/Entities/PosEntities.cs`

**Repository Pattern:**

- `IOrderRepository`: Order CRUD, ticket items, payments, transactions
- `IMenuRepository`: Menu items, sizes, availability, stock
- `ICustomerRepository`: Customer records, contact info
- `IPosRepository`: General POS operations, table management
- `IMiscRepository`: Tax rates, system configuration

Files: `Interfaces/I*Repository.cs`, `Infrastructure/Data/*.cs`

**Service Abstraction:**

- `IOrderProcessingService`: Order lifecycle (create, complete, cancel)
- `ILoyaltyService`: Point earning/redemption
- `IPaymentService`: Payment processing (mocked)
- `INotificationService`: Customer notifications (mocked)
- `IUpsellService`: Product recommendations

Files: `Interfaces/I*Service.cs`, `Services/*.cs`

## Entry Points

**Backend API:**

- Location: `/home/kali/Desktop/TOAST/src/backend/IntegrationService.API/Program.cs`
- Triggers: ASP.NET Core host startup
- Responsibilities:
  - Configure Serilog logging
  - Register Swagger/OpenAPI documentation
  - Configure CORS (allows localhost:3000)
  - Register dependency injection (repositories, services, background services)
  - Map controllers and middleware

**Frontend Entry Point:**

- Location: `/home/kali/Desktop/TOAST/src/web/app/layout.tsx`
- Triggers: Next.js app initialization
- Responsibilities:
  - Wrap with AuthProvider and CartProvider
  - Set up global layout (Sidebar, main grid)
  - Configure metadata

**Menu Page:**

- Location: `/home/kali/Desktop/TOAST/src/web/app/menu/page.tsx`
- Entry point for menu browsing
- Uses CartContext to manage selections
- Calls MenuAPI.getFullMenu() on load

**Checkout Page:**

- Location: `/home/kali/Desktop/TOAST/src/web/app/checkout/page.tsx`
- Entry point for order completion
- Calls OrderAPI.create() with cart items
- Displays order confirmation

## Error Handling

**Strategy:** Exceptions propagate with user-friendly messages, database transactions rolled back on failure

**Patterns:**

- **Repository Layer**: Returns nullable types (Option pattern), throws on SQL errors
  - Example: `GetItemByIdAsync()` returns `MenuItem?`
  - Transactions auto-rollback on exception in `OrderService.PlaceOrderAsync()`

- **Service Layer**: Validates business rules before database operations
  - Example: `OrderService.PlaceOrderAsync()` validates item existence, size availability before creating ticket
  - Returns `OrderResult` with `Success` bool and `ErrorMessage` on failure

- **API Layer**: Returns typed DTO responses with status codes
  - 200 OK: Successful operation
  - 400 Bad Request: Validation failure (missing sizeId, invalid request)
  - 500 Internal Server Error: Unhandled exception (logged via Serilog)
  - Example: `CreateOrderResponse` contains Success, Message, SalesId, TotalAmount

- **Frontend**: Error states in component UI
  - Example: Menu page sets error message if API unreachable
  - Catch blocks in async operations display user-friendly messages

## Cross-Cutting Concerns

**Logging:**
- Framework: Serilog (configured in `Program.cs`)
- Output: Console during development
- Used in: Controllers (ILogger<T>), services on critical operations

**Validation:**
- ASP.NET Core model binding validates DTOs on API layer
- Business logic validation in service layer (item existence, stock, payment)
- Frontend validation on client (required fields, quantity > 0)

**Authentication:**
- Token-based (Bearer token in Authorization header)
- Managed by AuthContext on frontend (stored in localStorage)
- Checked by API client before sending requests (except login/register endpoints)

**Tax Calculation:**
- Decoupled from order processing via `IMiscRepository.GetTaxRatesAsync()`
- Stored at transaction time in PosTicket (GST, PST, PST2 amounts)
- Applied per-item based on MenuItem tax flags (ApplyGST, ApplyPST, ApplyPST2)

**Idempotency:**
- Order creation requires `X-Idempotency-Key` header (UUID from frontend)
- Prevents duplicate orders on network retry
- Validated in `OrdersController.CreateOrder()`

---

*Architecture analysis: 2026-02-25*
