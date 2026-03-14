# iOS TestFlight Setup & Deployment Guide

**Client:** Imidus Technologies / INI_Restaurant  
**App:** Imidus Customer App (React Native 0.73)  
**Date:** March 6, 2026  
**Support:** novatech2210@gmail.com

---

## 📋 Overview

TestFlight is Apple's official beta testing platform. This guide walks through the complete setup process from App Store Connect to distributing builds to testers.

**Timeline:** 
- Initial setup: 30-45 minutes
- First build upload: 15-20 minutes
- Build processing: 10-30 minutes
- Tester invitation: 5 minutes

---

## 🔑 Prerequisites

You will need:
1. **Apple Developer Account** (enroll at developer.apple.com)
2. **App Store Connect access** (developer.apple.com/app-store-connect)
3. **Bundle ID:** `com.imidus.customerapp` (must match your Xcode config)
4. **App Privacy Policy URL** (required for TestFlight)
5. **Contact Email** for testers

---

## Part 1: App Store Connect Setup (15 min)

### Step 1a: Create App Record

1. Go to **App Store Connect** → Sign in with Apple ID
2. Click **Apps** → **+ New App**
3. Select **iOS**
4. Fill in:
   - **Platform:** iOS
   - **Name:** `Imidus Customer App` (display name in App Store)
   - **Primary Language:** English
   - **Bundle ID:** `com.imidus.customerapp`
   - **SKU:** `IMIDUS-CUSTOMER-001` (internal identifier, any unique value)
   - **User Access:** Select if app allows sign-ups (YES for this app)

5. Click **Create**

### Step 1b: Add Privacy Policy

1. In App Store Connect → **Your App** → **App Information** → **Privacy Policy URL**
2. Enter: `https://inirestaurant.com/privacy` (or your privacy policy URL)
   - **CRITICAL:** This must be a valid HTTPS URL. TestFlight will fail without it.
3. Save

### Step 1c: Add Test Information

1. Go to **App Store Connect** → **Your App** → **TestFlight** → **Information**
2. Fill in:
   - **Beta App Name:** `Imidus Customer (Beta)`
   - **Beta App Description:** Test the new order management system
   - **Test Notes:** `Test payment, orders, loyalty points, and order tracking`
   - **Feedback Email:** `novatech2210@gmail.com`
   - **Contact Email for TestFlight:** Your contact email
   - **Significant Change:** Check if this is first build

3. Save

---

## Part 2: Signing Certificates & Provisioning (30 min)

### Step 2a: Create Signing Certificate

**On your Mac (or build machine):**

1. Open **Keychain Access** → **Keychain Access** → **Certificate Assistant** → **Request a Certificate from a Certificate Authority**

2. Fill in:
   - **User Email Address:** Your Apple ID email
   - **Common Name:** Your name or company
   - **Request is:** Saved to disk

3. Save as `CertificateSigningRequest.certSigningRequest`

**In App Store Connect:**

1. Go to **Certificates, Identifiers & Profiles** → **Certificates**
2. Click **+** (Create new certificate)
3. Select **Apple Distribution** (for TestFlight/App Store)
4. Click **Continue**
5. Upload your `CertificateSigningRequest.certSigningRequest` file
6. Download the generated `.cer` file
7. Double-click to install in Keychain

### Step 2b: Register Device UDIDs

TestFlight requires registering test devices. Get the UDID from each tester's iPhone:

**For each tester:**
1. Connect their iPhone to their Mac
2. Open **Xcode** → Window → **Devices and Simulators**
3. Select their iPhone → Copy **Identifier** (40-character code)

**Register in App Store Connect:**
1. Go to **Certificates, Identifiers & Profiles** → **Devices**
2. Click **+** → **Register Devices**
3. Add each tester's device:
   - **Platform:** iOS
   - **Device Name:** `Tester iPhone [Name]`
   - **Device ID (UDID):** Paste the UDID from step above

4. Click **Continue** → **Register**

### Step 2c: Create Provisioning Profile

1. Go to **Certificates, Identifiers & Profiles** → **Provisioning Profiles**
2. Click **+** → **Create new profile**
3. Select **App Store Connect**
4. Select Bundle ID: `com.imidus.customerapp`
5. Select Certificate: (the one you created above)
6. Select Devices: (all registered test devices)
7. Enter Profile Name: `Imidus Customer App Distribution`
8. Download the `.mobileprovision` file
9. Double-click to install (installs to ~/Library/MobileDevice/Provisioning\ Profiles/)

---

## Part 3: Prepare App Store Connect API Key (for automation)

**This enables automated TestFlight uploads from CI/CD:**

1. Go to **App Store Connect** → **Users and Access** → **Integrations** → **App Store Connect API**
2. Click **Generate API Key**
3. Select **App Manager** role (minimum required for TestFlight)
4. Key name: `CI_CD_TestFlight_Upload`
5. Download the key file (save as `AuthKey_[KEY_ID].p8`)
6. **IMPORTANT:** Note your **Key ID** (visible in the UI) and **Issuer ID** (shown after download)

