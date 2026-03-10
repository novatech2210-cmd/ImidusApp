# CI/CD Setup Guide for IMIDUS Mobile Apps

This guide explains how to configure GitHub Actions for automated Android APK and iOS TestFlight builds.

## Android APK Build

### Required GitHub Secrets

1. **ANDROID_KEYSTORE_BASE64** - Base64 encoded keystore file

   ```bash
   # Generate from your keystore:
   base64 -i android/app/imidus-release.keystore | tr -d '\n'
   ```

2. **KEYSTORE_PASSWORD** - Keystore password
   - Current value: `ImidusSecure2024`

3. **KEY_PASSWORD** - Key password
   - Current value: `ImidusSecure2024`

4. **KEY_ALIAS** - Key alias
   - Current value: `imidus-key`

### Creating a New Keystore (if needed)

```bash
keytool -genkeypair -v \
  -keystore imidus-release.keystore \
  -alias imidus-key \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -dname "CN=IMIDUS, OU=Mobile, O=IMIDUS Technologies, L=Vancouver, ST=BC, C=CA"
```

### Triggering a Build

1. Push to `main`, `develop`, or `feature/*` branches
2. Or manually via GitHub Actions → Android APK Build → Run workflow

## iOS Build & TestFlight

### Required GitHub Secrets

1. **IOS_P12_CERTIFICATE_BASE64** - Base64 encoded .p12 certificate

   ```bash
   base64 -i Certificates.p12 | tr -d '\n'
   ```

2. **IOS_P12_PASSWORD** - Certificate password

3. **IOS_KEYCHAIN_PASSWORD** - Temporary keychain password (any strong password)

4. **IOS_PROVISIONING_PROFILE_BASE64** - Base64 encoded provisioning profile
   ```bash
   base64 -i profile.mobileprovision | tr -d '\n'
   ```

### App Store Connect API (for TestFlight upload)

5. **APP_STORE_CONNECT_API_KEY_ID** - API Key ID from App Store Connect

6. **APP_STORE_CONNECT_API_ISSUER_ID** - Issuer ID from App Store Connect

7. **APP_STORE_CONNECT_API_KEY_BASE64** - Base64 encoded .p8 key file
   ```bash
   base64 -i AuthKey_XXXXXXXX.p8 | tr -d '\n'
   ```

### Creating App Store Connect API Key

1. Go to App Store Connect → Users and Access → Keys
2. Click + to create a new key
3. Name: "CI/CD Build Key"
4. Access: "App Manager" role
5. Download the .p8 key file (only available once!)
6. Note the Key ID and Issuer ID

### iOS Setup Steps

1. Create an App ID in Apple Developer Portal
2. Create a Distribution Certificate
3. Create an App Store Distribution Provisioning Profile
4. Export certificate as .p12 with password
5. Create `ExportOptions.plist` in ios/ directory:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>app-store</string>
    <key>teamID</key>
    <string>YOUR_TEAM_ID</string>
    <key>uploadSymbols</key>
    <true/>
    <key>compileBitcode</key>
    <false/>
</dict>
</plist>
```

## Build Artifacts

- **Android APKs**: Available as GitHub Actions artifacts for 30 days
- **iOS IPAs**: Uploaded to TestFlight automatically (or available as artifacts)

## Manual APK Installation

1. Download APK from GitHub Actions artifacts
2. On Android device, enable "Install from unknown sources"
3. Transfer APK to device and install

## Troubleshooting

### Android Build Fails

- Check keystore secret is correctly base64 encoded
- Verify all passwords are correct
- Check build.gradle for SDK version compatibility

### iOS Build Fails

- Verify certificate hasn't expired
- Check provisioning profile matches bundle ID
- Ensure App Store Connect API key has correct permissions
