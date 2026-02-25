# Codebase Structure

**Analysis Date:** 2026-02-25

## Directory Layout

```
/home/kali/Desktop/TOAST/
├── src/                              # All source code
│   ├── backend/                      # .NET 8 backend (C#)
│   │   ├── IntegrationService.API/           # ASP.NET Core API layer
│   │   ├── IntegrationService.Core/          # Domain/business logic layer
│   │   ├── IntegrationService.Infrastructure/ # Data access layer
│   │   ├── IntegrationService.Tests/         # Unit tests
│   │   └── Database/                         # SQL schema/migrations
│   ├── web/                          # Next.js 14 frontend (TypeScript/React)
│   │   ├── app/                      # App router pages
│   │   ├── lib/                      # API client, utilities
│   │   ├── context/                  # React Context providers
│   │   ├── components/               # Reusable UI components
│   │   └── public/                   # Static assets
│   ├── mobile/                       # React Native mobile (future)
│   │   └── ImidusCustomerApp/
│   └── ImidusPos.slnx                # Solution file
├── assets/                           # Marketing/documentation assets
├── .planning/                        # GSD planning documents
│   └── codebase/                     # This architecture documentation
└── .github/                          # GitHub Actions CI/CD
```

## Directory Purposes

**Backend Directories:**

**IntegrationService.API:**
- Purpose: HTTP API layer, request handling, dependency injection
- Contains: Controllers, DTOs, background services, Swagger config
- Key files: `Program.cs`, `Controllers/OrdersController.cs`, `Controllers/MenuController.cs`, `Controllers/HealthController.cs`
- Important: CORS configured for `http://localhost:3000`, Serilog logging setup

**IntegrationService.Core:**
- Purpose: Domain entities, business logic, service interfaces
- Contains: Entity models, repository interfaces, service implementations
- Structure:
  - `Domain/Entities/`: C# entity classes matching INI POS database schema
  - `Interfaces/`: Service and repository contracts
  - `Services/`: Business logic (OrderService, LoyaltyService, UpsellService, etc.)
  - `Models/`: DTOs for service layer
- Key files: `Domain/Entities/PosEntities.cs` (all database mappings)

**IntegrationService.Infrastructure:**
- Purpose: Data persistence, external service implementations
- Contains: Repository implementations, SQL data access, mock services
- Structure:
  - `Data/`: Repository implementations (PosRepository, CustomerRepository)
  - `Services/`: Mock implementations (MockPaymentService, MockNotificationService)
- Database: SQL Server 2005 Express, database name "TPPro"

**IntegrationService.Tests:**
- Purpose: Unit tests for business logic
- Contains: Service tests, repository tests
- Key files: `OrderServiceTests.cs`, `LoyaltyServiceTests.cs`, `UnitTest1.cs`

**Database:**
- Purpose: SQL schema scripts, migrations
- Location: `/home/kali/Desktop/TOAST/src/backend/Database/`
- Contains: Database initialization scripts

**Frontend Directories:**

**app/ (Next.js App Router):**
- Purpose: Page definitions and routing
- Contains: Page components organized by route
- Structure:
  - `page.tsx`: Root/home page
  - `menu/page.tsx`: Menu browsing
  - `cart/page.tsx`: Shopping cart display
  - `checkout/page.tsx`: Order completion
  - `orders/page.tsx`: Order history
  - `login/page.tsx`: Authentication
  - `register/page.tsx`: User registration
  - `profile/page.tsx`: User profile
  - `merchant/dashboard/page.tsx`: Merchant analytics
- Pattern: Each directory contains `page.tsx` (route component)

**lib/:**
- Purpose: Utilities, API client, helpers
- Location: `/home/kali/Desktop/TOAST/src/web/lib/`
- Key files:
  - `api.ts`: API client wrapper, typed endpoints (MenuAPI, OrderAPI, LoyaltyAPI)
  - Contains: Request authentication (Bearer token), error handling, interface definitions

**context/:**
- Purpose: Global state management via React Context API
- Location: `/home/kali/Desktop/TOAST/src/web/context/`
- Contains:
  - `CartContext.tsx`: Shopping cart state (items, total, count) with localStorage persistence
  - `AuthContext.tsx`: User authentication state (login, token, user info)
- Pattern: useContext hooks for component consumption

**components/:**
- Purpose: Reusable UI components
- Location: `/home/kali/Desktop/TOAST/src/web/components/`
- Key files:
  - `OrderPanel.tsx`: Order summary display
  - `Sidebar.tsx`: Navigation sidebar
  - Other UI components (buttons, cards, forms)

**public/:**
- Purpose: Static assets (images, fonts, manifests)
- Location: `/home/kali/Desktop/TOAST/src/web/public/`
- Served at root of web app

