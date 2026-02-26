# Phase 3 Plan 3: Order Number Generation & Configuration - Summary

**Subsystem:** Order Management
**Tags:** #order-numbering #configuration #concurrency #race-conditions
**Completed:** 2026-02-26
**Duration:** 8 minutes

## One-liner

Implemented atomic daily order number generation with retry logic and configurable online order identifiers (CashierID=999, StationID=999, TableID=0) for POS integration filtering and reporting.

## What Was Built

### 1. Atomic Order Number Generation (Task 1)
- **IOrderNumberRepository interface** - Contract for daily order numbering
- **OrderNumberRepository implementation** - Atomic increment using UPDATE...OUTPUT pattern
- **Retry logic** - Exponential backoff (10ms, 20ms, 40ms) for deadlock handling (SQL error 1205)
- **Migration script** - Creates tblOrderNumber table with OrderDate primary key
- **PosRepository delegation** - Replaced race-condition-prone MAX() query with atomic repository
- **DI registration** - Registered OrderNumberRepository in Program.cs

**Files created:**
- `src/backend/IntegrationService.Core/Interfaces/IOrderNumberRepository.cs`
- `src/backend/IntegrationService.Infrastructure/Data/OrderNumberRepository.cs`
- `src/backend/db/migrations/002-create-order-number-table.sql`

**Files modified:**
- `src/backend/IntegrationService.API/Program.cs` - DI registration
- `src/backend/IntegrationService.Infrastructure/Data/PosRepository.cs` - Constructor injection + delegation

### 2. Online Order Settings Configuration (Task 2)
- **OnlineOrderSettings class** - Strongly-typed configuration with DataAnnotations validation
- **ValidateOnStart registration** - Fail-fast configuration validation at app startup
- **appsettings.json configuration** - Production settings (CashierID=999, StationID=999, TableID=0, OnlineCompanyId=1)
- **appsettings.Development.json configuration** - Development settings (same values)
- **OrderService integration** - IOptions<OnlineOrderSettings> injection and usage
- **PosRepository update** - Uses OnlineOrderCompanyID from ticket (set by OrderService)

**Configuration values:**
```json
{
  "OnlineCashierId": 999,
  "OnlineStationId": 999,
  "OnlineTableId": 0,
  "OnlineCompanyId": 1,
  "TestCashierId": 998
}
```

**Files created:**
- `src/backend/IntegrationService.Core/Configuration/OnlineOrderSettings.cs`

**Files modified:**
- `src/backend/IntegrationService.API/appsettings.json`
- `src/backend/IntegrationService.API/appsettings.Development.json`
- `src/backend/IntegrationService.API/Program.cs` - Configuration registration + OrderService registration
- `src/backend/IntegrationService.Core/Services/OrderService.cs` - IOptions injection + usage
- `src/backend/IntegrationService.Core/IntegrationService.Core.csproj` - Added Microsoft.Extensions.Options package
- `src/backend/IntegrationService.Infrastructure/Data/PosRepository.cs` - Uses OnlineOrderCompanyID from ticket

### 3. Integration Tests (Task 3)
- **OrderNumberRepositoryTests** - 5 integration test cases with SkippableFact pattern
  1. First order of day returns 1
  2. Sequential orders increment correctly
  3. Daily reset (new day starts at 1)
  4. Concurrent requests produce no duplicates
  5. Multiple calls same day increment properly
- **OrderServiceTests fix** - Added IOptions<OnlineOrderSettings> mock to existing tests

**Files created:**
- `src/backend/IntegrationService.Tests/Infrastructure/OrderNumberRepositoryTests.cs`

**Files modified:**
- `src/backend/IntegrationService.Tests/Services/OrderServiceTests.cs`

## Key Decisions

| Decision | Rationale | Impact |
|----------|-----------|--------|
| UPDATE...OUTPUT pattern instead of SEQUENCE | SQL Server 2005 compatibility (no SEQUENCE objects) | Atomic increment with manual retry logic |
| Exponential backoff 10-100ms | Balance between retry speed and deadlock resolution | 3 retries with 10ms, 20ms, 40ms delays |
| OrderNumberRepository in Infrastructure | Separate concerns: POS-specific vs. business logic | PosRepository delegates to OrderNumberRepository |
| IOptions<OnlineOrderSettings> injection | Standard .NET configuration pattern | Type-safe access with ValidateOnStart fail-fast |
| CashierID=999, StationID=999 | High numbers unlikely to conflict with physical terminals | Easy filtering in POS reports: "WHERE CashierID = 999" |
| TableID=0 for online orders | Convention for "no table" (takeout/delivery) | Natural fit for online order model |
| OnlineOrderSettings in Core project | Configuration models belong in Core (not Infrastructure) | Added Microsoft.Extensions.Options dependency to Core |

