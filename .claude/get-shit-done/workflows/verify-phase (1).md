<purpose>
Verify phase goal achievement through goal-backward analysis. Check that the codebase delivers what the phase promised, not just that tasks completed.

Executed by a verification subagent spawned from execute-phase.md.
</purpose>

<core_principle>
**Task completion ≠ Goal achievement**

A task "create chat component" can be marked complete when the component is a placeholder. The task was done — but the goal "working chat interface" was not achieved.

Goal-backward verification:
1. What must be TRUE for the goal to be achieved?
2. What must EXIST for those truths to hold?
3. What must be WIRED for those artifacts to function?

Then verify each level against the actual codebase.

**Database Integration Source of Truth:**

For any phase involving POS database integration, verification MUST confirm implementation matches INI_Restaurant.Bak:

1. **Schema Truth** - Table/column names, types, constraints match actual database (not documentation)
2. **Relationship Truth** - Foreign keys, joins follow actual schema (not assumptions)
3. **Transaction Truth** - Multi-table writes follow actual POS patterns (6-table atomic order creation)
4. **Business Rule Truth** - Tax from tblMisc, CashierID conventions (998/999), no schema modifications

INI_Restaurant.Bak supersedes all other documentation when conflicts exist.
</core_principle>

<required_reading>
@./.claude/get-shit-done/references/verification-patterns.md
@./.claude/get-shit-done/templates/verification-report.md
</required_reading>

<process>

<step name="load_context" priority="first">
Load phase operation context:

```bash
INIT=$(node ./.claude/get-shit-done/bin/gsd-tools.cjs init phase-op "${PHASE_ARG}")
```

Extract from init JSON: `phase_dir`, `phase_number`, `phase_name`, `has_plans`, `plan_count`.

Then load phase details and list plans/summaries:
```bash
node ./.claude/get-shit-done/bin/gsd-tools.cjs roadmap get-phase "${phase_number}"
grep -E "^| ${phase_number}" .planning/REQUIREMENTS.md 2>/dev/null
ls "$phase_dir"/*-SUMMARY.md "$phase_dir"/*-PLAN.md 2>/dev/null
```

Extract **phase goal** from ROADMAP.md (the outcome to verify, not tasks) and **requirements** from REQUIREMENTS.md if it exists.
</step>

<step name="establish_must_haves">
**Option A: Must-haves in PLAN frontmatter**

Use gsd-tools to extract must_haves from each PLAN:

```bash
for plan in "$PHASE_DIR"/*-PLAN.md; do
  MUST_HAVES=$(node ./.claude/get-shit-done/bin/gsd-tools.cjs frontmatter get "$plan" --field must_haves)
  echo "=== $plan ===" && echo "$MUST_HAVES"
done
```

Returns JSON: `{ truths: [...], artifacts: [...], key_links: [...] }`

Aggregate all must_haves across plans for phase-level verification.

**Option B: Use Success Criteria from ROADMAP.md**

If no must_haves in frontmatter (MUST_HAVES returns error or empty), check for Success Criteria:

```bash
PHASE_DATA=$(node ./.claude/get-shit-done/bin/gsd-tools.cjs roadmap get-phase "${phase_number}" --raw)
```

Parse the `success_criteria` array from the JSON output. If non-empty:
1. Use each Success Criterion directly as a **truth** (they are already written as observable, testable behaviors)
2. Derive **artifacts** (concrete file paths for each truth)
3. Derive **key links** (critical wiring where stubs hide)
4. Document the must-haves before proceeding

Success Criteria from ROADMAP.md are the contract — they override PLAN-level must_haves when both exist.

**Option C: Derive from phase goal (fallback)**

If no must_haves in frontmatter AND no Success Criteria in ROADMAP:
1. State the goal from ROADMAP.md
2. Derive **truths** (3-7 observable behaviors, each testable)
3. Derive **artifacts** (concrete file paths for each truth)
4. Derive **key links** (critical wiring where stubs hide)
5. Document derived must-haves before proceeding

**Database Integration Must-Haves:**

If phase involves POS database operations, add schema verification must-haves:

