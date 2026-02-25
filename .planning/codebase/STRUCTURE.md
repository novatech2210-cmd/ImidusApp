# Codebase Structure

**Analysis Date:** 2026-02-25

## Directory Layout

```
TOAST/
├── src/
│   ├── backend/                              # .NET 8 ASP.NET Core API server
│   │   ├── IntegrationService.API/           # Controllers and HTTP entry point
│   │   ├── IntegrationService.Core/          # Domain entities and service interfaces
│   │   ├── IntegrationService.Infrastructure/# Data access layer and repository implementations
│   │   ├── IntegrationService.Tests/         # XUnit tests
│   │   └── Database/                         # Migration scripts
│   ├── web/                                  # Next.js frontend application
│   │   ├── app/                              # App Router pages (menu, cart, orders, etc.)
│   │   ├── components/                       # Reusable React components
│   │   ├── context/                          # React Context providers (Auth, Cart)
│   │   ├── lib/                              # Utility functions and API client
│   │   ├── node_modules/                     # Dependencies (auto-generated)
│   │   └── public/                           # Static assets
│   └── mobile/
│       └── ImidusCustomerApp/                # React Native mobile app
│           ├── src/
│           │   ├── screens/                  # Screen components (login, menu, orders)
│           │   ├── components/               # Shared UI components
│           │   ├── services/                 # API call abstractions
│           │   ├── store/                    # Redux store configuration
│           │   ├── navigation/               # React Navigation stack setup
│           │   ├── config/                   # Configuration files
│           │   ├── types/                    # TypeScript type definitions
│           │   ├── api/                      # API endpoints and clients
│           │   └── assets/                   # Images, fonts
│           ├── android/                      # Android native code and Gradle config
│           └── ios/                          # iOS native code and Xcode config
├── .planning/codebase/                       # GSD codebase analysis documents
├── assets/                                   # Project-wide assets and documentation
└── POS_REFACTORING_GUIDES/                   # Legacy migration documentation
```

## Directory Purposes

**src/backend/IntegrationService.API:**
- Purpose: ASP.NET Core Web API entry point
- Contains: HTTP controllers, Swagger configuration, middleware setup
- Key files: `Program.cs` (DI setup), `Controllers/*.cs` (endpoints)

**src/backend/IntegrationService.Core:**
- Purpose: Business logic and domain model definitions
- Contains: Service classes, entity definitions, service interfaces
- Key files: `Domain/Entities/PosEntities.cs`, `Services/*.cs`, `Interfaces/*.cs`

**src/backend/IntegrationService.Infrastructure:**
- Purpose: Data access layer
- Contains: Repository implementations, database transactions
- Key files: `Data/PosRepository.cs`, `Data/CustomerRepository.cs`

**src/backend/IntegrationService.Tests:**
- Purpose: Automated tests (unit and integration)
- Contains: XUnit test files
- Key files: Test files organized by component

**src/web/app:**
- Purpose: Next.js App Router pages
- Contains: Route directories and page components
- Key files: `page.tsx` (home), `menu/page.tsx`, `cart/page.tsx`, `orders/page.tsx`, `merchant/dashboard/page.tsx`

**src/web/components:**
- Purpose: Reusable React components
- Contains: UI components shared across pages
- Key files: `Navbar.tsx`, `Sidebar.tsx`, `OrderPanel.tsx`

**src/web/context:**
- Purpose: React Context API providers for global state
- Contains: Context definitions and custom hooks
- Key files: `AuthContext.tsx`, `CartContext.tsx`

**src/web/lib:**
- Purpose: Utility functions and API client
- Contains: Type definitions, fetch wrapper, API endpoints
- Key files: `api.ts` (apiClient function, MenuAPI, OrderAPI, LoyaltyAPI)

**src/mobile/ImidusCustomerApp/src/screens:**
- Purpose: Full-screen components for navigation
- Contains: Login, menu browsing, order tracking screens
- Key files: Screen components organized by feature

**src/mobile/ImidusCustomerApp/src/store:**
- Purpose: Redux store configuration
- Contains: Redux slices (reducers, actions)
- Key files: Redux store setup and slice definitions

**src/mobile/ImidusCustomerApp/src/services:**
- Purpose: API call abstractions
- Contains: Service classes for menu, order, auth, loyalty
- Key files: Service implementations wrapping Axios client

## Key File Locations

**Entry Points:**

- Web: `src/web/app/layout.tsx` (root layout with providers), `src/web/app/page.tsx` (home page)
- Backend: `src/backend/IntegrationService.API/Program.cs` (service configuration and startup)
- Mobile: `src/mobile/ImidusCustomerApp/App.tsx` (React Navigation entry)

**Configuration:**

- Backend: `src/backend/IntegrationService.API/Program.cs` (CORS, Swagger, DI)
- Web: `src/web/next.config.ts` (empty, minimal Next.js config)
- Web: `src/web/app/globals.css` (global Tailwind styles)
- Mobile: `src/mobile/ImidusCustomerApp/metro.config.js` (Metro bundler config)

**Core Logic:**

