# Workflow - INI Restaurant POS Integration

## TDD Policy

### Strict Enforcement (Required)

**Backend Integration Service (.NET 8 API)**

- All writes to INI_Restaurant database must have automated tests
- Idempotency key checks, concurrency validations, transaction rollback scenarios
- Critical stored procedures / SQL queries (Dapper) covered by:
  - Unit tests with mocked DB
  - Integration tests against INI_Restaurant.Bak sandbox

**Payment Flows**

- Authorize.net tokenization and posting to POS DB
- Partial payments, failed payments, retries
- Verifone/Ingenico bridge (once API docs provided)

**Scheduled / Future Orders**

- Insertion into overlay DB (ScheduledOrders)
- Injection into POS DB (tblSales)
- Timing and boundary conditions

### Moderate Enforcement (Recommended)

**Web & Mobile UI Components**

- Focus on critical business logic:
  - Cart calculations
  - Loyalty point redemption
  - Price/discount calculations
- Full component rendering tests optional
- Prioritize integration tests for end-to-end flows

### Loose Enforcement (Optional)

**Static Content / Branding**

- Purely static content or branding application
- Read-only queries that do not mutate POS DB state

### Testing Strategy

- **Unit Tests**: xUnit / NUnit for C# backend
- **Integration Tests**: Sandbox copy of INI_Restaurant.Bak
- **Regression Safety**: Every new feature must include at least one test covering read/write to POS tables
- **CI Enforcement**: Automated CI must fail if tests fail

## Commit Strategy

### Branching Model

- **main** — Production, always stable, deployable at any time
- **develop** — Integration branch, full TDD suite runs before merging to main
- **feature/<name>** — Each feature/milestone (e.g., feature/mobile-cart, feature/payment-authorize-net)
- **hotfix/<issue>** — Urgent fixes in main, merged back to both main and develop

### Conventional Commits

Format: `type(scope): description`

**Types**:

- `feat` — New feature
- `fix` — Bug fix
- `chore` — Maintenance/tooling/CI/CD changes
- `refactor` — Code refactoring (no feature/bug impact)
- `test` — Add or fix tests
- `docs` — Documentation updates

**Scopes**:

- `backend` — Integration service
- `mobile` — React Native apps
- `web` — Customer ordering website
- `admin` — Admin portal
- `payments` — Payment integrations
- `overlay-db` — IntegrationService database

**Examples**:

```
feat(backend): add idempotency key check for tblSales insert
fix(payment): handle partial Authorize.net payment retries
test(backend): add integration test for ScheduledOrders injection
refactor(mobile): update cart calculation logic
docs(web): update homepage carousel documentation
```

### Commit Rules

- **Atomic commits only** — One logical change per commit
- **TDD enforced commits** — 🔴 strict modules: all commits must pass unit + integration tests
- **No direct commits to main** — All changes through PRs with review
- **PR Review Required** — At least one peer or lead review

### Tagging and Releases

- **Milestone tags**: `v<milestone_number>.<subversion>` (e.g., `v2.0` for Milestone 2)
- **Deployment tags**: `deploy-YYYY-MM-DD-<milestone>` (e.g., `deploy-2026-03-10-M3`)

## Code Review Policy

### Mandatory Review

All merges into `develop` or `main` require a pull request (PR):

- No direct commits to main
- PR must be reviewed and approved before merging
- Reviewer(s) cannot be the same as the author

### Reviewer Assignment

**Backend / Critical Logic** (POS DB writes, payments, scheduled orders)

- Minimum **two reviewers**:
  - Domain expert familiar with POS lifecycle
  - Senior backend developer
- Focus: SQL correctness, transactions, idempotency, concurrency checks

**Moderate Risk** (Mobile business logic, cart calculations, loyalty points)

- Minimum **one reviewer**
- Focus: UI → API mapping, logic correctness, TDD coverage

**Low Risk** (UI, CSS, branding, static content)

- **Optional** review or peer review only
- Focus: branding compliance, style consistency

### Review Checklist

**Critical Modules** (Backend Writes, Payments, Scheduled Orders):

