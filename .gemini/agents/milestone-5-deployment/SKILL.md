Here is a refined, production-focused version of the milestone-5-deployment.md skill file. It incorporates realistic 2026 constraints for SQL Server 2005 Express (still common in legacy hospitality setups), PCI compliance for in-store terminals, contractual MSI delivery, and final handover requirements. I've corrected minor technical inaccuracies, added clarity on bridge patterns, and strengthened the QA/stress focus.
Markdown---
name: milestone-5-deployment
description: Quality gate for Milestone 5 (In-Store Terminal Bridge Integration, Full E2E QA, and Contractual Deployment). Ensures Verifone/Ingenico bridge posts correctly to tblPayment, system survives SQL 2005 limits, and final Windows MSI + artifacts are delivered per contract.
color: red
icon: package
---

# Milestone 5: Terminal Integration, QA & Final Deployment

**Goal**: Complete in-store payment terminal bridge, validate full end-to-end flow (mobile/web → POS → payment → loyalty), stress test under 2005 constraints, and deliver contractual Windows MSI package + all artifacts to S3.

## Production-Ready Checklists

### 1. Terminal Bridge Integration (PCI & Reliability)
- [ ] **Bridge Event Handling**: Verifone/Ingenico (or combined) API/webhook posts approved transactions → `tblPayment` with:
  - PaymentTypeID (3=Visa,4=MC,5=Amex, etc.)
  - Amount
  - CardNumber = dbo.EncryptString(masked last-4)
  - AuthCode
  - RefNum (terminal transaction ID)
  - PaymentDateTime
- [ ] **Multi-Tender / Partial Payments**: Supported — multiple `tblPayment` rows per `tblSales.ID` (e.g., $15 cash + $35 card).
- [ ] **Failover & Fallback**: If bridge is unreachable/offline:
  - Manual card entry disabled by default (or tightly controlled via admin toggle)
  - Fallback to cash-only mode logged and alerted
- [ ] **Audit Trail**: Every bridge event (success/fail/timeout) logged in `IntegrationService.BridgeLog` (raw payload redacted, timestamps, terminal ID).

### 2. Final QA & Stress / Scale Testing
- [ ] **SQL Server 2005 Express Limits**:
  - Database size stays <4 GB (per-file limit)
  - Memory usage <1 GB (Express cap)
  - Tested with ≥10,000 historical orders + simulated 500 active open tickets
- [ ] **Full E2E Traceability**:
  - Mobile/web order → `tblSales` (TransType=2) → bridge payment → `tblPayment` → `tblSales` TransType=1 → loyalty points in `tblPointsDetail` / `tblCustomer.EarnedPoints`
- [ ] **Concurrency & Race Conditions**:
  - 2+ simulated terminals completing orders simultaneously
  - No duplicate `tblSales` IDs, no lost payments, optimistic concurrency on `tblSales`
- [ ] **Error Recovery**:
  - Network drop during bridge call → retry logic (exponential backoff, max 3 attempts)
  - POS restart → service auto-recovers, re-syncs pending bridge events

### 3. Contractual Delivery (Windows MSI)
- [ ] **WiX Toolset MSI**:
  - Bundles .NET 8 runtime (self-contained or framework-dependent)
  - Installs as Windows Service `ImidusPOSBridge` (or `ImidusPOSAPI`)
  - Configures port (default 5004), connection strings, logging path
  - Includes firewall rule for inbound port
- [ ] **Database Initialization**:
  - MSI runs scripts to create/upgrade `IntegrationService` DB (overlay tables, indexes, stored procedures like `dbo.EncryptString`)
  - Safe — checks existence before CREATE
- [ ] **S3 Upload**:
  - All final artifacts uploaded to `s3://inirestaurant/Novatech/` (Capital N)
  - Versioned filenames (e.g., `ImidusPOSBridge-1.5.0.msi`, `customer-app-ios-1.2.3.ipa`)

## Technical Proof Points

### Bridge Transaction Flow (Simplified)
```csharp
// BridgeListenerService.cs (Windows Service)
public async Task HandleTerminalApproval(BridgeTransaction tx)
{
    using var scope = _serviceProvider.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<PosDbContext>();

    await using var transaction = await db.Database.BeginTransactionAsync();

    try
    {
        var payment = new PosTender
        {
            SalesID = tx.SalesID,
            PaymentTypeID = MapCardType(tx.CardType),
            Amount = tx.ApprovedAmount,
            CardNumber = $"XXXX{tx.LastFour}",
            AuthCode = tx.AuthCode,
            RefNum = tx.TransactionId,
            PaymentDateTime = DateTime.UtcNow
        };

        await db.tblPayment.AddAsync(payment);
        await db.SaveChangesAsync();

        // Update tblSales.TransType = 1 if fully paid
        var sales = await db.tblSales.FindAsync(tx.SalesID);
        if (IsFullyPaid(sales.ID))
            sales.TransType = 1;

        await db.SaveChangesAsync();
        await transaction.CommitAsync();

        await _activityRepo.LogAsync(... "BRIDGE_APPROVAL", ...);
    }
    catch
    {
        await transaction.RollbackAsync();
        throw;
    }
}
SQL 2005 Maintenance (Included in MSI / Docs)
SQL-- Recommended monthly maintenance script (client-run via SSMS)
ALTER INDEX ALL ON dbo.tblSales REBUILD WITH (ONLINE = OFF);  -- or DBCC DBREINDEX if older syntax
ALTER INDEX ALL ON dbo.tblPayment REBUILD;
UPDATE STATISTICS dbo.tblSales;
UPDATE STATISTICS dbo.tblPayment;
[!IMPORTANT]
Contract requires Windows MSI as primary delivery (not Docker). Docker-compose used internally for dev/test only.
E2E Manual Test Scenarios

































ScenarioExpected ResultFull MSI install on clean WindowsService ImidusPOSBridge starts, listens on 5004, connects to DB without errorsIn-store card swipe (physical reader)Transaction approved → tblPayment row with encrypted masked number, AuthCodeMulti-tender (cash + card)Two tblPayment rows for same tblSales.ID, TransType flips to 1 when completeS3 artifact verificationBucket contains latest MSI, .ipa, .aab, web .tar.gz, user guide PDF, OpenAPI YAMLHeavy load (100 orders/min simulation)No SQL memory >1GB, no deadlocks, bridge handles concurrent approvalsBridge offline fallbackManual card entry blocked; cash-only allowed; alert logged
Final Handover Checklist

Admin Portal User Guide (PDF) – uploaded to S3
API Specification — OpenAPI 3.0 YAML/JSON exported from Swagger, uploaded
CI/CD Pipelines — All green, documentation in repo (GitHub Actions / Azure DevOps)
Source Repository — Transferred to client GitHub org or private repo
Credentials & Secrets — Rotated post-handover; final .env.example / secrets guide
Client Training Session — Recorded or scheduled for MSI install, maintenance scripts, admin portal usage

Milestone Sign-Off Gate: All checkboxes green + client witnesses successful bridge transaction on physical hardware (or emulator if hardware delayed), MSI install on test VM, and full E2E flow from mobile order → in-store payment → loyalty update. Project complete upon S3 upload confirmation and handover acknowledgment.
Last Updated: March 17, 2026 – Added multi-tender, failover logic, indexed view note, concurrent test scenario, and MSI emphasis.
