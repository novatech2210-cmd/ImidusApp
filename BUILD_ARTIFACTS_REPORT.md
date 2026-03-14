# Mobile App Build Artifacts Report

**Generated**: 2026-03-09
**Project**: TOAST - Imidus POS Integration
**Milestone**: M2 - Mobile Apps (iOS & Android)

---

## 📱 Android APK - FOUND ✅

### Build Information

| Property | Value |
|----------|-------|
| **File** | `app-release.apk` |
| **Location** | `src/mobile/ImidusCustomerApp/android/app/build/outputs/apk/release/` |
| **Size** | 59 MB (61,044,983 bytes) |
| **Build Date** | March 5, 2026 21:08:22 |
| **Status** | ✅ **SIGNED & READY FOR DISTRIBUTION** |

### Package Details

| Property | Value |
|----------|-------|
| **Package Name** | `com.imidus.customer` |
| **Version Code** | 2 |
| **Version Name** | 1.0 |
| **Min SDK** | 23 (Android 6.0 Marshmallow) |
| **Target SDK** | 34 (Android 14) |
| **Compile SDK** | 34 (Android 14) |

### App Configuration

**Application Label**: ImidusCustomerApp
**Launch Activity**: `com.imidus.customer.MainActivity`

**Permissions**:
- ✅ `android.permission.INTERNET` (API access)
- ✅ `android.permission.WAKE_LOCK` (background tasks)
- ✅ `android.permission.ACCESS_NETWORK_STATE` (connectivity)
- ✅ `android.permission.POST_NOTIFICATIONS` (push notifications)
- ✅ `com.google.android.c2dm.permission.RECEIVE` (FCM)
- ✅ `com.imidus.customer.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION` (security)

### Signing Status

**✅ APK is SIGNED with release keystore**

Signing certificates found in META-INF:
- `CERT.SF` - Signature file
- `CERT.RSA` - RSA certificate
- `MANIFEST.MF` - Manifest with checksums

**Keystore**: `android/app/imidus-release.keystore` (configured)

### Dependencies Included

**AndroidX Libraries**:
- androidx.activity
- androidx.appcompat
- androidx.core
- androidx.fragment
- androidx.lifecycle
- androidx.recyclerview
- androidx.swiperefreshlayout
- com.google.android.material

**React Native**: 0.73.0
**Kotlin Coroutines**: Included for async operations
**Firebase**: Configured for FCM push notifications

### Baseline Profiles

Optimized for:
- API 28-30 (Android 9-11)
- API 31+ (Android 12+)

Performance optimization profiles included for faster app startup.

---

## 🍎 iOS IPA - NOT FOUND ❌

### Status

**⚠️ No IPA file found in build outputs**

### iOS Project Configuration

| Property | Value |
|----------|-------|
| **Bundle ID** | `$(PRODUCT_BUNDLE_IDENTIFIER)` (dynamic) |
| **Version** | `$(MARKETING_VERSION)` (dynamic from Xcode) |
| **Build Number** | `$(CURRENT_PROJECT_VERSION)` (dynamic) |
| **Project File** | `ios/ImidusCustomerApp.xcodeproj` ✅ |
| **Workspace** | Not found (CocoaPods not installed) |

### Export Configuration Found

**File**: `ios/ExportOptions.plist` ✅

```xml
<dict>
    <key>method</key>
    <string>app-store</string>      <!-- App Store distribution -->

    <key>teamID</key>
    <string>YOUR_TEAM_ID</string>   <!-- ⚠️ NEEDS UPDATE -->

    <key>signingStyle</key>
    <string>automatic</string>       <!-- Automatic code signing -->
</dict>
```

**⚠️ Configuration Issues**:
- Team ID is placeholder `YOUR_TEAM_ID` (needs Apple Developer Team ID)
- No signing certificates found in keychain
- CocoaPods dependencies not installed (`pod install` required)

### Why No IPA?

**Reasons**:
1. **macOS Required**: IPA files must be built on macOS with Xcode
2. **Signing Required**: Need Apple Developer account + certificates
3. **CI/CD Not Run**: GitHub Actions iOS workflow not executed on macOS runner
4. **Local Build**: This is a Linux environment (Kali), iOS builds require macOS

### iOS Build Requirements

**To build IPA, you need**:
1. ✅ Xcode project (present)
2. ❌ macOS machine or macOS CI/CD runner
3. ❌ Apple Developer account ($99/year)
4. ❌ Signing certificate + provisioning profile
5. ❌ Team ID configured in ExportOptions.plist
6. ❌ CocoaPods dependencies installed (`pod install`)

---

## 📊 Build Artifacts Summary

| Platform | Status | File Size | Ready for Distribution |
|----------|--------|-----------|------------------------|
| **Android** | ✅ Built | 59 MB | ✅ **YES** - Signed APK ready |
| **iOS** | ❌ Not Built | N/A | ❌ **NO** - Requires macOS + signing |

---

## 🚀 Distribution Readiness

### Android APK - READY ✅

**Can be distributed immediately**:
- ✅ Signed with release keystore
- ✅ All permissions configured
- ✅ Push notifications ready (FCM)
- ✅ Package name matches Firebase project
- ✅ Min SDK covers 99%+ devices

