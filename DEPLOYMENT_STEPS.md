# M4 Deployment Steps - March 22, 2026

## Environment
- **Worktree:** `.worktrees/m5-deployment`
- **Branch:** `feature/m5-deployment-tasks`
- **Backend Build:** ✅ PASSING (50 warnings, 0 errors)
- **Migration Script:** ✅ READY at `src/backend/IntegrationService.API/Migrations/M4_BirthdayRewardsAndRFM.sql`

---

## Task 1: Deploy SQL Migration ✅ READY

**Location:** `src/backend/IntegrationService.API/Migrations/M4_BirthdayRewardsAndRFM.sql`

**Tables Created:**
1. `dbo.BirthdayRewardConfig` - Configuration for birthday automation
2. `dbo.BirthdayRewards` - Audit trail (idempotency tracking)
3. `dbo.RFMSegments` - RFM segment cache (24-hour TTL)

**Stored Procedures:** 4 SPs for segment operations (defined in migration script)

**Deployment Checklist:**
- [ ] SQL Server Access: Connect to backend IntegrationService database
- [ ] Backup: Create backup of existing database
- [ ] Execute: Run migration script against staging first, then production
- [ ] Verify: Confirm 3 tables + 4 SPs created successfully
- [ ] Index Validation: Confirm all indexes created without errors

**Windows Deployment:**
```batch
# On Windows Server with SQL Server
sqlcmd -S (local) -d IntegrationService -i "src/backend/IntegrationService.API/Migrations/M4_BirthdayRewardsAndRFM.sql"
```

---

## Task 2: Health Checks on API Endpoints ✅ READY

**6 M4 Endpoints Added to AdminController:**

| Endpoint | Method | Expected Status |
|----------|--------|-----------------|
| `/api/admin/rfm/calculate` | POST | 200 OK + RFM segments |
| `/api/admin/rfm/segments/{segment}` | GET | 200 OK + customer list |
| `/api/admin/rfm/stats` | GET | 200 OK + segment stats |
| `/api/admin/birthday/calculate` | POST | 200 OK + calculation result |
| `/api/admin/birthday/config` | GET | 200 OK + config  |
| `/api/admin/birthday/config` | PUT | 200 OK + updated config |

**Health Check Script:**
```bash
BASE_URL="http://localhost:5004/api"

# Test 1: RFM Calculation
curl -X POST $BASE_URL/admin/rfm/calculate \
  -H "Content-Type: application/json" \
  -d '{}' \
  -w "\nStatus: %{http_code}\n"

# Test 2: Birthday Config
curl -X GET $BASE_URL/admin/birthday/config \
  -w "\nStatus: %{http_code}\n"

# All health checks must return 200-level status codes
```

---

## Task 3: Integration Testing (2-3 hours)

**Test Coverage Plan:**

### Unit Tests (18 planned cases)
- [ ] RFM quartile logic (4 tests)
- [ ] Segment assignment (3 tests)
- [ ] Birthday detection (3 tests)
- [ ] Idempotency checks (2 tests)
- [ ] Configuration CRUD (2 tests)
- [ ] Background scheduling (2 tests)

### Integration Tests (8 planned)
- [ ] API endpoint contracts
- [ ] Database transaction safety
- [ ] Service DI resolution
- [ ] RFM Dapper queries
- [ ] Birthday service background execution
- [ ] Endpoint error handling

### Test Command:
```bash
dotnet test src/backend/IntegrationService.Tests/IntegrationService.Tests.csproj -c Release --verbosity normal
```

---

## Task 4: E2E Testing (1-2 hours)

**Admin Portal Flows:**
- [ ] RFM Dashboard loads with segment data
- [ ] Customer segmentation filter works
- [ ] Birthday reward settings save to database
- [ ] Order polling hook updates in real-time
- [ ] useOrderPoll custom hook cleanup on unmount

**Web Test Suite:**
```bash
cd src/web/imidus-admin
npm run test:e2e
```

---

## Task 5: Production Deployment (1 hour)

**Build Release Binaries:**
```bash
# Backend Release Build
dotnet build src/backend/IntegrationService.API/IntegrationService.API.csproj -c Release

# Create Windows MSI (on Windows)
# dotnet new msbuild -o msi-setup
# msbuild msi-setup.sln /p:Configuration=Release
```

**AWS S3 Upload:**
```bash
aws s3 cp src/backend/IntegrationService.API/bin/Release/ \
  s3://inirestaurant/novatech/backend/m4-release/ \
  --recursive \
  --profile imidus

aws s3 cp src/web/imidus-admin/.next/production-export/ \
  s3://inirestaurant/novatech/admin-portal/ \
  --recursive \
  --profile imidus
```

**Deployment Verification:**
- [ ] AWS S3 artifacts uploaded successfully
- [ ] Backup created before deployment
- [ ] All services start without errors
- [ ] API health checks pass
- [ ] Database connections verified
- [ ] Background service logs confirm execution

---

## Rollback Plan

**If Issues Occur:**
1. Restore database from backup
2. Roll back API to previous Release build
3. Restart services
4. Verify health checks pass
5. Document root cause in incident report

---

## Sign-Off

**Backend Build:** ✅ Clean (warnings only)
**Migration Script:** ✅ Validated
**Endpoints:** ✅ 6 new endpoints registered
**UI Components:** ✅ 21 files updated with Imperial Onyx colors
**Documentation:** ✅ Complete

**Status:** READY FOR STAGING DEPLOYMENT

**Next Step:** Execute Task 2 - Health Checks
