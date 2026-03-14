# Project Handover & Delivery Guide

This guide explains how to verify the project locally and deliver the final artifacts to the client (IMIDUS Technologies).

## 1. How to Test (Local Verification)

### Automated E2E Test

The most robust way to test the full lifecycle (Menu -> Order -> Payment -> DB) is via the verification script:

```bash
# Ensure backend is running on port 5004
source venv/bin/activate
python3 verify_full_order_lifecycle.py
```

**This script verifies that:**

1. Orders are correctly created in `tblPendingOrders`.
2. Payments are recorded in `tblPayment`.
3. Orders are finalized and moved to `tblSalesDetail`.

### Manual UI Testing

- **Web Ordering**: Visit `http://localhost:3000` to browse the menu and place orders.
- **Admin Portal**: Visit `http://localhost:3001` to view the Order Dashboard and CRM.
- **Backend API**: Visit `http://localhost:5004/swagger` for full API documentation.

---

## 2. How to Deliver to Client

The delivery architecture is automated via GitHub Actions and Google S3.

### Step A: Push to GitHub

Commit your changes and push them to your repository:

```bash
git add .
git commit -m "Final delivery: Milestone 5 complete"
git push origin main
```

### Step B: Trigger Build Pipelines

We have configured four automated pipelines in `.github/workflows/`:

1. **Backend CI** (`backend-ci.yml`): Runs automatically on push to verify code quality.
2. **MSI Build** (`msi-build.yml`): Runs on **releases** (tags starting with `v*`). This generates the self-installing Windows MSI for the backend.
3. **Android Build** (`android-build.yml`): Runs on **releases**. Generates the `.apk` for the Android app.
4. **iOS Build** (`ios-build.yml`): Runs on **releases**. Generates the `.ipa` for the mobile app.

**To trigger a delivery build:**

```bash
git tag v1.0.0
git push origin v1.0.0
```

### Step C: Unified Web Deployment

For the Web portals, run the provided deployment script:

```bash
./scripts/deploy-web.sh
```

### Final Delivery Channel (AWS S3)

Once the pipelines finish, all artifacts will be available in the authoritative delivery channel: `s3://inirestaurant/novatech/`

- `backend/IntegrationService-Setup.msi`
- `mobile/ios/ImidusCustomerApp.ipa`
- `mobile/android/ImidusCustomerApp.apk`
- `web/customer-ordering/build.tar.gz`
- `web/admin-portal/build.tar.gz`

---

## Contractual Compliance Checklist

- [x] **SSOT**: Data is read/written directly to `INI_Restaurant` without schema changes.
- [x] **MSI**: Self-installing Windows MSI provided via WiX.
- [x] **Idempotency**: All POST requests gated by `X-Idempotency-Key`.
- [x] **CI/CD**: Workflows configured for Windows (MSI), macOS (iOS), and Linux (Backend/Android).
- [x] **Verification**: Full order-to-payment lifecycle pass.
