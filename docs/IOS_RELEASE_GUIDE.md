# iOS Release Guide - ImidusCustomerApp

## Overview

This guide covers the complete iOS app release process from development to App Store.

**App Details**:
- Bundle ID: `com.imidus.customer`
- App Name: ImidusCustomerApp
- Min iOS: 13.0
- Target iOS: 17.0

---

## Prerequisites

### 1. Apple Developer Account

**Cost**: $99/year

**Enrollment Steps**:
1. Go to https://developer.apple.com/programs/enroll/
2. Sign in with Apple ID
3. Agree to Apple Developer Agreement
4. Pay enrollment fee
5. Wait for approval (usually 24-48 hours)

**After Enrollment**:
- Get **Team ID**: https://developer.apple.com/account/#/membership
- Note your Apple ID email for Fastlane configuration

### 2. App ID Registration

1. Go to https://developer.apple.com/account/resources/identifiers/list
2. Click "+" to register new App ID
3. Select "App IDs" → Continue
4. Select "App" → Continue
5. Enter:
   - Description: `ImidusCustomerApp`
   - Bundle ID: `com.imidus.customer` (Explicit)
6. Enable Capabilities:
   - ✅ Push Notifications
   - ✅ Associated Domains (optional)
7. Click "Continue" → "Register"

### 3. Signing Certificates

**Option A: Automatic Signing (Recommended)**

1. Open Xcode
2. Preferences → Accounts → Add Apple ID
3. Open project: `open ImidusCustomerApp.xcworkspace`
4. Select project → Signing & Capabilities
5. Check "Automatically manage signing"
6. Select your Team
7. Xcode creates certificates automatically

**Option B: Manual Signing with Match**

```bash
cd ios
bundle install
bundle exec fastlane match init
bundle exec fastlane match appstore
```

### 4. App Store Connect Setup

1. Go to https://appstoreconnect.apple.com
2. My Apps → "+" → New App
3. Enter:
   - Platform: iOS
   - Name: ImidusCustomerApp
   - Primary Language: English (U.S.)
   - Bundle ID: com.imidus.customer
   - SKU: com.imidus.customer.2024
4. Create App

---

## Local Build (macOS Required)

### Quick Start

```bash
# Navigate to iOS directory
cd src/mobile/ImidusCustomerApp/ios

# Install dependencies
bundle install
pod install

# Build locally
./scripts/build-local.sh
```

### Manual Xcode Build

```bash
# Open workspace
open ImidusCustomerApp.xcworkspace

# In Xcode:
# 1. Select "ImidusCustomerApp" scheme
# 2. Select "Any iOS Device" as destination
# 3. Product → Archive
# 4. Window → Organizer → Distribute App
```

### Fastlane Build

```bash
# Staging build
bundle exec fastlane build_staging

# Production build
bundle exec fastlane build_production
```

---

## TestFlight Distribution

### Upload via Fastlane

```bash
# Build and upload
bundle exec fastlane upload_testflight

# Or upload existing IPA
./scripts/upload-testflight.sh build/ImidusCustomerApp.ipa
```

### Upload via Xcode

1. Product → Archive
2. Window → Organizer
3. Select archive → Distribute App
4. App Store Connect → Upload
5. Wait for processing (10-30 min)

### TestFlight Setup

1. App Store Connect → TestFlight
2. Internal Testing:
   - Add team members by email
   - Up to 100 internal testers
   - No review required
3. External Testing:
   - Add external testers
   - Requires Beta App Review
   - Up to 10,000 testers

---

## GitHub Actions CI/CD

### Required Secrets

Add these to GitHub repository settings → Secrets:

| Secret | Description | How to Get |
|--------|-------------|------------|
| `IOS_BUILD_CERTIFICATE_BASE64` | .p12 certificate (base64) | Export from Keychain, encode |
| `IOS_CERTIFICATE_PASSWORD` | Certificate password | Set during export |
| `IOS_PROVISIONING_PROFILE_BASE64` | Provisioning profile (base64) | Download from Apple, encode |
| `IOS_KEYCHAIN_PASSWORD` | Temporary keychain password | Any strong password |
| `APPLE_ID` | Apple Developer email | Your Apple ID |
| `APPLE_ID_PASSWORD` | Apple ID password or app-specific | Generate at appleid.apple.com |
| `APPLE_APP_SPECIFIC_PASSWORD` | App-specific password | https://appleid.apple.com |
| `FASTLANE_TEAM_ID` | Apple Developer Team ID | Developer portal |
| `AWS_ACCESS_KEY_ID` | AWS access key | IAM console |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | IAM console |

### Encoding Certificates

```bash
# Encode certificate
base64 -i Certificates.p12 -o certificate_base64.txt

# Encode provisioning profile
base64 -i profile.mobileprovision -o profile_base64.txt

# Copy contents to GitHub secrets
cat certificate_base64.txt | pbcopy
```