**Store these securely for CI/CD:**
```
APP_STORE_CONNECT_API_KEY_ID = [Key ID from above]
APP_STORE_CONNECT_API_ISSUER_ID = [Issuer ID from above]
APP_STORE_CONNECT_API_KEY_BASE64 = [base64-encoded contents of AuthKey_*.p8]
```

---

## Part 4: Configure iOS Project (Xcode)

### Step 4a: Open Xcode Project

```bash
cd src/mobile/ImidusCustomerApp/ios
open ImidusCustomerApp.xcworkspace  # NOTE: .xcworkspace not .xcodeproj
```

### Step 4b: Configure Signing

1. Select **ImidusCustomerApp** project (left sidebar)
2. Select **ImidusCustomerApp** target
3. Go to **Signing & Capabilities** tab
4. Set:
   - **Team:** Your Apple Team (will auto-populate once connected)
   - **Bundle Identifier:** `com.imidus.customerapp`
   - **Provisioning Profile:** Auto (or select the one you created)
   - **Code Sign Identity:** Apple Distribution

5. Repeat for **ImidusCustomerAppTests** target

### Step 4c: Create ExportOptions.plist

Create file: `src/mobile/ImidusCustomerApp/ios/ExportOptions.plist`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>app-store</string>
    <key>teamID</key>
    <string>YOUR_TEAM_ID</string>
    <key>signingStyle</key>
    <string>automatic</string>
    <key>stripSwiftSymbols</key>
    <true/>
    <key>thinning</key>
    <string>&lt;none&gt;</string>
    <key>destination</key>
    <string>export</string>
    <key>generateBitcode</key>
    <false/>
</dict>
</plist>
```

Replace `YOUR_TEAM_ID` with your 10-digit Apple Team ID (found in App Store Connect).

---

## Part 5: Build & Upload (Manual Process)

### Step 5a: Build on Local Mac

**Prerequisites:**
- macOS 13+ with Xcode 14+
- CocoaPods installed: `sudo gem install cocoapods`
- Node.js 18+

**Build Steps:**

```bash
cd src/mobile/ImidusCustomerApp

# Install dependencies
pnpm install --frozen-lockfile

# Install CocoaPods
cd ios
pod install
cd ..

# Build for iOS
cd ios
xcodebuild -workspace ImidusCustomerApp.xcworkspace \
  -scheme ImidusCustomerApp \
  -sdk iphoneos \
  -configuration Release \
  -archivePath $PWD/build/ImidusCustomerApp.xcarchive \
  archive

# Export IPA
xcodebuild -exportArchive \
  -archivePath $PWD/build/ImidusCustomerApp.xcarchive \
  -exportOptionsPlist ExportOptions.plist \
  -exportPath $PWD/build

# Result: ImidusCustomerApp.ipa in build/ directory
```

### Step 5b: Upload IPA to TestFlight

**Option 1: Using Transporter App (GUI)**
1. Download **Transporter** from App Store
2. Open → Sign in with Apple ID
3. Drag & drop the `.ipa` file
4. Click **Deliver**
5. Wait for processing (5-10 min)

**Option 2: Using Command Line**

```bash
cd src/mobile/ImidusCustomerApp/ios/build

# Using Transporter CLI
xcrun altool --upload-app -f ImidusCustomerApp.ipa \
  -t ios \
  -u your-apple-id@email.com \
  -p your-app-specific-password

# App-specific password: https://appleid.apple.com → Security → App Passwords
```

---

## Part 6: Automated Deployment via CI/CD

### Step 6a: Add GitHub Secrets

In your GitHub repo:
1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Add these secrets:

```
IOS_P12_CERTIFICATE_BASE64    = [base64-encoded .p12 cert]
IOS_P12_PASSWORD              = [password for .p12]
IOS_KEYCHAIN_PASSWORD         = [any secure password]
IOS_PROVISIONING_PROFILE_BASE64 = [base64-encoded .mobileprovision]
APP_STORE_CONNECT_API_KEY_ID  = [from Part 3 above]
APP_STORE_CONNECT_API_ISSUER_ID = [from Part 3 above]
APP_STORE_CONNECT_API_KEY_BASE64 = [base64-encoded AuthKey_*.p8]
```

**How to create base64 values:**
```bash
# For certificate
base64 -i MyCertificate.p12 | pbcopy  # macOS
base64 < MyCertificate.p12 | xclip -selection clipboard  # Linux

# For provisioning profile
base64 -i Imidus\ Customer\ App\ Distribution.mobileprovision | pbcopy
```

### Step 6b: Trigger CI/CD

The workflow (`.github/workflows/ios-build.yml`) is already configured. To trigger:

```bash
# Push changes to trigger automatic build
git push origin main

