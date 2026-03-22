# IMIDUS Mobile App Installation Guide

## Overview

This guide covers installation of the IMIDUS Customer mobile application on Android and iOS devices.

---

## Android Installation

### APK Location
```
mobile/android/ImidusCustomerApp-release.apk
```

### Method 1: ADB Installation (Recommended for Developers)

**Prerequisites:**
- Android Debug Bridge (ADB) installed
- USB debugging enabled on device

```bash
# 1. Connect device via USB
# 2. Verify connection
adb devices

# 3. Install APK
adb install -r ImidusCustomerApp-release.apk

# 4. Launch app
adb shell am start -n com.imidus.customer/.MainActivity
```

### Method 2: Direct Device Installation

1. **Enable Unknown Sources:**
   - Go to Settings > Security
   - Enable "Unknown sources" or "Install unknown apps"
   - (On Android 8+: Settings > Apps > Special access > Install unknown apps)

2. **Transfer APK:**
   - Connect device to computer via USB
   - Copy `ImidusCustomerApp-release.apk` to device storage
   - Or email/message the APK to yourself

3. **Install:**
   - Open file manager on device
   - Navigate to the APK file
   - Tap to install
   - Accept any permission prompts

### Method 3: Android Emulator

```bash
# Start emulator
emulator -avd Pixel_6_API_33 &

# Wait for boot, then install
adb install -r ImidusCustomerApp-release.apk
```

---

## iOS Installation

### Option A: TestFlight Distribution (Recommended)

1. **Request Access:**
   - Contact: novatech2210@gmail.com
   - Provide your Apple ID email

2. **Install TestFlight:**
   - Download TestFlight from the App Store

3. **Accept Invitation:**
   - Check email for TestFlight invitation
   - Tap "Start Testing"
   - Install IMIDUSAPP from TestFlight

### Option B: Ad-Hoc IPA Installation

**Prerequisites:**
- Device UDID registered in provisioning profile
- Apple Configurator 2 or Xcode installed

**Steps:**
1. Connect iOS device to Mac
2. Open Apple Configurator 2
3. Select device
4. Add > Apps > Select IPA file
5. Wait for installation to complete

### Option C: Development Build (Xcode)

**Requirements:**
- macOS with Xcode 15+
- Apple Developer account
- iOS device registered in developer portal

```bash
# Navigate to iOS project
cd mobile/ios

# Install dependencies
pod install

# Open in Xcode
open ImidusCustomerApp.xcworkspace

# Select your device and run
```

---

## Configuration

### API Endpoint Configuration

The app connects to the backend API. Configure the endpoint based on your environment:

| Environment | API URL |
|-------------|---------|
| Local (USB) | `http://localhost:5004` |
| Local (WiFi) | `http://<your-machine-ip>:5004` |
| Production | `https://api.yourdomain.com` |

**To find your local IP:**
```bash
# macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig | findstr "IPv4"
```

---

## First Launch Verification

After installation, verify these screens work:

1. **Splash Screen** - IMIDUS logo displays (2 seconds)
2. **Login Screen** - Brand colors (blue/gold) appear correctly
3. **Registration** - Can create new account
4. **Menu** - Categories and items load from backend
5. **Cart** - Can add items and see totals
6. **Checkout** - Payment form appears
7. **Profile** - Loyalty points display

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| App crashes on launch | Check logcat: `adb logcat \| grep -i imidus` |
| "Network error" | Verify backend is running at expected URL |
| Menu doesn't load | Check API endpoint configuration |
| Payment fails | Verify Authorize.net sandbox credentials |
| Push notifications not working | Ensure FCM token is registered |

### Debug Logs

**Android:**
```bash
adb logcat -s ImidusApp,ReactNativeJS
```

**iOS:**
- Open Console.app on Mac
- Select connected device
- Filter by "ImidusApp"

---

## Test Credentials

| Account Type | Email | Password |
|--------------|-------|----------|
| Test Customer | test@imidus.com | Test123! |
| Admin | admin@imidus.com | Admin123! |

---

## Support

For installation issues:
- Email: novatech2210@gmail.com
- Include: Device model, OS version, error message/screenshot

---

## Build Information

| Property | Value |
|----------|-------|
| Version | 1.0.0 |
| Build | Release |
| Min Android | API 26 (Android 8.0) |
| Min iOS | 13.0 |
| Package (Android) | com.imidus.customer |
| Bundle ID (iOS) | com.imidus.customer |