```bash
# Check if phase involves database integration
grep -r "tblOrders\|tblOrderDetails\|tblPayments\|tblMisc" "$PHASE_DIR"/*-PLAN.md 2>/dev/null
```

If database integration detected, add these mandatory truths:

**Schema Alignment Truths:**
- Truth: "All table references match INI_Restaurant.Bak schema exactly"
  - Artifacts: All .cs/.ts files with SQL queries
  - Verification: `grep -r "INSERT INTO\|UPDATE\|SELECT.*FROM" --include="*.cs" --include="*.ts" | compare to actual schema`

- Truth: "Tax rates read from tblMisc.Tax1 (never hardcoded)"
  - Artifacts: Tax calculation logic files
  - Verification: `grep -r "Tax1\|tblMisc" && grep -rL "0\\.0[0-9]*.*tax" (no hardcoded rates)`

- Truth: "CashierID uses correct conventions (998=test, 999=production)"
  - Artifacts: Order creation logic
  - Verification: `grep -r "CashierID.*99[89]"`

- Truth: "Multi-table writes wrapped in transactions"
  - Artifacts: Order creation, payment processing logic
  - Verification: `grep -B5 "INSERT INTO tblOrders" | grep "BEGIN TRANSACTION"`

- Truth: "No schema modifications attempted"
  - Artifacts: All database interaction files
  - Verification: `grep -r "ALTER TABLE\|CREATE TABLE\|ADD COLUMN" --include="*.cs" --include="*.sql" (should be empty)`
</step>

<step name="verify_truths">
For each observable truth, determine if the codebase enables it.

**Status:** ✓ VERIFIED (all supporting artifacts pass) | ✗ FAILED (artifact missing/stub/unwired) | ? UNCERTAIN (needs human)

For each truth: identify supporting artifacts → check artifact status → check wiring → determine truth status.

**Example:** Truth "User can see existing messages" depends on Chat.tsx (renders), /api/chat GET (provides), Message model (schema). If Chat.tsx is a stub or API returns hardcoded [] → FAILED. If all exist, are substantive, and connected → VERIFIED.
</step>

<step name="verify_artifacts">
Use gsd-tools for artifact verification against must_haves in each PLAN:

```bash
for plan in "$PHASE_DIR"/*-PLAN.md; do
  ARTIFACT_RESULT=$(node ./.claude/get-shit-done/bin/gsd-tools.cjs verify artifacts "$plan")
  echo "=== $plan ===" && echo "$ARTIFACT_RESULT"
done
```

Parse JSON result: `{ all_passed, passed, total, artifacts: [{path, exists, issues, passed}] }`

**Artifact status from result:**
- `exists=false` → MISSING
- `issues` not empty → STUB (check issues for "Only N lines" or "Missing pattern")
- `passed=true` → VERIFIED (Levels 1-2 pass)

**Level 3 — Wired (manual check for artifacts that pass Levels 1-2):**
```bash
grep -r "import.*$artifact_name" src/ --include="*.ts" --include="*.tsx"  # IMPORTED
grep -r "$artifact_name" src/ --include="*.ts" --include="*.tsx" | grep -v "import"  # USED
```
WIRED = imported AND used. ORPHANED = exists but not imported/used.

| Exists | Substantive | Wired | Status |
|--------|-------------|-------|--------|
| ✓ | ✓ | ✓ | ✓ VERIFIED |
| ✓ | ✓ | ✗ | ⚠️ ORPHANED |
| ✓ | ✗ | - | ✗ STUB |
| ✗ | - | - | ✗ MISSING |
</step>

<step name="verify_wiring">
Use gsd-tools for key link verification against must_haves in each PLAN:

```bash
for plan in "$PHASE_DIR"/*-PLAN.md; do
  LINKS_RESULT=$(node ./.claude/get-shit-done/bin/gsd-tools.cjs verify key-links "$plan")
  echo "=== $plan ===" && echo "$LINKS_RESULT"
done
```

Parse JSON result: `{ all_verified, verified, total, links: [{from, to, via, verified, detail}] }`

**Link status from result:**
- `verified=true` → WIRED
- `verified=false` with "not found" → NOT_WIRED
- `verified=false` with "Pattern not found" → PARTIAL

**Fallback patterns (if key_links not in must_haves):**