## Technical Highlights

### Race Condition Prevention
The original MAX() approach had a critical race condition:
```sql
-- OLD (BROKEN): Two concurrent requests can get same number
SELECT ISNULL(MAX(DailyOrderNumber), 0) + 1
FROM tblSales WHERE ...
```

New atomic approach with UPDATE...OUTPUT:
```sql
-- NEW (SAFE): Atomic increment
UPDATE tblOrderNumber
SET OrderNumber = OrderNumber + 1
OUTPUT INSERTED.OrderNumber
WHERE OrderDate = @Today
```

### Tax Calculation Precision
Maintained existing precision pattern from Phase 3 Plan 1:
- Accumulate unrounded tax amounts per line item
- Round once at the end using `Math.Round(..., MidpointRounding.AwayFromZero)`
- Prevents penny discrepancies from premature rounding

### Configuration Validation
DataAnnotations + ValidateOnStart ensures:
- Required fields present at startup
- Range validation (e.g., CashierID > 0)
- Clear error messages if misconfigured
- No runtime surprises

## Testing Notes

### Integration Tests
OrderNumberRepositoryTests require:
- SQL Server running locally
- POS database restored (INI_Restaurant)
- Migration script executed: `002-create-order-number-table.sql`

Tests use SkippableFact to gracefully skip if database unavailable (CI-friendly).

### Unit Tests
OrderServiceTests updated to mock IOptions<OnlineOrderSettings>:
```csharp
var mockSettings = new Mock<IOptions<OnlineOrderSettings>>();
mockSettings.Setup(x => x.Value).Returns(new OnlineOrderSettings { ... });
```

All existing tests pass with new configuration dependency.

## Deviations from Plan

**None - plan executed exactly as written.**

All tasks completed as specified:
- Atomic order number generation with retry ✓
- Configuration with validation ✓
- Integration tests with SkippableFact ✓

## Self-Check: PASSED

**Files created (verified):**
```bash
FOUND: src/backend/IntegrationService.Core/Interfaces/IOrderNumberRepository.cs
FOUND: src/backend/IntegrationService.Infrastructure/Data/OrderNumberRepository.cs
FOUND: src/backend/db/migrations/002-create-order-number-table.sql
FOUND: src/backend/IntegrationService.Core/Configuration/OnlineOrderSettings.cs
FOUND: src/backend/IntegrationService.Tests/Infrastructure/OrderNumberRepositoryTests.cs
```

**Commits (verified):**
```bash
FOUND: 3ebe804 (Task 1: Atomic order number generation)
FOUND: 14f04be (Task 2: Configuration with validation)
FOUND: 55b700b (Task 3: Integration tests)
```

**Build verification:**
```bash
✓ IntegrationService.Core builds
✓ IntegrationService.Infrastructure builds
✓ IntegrationService.API builds
✓ IntegrationService.Tests builds
```

**Pattern verification:**
```bash
✓ UPDATE...OUTPUT found in OrderNumberRepository
✓ ex.Number == 1205 (deadlock handling)
✓ Math.Pow (exponential backoff)
✓ AddScoped<IOrderNumberRepository> in Program.cs
✓ OnlineOrderSettings section in appsettings.json
✓ ValidateOnStart in Program.cs
✓ IOptions<OnlineOrderSettings> in OrderService
✓ _settings.OnlineCashierId usage
```

## What's Next

**Phase 3 Plan 4 (if exists):** Continue order creation implementation (payment processing, order completion workflow).

**Database setup required:**
Run migration script before testing:
```bash
docker exec imidus-sqlserver /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P "$SA_PASSWORD" -C \
  -i /var/opt/mssql/migrations/002-create-order-number-table.sql
```

**Configuration deployment:**
Ensure OnlineOrderSettings configured in production appsettings.json with appropriate values for restaurant's POS terminal IDs.

---

**Dependency Graph:**
- **Requires:** Phase 3 Plans 1-2 (order creation refactor, idempotency)
- **Provides:** Atomic order numbering, configurable POS identifiers
- **Affects:** Any feature using DailyOrderNumber or online order POS integration

**Tech Stack Added:**
- `Microsoft.Extensions.Options` (v8.0.0) - Configuration binding and validation

**Key Files:**
- **Created:** IOrderNumberRepository.cs, OrderNumberRepository.cs, OnlineOrderSettings.cs, OrderNumberRepositoryTests.cs, 002-create-order-number-table.sql
- **Modified:** PosRepository.cs (delegation), OrderService.cs (IOptions injection), Program.cs (DI + config), appsettings.json (config values)
