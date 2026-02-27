---
phase: 05-loyalty
plan: 02
subsystem: payments-loyalty
status: complete
completed_date: "2026-02-27"
tags: [loyalty-points, stored-procedures, order-completion, graceful-failure]
dependency_graph:
  requires: [05-01, 04-02]
  provides: [points-earn, points-redeem, sp-integration]
  affects: [order-completion, payment-flow]
tech_stack:
  added: [sp_InsertUpdateRewardPointsDetail]
  patterns: [graceful-failure, atomic-transactions, fallback-operations]
key_files:
  created: []
  modified:
    - src/backend/IntegrationService.Core/Interfaces/IPosRepository.cs
    - src/backend/IntegrationService.Infrastructure/Data/PosRepository.cs
    - src/backend/IntegrationService.Core/Services/OrderProcessingService.cs
    - src/backend/IntegrationService.Core/Models/PaymentModels.cs
    - src/backend/IntegrationService.Tests/Services/OrderProcessingServiceTests.cs
decisions:
  - title: "Graceful failure for loyalty points"
    rationale: "Order completion should never fail due to loyalty system unavailability"
    alternatives: ["Hard failure (reject order)", "Async retry queue"]
    chosen: "Return false from RecordPointsTransactionAsync, log warning, complete order"
  - title: "Stored procedure detection pattern"
    rationale: "Support both new POS versions with SP and older versions without"
    implementation: "Check INFORMATION_SCHEMA.ROUTINES before execution, fallback to direct table ops"
  - title: "Points discount application timing"
    rationale: "Discount must be applied before charging card to ensure correct amount"
    implementation: "Calculate discount, create adjusted PaymentRequest, charge reduced amount"
metrics:
  duration_minutes: 4
  tasks_completed: 3
  tests_added: 4
  tests_passing: 9
  files_modified: 5
  lines_added: 476
---

# Phase 05 Plan 02: Points Earn/Redeem Integration

**One-liner:** Integrated loyalty points earn/redeem into order completion workflow using sp_InsertUpdateRewardPointsDetail with graceful failure handling

## Summary

Successfully integrated loyalty points functionality into the payment and order completion orchestration. Points are earned at 1:1 ratio (1 point per $1 spent) and redeemed at 100 points = $1 discount. Integration uses stored procedure sp_InsertUpdateRewardPointsDetail with automatic fallback to direct table operations for compatibility. Graceful failure ensures orders complete successfully even if loyalty system fails.

## Implementation Details

### Task 1: Stored Procedure Integration in Repository

**Files Modified:**
- `src/backend/IntegrationService.Core/Interfaces/IPosRepository.cs`
- `src/backend/IntegrationService.Infrastructure/Data/PosRepository.cs`

**Implementation:**

Added `RecordPointsTransactionAsync` method to PosRepository with three-tier approach:

1. **Stored Procedure Detection:**
   ```sql
   SELECT COUNT(*) FROM INFORMATION_SCHEMA.ROUTINES
   WHERE ROUTINE_NAME = 'sp_InsertUpdateRewardPointsDetail'
   ```

2. **Primary Path (Stored Procedure):**
   ```csharp
   var parameters = new DynamicParameters();
   parameters.Add("@SalesID", salesId);
   parameters.Add("@CustomerID", customerId);
   parameters.Add("@PointUsed", pointsUsed);
   parameters.Add("@PointSaved", pointsSaved);

   await connection.ExecuteAsync(
       "sp_InsertUpdateRewardPointsDetail",
       parameters,
       transaction,
       commandType: CommandType.StoredProcedure
   );
   ```

3. **Fallback Path (Direct Table Operations):**
   - INSERT INTO tblRewardPointsDetail (SalesID, CustomerID, PointUsed, PointSaved, TransactionDate)
   - UPDATE tblCustomer SET EarnedPoints = EarnedPoints + @PointSaved - @PointUsed

4. **Graceful Failure:**
   - Returns `bool` instead of throwing exceptions
   - Logs error but allows order completion to continue
   - Follows user decision: "Fail gracefully - show error 'Loyalty system unavailable' and allow order completion without points"

**Commit:** 56bee38 - `feat(05-02): implement RecordPointsTransactionAsync with stored procedure integration`

### Task 2: Points Integration in Order Processing Service