**Distribution Options**:
1. **Direct Install** (Sideloading)
   - Upload to S3: `s3://inirestaurant/novatech/`
   - Share download link with client
   - Users enable "Install from Unknown Sources"

2. **Google Play Store** (Recommended)
   - Create Google Play Console account ($25 one-time)
   - Upload APK for internal testing
   - Distribute via closed alpha/beta track
   - Eventually publish to production

3. **Firebase App Distribution**
   - Upload to Firebase Console
   - Invite testers by email
   - Automatic updates when new builds uploaded

**Recommended**: Upload to S3 for immediate client testing.

### iOS IPA - REQUIRES WORK ❌

**Steps to build IPA**:

1. **Get macOS Environment**
   ```bash
   # Option 1: Use GitHub Actions macOS runner (already configured)
   # Option 2: Access a Mac machine
   # Option 3: Use cloud Mac (MacStadium, MacinCloud)
   ```

2. **Install Dependencies**
   ```bash
   cd ios
   pod install
   ```

3. **Update Team ID**
   ```bash
   # Get Team ID from Apple Developer portal
   # Update ios/ExportOptions.plist
   sed -i 's/YOUR_TEAM_ID/ABCD1234XY/g' ExportOptions.plist
   ```

4. **Configure Signing**
   - Xcode: Preferences → Accounts → Add Apple ID
   - Project Settings → Signing & Capabilities
   - Select Team, enable "Automatically manage signing"

5. **Build Archive**
   ```bash
   # Via Xcode
   Product → Archive → Distribute App → App Store Connect

   # Via CLI
   xcodebuild archive -workspace ImidusCustomerApp.xcworkspace \
     -scheme ImidusCustomerApp \
     -archivePath build/ImidusCustomerApp.xcarchive

   xcodebuild -exportArchive \
     -archivePath build/ImidusCustomerApp.xcarchive \
     -exportPath build/ \
     -exportOptionsPlist ExportOptions.plist
   ```

6. **Upload to TestFlight**
   ```bash
   xcrun altool --upload-app -f build/ImidusCustomerApp.ipa \
     -u your@email.com -p app-specific-password
   ```

---

## 📦 Recommended Next Steps

### Immediate (Android)

1. **Test APK Locally**
   ```bash
   # Install on Android device/emulator
   adb install -r android/app/build/outputs/apk/release/app-release.apk
   ```

2. **Upload to S3**
   ```bash
   aws s3 cp app-release.apk s3://inirestaurant/novatech/ImidusCustomerApp-v1.0-build2.apk
   ```

3. **Share with Client**
   - Generate S3 pre-signed URL (24h expiry)
   - Send download link + installation instructions
   - Include note about "Install from Unknown Sources"

### Medium-Term (iOS)

1. **Set up GitHub Actions iOS build**
   - Use macOS-latest runner
   - Configure secrets (Apple ID, Team ID, certificates)
   - Automated IPA generation on push

2. **Configure Fastlane**
   - Automate signing
   - Automate TestFlight upload
   - Match for certificate management

3. **Get Apple Developer Account**
   - Enroll in Apple Developer Program ($99/year)
   - Create App ID for `com.imidus.customer`
   - Generate signing certificates

---

## 🔐 Security Notes

### Android APK

**✅ Security Status: GOOD**
- Signed with release keystore (not debug)
- ProGuard/R8 enabled (code obfuscation)
- Release build (optimized, no debug symbols)
- HTTPS enforced for API calls

**⚠️ Sensitive Data Check**:
- API keys should be in environment variables (verify)
- No hardcoded credentials in APK (decompile to verify)
- SSL certificate pinning recommended (not implemented)

### iOS (When Built)

**Security Requirements**:
- Must be signed with Distribution certificate
- Provisioning profile required
- App Transport Security enabled
- Keychain for secure storage

---

## 📋 Client Delivery Checklist

### Android Release

- [x] APK built and signed
- [x] Permissions documented
- [x] FCM push notifications configured
- [ ] Uploaded to S3
- [ ] Download link generated
- [ ] Installation instructions provided
- [ ] Release notes written

### iOS Release

- [ ] CocoaPods dependencies installed
- [ ] Team ID configured
- [ ] Signing certificates obtained
- [ ] IPA built and archived
- [ ] Uploaded to TestFlight
- [ ] Internal testers invited
- [ ] Release notes written

---

## 📱 Installation Instructions (Android)

**For Client Testing**:

1. **Enable Unknown Sources**
   ```
   Settings → Security → Unknown Sources → Enable
   ```

2. **Download APK**
   ```
   Download from: [S3 URL to be provided]
   File: ImidusCustomerApp-v1.0-build2.apk (59 MB)
   ```

3. **Install**
   ```
   Open downloaded file → Install → Open
   ```

4. **Grant Permissions**
   ```
   - Allow notifications (for order updates)
   - Allow internet access (automatic)
   ```

5. **Test**
   ```
   - Register new account
   - Browse menu
   - Add items to cart
   - Place test order
   - Receive push notification
   ```

---

**Report Generated**: 2026-03-09 02:15:00
**APK Path**: `src/mobile/ImidusCustomerApp/android/app/build/outputs/apk/release/app-release.apk`
**APK Size**: 59 MB
**APK Status**: ✅ Ready for distribution
**iOS Status**: ⏳ Requires macOS build environment
