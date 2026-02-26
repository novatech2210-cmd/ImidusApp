# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-25)

**Core value:** Customers can order from their phones and have orders appear in the POS terminal exactly as if placed at the counter - with payment already posted.
**Current focus:** Phase 2: Menu System

## Current Position

Phase: 4 of 8 (Payments)
Plan: 1 of 2 in current phase - COMPLETE
Status: In Progress
Last activity: 2026-02-26 - Completed 04-01-PLAN.md (Payment Tokenization & Charging)

Progress: [█████░░░░░] 43%

## Performance Metrics

**Velocity:**
- Total plans completed: 7
- Average duration: 33.6 min
- Total execution time: 3.92 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 2 | 6 min | 3 min |
| 02-menu-system | 2 | 7 min | 3.5 min |
| 03-order-creation | 3 | 16 min | 5.3 min |
| 04-payments | 1 | 204 min | 204 min |

**Recent Trend:**
- Last 5 plans: 5 min, 8 min, 8 min
- Trend: Stable (complex implementation continuing)

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- DATETIME over DATETIME2 for SQL Server 2005 compatibility (01-01)
- Separate db/ directory from existing Database/ to distinguish real POS vs mock dev data (01-01)
- Schema discovery deferred until .bak file provided (01-01)
- Application-side sequence numbering for SQL Server 2005 compatibility (01-02)
- Graceful health check handling when connection strings missing (01-02)
- SkippableFact for database-optional integration tests (01-02)
- N+1 query pattern for size fetching matches existing GetMenu endpoint (02-01)
- Empty category filtering via item count dictionary (02-01)
- Skip items without in-stock sizes for better UX (02-01)
- Kitchen routing in API response for Phase 3, hidden from customers in UI (02-01)
- Used --legacy-peer-deps for bottom-sheet to avoid navigation dependency upgrades (02-02)
- Parallel category loading for better initial load performance (02-02)
- Cache-first strategy with 5-minute TTL for instant menu display (02-02)
- Bidirectional category tab scroll sync with viewAreaCoveragePercentThreshold: 50 (02-02)
- Standard Idempotency-Key header (not X-Idempotency-Key) for HTTP convention (03-02)
- SHA256 request body hashing for collision detection (03-02)
- 24-hour idempotency cache expiration balances retries with storage (03-02)
- Optimistic concurrency via TransType validation for order completion (03-02)
- Online order registration atomic with tblSales creation (03-02)
- [Phase 03-01]: Repository delegation pattern: OrderRepository wraps PosRepository
- [Phase 03-01]: Tax calculation: accumulate unrounded, round once with AwayFromZero
- [Phase 03-01]: Atomic order validation: reject entire order if any item unavailable
- [Phase 03-03]: UPDATE...OUTPUT pattern for atomic order number increment (SQL 2005 compatible)
- [Phase 03-03]: Exponential backoff retry (10-100ms) for deadlock handling
- [Phase 03-03]: CashierID=999, StationID=999, TableID=0 for online order identification
- [Phase 03-03]: IOptions<OnlineOrderSettings> with ValidateOnStart for fail-fast configuration
- [Phase 04-01]: Opaque data token pattern reduces PCI scope (card data never touches backend)
- [Phase 04-01]: Exponential backoff retry for void operations (2^attempt seconds, 3 retries)
- [Phase 04-01]: ValidateOnStart for AuthorizeNetSettings (fail-fast on missing credentials)
- [Phase 04-01]: LogCritical for settled transaction void attempts (manual refund required)

### Pending Todos

None yet.

### Blockers/Concerns

**Critical constraints to remember:**
- SQL Server 2005 Express: no MERGE, OFFSET/FETCH, window functions
- No POS schema modifications allowed
- All writes require idempotency keys + concurrency checks (contractual)
- tblPendingOrders has 20+ columns - ALL must be populated on insert
- Use sp_InsertUpdateRewardPointsDetail for loyalty points (not direct insert)
- Online orders need tblOnlineOrderCompany registration
- Card encryption via dbo.EncryptString() function
- AWS S3 is the only valid delivery channel

## Session Continuity

Last session: 2026-02-26
Stopped at: Completed 04-01-PLAN.md (Payment Tokenization & Charging)
Resume file: None

---
*State initialized: 2026-02-25*
