---
name: milestone-5-deployment
description: Quality gate for Milestone 5 (Terminal/Bridge Integration, QA & Deployment). Ensures final bridge integration, E2E testing, and contractual Windows MSI delivery.
---

# Milestone 5: Terminal Integration & Deployment

## Production-Ready Checklists

### 1. Terminal Bridge (PCI Compliance)

- [ ] **Bridge Sync**: Verifone/Ingenico results correctly post to `tblPayment` with full audit trail.
- [ ] **Partial Payments**: Multi-tender support (e.g., $10 Cash + $20 Visa) verified in `tblPayment`.
- [ ] **Failover**: If bridge API is down, manual payment entry is disabled (or strictly controlled).

### 2. Final QA & Stress Testing

- [ ] **SQL 2005 Limits**: Database size (4GB) and RAM (1GB) constraints verified with 10k+ test orders.
- [ ] **E2E Traceability**: Order placed on Mobile -> Visible in POS -> Payment in `tblPayment` -> Loyalty in `tblPointsDetail`.
- [ ] **Concurrency**: Multi-terminal test (2+ terminals completing different orders simultaneously).

### 3. Contractual Delivery (Windows MSI)

- [ ] **WiX Installer**: Self-installing MSI bundles .NET 8 runtime and configs Windows Service.
- [ ] **Database Setup**: MSI includes scripts to initialize the `IntegrationService` overlay DB.
- [ ] **Authoritative Channel**: All artifacts successfully uploaded to `s3://inirestaurant/novatech/`.

---

## Technical Proof points

### Windows MSI Validation

The MSI MUST be tested on a clean Windows Server 2012/2016/2019 environment without dev tools installed.

> [!IMPORTANT]
> Contractual requirement: The backend MUST be delivered as a self-installing Windows MSI. Docker is internal only; MSI is the client delivery format.

### Performance Tuning

On SQL Server 2005 Express, fragmentation is common.

```sql
-- MSI should include periodic maintenance script for the client to run
DBCC DBREINDEX ('tblSales', ' ', 90);
```

---

## E2E Test Scenarios (Manual)

| Scenario           | Expected Result                                                                 |
| ------------------ | ------------------------------------------------------------------------------- |
| Full MSI Install   | Windows Service `ImidusPOSAPI` starts automatically on port 5004.               |
| Bridge Transaction | Swiping card on physical reader posts `AuthCode` and `RefNum` to `tblPayment`.  |
| AWS S3 Audit       | Bucket contains current versions of iOS IPA, Android APK, Web Tarball, and MSI. |
| Heavy Load Test    | 100 orders in 1 minute; SQL Express memory stays within 1GB limit.              |

---

## Final Handover Checklist

- [ ] Admin Portal User Guide (PDF).
- [ ] API Specification (OpenAPI/Swagger) exported and uploaded to S3.
- [ ] All CI/CD pipelines green and documented.
- [ ] GitHub repository handed over to client.