- Order Processing: `src/backend/IntegrationService.Core/Services/OrderProcessingService.cs`
- Data Access: `src/backend/IntegrationService.Infrastructure/Data/PosRepository.cs`
- API Client: `src/web/lib/api.ts` (fetch wrapper and typed endpoints)
- Menu Page: `src/web/app/menu/page.tsx`
- Orders Page: `src/web/app/orders/page.tsx`

**Testing:**

- Backend Tests: `src/backend/IntegrationService.Tests/` (XUnit test files)
- Mobile Tests: `src/mobile/ImidusCustomerApp/__tests__/` (Jest tests)
- Web: No test files currently present

## Naming Conventions

**Files:**

- Backend C# files: PascalCase + `.cs` (e.g., `OrderProcessingService.cs`, `PosRepository.cs`)
- Frontend TypeScript/TSX: PascalCase for components (e.g., `Navbar.tsx`, `AuthContext.tsx`)
- Frontend TypeScript: camelCase for utilities (e.g., `api.ts`)
- Backend projects: `.csproj` files with PascalCase project names (e.g., `IntegrationService.API.csproj`)

**Directories:**

- Backend: PascalCase (e.g., `Controllers`, `Services`, `Interfaces`)
- Frontend: lowercase (e.g., `app`, `components`, `context`, `lib`)
- Mobile: lowercase (e.g., `src/screens`, `src/services`, `src/store`)

**Database/Schema:**

- Tables: `tbl` prefix + PascalCase (e.g., `tblSales`, `tblPendingOrders`, `tblPayment`)
- Columns: PascalCase (e.g., `SalesID`, `ItemID`, `TransType`)

## Where to Add New Code

**New Feature (e.g., Loyalty Points UI):**
- Primary code: `src/web/app/profile/page.tsx` (new page or existing route)
- Service: `src/backend/IntegrationService.Core/Services/LoyaltyService.cs` (business logic)
- API Client: Add method to `LoyaltyAPI` in `src/web/lib/api.ts`
- Tests: `src/backend/IntegrationService.Tests/LoyaltyServiceTests.cs`

**New Component/Module (e.g., PaymentModal):**
- Implementation: `src/web/components/PaymentModal.tsx`
- Tests: Web tests would go in same directory as component
- Mobile: `src/mobile/ImidusCustomerApp/src/components/PaymentModal.tsx`

**Backend API Endpoint (e.g., Analytics):**
- Controller: New method in `src/backend/IntegrationService.API/Controllers/AnalyticsController.cs` (or new controller)
- Service: Logic in `src/backend/IntegrationService.Core/Services/` (new or existing)
- Repository: Data access in `src/backend/IntegrationService.Infrastructure/Data/PosRepository.cs`

**Utilities/Helpers:**
- Shared web helpers: `src/web/lib/` (import patterns, validation, formatting)
- Mobile services: `src/mobile/ImidusCustomerApp/src/services/`
- Backend extensions: `src/backend/IntegrationService.Core/` or `Infrastructure/`

**Database Changes:**
- Schema scripts: `src/backend/Database/scripts/` (migration files)
- New entities: `src/backend/IntegrationService.Core/Domain/Entities/PosEntities.cs`
- New queries: `src/backend/IntegrationService.Infrastructure/Data/PosRepository.cs`

## Special Directories

**src/backend/Database:**
- Purpose: Database initialization and migration scripts
- Generated: No, manually maintained
- Committed: Yes, tracked in git

**src/web/.next:**
- Purpose: Next.js build output and cache
- Generated: Yes, auto-generated during `npm run build` or `npm run dev`
- Committed: No, in `.gitignore`

**node_modules/ (web and mobile):**
- Purpose: Installed npm packages
- Generated: Yes, created by `npm install` or `yarn install`
- Committed: No, in `.gitignore`

**src/backend/bin/ and obj/:**
- Purpose: .NET build artifacts
- Generated: Yes, created during `dotnet build`
- Committed: No, in `.gitignore`

**.planning/codebase/:**
- Purpose: GSD codebase analysis documents
- Generated: No, maintained by analysis agents
- Committed: Yes, tracked in git for reference

## Route Organization (Web Frontend)

```
src/web/app/
├── page.tsx                    # / (home)
├── layout.tsx                  # Root layout with providers
├── login/page.tsx              # /login
├── register/page.tsx           # /register
├── menu/page.tsx               # /menu (main ordering interface)
├── cart/page.tsx               # /cart
├── orders/page.tsx             # /orders (order history)
├── profile/page.tsx            # /profile (user settings, loyalty)
├── checkout/page.tsx           # /checkout (payment processing)
└── merchant/
    └── dashboard/page.tsx      # /merchant/dashboard (analytics)
```

All routes are wrapped by:
- `AuthProvider` (manages auth token and user state)
- `CartProvider` (manages cart contents)
- Global layout with `Sidebar`, `OrderPanel`, `Navbar` components

## Backend Project Dependencies

- **IntegrationService.API** depends on:
  - `IntegrationService.Core` (services)
  - `IntegrationService.Infrastructure` (data access)

- **IntegrationService.Core** depends on:
  - Nothing (pure domain layer)

- **IntegrationService.Infrastructure** depends on:
  - `IntegrationService.Core` (interfaces, entities)

- **IntegrationService.Tests** depends on:
  - All above projects (for testing)

---

*Structure analysis: 2026-02-25*