| Pattern | Check | Status |
|---------|-------|--------|
| Component → API | fetch/axios call to API path, response used (await/.then/setState) | WIRED / PARTIAL (call but unused response) / NOT_WIRED |
| API → Database | Prisma/DB query on model, result returned via res.json() | WIRED / PARTIAL (query but not returned) / NOT_WIRED |
| Form → Handler | onSubmit with real implementation (fetch/axios/mutate/dispatch), not console.log/empty | WIRED / STUB (log-only/empty) / NOT_WIRED |
| State → Render | useState variable appears in JSX (`{stateVar}` or `{stateVar.property}`) | WIRED / NOT_WIRED |

Record status and evidence for each key link.
</step>

<step name="verify_requirements">
If REQUIREMENTS.md exists:
```bash
grep -E "Phase ${PHASE_NUM}" .planning/REQUIREMENTS.md 2>/dev/null
```

For each requirement: parse description → identify supporting truths/artifacts → status: ✓ SATISFIED / ✗ BLOCKED / ? NEEDS HUMAN.
</step>

<step name="scan_antipatterns">
Extract files modified in this phase from SUMMARY.md, scan each:

| Pattern | Search | Severity |
|---------|--------|----------|
| TODO/FIXME/XXX/HACK | `grep -n -E "TODO\|FIXME\|XXX\|HACK"` | ⚠️ Warning |
| Placeholder content | `grep -n -iE "placeholder\|coming soon\|will be here"` | 🛑 Blocker |
| Empty returns | `grep -n -E "return null\|return \{\}\|return \[\]\|=> \{\}"` | ⚠️ Warning |
| Log-only functions | Functions containing only console.log | ⚠️ Warning |

**Database Integration Anti-patterns:**

For files containing database operations, scan for these critical issues:

| Pattern | Search | Severity | Rationale |
|---------|--------|----------|-----------|
| Hardcoded tax rates | `grep -n -E "0\\.0[0-9]+.*tax\|tax.*=.*0\\.[0-9]"` | 🛑 Blocker | Must read from tblMisc.Tax1 |
| Missing transactions | `grep -L "BEGIN TRANSACTION" files-with-INSERT` | 🛑 Blocker | Atomicity required for multi-table writes |
| Schema modifications | `grep -n -E "ALTER TABLE\|CREATE TABLE\|ADD COLUMN\|DROP COLUMN"` | 🛑 Blocker | Schema changes not permitted |
| Wrong CashierID | `grep -n -E "CashierID.*[^9][^9][0-9]\|CashierID.*[0-8][0-9][0-9]"` | 🛑 Blocker | Must use 998 (test) or 999 (production) |
| Truncated table names | `grep -n -E "tblOrder[^sD]\|tblOrderDetail[^s]\|tblPayment[^s]"` | 🛑 Blocker | Table name typos break integration |
| Missing required fields | Check INSERT statements against schema required columns | 🛑 Blocker | Violates NOT NULL constraints |
| SQL injection risk | `grep -n -E "\\$\\{.*\\}\|string.*\\+.*\\+.*SELECT\|\\\".*\\\".*\\+.*WHERE"` | 🛑 Blocker | Security + stability risk |

**Verification method for schema alignment:**

```bash
# Extract all table references from code
grep -r "INSERT INTO\|UPDATE.*SET\|FROM tbl" --include="*.cs" --include="*.ts" -h | \
  grep -oE "tbl[A-Za-z]+" | sort -u > /tmp/code_tables.txt

# Compare against known INI_Restaurant.Bak tables
# (Requires schema reference or sqlcmd query)
# Flag any mismatches as 🛑 Blocker
```

Categorize: 🛑 Blocker (prevents goal) | ⚠️ Warning (incomplete) | ℹ️ Info (notable).
</step>

<step name="identify_human_verification">
**Always needs human:** Visual appearance, user flow completion, real-time behavior (WebSocket/SSE), external service integration, performance feel, error message clarity.

**Database integration ALWAYS needs human verification:**

For phases involving POS database operations, these MUST be verified by human with access to INI POS terminal:

1. **Data Appears in POS Terminal**
   - Test: Create order via mobile app
   - Expected: Order immediately visible in INI POS with correct items, quantities, prices, tax, payment
   - Why can't verify programmatically: Requires physical POS terminal or remote access to production system

2. **Transaction Atomicity**
   - Test: Simulate failure mid-transaction (kill process during order creation)
   - Expected: Either complete order exists OR no partial data (no orphaned records in any of 6 tables)
   - Why can't verify programmatically: Requires controlled failure scenarios on live database

3. **Tax Calculation Accuracy**
   - Test: Create order, compare tax amount to manual calculation using tblMisc.Tax1 rate
   - Expected: Tax matches tblMisc rate exactly (e.g., $100 subtotal × 0.0825 = $8.25 tax)
   - Why can't verify programmatically: Need to confirm actual POS display matches calculation

4. **CashierID Attribution**
   - Test: Check tblOrders.CashierID in database after order creation
   - Expected: Test orders show CashierID=998, production orders show CashierID=999
   - Why can't verify programmatically: Could query, but human should verify POS shows correct cashier attribution in UI

5. **Schema Compatibility**
   - Test: Run integration on actual SQL Server 2005 Express (production version)
   - Expected: All queries execute without errors, data types compatible, no version-specific issues
   - Why can't verify programmatically: Local dev uses SQL Server 2022, need to confirm 2005 compatibility

**Needs human if uncertain:** Complex wiring grep can't trace, dynamic state-dependent behavior, edge cases.

Format each as: Test Name → What to do → Expected result → Why can't verify programmatically.
</step>

<step name="determine_status">
**passed:** All truths VERIFIED, all artifacts pass levels 1-3, all key links WIRED, no blocker anti-patterns.

**gaps_found:** Any truth FAILED, artifact MISSING/STUB, key link NOT_WIRED, or blocker found.

**human_needed:** All automated checks pass but human verification items remain.

**Score:** `verified_truths / total_truths`
</step>

<step name="generate_fix_plans">
If gaps_found:

1. **Cluster related gaps:** API stub + component unwired → "Wire frontend to backend". Multiple missing → "Complete core implementation". Wiring only → "Connect existing components".

2. **Generate plan per cluster:** Objective, 2-3 tasks (files/action/verify each), re-verify step. Keep focused: single concern per plan.

3. **Order by dependency:** Fix missing → fix stubs → fix wiring → verify.
</step>

<step name="create_report">
```bash
REPORT_PATH="$PHASE_DIR/${PHASE_NUM}-VERIFICATION.md"
```

Fill template sections: frontmatter (phase/timestamp/status/score), goal achievement, artifact table, wiring table, requirements coverage, anti-patterns, human verification, gaps summary, fix plans (if gaps_found), metadata.

See ./.claude/get-shit-done/templates/verification-report.md for complete template.
</step>

<step name="return_to_orchestrator">
Return status (`passed` | `gaps_found` | `human_needed`), score (N/M must-haves), report path.

If gaps_found: list gaps + recommended fix plan names.
If human_needed: list items requiring human testing.

Orchestrator routes: `passed` → update_roadmap | `gaps_found` → create/execute fixes, re-verify | `human_needed` → present to user.
</step>

</process>

<success_criteria>
- [ ] Must-haves established (from frontmatter or derived)
- [ ] Database integration must-haves added if phase involves POS operations
- [ ] All truths verified with status and evidence
- [ ] Database schema alignment verified against INI_Restaurant.Bak (not documentation)
- [ ] All artifacts checked at all three levels
- [ ] All key links verified
- [ ] Database transaction safety verified (BEGIN TRANSACTION/COMMIT wrappers)
- [ ] Tax rate source verified (from tblMisc, not hardcoded)
- [ ] CashierID conventions verified (998/999 usage)
- [ ] Schema modification attempts detected (should be zero)
- [ ] Requirements coverage assessed (if applicable)
- [ ] Anti-patterns scanned and categorized
- [ ] Database anti-patterns scanned and flagged as blockers
- [ ] Human verification items identified
- [ ] Database terminal verification requirements documented
- [ ] Overall status determined
- [ ] Fix plans generated (if gaps_found)
- [ ] VERIFICATION.md created with complete report
- [ ] Results returned to orchestrator
</success_criteria>