**Layout:**
- Location: `/home/kali/Desktop/TOAST/src/web/app/layout.tsx`
- Purpose: Root layout for all pages
- Contains: Provider setup (AuthProvider, CartProvider), global styling, header/footer

## Key File Locations

**Entry Points:**

- **Backend API**: `/home/kali/Desktop/TOAST/src/backend/IntegrationService.API/Program.cs`
- **Frontend Root**: `/home/kali/Desktop/TOAST/src/web/app/layout.tsx`
- **Frontend Home**: `/home/kali/Desktop/TOAST/src/web/app/page.tsx`

**Configuration:**

- **API Setup**: `/home/kali/Desktop/TOAST/src/backend/IntegrationService.API/Program.cs` (CORS, DI, Swagger)
- **Frontend Config**: `/home/kali/Desktop/TOAST/src/web/next.config.js` (if exists)
- **Solution File**: `/home/kali/Desktop/TOAST/src/ImidusPos.slnx`

**Core Logic:**

- **Order Processing**: `/home/kali/Desktop/TOAST/src/backend/IntegrationService.Core/Services/OrderService.cs`
- **Order Processing Service**: `/home/kali/Desktop/TOAST/src/backend/IntegrationService.Core/Services/OrderProcessingService.cs`
- **Loyalty System**: `/home/kali/Desktop/TOAST/src/backend/IntegrationService.Core/Services/LoyaltyService.cs`
- **Upsell Logic**: `/home/kali/Desktop/TOAST/src/backend/IntegrationService.Core/Services/UpsellService.cs`

**Data Layer:**

- **Order Repository**: `/home/kali/Desktop/TOAST/src/backend/IntegrationService.Infrastructure/Data/PosRepository.cs`
- **Customer Repository**: `/home/kali/Desktop/TOAST/src/backend/IntegrationService.Infrastructure/Data/CustomerRepository.cs`

**Testing:**

- **Order Service Tests**: `/home/kali/Desktop/TOAST/src/backend/IntegrationService.Tests/OrderServiceTests.cs`
- **Loyalty Tests**: `/home/kali/Desktop/TOAST/src/backend/IntegrationService.Tests/LoyaltyServiceTests.cs`

## Naming Conventions

**Files:**

- **C# Classes**: `PascalCase` (PosTicket, OrderService, IOrderRepository)
- **C# Files**: Match class name exactly (OrderService.cs contains OrderService class)
- **TypeScript Components**: `PascalCase.tsx` for React components (CartContext.tsx, OrderPanel.tsx)
- **TypeScript Utilities**: `camelCase.ts` (api.ts, helpers.ts)
- **Pages**: `page.tsx` (Next.js convention)

**Directories:**

- **C# Projects**: `PascalCase` with dot separators (IntegrationService.API, IntegrationService.Core)
- **C# Namespaces**: Match directory structure (IntegrationService.Core.Domain.Entities)
- **Frontend Directories**: `camelCase` for feature directories, `PascalCase` for component directories
- **Feature Directories**: Grouped by domain (e.g., `/app/menu/`, `/app/checkout/`)

**Functions/Methods:**

- **C# Methods**: `PascalCase` (CreateOrderAsync, GetItemByIdAsync, ProcessPaymentAsync)
- **TypeScript Functions**: `camelCase` (apiClient, getFullMenu, addItem)
- **React Hooks**: Prefixed with `use` (useCart, useAuth)

**Types/Interfaces:**

- **C# Interfaces**: Prefixed with `I` (IOrderRepository, IPaymentService)
- **TypeScript Interfaces**: `PascalCase` (CartContextType, MenuCategory, OrderItem)
- **C# Enums**: `PascalCase` (TransactionType, PaymentType)

**Database Entities:**

- **Entity Classes**: `Pos` prefix + domain (PosTicket, PosCustomer, PosTable, PosTender)
- **Abbreviations**: Allowed for legacy field names (DSCAmt for discount amount, Qty for quantity)

## Where to Add New Code

**New Feature:**

- Primary code:
  - **Backend Domain Entity**: `/home/kali/Desktop/TOAST/src/backend/IntegrationService.Core/Domain/Entities/PosEntities.cs` (if extends POS schema)
  - **Backend Interface**: `/home/kali/Desktop/TOAST/src/backend/IntegrationService.Core/Interfaces/I[Feature]Service.cs` (or I[Feature]Repository.cs)
  - **Backend Service**: `/home/kali/Desktop/TOAST/src/backend/IntegrationService.Core/Services/[Feature]Service.cs`
  - **Backend Implementation**: `/home/kali/Desktop/TOAST/src/backend/IntegrationService.Infrastructure/Data/[Feature]Repository.cs`
  - **API Controller**: `/home/kali/Desktop/TOAST/src/backend/IntegrationService.API/Controllers/[Feature]Controller.cs`
  - **API DTOs**: `/home/kali/Desktop/TOAST/src/backend/IntegrationService.API/DTOs/[Feature]DTOs.cs`
