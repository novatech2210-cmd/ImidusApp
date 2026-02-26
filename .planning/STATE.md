# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-25)

**Core value:** Customers can order from their phones and have orders appear in the POS terminal exactly as if placed at the counter - with payment already posted.
**Current focus:** Phase 2: Menu System

## Current Position

Phase: 3 of 8 (Order Creation)
Plan: 2 of 3 in current phase
Status: In Progress
Last activity: 2026-02-26 - Completed 03-02-PLAN.md (Idempotency & Concurrency)

Progress: [█████░░░░░] 33%

## Performance Metrics

**Velocity:**
- Total plans completed: 5
- Average duration: 3.6 min
- Total execution time: 0.30 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 2 | 6 min | 3 min |
| 02-menu-system | 2 | 7 min | 3.5 min |
| 03-order-creation | 1 | 6 min | 6 min |

**Recent Trend:**
- Last 5 plans: 2 min, 2 min, 5 min, 6 min
- Trend: Consistent

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
Stopped at: Completed 03-02-PLAN.md (Idempotency & Concurrency Control)
Resume file: None

---
*State initialized: 2026-02-25*