**Files Modified:**
- `src/backend/IntegrationService.Core/Services/OrderProcessingService.cs`
- `src/backend/IntegrationService.Core/Models/PaymentModels.cs`

**Changes:**

1. **Added PointsToRedeem to PaymentRequest:**
   ```csharp
   public int PointsToRedeem { get; set; }
   ```

2. **Discount Calculation (BEFORE Payment Charge):**
   ```csharp
   decimal pointsDiscount = 0m;
   PaymentRequest requestToCharge = paymentRequest;

   if (paymentRequest.PointsToRedeem > 0)
   {
       pointsDiscount = paymentRequest.PointsToRedeem / 100.0m; // 100 points = $1
       decimal finalAmount = paymentRequest.Amount - pointsDiscount;
       if (finalAmount < 0) finalAmount = 0;

       requestToCharge = new PaymentRequest {
           Amount = finalAmount, // Reduced amount
           ...
       };
   }
   ```

3. **Update DSCAmt (Discount Amount) in Database:**
   ```csharp
   if (pointsDiscount > 0)
   {
       await _posRepo.UpdateSaleTotalsAsync(
           salesId,
           ticket.SubTotal,
           ticket.GSTAmt,
           ticket.PSTAmt,
           ticket.PST2Amt,
           pointsDiscount,  // DSCAmt reflects points redemption
           transaction
       );
   }
   ```

4. **Points Recording (NEW Step 5 in Orchestration):**
   ```csharp
   // Step 5: Record loyalty points (NEW)
   if (paymentRequest.CustomerId.HasValue)
   {
       int pointsEarned = (int)Math.Floor(paymentRequest.Amount); // 1:1 ratio
       int pointsRedeemed = paymentRequest.PointsToRedeem;

       bool pointsRecorded = await _posRepo.RecordPointsTransactionAsync(
           salesId,
           paymentRequest.CustomerId.Value,
           pointsRedeemed,
           pointsEarned,
           transaction
       );

       if (!pointsRecorded)
       {
           _logger.LogWarning(
               "Loyalty points recording failed for order {SalesId}, customer {CustomerId}. Order completed without points.",
               salesId, paymentRequest.CustomerId.Value
           );
       }
   }
   ```

**Orchestration Flow (Updated):**
1. Calculate points discount
2. Charge card via Authorize.net (with discount applied)
3. Insert payment record
4. Update sale payment totals
5. Update sale totals with DSCAmt
6. Complete order (TransType 2→1, items to tblSalesDetail)
7. **Record loyalty points (NEW - atomic within transaction)**
8. Commit transaction

**Commit:** 1daa06f - `feat(05-02): integrate loyalty points into order completion workflow`

### Task 3: Integration Tests

**Files Modified:**
- `src/backend/IntegrationService.Tests/Services/OrderProcessingServiceTests.cs`

**Tests Added:**

1. **OrderWithCustomerId_RecordsPointsEarned**
   - Request: Amount = $45.75, CustomerId = 456, PointsToRedeem = 0
   - Expected: RecordPointsTransactionAsync called with pointsSaved = 45 (Math.Floor)
   - Verifies: 1:1 earn ratio calculation

2. **OrderWithPointsRedemption_AppliesDiscount**
   - Request: Amount = $50.00, PointsToRedeem = 500
   - Expected: Charge amount = $45.00 (50 - 5)
   - Expected: RecordPointsTransactionAsync called with pointsUsed = 500, pointsSaved = 50
   - Verifies: Discount calculation (100 points = $1) and charge amount reduction

3. **PointsRecordingFails_OrderStillCompletes**
   - Setup: RecordPointsTransactionAsync returns false
   - Expected: Order Success = true (graceful failure)
   - Expected: LogWarning called with "points recording failed"
   - Expected: Transaction commits (not rolled back)
   - Verifies: Graceful failure behavior

4. **OrderWithoutCustomerId_SkipsPointsRecording**
   - Request: CustomerId = null
   - Expected: RecordPointsTransactionAsync NOT called (Times.Never)
   - Verifies: Skip logic when no customer associated

**Test Results:**
- Total tests: 9 (5 original payment tests + 4 new loyalty tests)
- Passed: 9/9 (100%)
- Failed: 0

**Commit:** d929949 - `test(05-02): add integration tests for loyalty points in order flow`

