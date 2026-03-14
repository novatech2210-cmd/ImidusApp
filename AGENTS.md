# AGENTS.md - Coding Agent Guidelines

## Build, Lint & Test Commands

### Backend (.NET 9)
```bash
cd /home/kali/Desktop/TOAST/src/backend/IntegrationService.API

# Build
dotnet build

# Run all tests
dotnet test ../IntegrationService.Tests/IntegrationService.Tests.csproj

# Run single test by fully qualified name
dotnet test ../IntegrationService.Tests/IntegrationService.Tests.csproj --filter "FullyQualifiedName~OrderCreationTests"

# Run with verbosity
dotnet test --verbosity normal

# Clean build
dotnet clean && dotnet build

# Run API locally
dotnet run --urls "http://localhost:5004"
```

### Web Frontend (Next.js 16)
```bash
cd /home/kali/Desktop/TOAST/src/web

# Install dependencies
npm install

# Dev server
npm run dev

# Build
npm run build

# Lint
npm run lint

# No test runner configured (add jest if needed)
```

### Admin Portal (Next.js 14)
```bash
cd /home/kali/Desktop/TOAST/src/admin

# Install dependencies
npm install

# Dev server (runs on port 3001)
npm run dev

# Build
npm run build

# Lint
npm run lint

# Type check (no emit)
npm run type-check
```

### Mobile (React Native 0.74)
```bash
cd /home/kali/Desktop/TOAST/src/mobile/ImidusCustomerApp

# Install dependencies
npm install

# Start Metro bundler
npm start

# Run Android
npm run android

# Run iOS
npm run ios

# Lint
npm run lint

# Run tests
npm test
```

## Code Style Guidelines

### C# / .NET Backend
- **Naming**: PascalCase for classes/methods/properties; camelCase for parameters; _prefix for private fields
- **Types**: Always use explicit types. Nullable reference types enabled (`<Nullable>enable</Nullable>`)
- **Imports**: System namespaces first, then Microsoft, then project. Use file-scoped namespaces
- **Null Guards**: Always validate parameters: `?? throw new ArgumentNullException(nameof(param))`
- **Async**: Use `Async` suffix on async methods. Prefer `Task` over `void` for async
- **POS Safety**: All DB writes must be atomic (BEGIN TRANSACTION / COMMIT). Use UPDLOCK for concurrent reads
- **Error Handling**: Use specific exceptions with descriptive messages. Log with structured logging (Serilog)

### TypeScript / React (Frontend)
- **Naming**: PascalCase for components; camelCase for functions/variables; UPPER_SNAKE for constants
- **Types**: Strict TypeScript enabled. Always define interfaces for props and API responses
- **Imports**: React first, then libraries (alphabetical), then local (@/ aliases)
- **Components**: Use functional components with hooks. Export default at bottom
- **Error Handling**: Use try/catch with console.error. Provide fallback UI for async operations
- **Styling**: Tailwind CSS classes. Use `clsx` for conditional classes

## Project Constants (Never Hardcode)

```csharp
// Backend constants
CashierID (online orders): 999
CashierID (test orders): 998
StationID (online): 2 (DESKTOP-DEMO)
GST Rate: 0.0600 (6%) — read live from tblMisc Code='GST'
PST Rate: 0.0000 (0%) — read from tblMisc Code='PST'
Loyalty earn: 1 pt per $10 spent (tblMisc SRPR = '10@1')
Loyalty redeem: $0.40 per point (tblMisc DRPR = '40@1')
```

## Critical Rules

1. **DB Atomicity**: All writes to POS database must use transactions. Partial writes corrupt live POS
2. **Price Validation**: Never trust client-submitted prices. Always re-validate from tblAvailableSize server-side
3. **No Schema Changes**: POS DB is SQL Server 2005. No ALTER TABLE allowed. Use existing columns only
4. **Idempotency**: All order endpoints require X-Idempotency-Key header to prevent duplicate orders
5. **Tokenization Only**: Use Authorize.net Accept.js for cards. Never store raw card data

## File Locations

- Backend API: `/src/backend/IntegrationService.API/Controllers/`
- Backend Services: `/src/backend/IntegrationService.Core/Services/`
- Backend DTOs: `/src/backend/IntegrationService.API/DTOs/`
- Web Pages: `/src/web/app/`
- Web Components: `/src/web/components/`
- Web API Client: `/src/web/lib/api.ts`
- Admin Pages: `/src/admin/app/`
