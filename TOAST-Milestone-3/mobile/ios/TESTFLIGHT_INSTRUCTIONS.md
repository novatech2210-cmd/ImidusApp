# iOS App Distribution via TestFlight

## Overview

The iOS version of IMIDUS Customer App is distributed via Apple TestFlight for beta testing and internal distribution.

---

## For Testers (Receiving the App)

### Step 1: Install TestFlight

1. Open App Store on your iOS device
2. Search for "TestFlight"
3. Download and install the TestFlight app

### Step 2: Accept Invitation

1. Check your email for a TestFlight invitation from IMIDUS
2. Open the email on your iOS device
3. Tap "Start Testing"
4. TestFlight will open automatically
5. Tap "Accept" and then "Install"

### Step 3: Open the App

1. Find "IMIDUSAPP" on your home screen
2. Launch and sign in with your credentials

---

## For Developers (Building the IPA)

### Prerequisites

- macOS with Xcode 15.0+
- Apple Developer account (Team ID configured)
- Valid distribution certificate
- App Store Connect access

### Required Certificates & Profiles

The following must be configured in GitHub Secrets for CI/CD:

| Secret Name | Description |
|-------------|-------------|
| `IOS_BUILD_CERTIFICATE_BASE64` | Distribution certificate (.p12) encoded in base64 |
| `IOS_CERTIFICATE_PASSWORD` | Password for the .p12 certificate |
| `IOS_KEYCHAIN_PASSWORD` | Temporary keychain password |
| `IOS_PROVISIONING_PROFILE_BASE64` | Provisioning profile encoded in base64 |

### Generate Base64 Values

```bash
# Certificate
base64 -i Certificates.p12 | pbcopy
# Paste into IOS_BUILD_CERTIFICATE_BASE64

# Provisioning Profile
base64 -i YourApp.mobileprovision | pbcopy
# Paste into IOS_PROVISIONING_PROFILE_BASE64
```

### Build Locally

```bash
cd src/mobile/ImidusCustomerApp

# Install dependencies
npm install

# Install pods
cd ios && pod install && cd ..

# Build for release
npx react-native build-ios --mode Release

# Or use Xcode directly
open ios/ImidusCustomerApp.xcworkspace
# Select "Any iOS Device" and Archive
```

### Upload to TestFlight

**Via Xcode:**
1. Open Xcode
2. Product > Archive
3. Distribute App > App Store Connect
4. Upload

**Via CLI:**
```bash
xcrun altool --upload-app -f path/to/app.ipa \
  -u your-apple-id@email.com \
  -p app-specific-password
```

### CI/CD Pipeline

The GitHub Actions workflow handles automatic builds:

1. Push to `main` or create version tag (`v1.x.x`)
2. Workflow builds iOS app on macOS runner
3. IPA is archived as build artifact
4. Optionally uploads to TestFlight

---

## App Configuration

### Bundle Identifier
```
com.imidus.customer
```

### Minimum iOS Version
```
iOS 13.0
```

### Required Capabilities
- Push Notifications
- Background Modes (Remote notifications)
- Apple Pay (future)

---

## Troubleshooting

### "Unable to install" Error
- Ensure device UDID is in provisioning profile
- Check iOS version compatibility
- Try removing and re-installing from TestFlight

### Build Fails in CI
- Verify certificates are not expired
- Check provisioning profile includes correct app ID
- Ensure Xcode version matches required version

### Push Notifications Not Working
- Verify APNs key is configured in Firebase
- Check notification permissions on device
- Test with Firebase Console

---

## Contact

For iOS build issues:
- Email: novatech2210@gmail.com
- Include: Xcode version, error logs
