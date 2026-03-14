# CI/CD Setup Guide - IMIDUS POS Integration

Complete guide for setting up CI/CD pipelines and GitHub Actions secrets for the IMIDUS POS integration project.

## Overview

The project uses GitHub Actions for automated building and deployment of:
- Android APK builds → S3
- iOS IPA builds → TestFlight + S3
- Backend .NET MSI → S3

## GitHub Secrets Configuration

All sensitive credentials are stored as GitHub repository secrets (not in code).

### AWS S3 Credentials

For uploading artifacts to S3, you need AWS IAM credentials with S3 access.

**Secret Names:**
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

**How to Generate:**
1. Log in to AWS Console (aws.amazon.com)
2. Navigate to IAM → Users
3. Select your IAM user
4. Click "Create access key"
5. Select "Application running on an AWS compute service"
6. Download the credentials CSV
7. Copy the Access Key ID and Secret Access Key into GitHub Secrets

**IAM Policy Required:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::inirestaurant",
        "arn:aws:s3:::inirestaurant/novatech/*"
      ]
    }
  ]
}
```

**Rotation:** Rotate credentials quarterly or when team member leaves
**Revocation:** Delete access key in IAM console immediately

---

## Android Build Setup

### Android Keystore Generation

The Android APK is signed with a release keystore for Google Play Store compliance.

**Step 1: Generate Keystore (One-time setup)**

```bash
# Generate the keystore (replace paths as needed)
keytool -genkey -v -keystore imidus-release.keystore \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias imidus-release \
  -keypass android_key_password \
  -storepass android_store_password

# Verify keystore was created
keytool -list -keystore imidus-release.keystore -storepass android_store_password
```

**Step 2: Encode Keystore to Base64**

```bash
# On macOS/Linux
base64 -i imidus-release.keystore | pbcopy

# On Linux without pbcopy
base64 imidus-release.keystore > keystore_base64.txt
cat keystore_base64.txt
```

**Step 3: Add to GitHub Secrets**

1. Go to GitHub repo → Settings → Secrets and variables → Actions
2. Create new secret: `ANDROID_KEYSTORE_BASE64`
3. Paste the base64-encoded keystore
4. Create additional secrets:
   - `KEYSTORE_PASSWORD` = `android_store_password`
   - `KEY_PASSWORD` = `android_key_password`
   - `KEY_ALIAS` = `imidus-release`

**Security Best Practices:**
- Never commit the raw `.keystore` file to Git
- Store only the base64 version in GitHub Secrets
- Rotate keystore password annually
- Backup keystore in secure location (encrypted)

---

## iOS Build Setup

### iOS Certificate & Provisioning Profile

iOS requires code signing certificate and provisioning profile from Apple Developer.

**Step 1: Generate Certificate Request (CSR)**

```bash
# Open Keychain Access on macOS
# Go to: Keychain Access → Certificate Assistant → Request a Certificate from a Certificate Authority
# Fill in:
#   Email Address: novatech2210@gmail.com
#   Common Name: Imidus Customer App
#   Request is: "Saved to disk"
# Save as: certificate.csr
```

**Step 2: Create iOS Distribution Certificate**

1. Go to Apple Developer: https://developer.apple.com/account
2. Certificates, Identifiers & Profiles → Certificates
3. Click "+" → Select "App Store and Ad Hoc" → Upload `certificate.csr`
4. Download the certificate as `DistributionCertificate.cer`

**Step 3: Convert Certificate to P12 Format**

```bash
# On macOS: Use Keychain Access
# File → Export Items → Select certificate → Export as P12 → Set password

# Or use openssl
openssl pkcs12 -export \
  -in DistributionCertificate.cer \
  -inkey private-key.key \
  -out Certificates.p12 \
  -passout pass:p12_password
```

**Step 4: Encode P12 to Base64**

```bash
# macOS/Linux
base64 -i Certificates.p12 | pbcopy

