# Build Verification Guide - IMIDUS POS Integration

How to verify that built artifacts are correct, signed properly, and ready for distribution.

## Android APK Verification

### Verify APK Signature

After building the Android APK, verify it's signed with the correct key.

```bash
# List signing certificates in APK
jarsigner -verify -verbose -certs app-release.apk

# Expected output should show:
# sm   3072 Sat Mar 07 10:50:58 EST 2026 AndroidManifest.xml
#         X.509, CN=Imidus Customer App, OU=, O=, L=, ST=, C=
#         [certificate is valid from 2/15/2026 to 2/10/2036]
```

### Verify APK Contents

```bash
# Extract and list all files
unzip -l app-release.apk | head -30

# Check for expected files:
# - AndroidManifest.xml
# - classes.dex
# - resources.arsc
# - lib/ (native libraries)
# - assets/ (app resources)
```

### Verify App Version

```bash
# Use aapt to extract manifest info
aapt dump badging app-release.apk | grep -E "package:|versionCode:|versionName:"

# Expected output:
# package: name='com.imidus.customer' versionCode='1' versionName='0.0.1'
```

### Manual Testing on Emulator/Device

```bash
# Install APK on Android device
adb install -r app-release.apk

# Verify app launches
adb shell am start -n com.imidus.customer/com.imidus.customer.MainActivity

# Check for crashes
adb logcat | grep -i "com.imidus.customer"
```

---

## iOS IPA Verification

### Verify IPA Code Signature

```bash
# Extract and verify code signature
unzip -q ImidusCustomerApp.ipa -d Payload
codesign -v Payload/ImidusCustomerApp.app

# Expected output:
# Payload/ImidusCustomerApp.app: valid on disk
# Payload/ImidusCustomerApp.app: satisfies its Designated Requirement
```

### Verify Provisioning Profile

```bash
# Extract provisioning profile from IPA
security cms -D -i "Payload/ImidusCustomerApp.app/embedded.mobileprovision" | plutil -p -

# Check for:
# - Correct bundle identifier: com.imidus.customer
# - Expiration date (should be in future)
# - Entitlements (PushNotifications, etc.)
```

### Verify App Version

```bash
# Extract Info.plist and check version
unzip -p ImidusCustomerApp.ipa Payload/ImidusCustomerApp.app/Info.plist | \
  plutil -p - | grep -A 2 "CFBundleVersion\|CFBundleShortVersionString"

# Expected output:
# "CFBundleShortVersionString" => "0.0.1"
# "CFBundleVersion" => "1"
```

### Verify dSYM Symbols

```bash
# Check if dSYM archive contains symbols
unzip -l ImidusCustomerApp.dSYM.zip | head -20

# dSYM should contain:
# ImidusCustomerApp.xcarchive/dSYMs/ImidusCustomerApp.app.dSYM/Contents/Resources/DWARF/ImidusCustomerApp
```

### Manual Testing on iOS Simulator

```bash
# Install IPA on simulator
xcrun simctl install booted ImidusCustomerApp.ipa

# Launch app
xcrun simctl launch booted com.imidus.customer

# Check console output
xcrun simctl spawn booted log stream --predicate 'process == "ImidusCustomerApp"'
```

---

## Backend MSI Verification

### Verify MSI Signature (Optional)

```bash
# On Windows, verify Authenticode signature
Get-AuthenticodeSignature .\ImidusIntegrationService.msi

# Expected output should show:
# Status: Valid
# Signer: Imidus Technologies
```

### Verify MSI Contents

```bash
# List files in MSI using LessMSI
lessmsi list ImidusIntegrationService.msi

# Expected components:
# - IntegrationService.API.exe
# - IntegrationService.API.dll
# - Configuration files
# - Registry keys
```

### Verify Service Installation

```powershell
# After installing MSI, verify service exists
Get-Service ImidusIntegrationService

# Expected output:
# Status   Name               DisplayName
# ------   ----               -----------
# Running  ImidusIntegration  Imidus Integration Service

# Check service details
Get-Service ImidusIntegrationService | Format-List *
```

---

## S3 Artifact Verification

### Verify Artifacts Uploaded

After builds complete, verify all files are in S3:

```bash
# List Android artifacts
aws s3 ls s3://inirestaurant/novatech/mobile/android/v0.0.1/

# Expected output:
# 2026-03-07 10:50:58       3456789 app-release.apk
# 2026-03-07 10:51:02          456 version.json

# List iOS artifacts
aws s3 ls s3://inirestaurant/novatech/mobile/ios/v0.0.1/

# Expected output:
# 2026-03-07 10:52:00       5678901 ImidusCustomerApp.ipa
# 2026-03-07 10:52:00       2345678 ImidusCustomerApp.dSYM.zip
# 2026-03-07 10:52:02          456 version.json

# List Backend artifacts
aws s3 ls s3://inirestaurant/novatech/backend/v1.0.0/

# Expected output:
# 2026-03-07 10:53:00       4567890 ImidusIntegrationService.msi
# 2026-03-07 10:53:02          234 version.txt
# 2026-03-07 10:53:02          678 deployment.json
```

### Verify version.json Content

```bash
# Download and check version manifest
aws s3 cp s3://inirestaurant/novatech/mobile/android/v0.0.1/version.json - | jq .

# Expected output:
{
  "platform": "android",
  "app_version": "v0.0.1",
  "build_date": "2026-03-07T10:50:58Z",
  "commit": "abc123def456...",
  "commit_short": "abc123de",
  "branch": "main",
  "build_number": "42",
  "build_id": "12345678",
  "testflight_status": "not_applicable"
}
```

### Verify File Integrity

```bash
# Calculate SHA256 hash of local file
sha256sum app-release.apk

# Compare with S3 metadata
aws s3api head-object --bucket inirestaurant \
  --key novatech/mobile/android/v0.0.1/app-release.apk \
  --query "Metadata"

# Hashes should match
```

---

## Deployment Verification Checklist

Before deploying to production, verify:

### Android

- [ ] APK signed with correct certificate
- [ ] Version code and name correct
- [ ] App ID is `com.imidus.customer`
- [ ] Manifest permissions correct
- [ ] App launches without crashes
- [ ] File uploaded to S3 with correct path
- [ ] version.json present in S3

### iOS

- [ ] IPA code signature valid
- [ ] Provisioning profile matches app ID
- [ ] App version correct in Info.plist
- [ ] dSYM symbols present for crash reporting
- [ ] App launches without crashes on simulator
- [ ] Files uploaded to S3 with correct path
- [ ] version.json present in S3

### Backend

- [ ] MSI signature valid (if signed)
- [ ] Service installs correctly
- [ ] Service starts without errors
- [ ] API endpoints respond
- [ ] Database connection established
- [ ] All required files packaged
- [ ] Files uploaded to S3 with correct path

### Coordination

- [ ] All three platforms version numbers match (v1.0.1)
- [ ] All three sets of artifacts in S3
- [ ] Deployment manifests created
- [ ] GitHub release notes updated
- [ ] Client notified of new version

---

## Rollback Verification

If deploying a previous version:

```bash
# Verify previous version still in S3
aws s3 ls s3://inirestaurant/novatech/mobile/android/v1.0.0/

# Download and verify before deployment
aws s3 cp s3://inirestaurant/novatech/mobile/android/v1.0.0/app-release.apk .

# Check file integrity
sha256sum app-release.apk
# Compare with documented hash from previous release

# Test on device before production rollout
adb install -r app-release.apk
```

---

## Troubleshooting

### APK Won't Install on Device

```bash
# Check for architecture mismatch
aapt dump badging app-release.apk | grep native-code

# Get device ABI
adb shell getprop ro.product.cpu.abi

# Rebuild for correct architecture if mismatch
```

### IPA Code Signature Invalid

```bash
# Re-sign IPA with correct certificate
codesign -f -s "iPhone Distribution: Imidus Technologies" \
  --entitlements entitlements.plist \
  Payload/ImidusCustomerApp.app

# Repackage as IPA
zip -qr ImidusCustomerApp.ipa Payload
```

### S3 Upload Failed

```bash
# Verify AWS credentials
aws sts get-caller-identity

# Check bucket permissions
aws s3 ls s3://inirestaurant/novatech/ --recursive

# If access denied, contact AWS administrator
```

---

**Last Updated:** 2026-03-07  
**Version:** 1.0  
**Contact:** novatech2210@gmail.com