- [ ] Business logic — Correct lifecycle of tblSales, tblPendingOrders, tblPayment
- [ ] Idempotency keys correctly applied
- [ ] Concurrency checks (ticket state re-validation) present
- [ ] Database Safety — SQL queries tested against sandbox INI_Restaurant DB
- [ ] No schema changes
- [ ] Transactions wrapped correctly with rollback on failure
- [ ] Unit and integration tests exist and pass
- [ ] Edge cases covered (duplicate orders, failed payments, boundary values)
- [ ] Audit & Logging — All writes include logging/audit tracking

**Moderate Modules** (Mobile/Web Logic):

- [ ] Correct calculations (cart totals, discounts, loyalty points)
- [ ] API calls match backend contract
- [ ] Unit/integration tests present (recommended but optional)
- [ ] Conventional commit messages, formatting, linting passed

**Low Risk Modules** (UI / Branding):

- [ ] Brand Compliance — Colors, logos, typography follow Imidus design system
- [ ] Code Quality — CSS, JS/TS code linted

### PR Requirements

- Clear title & description with linked milestone/issue number
- TDD Validation — Include screenshots of tests passing (backend critical)
- Dependency Check — Confirm no breaking changes in CI/CD pipeline
- Approval — At least 1 reviewer for moderate, 2 reviewers for critical

### CI/CD Enforcement

Merge blocked if:

- Any backend critical test fails
- Linting errors
- Missing TDD for strict modules

## Verification Checkpoints

### Mandatory Manual Verification

**Critical Backend Writes** (POS DB):

- Any new feature that inserts or updates:
  - tblSales (tickets/orders)
  - tblPendingOrders (active order lines)
  - tblPayment (payment records)
  - Scheduled/future orders (ScheduledOrders → tblSales injection)

**Payment Flows**:

- Authorize.net tokenization and posting to POS DB
- Partial payments, failed payments, retries
- Verifone/Ingenico bridge interactions

**Cross-Platform End-to-End Flows**:

- Customer orders on mobile → backend → POS DB → order completion → notification sent
- Web ordering → same lifecycle
- Admin portal triggers scheduled or promotional orders

**Edge Cases / Boundary Scenarios**:

- Maximum/minimum order amounts
- Multi-item split-bill scenarios (PersonIndex usage)
- Loyalty points: zero, negative, or exact redemption
- Kitchen routing flags (KitchenB/KitchenF/Bar)
- DailyOrderNumber reset at midnight

### Optional Manual Verification

**UI/Branding**: Mobile/Web UI rendering of menus, banners, colors, fonts
**Push Notifications**: Validate appearance on device for campaigns or transactional messages
**Reporting/Analytics**: Quick spot-check of aggregate numbers (sales, points, revenue)

### Manual Verification Checklist

For any scenario requiring manual checks:

- [ ] Reproduce the workflow end-to-end
- [ ] Check data integrity — Correct totals, item counts, loyalty points, payment amounts
- [ ] Check audit logs — All writes logged correctly with timestamp, user, action
- [ ] Validate external integration — Authorize.net tokenization result, push notifications, scheduled order release
- [ ] Record pass/fail — Document any anomalies before marking feature/milestone as complete

### Trigger Points

| Trigger                            | Manual Verification Required? | Notes                             |
| ---------------------------------- | ----------------------------- | --------------------------------- |
| New feature writing to POS DB      | ✅ Yes                        | Mandatory for every insert/update |
| Payment integration / tokenization | ✅ Yes                        | Include partial/failure scenarios |
| End-to-end order lifecycle         | ✅ Yes                        | Cross-platform mobile/web/admin   |
| Critical edge cases                | ✅ Yes                        | Include timing-based scenarios    |
| UI / branding only                 | ⚪ Optional                   | Visual QA suffices                |
| Read-only queries                  | ⚪ Optional                   | Automated test sufficient         |

## Summary Rule

Manual verification is **required** whenever a change affects:

- POS DB writes
- Payment processing
- Scheduled orders
- End-to-end order flows

UI, branding, and read-only data checks can rely primarily on automated tests, with visual QA as a backup. Always document verification results before milestone completion or S3 deployment.