- Tests:
  - **Backend Tests**: `/home/kali/Desktop/TOAST/src/backend/IntegrationService.Tests/[Feature]ServiceTests.cs`
- Frontend:
  - **Page**: `/home/kali/Desktop/TOAST/src/web/app/[route]/page.tsx`
  - **Context (if state needed)**: `/home/kali/Desktop/TOAST/src/web/context/[Feature]Context.tsx`
  - **API Client**: Add to `lib/api.ts` under appropriate namespace (MenuAPI, OrderAPI, etc.)

**New Component/Module:**

- Implementation:
  - **React Component**: `/home/kali/Desktop/TOAST/src/web/components/[ComponentName].tsx`
  - **Component Tests**: `/home/kali/Desktop/TOAST/src/web/__tests__/[ComponentName].test.tsx` (if test directory exists)
- Follow existing pattern of "use client" directive for interactive components

**Utilities:**

- **Shared Helpers**: `/home/kali/Desktop/TOAST/src/web/lib/[utility].ts` (add alongside api.ts)
- **C# Utilities**: `/home/kali/Desktop/TOAST/src/backend/IntegrationService.Core/Services/` for domain logic, `/home/kali/Desktop/TOAST/src/backend/IntegrationService.Infrastructure/Services/` for infra utilities

**Background Services:**

- Location: `/home/kali/Desktop/TOAST/src/backend/IntegrationService.API/BackgroundServices/`
- Pattern: Implement `IHostedService`, registered in `Program.cs`
- Example: `BirthdayRewardBackgroundService.cs`

## Special Directories

**bin/obj:**
- Purpose: Build artifacts
- Generated: Yes (by .NET build process)
- Committed: No (in .gitignore)
- Location: Each project has `/bin/` and `/obj/` directories

**.next:**
- Purpose: Next.js build output and cache
- Generated: Yes (by Next.js dev server and build)
- Committed: No (in .gitignore)
- Location: `/home/kali/Desktop/TOAST/src/web/.next/`
- Contains: Compiled pages, static chunks, development server cache

**node_modules:**
- Purpose: npm dependencies
- Generated: Yes (by npm install)
- Committed: No (in .gitignore)
- Location: `/home/kali/Desktop/TOAST/src/web/node_modules/`

**.planning/codebase/**
- Purpose: GSD architecture documentation
- Generated: No (manually maintained)
- Committed: Yes (tracks codebase structure)
- Location: `/home/kali/Desktop/TOAST/.planning/codebase/`
- Files: ARCHITECTURE.md, STRUCTURE.md, CONVENTIONS.md, TESTING.md, STACK.md, INTEGRATIONS.md, CONCERNS.md

**.claude/**
- Purpose: Claude agent configuration and context
- Generated: No (user-maintained)
- Committed: No (project-specific config)
- Location: `/home/kali/Desktop/TOAST/.claude/`

**Database/scripts:**
- Purpose: SQL initialization and schema
- Location: `/home/kali/Desktop/TOAST/src/backend/Database/scripts/`
- Not executed via migrations; manual schema setup required

## Import Path Organization

**C# Namespaces (All Layers):**

1. System and .NET libraries
2. Third-party packages (Microsoft.*, Serilog)
3. Local namespaces (IntegrationService.*)

Example from OrderService.cs:
```csharp
using IntegrationService.Core.Domain.Entities;
using IntegrationService.Core.Interfaces;
using OrderModels = IntegrationService.Core.Models;
```

**TypeScript Imports (Frontend):**

1. React imports
2. Third-party libraries (next, heroicons, etc.)
3. Relative/alias imports (`@/lib`, `@/context`, `@/components`)

Example from menu/page.tsx:
```typescript
import { useCart } from "@/context/CartContext";
import { MenuAPI, MenuCategory } from "@/lib/api";
import { CheckIcon, PlusIcon } from "@heroicons/react/24/solid";
```

## Frontend Build Artifacts

**Generated on `npm run build`:**

- `/home/kali/Desktop/TOAST/src/web/.next/`: Compiled Next.js output (static HTML, JS bundles)
- Contains optimized pages, static assets, API routes
- Not part of version control

**Run Commands:**

- Development: `npm run dev` (starts Next.js dev server on port 3000)
- Build: `npm run build` (production build to .next/)
- Start: `npm start` (runs production build)

---

*Structure analysis: 2026-02-25*