# Linux
base64 Certificates.p12 > p12_base64.txt
cat p12_base64.txt
```

**Step 5: Add to GitHub Secrets**

1. GitHub repo → Settings → Secrets → Create secrets:
   - `IOS_P12_CERTIFICATE_BASE64` = base64-encoded P12 file
   - `IOS_P12_PASSWORD` = password used when exporting P12
   - `IOS_KEYCHAIN_PASSWORD` = temporary password for build keychain (can be random)

### iOS Provisioning Profile

**Step 1: Create App ID**

1. Apple Developer → Certificates, Identifiers & Profiles → Identifiers
2. Click "+" → App ID
3. Bundle ID: `com.imidus.customer`
4. Select capabilities (Push Notifications, etc.)

**Step 2: Create Provisioning Profile**

1. Certificates, Identifiers & Profiles → Provisioning Profiles
2. Click "+" → App Store
3. Select App ID → Select certificate → Add device
4. Download profile as `ImidusCustomerApp.mobileprovision`

**Step 3: Encode Profile to Base64**

```bash
base64 ImidusCustomerApp.mobileprovision | pbcopy
```

**Step 4: Add to GitHub Secrets**

- `IOS_PROVISIONING_PROFILE_BASE64` = base64-encoded provisioning profile

### App Store Connect API Key

For TestFlight uploads, create an API key:

1. App Store Connect → Users and Access → API Keys
2. Click "+" → Create new API key
3. Select "App Manager" role
4. Download `AuthKey_XXXXXXXXXX.p8`
5. Note the Key ID and Issuer ID from the screen

**Base64 Encode:**

```bash
base64 AuthKey_XXXXXXXXXX.p8 | pbcopy
```

**Add to GitHub Secrets:**

- `APP_STORE_CONNECT_API_KEY_ID` = Key ID (e.g., `ABC123DEF4`)
- `APP_STORE_CONNECT_API_ISSUER_ID` = Issuer ID (UUID)
- `APP_STORE_CONNECT_API_KEY_BASE64` = base64-encoded P8 file

---

## Backend .NET Build Setup

### WiX Installer Certificate (Optional)

If signing the MSI installer:

1. Generate certificate with `SignTool` or OpenSSL
2. Add `CODESIGN_CERTIFICATE_BASE64` secret if needed
3. Update `backend-build.yml` to sign MSI before upload

---

## GitHub Actions Workflow Triggers

### Android Build Workflow

**Automatic Triggers:**
- Push to `main`, `develop`, or `feature/*` branches with changes to `src/mobile/ImidusCustomerApp/**`
- Pull request to `main` with mobile changes

**Manual Trigger (workflow_dispatch):**

1. Go to GitHub repo → Actions → Android APK Build
2. Click "Run workflow"
3. Select branch: `main`
4. Build type: `release` or `debug`
5. Check "Upload to S3" if desired
6. Click "Run workflow"

### iOS Build Workflow

**Automatic Triggers:**
- Push to `main` with changes to `src/mobile/ImidusCustomerApp/**`

**Manual Trigger:**

1. GitHub repo → Actions → iOS Build & TestFlight
2. Click "Run workflow"
3. Select branch: `main`
4. Check "Upload to TestFlight"
5. Check "Upload to S3" if desired
6. Click "Run workflow"

### Backend Build Workflow

**Automatic Triggers:**
- Push to `main` or `develop` with changes to `src/backend/**`

**Manual Trigger:**

1. GitHub repo → Actions → Backend .NET Build & MSI
2. Click "Run workflow"
3. Check "Build MSI installer"
4. Check "Upload to S3"
5. Click "Run workflow"

---

## Release Tag Workflow

To create a coordinated release across all platforms:

1. **Create Release Tag:**
   ```bash
   git tag -a v1.0.1 -m "Release v1.0.1 - Bug fixes and improvements"
   git push origin v1.0.1
   ```

2. **Automated Actions:**
   - GitHub Actions automatically triggers all three workflows
   - Mobile apps extract version from tag
   - Artifacts uploaded to S3 with version in path
   - Version manifests created for tracking

3. **Monitor Build Status:**
   - GitHub repo → Actions
   - Watch workflows complete
   - Check S3 artifacts uploaded

---

## Troubleshooting

### "Secrets not found" Error

**Problem:** Workflow fails with "secrets.AWS_ACCESS_KEY_ID is not set"

**Solution:**
1. Verify secret exists in GitHub Settings → Secrets
2. Ensure secret name matches exactly (case-sensitive)
3. Re-save secret value (sometimes helps)
4. Clear browser cache and refresh

### Android Build Fails on Keystore

**Problem:** `Failed to decrypt keystore` or keystore not found

**Solution:**
1. Verify `ANDROID_KEYSTORE_BASE64` secret contains valid base64
2. Verify passwords match: `KEYSTORE_PASSWORD`, `KEY_PASSWORD`
3. Test locally: decode base64 and verify keystore is valid
4. Regenerate and re-encode keystore if corrupted

### iOS Build Fails on Certificate Import

**Problem:** `Security Error: -25295` or certificate import failure

**Solution:**
1. Verify certificate validity on Apple Developer
2. Recreate P12 with correct password
3. Verify `IOS_KEYCHAIN_PASSWORD` is set correctly
4. Check `IOS_P12_PASSWORD` matches export password

### S3 Upload Fails

**Problem:** `An error occurred (AccessDenied) when calling the PutObject operation`

**Solution:**
1. Verify AWS credentials are active (not expired)
2. Check IAM policy allows `s3:PutObject` on `inirestaurant` bucket
3. Verify bucket name and prefix are correct
4. Check AWS region is `us-east-1`

---

## Best Practices

1. **Rotate Secrets Quarterly**
   - Generate new AWS credentials
   - Renew iOS certificates before expiry
   - Update all GitHub Secrets

2. **Maintain Local Backups**
   - Keep encrypted backup of keystores/certificates
   - Store in separate secure location
   - Document password in secure vault (not Git)

3. **Monitor Build Logs**
   - GitHub Actions logs contain useful error info
   - Never copy secrets from logs
   - Archive logs for compliance

4. **Test New Secrets**
   - Test with debug builds before releasing
   - Manually verify S3 uploads work
   - Verify app functionality after signing

5. **Document Changes**
   - Update DEPLOYMENT.md when versioning changes
   - Document any certificate renewals
   - Keep CHANGELOG.md current

---

**Last Updated:** 2026-03-07  
**Version:** 1.0  
**Contact:** novatech2210@gmail.com
