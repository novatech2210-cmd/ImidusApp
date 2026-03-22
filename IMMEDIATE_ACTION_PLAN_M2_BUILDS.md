# IMMEDIATE ACTION PLAN: COMPLETE MOBILE BUILDS FOR M2

**Date**: March 19, 2026
**Priority**: CRITICAL - Client blocking on M2 mobile builds
**Objective**: Deliver Android APK + iOS IPA within 4 hours

---

## CURRENT STATUS SNAPSHOT

| Platform | Status | Next Step |
|----------|--------|-----------|
| **Android APK** | ✅ BUILT (60.3MB) | Upload to S3, notify client |
| **iOS IPA** | 🔄 READY TO BUILD | Trigger GitHub Actions macOS runner |
| **Backend** | ✅ RUNNING (localhost:5004) | Verified for mobile integration |
| **Client** | ⏸️ WAITING | Expects builds by EOD March 19 |

---

## TASK 1: FINALIZE ANDROID APK (30 minutes)

### 1.1 Verify Release APK exists and is valid
```bash
# Check file size and integrity
ls -lh /home/kali/Desktop/TOAST/src/mobile/ImidusCustomerApp/android/app/build/outputs/apk/release/
md5sum /path/to/imidus-customer-app-release.apk
```

### 1.2 Upload to AWS S3
```bash
# Configure AWS CLI (if needed)
aws configure

# Upload APK to S3
aws s3 cp /path/to/imidus-customer-app-release.apk \
  s3://inirestaurant/novatech/builds/m2-mobile/ \
  --region us-east-1 \
  --acl public-read

# Generate public URL
aws s3api get-object-acl \
  --bucket inirestaurant \
  --key novatech/builds/m2-mobile/imidus-customer-app-release.apk
```

### 1.3 Document Android APK details
```
File: imidus-customer-app-release.apk
Size: 60.3MB
Build Date: March 19, 2026
Includes:
- Menu browsing (tblItem, tblAvailableSize, tblCategory)
- Shopping cart and checkout
- Authorize.net payment tokenization
- Order status tracking
- Loyalty points (tblCustomer.EarnedPoints)
- Firebase FCM push notifications
- IMIDUS branding (orange, blue, gold theme)

Installation:
1. Download APK from S3
2. adb install -r imidus-customer-app-release.apk
3. Launch IMIDUSAPP
4. Test login → menu → cart → checkout → payment

Test Credentials:
- Email: test@imidus.com
- Password: [set in backend]
```

---

## TASK 2: TRIGGER iOS BUILD (Immediate)

### 2.1 Check GitHub Actions workflow status
```bash
# List recent workflow runs
gh run list --repo novatech642/pos-integration --workflow=ios-build.yml --limit 5

# Or check online:
# https://github.com/novatech642/pos-integration/actions
```

### 2.2 Manually trigger iOS build (if not auto-triggering)
```bash
# Trigger workflow via GitHub CLI
gh workflow run ios-build.yml \
  --repo novatech642/pos-integration \
  --ref main

# Alternative: Push a commit to trigger
cd /home/kali/Desktop/TOAST/src/mobile/ImidusCustomerApp
git add .
git commit -m "chore: trigger final iOS build for M2" || echo "No changes"
git push origin main
```

### 2.3 Monitor build progress
```bash
# Watch workflow execution
gh run watch --repo novatech642/pos-integration

# Check build logs
gh run view [RUN_ID] --repo novatech642/pos-integration --log
```

### 2.4 Expected iOS build output
- **File**: `ImidusCustomerApp.ipa` (~50-60MB)
- **Duration**: 30-45 minutes on macOS runner
- **Output**: GitHub Actions build artifacts

---

## TASK 3: DELIVER iOS BUILD TO TESTFLIGHT (1-2 hours)

### 3.1 Download IPA from GitHub Actions
```bash
# Once build completes, download artifact
gh run download [RUN_ID] \
  --repo novatech642/pos-integration \
  --name ios-build

# Verify IPA file
file ImidusCustomerApp.ipa
```

### 3.2 Upload to Apple TestFlight
```bash
# Option A: Using Xcode (if available)
xcrun altool --upload-app \
  -f ImidusCustomerApp.ipa \
  -t ios \
  -u [APPLE_ID_EMAIL] \
  -p [APP_SPECIFIC_PASSWORD]

# Option B: Using App Store Connect (web)
# 1. Navigate to: https://appstoreconnect.apple.com/
# 2. Select "My Apps" → IMIDUSAPP
# 3. Click "+" → "Upload Build"
# 4. Drag and drop IPA file
# 5. Answer compliance questions
# 6. Submit for beta review
```

### 3.3 Create TestFlight invite
```
Once build is uploaded:
1. Go to TestFlight tab in App Store Connect
2. Create internal testers group
3. Add tester emails (client's team)
4. Send invitation links
5. Testers can install from TestFlight app on iOS
```

---

## TASK 4: NOTIFY CLIENT (Immediate)

