---
name: milestone-2-mobile
description: Quality gate for Milestone 2 (Customer Mobile Apps - iOS & Android). Ensures production-ready delivery with Auth.net tokenization, loyalty sync, FCM push, and POS integration. Bare workflow preferred for native payment bridges.
color: green
icon: phone
---

# Milestone 2: Customer Mobile Apps (iOS/Android)

**Goal**: Deliver secure, performant React Native apps for order placement, loyalty viewing, and notifications. Must integrate with INI POS DB via backend APIs.

## Production-Ready Checklists

### 1. UI/UX Consistency
- [ ] Gold + Blue Imidus branding palette applied consistently
- [ ] No hardcoded strings — use i18n/localization files (react-i18next or expo-localization)
- [ ] Splash screens, app icons, adaptive icons verified for all densities/resolutions
- [ ] Branded empty states (no orders, no points, offline, etc.) with helpful CTAs

### 2. Core Functional Requirements
- [ ] **Menu Browsing**: Real-time fetch from `tblItem` + `tblAvailableSize` via backend API
- [ ] **Cart Persistence**: Survives app restarts (AsyncStorage / MMKV / Redux Persist)
- [ ] **Payments (Authorize.net)**: Tokenization-only flow — **never** send raw card data to backend
  - Use community bridge: `react-native-authorize-net-accept` or `react-native-expo-authorize-net` (Expo-compatible)
  - Fallback: WebView loading Accept.js (https://js.authorize.net/v1/Accept.js or sandbox equivalent)
  - On success: Receive nonce → POST to backend → Await `PaymentResult.Success=true` before proceeding
- [ ] **Loyalty**: Display live `EarnedPoints` from `tblCustomer` via API
- [ ] **Push Notifications**: FCM token registered on first launch / login (via `@react-native-firebase/messaging`)
  - Request permissions (iOS critical)
  - Handle foreground/background/quit states

### 3. Resilience & Performance
- [ ] **Offline Handling**: Graceful UI (cached menu? error screens) when no network
- [ ] **API Timeouts & Retries**: 30s timeout + exponential backoff on POS-touching calls
- [ ] **Image Loading**: Progressive/cached for menu images (FastImage or expo-image)
- [ ] **Session Security**: JWT with refresh token logic; secure storage (expo-secure-store / react-native-keychain)
- [ ] **Crash & Error Reporting**: Integrated (Sentry / Firebase Crashlytics)
- [ ] **App State Management**: Clean navigation on notification tap (deep linking support)

### 4. Build & Deployment Readiness
- [ ] **Workflow**: Bare React Native CLI preferred (for native module flexibility); Expo EAS OK with custom dev client if needed
- [ ] **Versioning**: Semantic version bump + changelog
- [ ] **Beta Testing**: Internal TestFlight (iOS) + Google Play internal track (Android)
- [ ] **Signing**: Production certificates/profiles used

## Technical Proof Points

### Auth.net Mobile Tokenization
- App collects card details client-side → Gets nonce/opaque token  
- POST nonce to backend `/orders` endpoint  
- Backend charges via .NET SDK → Returns `PaymentResult`  
- **Gate**: Only create `tblSales` (TransType=2) after `Success=true`  
> [!IMPORTANT]  
> PCI SAQ-A eligibility: No raw PANs ever touch your backend or logs.

### FCM Push Payload (Backend → Device)
```json
{
  "message": {
    "token": "DEVICE_TOKEN",
    "notification": {
      "title": "Order Ready for Pickup",
      "body": "Your order #123 is ready!"
    },
    "data": {
      "orderId": "123",
      "type": "ORDER_STATUS",
      "click_action": "OPEN_ORDER_DETAIL"  // Optional for deep link
    },
    "android": { "priority": "high" },
    "apns": { "headers": { "apns-priority": "10" } }
  }
}
E2E Manual Test Scenarios


#ScenarioExpected Result1First app launch & loginJWT stored securely; FCM token registered to IntegrationService.DeviceTokens2Place order with test Visa cardNonce generated → Backend charges → tblSales (TransType=2) + tblPayment created3Loyalty refresh after orderPoints match aggregated tblPointsDetail / tblCustomer.EarnedPoints4Receive order status pushNotification appears → Tap opens correct Order Detail screen5Offline modeCached menu loads; clear error UI on cart/payment attempts6App restart with cartCart items preserved; no duplicate orders
Delivery Artifacts

iOS: .ipa (signed with Production Distribution Profile + App Store Connect upload ready)
Android: .aab (App Bundle — preferred for Play Store) or universal .apk
Source Code: Clean commit in src/mobile/ImidusCustomerApp with:
.env.example (no secrets)
README.md with build instructions
Dependency lockfile (yarn.lock / package-lock.json)


Milestone Sign-Off Gate: All checkboxes green + successful E2E runs on physical devices (iOS 17+, Android 12+). Proceed to Milestone 3 only after client verifies payments and notifications in sandbox.
Last Updated: March 17, 2026 – Updated Auth.net to community bridge/WebView, preferred .aab, added resilience items.