### Generating App-Specific Password

1. Go to https://appleid.apple.com/account/manage
2. Sign In & Security → App-Specific Passwords
3. Click "+" to generate
4. Name: "GitHub Actions iOS"
5. Copy password to `APPLE_APP_SPECIFIC_PASSWORD` secret

### Trigger Build

```bash
# Push to main branch (auto-triggers)
git push origin main

# Or manual trigger via GitHub UI
# Actions → iOS Build & Release → Run workflow
```

---

## App Store Submission

### Prepare Metadata

Required assets:
- App Icon (1024x1024)
- Screenshots (various sizes)
- App Description
- Keywords
- Support URL
- Privacy Policy URL

### Screenshots Required

| Device | Size |
|--------|------|
| iPhone 6.7" | 1290 x 2796 |
| iPhone 6.5" | 1242 x 2688 |
| iPhone 5.5" | 1242 x 2208 |
| iPad Pro 12.9" | 2048 x 2732 |

### Submit for Review

```bash
# Upload with metadata
bundle exec fastlane release

# Submit for review
bundle exec fastlane submit_review
```

### Review Guidelines

Common rejection reasons:
- ❌ Crashes or bugs
- ❌ Placeholder content
- ❌ Missing privacy policy
- ❌ Login required without demo account
- ❌ Incomplete app metadata

---

## Release Checklist

### Pre-Build
- [ ] Code freeze on release branch
- [ ] All tests passing
- [ ] Version number updated
- [ ] Build number incremented
- [ ] Release notes written

### Build & Sign
- [ ] CocoaPods dependencies installed
- [ ] Certificates valid (not expired)
- [ ] Provisioning profile includes all devices
- [ ] Archive builds successfully
- [ ] IPA exported without errors

### TestFlight
- [ ] IPA uploaded to App Store Connect
- [ ] Build processing complete
- [ ] Export compliance answered
- [ ] Internal testers notified
- [ ] External beta review passed (if applicable)

### App Store
- [ ] All metadata complete
- [ ] Screenshots uploaded (all sizes)
- [ ] App preview video (optional)
- [ ] Privacy policy URL valid
- [ ] Support URL valid
- [ ] Pricing configured
- [ ] App Review Information complete
- [ ] Submitted for review

### Post-Release
- [ ] dSYM uploaded for crash reporting
- [ ] Release notes published
- [ ] Marketing notified
- [ ] Support team notified
- [ ] Analytics tracking verified

---

## Troubleshooting

### Common Issues

**1. Code Signing Errors**
```
error: No signing certificate "iOS Distribution" found
```
Solution:
- Check Keychain Access for valid certificates
- Re-download from Apple Developer Portal
- Run `bundle exec fastlane match appstore`

**2. Provisioning Profile Issues**
```
error: No profiles for 'com.imidus.customer' were found
```
Solution:
- Check profiles at developer.apple.com
- Re-generate with Match
- Ensure Bundle ID matches exactly

**3. Archive Failed**
```
error: Multiple commands produce...
```
Solution:
- Clean build folder: Cmd+Shift+K
- Delete DerivedData: `rm -rf ~/Library/Developer/Xcode/DerivedData`
- Re-install pods: `pod deintegrate && pod install`

**4. Upload Failed**
```
error: Authentication failed
```
Solution:
- Verify Apple ID credentials
- Generate new app-specific password
- Check 2FA is enabled

### Getting Help

- Fastlane Docs: https://docs.fastlane.tools
- Apple Developer Forums: https://developer.apple.com/forums/
- Stack Overflow: `[ios] [fastlane]` tags

---

## Environment Variables Reference

```bash
# Apple Developer
export FASTLANE_TEAM_ID="ABCD1234XY"
export FASTLANE_APPLE_ID="developer@example.com"
export FASTLANE_ITC_TEAM_ID="123456789"

# App-specific password (for uploads)
export FASTLANE_APPLE_APPLICATION_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"

# Match (certificate management)
export MATCH_GIT_URL="https://github.com/your-org/certificates.git"
export MATCH_PASSWORD="your-encryption-password"

# AWS (for S3 uploads)
export AWS_ACCESS_KEY_ID="AKIA..."
export AWS_SECRET_ACCESS_KEY="..."
export AWS_DEFAULT_REGION="us-east-1"
```

---

## Quick Commands Reference

```bash
# Local development
cd ios
pod install
open ImidusCustomerApp.xcworkspace

# Build & Test
bundle exec fastlane test
bundle exec fastlane build_staging
bundle exec fastlane build_production

# Upload
bundle exec fastlane upload_testflight
bundle exec fastlane release

# Certificates
bundle exec fastlane match appstore
bundle exec fastlane match development

# Utilities
bundle exec fastlane bump_version bump_type:minor
bundle exec fastlane clean
```

---

**Document Version**: 1.0
**Last Updated**: 2026-03-09
**Maintainer**: Novatech Build Team