## Verification Results

### Build Success
```
dotnet build src/backend/IntegrationService.API
Build succeeded.
```

### Stored Procedure Integration
```
✓ sp_InsertUpdateRewardPointsDetail called via CommandType.StoredProcedure
✓ INFORMATION_SCHEMA.ROUTINES check exists (fallback pattern)
✓ Fallback to tblRewardPointsDetail INSERT + tblCustomer UPDATE
```

### Points Calculation
```
✓ Points earned: Math.Floor(paymentRequest.Amount) - 1:1 ratio
✓ Points discount: pointsToRedeem / 100.0m - 100 points = $1
✓ Discount applied BEFORE payment charge
```

### Graceful Failure
```
✓ RecordPointsTransactionAsync returns bool (not throwing)
✓ LogWarning called on points failure
✓ Order completes successfully despite points failure
✓ Transaction commits (no rollback)
```

### Test Coverage
```
✓ All 9 integration tests pass
✓ 4 loyalty-specific scenarios covered
✓ Earn, redeem, failure, and skip paths tested
```

## Deviations from Plan

None - plan executed exactly as written. All requirements met:
- ✓ Stored procedure integration with detection
- ✓ RecordPointsTransactionAsync repository method
- ✓ OrderProcessingService enhanced with points
- ✓ PaymentRequest extended with PointsToRedeem
- ✓ Integration tests for all scenarios
- ✓ Graceful failure handling
- ✓ Atomic transaction handling

## Key Decisions

### 1. Graceful Failure Pattern
**Decision:** Return false from RecordPointsTransactionAsync instead of throwing exceptions

**Rationale:**
- User requirement: "Fail gracefully - show error 'Loyalty system unavailable' and allow order completion without points"
- Loyalty points are a nice-to-have feature, not critical to order completion
- Prevents customer frustration from failed orders due to loyalty system issues

**Implementation:**
- Repository method returns `Task<bool>` instead of `Task`
- Catches all exceptions, logs error, returns false
- Service checks return value and logs warning but continues
- Transaction still commits successfully

### 2. Stored Procedure Detection
**Decision:** Check INFORMATION_SCHEMA.ROUTINES before calling stored procedure

**Rationale:**
- POS system may not have stored procedure in older versions
- Cannot assume SP exists in all environments
- Need backward compatibility without deployment dependencies

**Implementation:**
```csharp
var spExists = await connection.QueryFirstOrDefaultAsync<int>(
    "SELECT COUNT(*) FROM INFORMATION_SCHEMA.ROUTINES WHERE ROUTINE_NAME = 'sp_InsertUpdateRewardPointsDetail'",
    transaction: transaction
);

if (spExists > 0)
{
    // Use stored procedure
}
else
{
    // Fallback to direct table operations
}
```

### 3. Discount Timing
**Decision:** Apply points discount BEFORE charging card, not after

**Rationale:**
- Customer should only be charged the final amount (original - discount)
- Charging full amount then crediting is poor UX and accounting practice
- Simpler transaction flow - charge once at correct amount

**Implementation:**
- Calculate discount first: `pointsDiscount = pointsToRedeem / 100.0m`
- Create adjusted PaymentRequest with reduced amount
- Charge card with final amount
- Update DSCAmt in database to reflect discount

## Points Calculation Formulas

### Points Earned (1:1 Ratio)
```csharp
int pointsEarned = (int)Math.Floor(orderAmount);
// Example: $45.75 → 45 points
```

### Points Redemption Discount (100:1 Ratio)
```csharp
decimal discount = pointsToRedeem / 100.0m;
// Example: 500 points → $5.00 discount
```

### Final Charge Amount
```csharp
decimal finalAmount = orderAmount - (pointsToRedeem / 100.0m);
if (finalAmount < 0) finalAmount = 0;
// Example: $50.00 - (500 / 100) = $45.00
```

## Technical Highlights

### Atomic Transaction Handling
Points operations happen within the same transaction as payment posting and order completion:
```
BEGIN TRANSACTION
  1. Charge card (Authorize.net)
  2. Insert payment (tblPayment)
  3. Update sale totals (tblSales)
  4. Update DSCAmt with discount (tblSales)
  5. Complete order (TransType 2→1)
  6. Move items to sales detail
  7. Record points (sp_InsertUpdateRewardPointsDetail OR fallback)
COMMIT TRANSACTION
```