### 4.1 Send availability notification
```
Subject: Milestone 2 Mobile Builds Ready for Testing - Action Needed

Dear Sung Bin Im,

Your requested mobile builds are ready:

✅ ANDROID: Release APK (60.3MB) available at S3
   - Installation: Download APK, install on Android device/emulator
   - Ready now

🔄 iOS: IPA build in progress via GitHub Actions
   - Build started: [TIME]
   - Expected completion: [TIME + 45 minutes]
   - Will send TestFlight link once ready (within 2 hours)

ACTION REQUIRED:
1. Confirm your Apple ID(s) for TestFlight invitations
2. Assign testing team members
3. Begin Android APK testing immediately
4. Expect iOS TestFlight link within 2 hours

Download Android APK: [S3_URL]
Support: novatech2210@gmail.com

Looking forward to your testing feedback.

Best regards,
Chris
```

---

## TASK 5: VERIFY BUILDS ARE FUNCTIONAL (During deployment)

### 5.1 Android APK sanity check
```bash
# Emulator test
adb install -r imidus-customer-app-release.apk
adb shell am start -n com.imidus.customer/com.imidus.customer.MainActivity

# Verify:
- App launches without crash
- Splash screen shows (brand assets)
- Login screen appears
- Can enter credentials
```

### 5.2 iOS IPA sanity check (if available)
```bash
# Create simulator and test
xcrun simctl create "iPhone 15" \
  "iPhone 15" iOS18.0
xcrun simctl boot "iPhone 15"

# Install IPA
xcrun simctl install booted ImidusCustomerApp.ipa

# Launch
xcrun simctl launch booted com.imidus.customer
```

---

## TASK 6: CREATE DOCUMENTATION FOR CLIENT

### 6.1 Testing guide
Create a file: `MOBILE_APP_TESTING_GUIDE.md`
- Installation instructions for Android APK
- Installation instructions for iOS TestFlight
- Feature checklist to verify
- Common issues and solutions
- Contact for support

### 6.2 Build artifacts manifest
Create a file: `M2_BUILD_ARTIFACTS.md`
- Android APK details (size, API levels, features)
- iOS IPA details (version, bundle ID, signing)
- Build dates and hashes
- Feature completeness checklist
- Known limitations (if any)

---

## TIMELINE EXECUTION

```
NOW (March 19, 2026)
├─ Task 1: Finalize Android (30 min) ................. [0:00-0:30]
├─ Task 2: Trigger iOS build (5 min) ................ [0:05-0:10]
├─ Task 3: Notify client (Android ready) ............ [0:15-0:20]
│
│ [iOS build running in parallel on GitHub Actions: 30-45 min]
│
├─ Task 4: Create testing documentation (30 min) ... [0:30-1:00]
├─ Task 5: Monitor iOS build completion ............ [1:00-1:45]
├─ Task 6: Download & prepare iOS IPA (15 min) ... [1:45-2:00]
├─ Task 7: Upload to TestFlight (30 min) .......... [2:00-2:30]
└─ Task 8: Notify client (iOS ready + TestFlight link) [2:30-2:45]

TOTAL TIME: ~2.5-3 hours from now

EXPECTED CLIENT DELIVERY: March 19, 2026, 5:00 PM (Both builds ready)
```

---

## SUCCESS CRITERIA

✅ **Android Build Delivered**
- [ ] APK uploaded to S3 and verified
- [ ] Download link provided to client
- [ ] File integrity confirmed
- [ ] Client can download and install

✅ **iOS Build Delivered**
- [ ] IPA uploaded to App Store Connect
- [ ] TestFlight build review completed
- [ ] TestFlight invitations sent to client
- [ ] Client team members can install from TestFlight

✅ **Documentation Complete**
- [ ] Testing guide provided
- [ ] Build artifacts manifest created
- [ ] Support contact clear
- [ ] Next steps defined

✅ **Client Ready to Test**
- [ ] Android APK installed on device/emulator
- [ ] iOS app installed from TestFlight
- [ ] Testers know what to verify
- [ ] Support channel established

---

## BLOCKERS TO WATCH

| Blocker | Resolution |
|---------|-----------|
| iOS build fails | Check GitHub Actions logs, re-trigger if needed |
| TestFlight review takes too long | Manually submit via App Store Connect web UI |
| APK too large for download | Create alternate distribution method |
| Client can't install APK | Provide adb installation commands and support |
| Testers unavailable | Client to confirm TestFlight recipient emails |

---

## FALLBACK OPTIONS

If iOS build is delayed:
1. Provide client with development build for testing
2. Use ad-hoc signed build for specific devices
3. Provide source code for them to build locally
4. Push iOS delivery to March 20 (next morning)

---

## SIGN-OFF

**Status**: Ready to execute
**Owner**: Chris, Novatech Build Team
**Deadline**: EOD March 19, 2026
**Target**: Both builds delivered and client testing begins by March 20

---

**Next Action**: Execute Task 1 (finalize Android APK) immediately.