# Or manually trigger
# Go to GitHub Actions → iOS Build & TestFlight → Run workflow
```

---

## Part 7: Manage TestFlight Testers

### Step 7a: Add Internal Testers

1. App Store Connect → **Your App** → **TestFlight** → **Internal Testing**
2. Click **+ Add Testers** (or invite via email)
3. Add team members who have admin access

### Step 7b: Add External Testers

1. App Store Connect → **Your App** → **TestFlight** → **External Testing**
2. Click **Create Group**
   - **Group Name:** `Beta Testers` (or your name)
   - **Testers:** Add email addresses
3. Click **Create**

4. When build is ready, click **Add Build to Test**
   - Select the build version
   - Accept beta agreement
   - Save
   - Click **Notify Testers**

### Step 7c: Testers Accept Invitations

Each tester will receive an email with a TestFlight link:
1. Click link → Opens TestFlight app (or App Store)
2. Click **Accept** or **Start Testing**
3. App downloads and installs
4. Tester provides feedback via TestFlight app

---

## Part 8: Build Processing & Testing

### What Happens After Upload

1. **Uploading** (5-10 min) — File transfers to Apple
2. **Processing** (10-30 min) — Apple processes the build
3. **Ready for Testing** (notification sent) — Build available in TestFlight
4. **Tester Installation** (immediate) — Testers can download & install

### Common Issues

**"Missing Privacy Policy"**
- Solution: Add privacy policy URL in App Store Connect (Part 1b)

**"Certificate not trusted"**
- Solution: Verify certificate was imported to Keychain correctly
- Re-download from App Store Connect and double-click to install

**"Provisioning profile doesn't match"**
- Solution: Ensure bundle ID matches exactly: `com.imidus.customerapp`
- Regenerate provisioning profile if needed

**"Build still processing after 1 hour"**
- Contact App Store Support
- Usually indicates compliance review needed

---

## Part 9: Version Management

Each TestFlight build requires:
- Unique **Build Number** (e.g., 1, 2, 3...)
- Unique **Version Number** (e.g., 1.0, 1.1, 2.0...)

**Increment Build Number Before Each Upload:**

In Xcode:
1. Select **ImidusCustomerApp** target
2. Go to **Build Settings** → Search "build number"
3. Increment **Bundle Version** (e.g., 1 → 2)

Or edit directly:
```bash
cd src/mobile/ImidusCustomerApp/ios/ImidusCustomerApp

# Edit Info.plist
# Change CFBundleVersion to next number
plutil -p Info.plist | grep CFBundle
```

---

## Part 10: Feedback & Iteration

### Collecting Tester Feedback

Testers submit feedback via TestFlight app:
- **Crashes** → Automatic stack traces sent
- **Session Logs** → 10 most recent sessions included
- **Screenshots** → Attach with feedback

### View Feedback in App Store Connect

1. App Store Connect → **Your App** → **TestFlight** → **Feedback**
2. Review crash reports, session logs, and user feedback
3. Cross-reference with your analytics

### Next Build Iterations

1. Fix issues based on feedback
2. Increment build number
3. Rebuild and upload (via GitHub Actions or local build)
4. Notify testers of new build
5. Collect feedback

---

## ✅ Quick Checklist: First TestFlight Upload

- [ ] Bundle ID registered in App Store Connect (`com.imidus.customerapp`)
- [ ] Privacy Policy URL added (required)
- [ ] Apple Distribution certificate created and installed
- [ ] Provisioning profile created and installed
- [ ] ExportOptions.plist configured with correct Team ID
- [ ] Test devices registered (UDIDs added to Apple account)
- [ ] Xcode signing configured (Automatic or Manual)
- [ ] Build number incremented in Info.plist
- [ ] IPA built and tested locally (verify it installs)
- [ ] IPA uploaded to TestFlight (via Transporter or CLI)
- [ ] Build processed and marked "Ready for Testing"
- [ ] Testers invited (internal and/or external)
- [ ] Testers notified via TestFlight
- [ ] Test scenarios run and feedback collected

---

## 📞 Support & Troubleshooting

**If you encounter issues:**

1. Check **App Store Connect** → **Your App** → **Activity**
   - Shows upload history and any rejection reasons

2. Check **Apple Developer** → **Certificates, Identifiers & Profiles**
   - Verify certificate validity and provisioning profile status

3. View Xcode build logs:
   - Xcode → Product → Scheme → Edit Scheme → Build → Show environment variables
   - Look for code signing errors

4. Email support: `novatech2210@gmail.com`
   - Include: Error messages, build logs, App Store Connect activity screenshot

---

## 🚀 Next Steps After M3 Acceptance

Once M3 (Web Platform) is approved and this iOS build is live:

1. **Collect TestFlight feedback** (1-2 weeks)
2. **Push updates as bugs are found**
3. **Move to App Store review** (requires additional steps)
4. **Begin M4 Admin Portal** development

---

## Files & Links

- **GitHub Workflow:** `.github/workflows/ios-build.yml`
- **Xcode Project:** `src/mobile/ImidusCustomerApp/ios/ImidusCustomerApp.xcworkspace`
- **App Store Connect:** https://appstoreconnect.apple.com
- **Apple Developer:** https://developer.apple.com
- **Transporter App:** Download from Mac App Store
- **TestFlight Support:** https://support.apple.com/en-us/105090