If any step fails (except step 7), entire transaction rolls back and payment is voided.

### Void-on-Failure Pattern (Preserved)
From Phase 04-02 - still applies:
- If DB operations fail after successful payment charge
- Automatically void the Authorize.net transaction
- Prevents orphaned charges

### Resilience Patterns
1. **Stored Procedure Detection** - Check before execute, fallback if missing
2. **Graceful Failure** - Log and continue instead of fail
3. **Null Safety** - Only record points if CustomerId.HasValue
4. **Boundary Checks** - Ensure finalAmount >= 0

## Success Criteria - ALL MET ✓

- [x] RecordPointsTransactionAsync calls sp_InsertUpdateRewardPointsDetail with CommandType.StoredProcedure
- [x] Stored procedure detection + fallback implemented for compatibility
- [x] Points earned calculated as Math.Floor(orderTotal) for 1:1 ratio
- [x] Points redemption applies discount (100 points = $1) to order total before payment charge
- [x] Failed points recording doesn't prevent order completion (graceful failure with warning log)
- [x] Points operations happen within transaction (atomic with payment + order completion)
- [x] All 4 integration tests pass covering earn, redeem, failure, and skip scenarios
- [x] Backend builds without errors

## Files Changed

### Modified
- `src/backend/IntegrationService.Core/Interfaces/IPosRepository.cs` (+1 method)
- `src/backend/IntegrationService.Infrastructure/Data/PosRepository.cs` (+120 lines)
- `src/backend/IntegrationService.Core/Services/OrderProcessingService.cs` (+85 lines)
- `src/backend/IntegrationService.Core/Models/PaymentModels.cs` (+5 lines)
- `src/backend/IntegrationService.Tests/Services/OrderProcessingServiceTests.cs` (+265 lines)

### Total Impact
- Lines added: 476
- Methods added: 1 (RecordPointsTransactionAsync)
- Tests added: 4
- Success criteria met: 8/8

## Integration Points

### Upstream Dependencies
- **Phase 04-02:** Payment + Order Completion orchestration (ProcessPaymentAndCompleteOrderAsync)
- **Phase 05-01:** Customer lookup API (provides CustomerId for loyalty)

### Downstream Consumers
- **Mobile checkout flow:** Will send CustomerId + PointsToRedeem in PaymentRequest
- **Receipt display:** Can show points earned/redeemed from tblRewardPointsDetail
- **Loyalty history:** Phase 05-01 API shows points transactions

## Next Steps

**Remaining in Phase 05:**
- **Plan 05-03:** Mobile UI for points redemption at checkout (select points to use, show discount preview)

**Required for E2E:**
- Mobile checkout needs to:
  1. Display available points from customer profile
  2. Allow partial redemption (slider/input)
  3. Show discount preview (500 points = $5 off)
  4. Send PointsToRedeem in payment request
  5. Display points earned on receipt

## Self-Check: PASSED ✓

### Commits Verified
```bash
git log --oneline -3
d929949 test(05-02): add integration tests for loyalty points in order flow
1daa06f feat(05-02): integrate loyalty points into order completion workflow
56bee38 feat(05-02): implement RecordPointsTransactionAsync with stored procedure integration
```

All commits exist and contain expected changes.

### Files Verified
```bash
✓ src/backend/IntegrationService.Core/Interfaces/IPosRepository.cs - RecordPointsTransactionAsync method added
✓ src/backend/IntegrationService.Infrastructure/Data/PosRepository.cs - sp_InsertUpdateRewardPointsDetail integration exists
✓ src/backend/IntegrationService.Core/Services/OrderProcessingService.cs - Points logic in step 5
✓ src/backend/IntegrationService.Core/Models/PaymentModels.cs - PointsToRedeem property exists
✓ src/backend/IntegrationService.Tests/Services/OrderProcessingServiceTests.cs - 4 loyalty tests added
```

All key files modified and contain required functionality.

### Build Verification
```bash
dotnet build src/backend/IntegrationService.API
Build succeeded. 0 Error(s)
```

### Test Verification
```bash
dotnet test --filter "OrderProcessingServiceTests"
Total tests: 9
Passed: 9
Failed: 0
```

**Self-check result: PASSED** - All claims verified, no discrepancies found.
