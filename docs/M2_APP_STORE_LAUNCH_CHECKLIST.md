# Milestone 2 (Mobile Apps) — App Store Launch Checklist

**Project:** Imidus POS Integration (IMIDUSAPP)
**Platforms:** iOS (App Store) + Android (Google Play)
**Timeline:** Launch-ready with credential setup
**Document Version:** 1.0 | March 23, 2026

---

## ✅ PRE-SUBMISSION CHECKLIST (Internal)

### Code Quality & Testing
- [ ] **All unit tests passing** (`npm test -- --coverage`)
- [ ] **Coverage ≥80%** (run: `npm test -- --coverage --passWithNoTests`)
- [ ] **No console.log() statements** in production code
- [ ] **No hardcoded credentials** (check: `grep -r "sk-" src/`)
- [ ] **No XSS vulnerabilities** (WebView sanitization verified)
- [ ] **All TypeScript strict mode** (`tsc --strict`)
- [ ] **Lint passing** (`npm run lint` or `eslint .`)
- [ ] **No deprecated APIs** in navigation & components

### Environment Configuration
- [ ] **API endpoint configured** (check `src/config/environment.ts`)
- [ ] **.env.production set** (not checked into git)
- [ ] **Firebase credentials configured** (check `google-services.json` & `GoogleService-Info.plist`)
- [ ] **Authorize.Net API ID correct** (not hardcoded, from config)
- [ ] **Build environment variables set** in CI/CD pipeline

### Security Checklist
- [ ] **No API keys in app code** (use environment injection)
- [ ] **HTTPS only** for all API calls
- [ ] **Certificate pinning reviewed** (if applicable)
- [ ] **Card data never logged** (check Payment module)
- [ ] **Tokens stored securely** (AsyncStorage on device, encrypted)
- [ ] **Firebase Security Rules reviewed** (cloud functions)
- [ ] **Privacy Policy accessible** (URL in app + store listing)
- [ ] **Terms of Service accessible** (URL in app + store listing)

### Performance & Analytics
- [ ] **App launch time <3 seconds** (measured on device)
- [ ] **Menu load time <2 seconds** (with skeleton loading)
- [ ] **Payment processing <5 seconds** (with feedback)
- [ ] **Memory usage <100MB** (check with device profiler)
- [ ] **Battery impact reasonable** (< 2% per hour on background polling)
- [ ] **Network traffic optimized** (bundle sizes checked)

### Branding & Design
- [ ] **Logo assets all sizes present** (512×512, 1024×1024, etc.)
- [ ] **Splash screen displays correctly** (all devices tested)
- [ ] **App icon rounded corners proper** (check both iOS & Android)
- [ ] **Launch screen UX verified** (brand colors, animation)
- [ ] **Fonts rendering correctly** (Georgia for wordmark, system fonts)
- [ ] **Colors match design system** (Imperial Onyx palette)
- [ ] **Accessibility tested** (text contrast, touch targets >44pt)

### Device Testing
- [ ] **iOS:** iPhone 12 mini (5.4"), iPhone 13 (6.1"), iPhone 14 Pro Max (6.7")
- [ ] **Android:** Pixel 6 (6.0"), Samsung S23 (6.1"), OnePlus 11 (6.7")
- [ ] **iOS:** iPad Pro 12.9" (tablet layout)
- [ ] **Android:** Galaxy Tab S8 (tablet layout)
- [ ] **Connectivity:** WiFi + cellular data + poor signal tested
- [ ] **Battery:** Low power mode tested
- [ ] **Dark mode:** UI looks correct in dark mode
- [ ] **Rotation:** App handles orientation changes
- [ ] **Landscape:** All screens work in landscape

### Functional Testing (Full Happy Path)
- [ ] **Login** → Splash → LoginScreen → MenuScreen (verify token stored)
- [ ] **Browse Menu** → MenuScreen → ItemDetailScreen (verify prices load)
- [ ] **Add to Cart** → ItemDetailSheet → CartScreen (verify item added)
- [ ] **Checkout** → CartScreen → CheckoutScreen (verify total calculated)
- [ ] **Loyalty** → Apply points slider → verify discount applied
- [ ] **Payment** → Enter card → Authorize.Net tokenization → Success
- [ ] **Confirmation** → OrderConfirmationScreen → OrderHistoryScreen (verify order appears)
- [ ] **Tracking** → OrderTrackingScreen → polling updates → Status changes
- [ ] **Order History** → Expandable orders → Reorder → Cart updated
- [ ] **Profile** → ProfileScreen → Loyalty card shows points, settings menu works
- [ ] **Logout** → ProfileScreen → Logout → LoginScreen (state cleared)
- [ ] **Guest Checkout** → Browse → Add items → Checkout (without login)
- [ ] **Push Notifications** → Transactional & marketing notifications received

### Error Handling Testing
- [ ] **Network offline** → Graceful error message + retry button
- [ ] **API timeout** → Timeout error with fallback UI
- [ ] **Payment declined** → User-friendly message + retry option
- [ ] **Invalid card** → Card validation error before submission
- [ ] **Expired token** → Auto-refresh + transparent retry
- [ ] **Firebase connection loss** → Graceful degradation (notifications optional)

### Regulatory Compliance
- [ ] **Privacy Policy** in-app accessible (Settings > Privacy)
- [ ] **Terms of Service** in-app accessible (Settings > Terms)
- [ ] **GDPR compliance** (data deletion, export options — if applicable)
- [ ] **PCI DSS compliance** (card data tokenization, no storage)
- [ ] **Apple Data & Privacy** section completed (app store)
- [ ] **Google Data Safety** section completed (play store)
- [ ] **COPPA compliance** if under 13 features present (unlikely)

---

## 🍎 **iOS APP STORE SUBMISSION CHECKLIST**

### Developer Account Setup
- [ ] **Apple Developer Account** active + in good standing
- [ ] **Team membership** confirmed (Sung Bin Im or designated admin)
- [ ] **Developer certificate** created & installed locally
- [ ] **Provisioning profile** downloaded (Distribution - App Store)
- [ ] **Bundle ID** registered (e.g., `com.imidus.customer`)
- [ ] **App name** reserved in App Store Connect

### App Store Connect Setup
- [ ] **App created** in App Store Connect
- [ ] **Bundle ID linked** to certificate & provisioning profile
- [ ] **SKU assigned** (unique identifier, e.g., `IMIDUS001`)
- [ ] **Primary category** selected (Food & Drink, or Lifestyle)
- [ ] **Content rating** form completed (IARC or manual)

### Build & Code Signing
- [ ] **Xcode project settings reviewed:**
  - [ ] Team ID correct
  - [ ] Bundle ID matches App Store Connect
  - [ ] Signing certificate selected
  - [ ] Provisioning profile selected
  - [ ] Version number updated (e.g., 1.0.0)
  - [ ] Build number incremented (e.g., 1)
- [ ] **Archive created:** `xcodebuild -scheme ImidusCustomerApp -configuration Release archive`
- [ ] **Archive exported** with "App Store" distribution option
- [ ] **IPA file** generated and validated

### App Store Listing
- [ ] **App Name:** "IMIDUSAPP" or "Imidus" (check brand guidelines)
- [ ] **Subtitle:** "Order · Track · Earn" (required for iOS 16+)
- [ ] **Description:**
  ```
  Seamless ordering from your favorite restaurant. Browse the menu,
  place orders, and track them in real-time. Earn and redeem loyalty
  points on every purchase.

  Features:
  - Browse menu with real-time availability
  - Quick & easy checkout
  - Secure payment via Authorize.Net
  - Real-time order tracking
  - Loyalty rewards program
  - Push notifications for order updates
  ```
- [ ] **Promotional Text:** "Order now, earn points!" (optional, for featured placement)
- [ ] **Keywords:** "restaurant, ordering, loyalty, delivery, food" (5 max)
- [ ] **Support URL:** support@imidus.com or support page
- [ ] **Privacy Policy URL:** Full privacy policy document

### App Icons & Screenshots
- [ ] **App Icon (1024×1024)** — PNG, no transparency, no glossy/raised effects
  - [ ] Named correctly: `AppIcon.png`
  - [ ] Margins: Safe area >= 0 (full bleed to edges)
  - [ ] Color space: sRGB
- [ ] **Screenshots (6-10 per language):**
  - [ ] iPhone 6.7" (Pro Max): 1284×2778 px, JPEG/PNG
  - [ ] iPhone 5.5" (mini): 1125×2436 px, JPEG/PNG
  - [ ] iPad 12.9" (if supporting): 2048×2732 px
  - [ ] **Content:** Show app's key features (menu, checkout, tracking, loyalty)
  - [ ] **Text:** Include captions explaining each screen (optional)
  - [ ] **Branding:** Logo visible, Imperial Onyx colors prominent
- [ ] **Preview (optional for iOS 16+):**
  - [ ] 1-30 second video demo of app flow (MP4, <500MB)

### Ratings & Content
- [ ] **Content Rating Questionnaire completed:**
  - [ ] Frequency of use of alcohol, tobacco, drugs? → Unlikely (food app)
  - [ ] Gambling? → No
  - [ ] Profanity? → No
  - [ ] Scary/horror? → No
  - [ ] Medical info? → No
  - [ ] Frequent/intense violence? → No
  - [ ] Sexual content? → No
  - [ ] Mature themes? → Possibly (Alcohol present in menu)
- [ ] **Age rating assigned** (typically 4+ for food/ordering apps)
- [ ] **Requires parental consent?** → No (unless targeting minors)

### Configuration
- [ ] **Requires subscription?** → No
- [ ] **Uses in-app purchases?** → No
- [ ] **Uses Sign in with Apple?** → Recommended (if using 3rd party auth)
- [ ] **Apple Watch app?** → No (not in scope)
- [ ] **Mac app?** → No (not in scope)
- [ ] **Game Center?** → No

### Testing Notes
- [ ] **QA Testing URL provided** (if reviewing early)
- [ ] **Demo account credentials** (if needed for testing):
  - [ ] Test phone: (blank for app store review — they'll test)
  - [ ] Test card: Provide Authorize.Net test cards (App Store reviewer will use)
- [ ] **Notes for Reviewer:**
  ```
  Our app integrates with a legacy POS system via real-time data sync.
  Test flow: Login (test phone) → Browse Menu → Add Items → Checkout
  (use Authorize.Net test card 4111111111111111) → Confirm Order

  Note: Order confirmation may take 10-30 seconds due to POS integration.
  Guest checkout available without login.
  ```

### Submission Process
- [ ] **App Status:** Ready for Upload → Waiting for Upload → Upload Complete
- [ ] **Build uploaded** to App Store Connect via Xcode or Transporter
- [ ] **Build processing** (takes 5-15 minutes)
- [ ] **Build status:** Processing → Ready to Submit
- [ ] **Submit for Review** clicked
- [ ] **Review status checked daily** (2-3 days typical, can be up to 7)
- [ ] **Check email** for rejection reasons (if rejected)

### Post-Submission
- [ ] **Monitoring app analytics** (crashes, usage patterns)
- [ ] **Prepare release notes** for public release:
  ```
  Version 1.0.0 - Initial Launch

  - Browse restaurant menu with real-time availability
  - Quick & easy checkout with Authorize.Net payment
  - Track orders in real-time with push notifications
  - Earn loyalty points on every purchase
  - View order history and reorder favorites
  - Manage account and loyalty preferences
  ```
- [ ] **Release to App Store** once approved
- [ ] **Monitor crash reports** + user feedback (first week critical)

---

## 🤖 **ANDROID GOOGLE PLAY SUBMISSION CHECKLIST**

### Developer Account Setup
- [ ] **Google Play Developer Account** active
- [ ] **$25 registration fee** paid
- [ ] **Account verification** completed (identity + payment method)
- [ ] **Developer profile** set up (company name: Imidus Technologies Inc.)
- [ ] **Contact info** on profile

### Google Play Console Setup
- [ ] **App created** in Google Play Console
- [ ] **Package name** registered (e.g., `com.imidus.customer`)
- [ ] **App title** set (must match iOS for consistency)
- [ ] **Default language** set (English)
- [ ] **App category** selected (Lifestyle or Food & Drink)

### Signing & Build
- [ ] **Keystore file created** (Android signing certificate):
  ```bash
  keytool -genkey -v -keystore imidus-release.jks \
    -keyalg RSA -keysize 2048 -validity 10950 \
    -alias imidus-key
  ```
- [ ] **Keystore password** stored securely (NOT in git)
- [ ] **Key alias & password** documented (needed for future builds)
- [ ] **Release APK built:**
  ```bash
  cd android
  ./gradlew assembleRelease
  # Output: app/release/app-release.apk
  ```
- [ ] **APK signed** with keystore (Android Studio or `jarsigner`)
- [ ] **APK optimized** (size checked <100MB):
  ```bash
  ls -lh app/release/app-release.apk
  # Should be ~60-70MB based on previous build
  ```
- [ ] **APK tested locally:**
  ```bash
  adb install app/release/app-release.apk
  # Run through happy path on real device or emulator
  ```

### App Store Listing (Google Play)
- [ ] **App name:** "IMIDUSAPP" (match iOS)
- [ ] **Short description** (80 chars max):
  ```
  Order from your favorite restaurant with real-time tracking
  ```
- [ ] **Full description** (4000 chars max):
  ```
  Welcome to IMIDUSAPP — the seamless way to order from your favorite restaurant!

  FEATURES:
  • Browse our menu with real-time item availability
  • Customize your order (sizes, flavors, special requests)
  • Secure checkout with Authorize.Net payment
  • Track your order in real-time
  • Earn loyalty points on every purchase
  • Redeem points for discounts
  • View complete order history
  • Receive push notifications for order updates

  LOYALTY REWARDS:
  Earn 1 point for every $10 you spend. Redeem 100 points for $1 off.
  Birthday specials and exclusive offers for members!

  SEAMLESS INTEGRATION:
  Your orders appear instantly in the restaurant's POS system,
  ensuring quick preparation and accurate fulfillment.

  SECURE PAYMENT:
  We use Authorize.Net for secure payment processing.
  Your payment information is never stored on our servers.
  ```
- [ ] **Category:** Lifestyle or Food & Drink
- [ ] **Contact email:** support@imidus.com
- [ ] **Website URL:** (optional, use if available)
- [ ] **Privacy Policy URL:** Full privacy policy
- [ ] **Content rating questionnaire** (similar to iOS):
  - [ ] Violence? → No
  - [ ] Sexual content? → No
  - [ ] Alcohol/tobacco? → Possibly (menu may include alcohol)
  - [ ] Gambling? → No

### App Icons & Screenshots
- [ ] **App Icon (512×512)** — PNG, no transparency, rounded corners handled by Play Store
  - [ ] File named: `ic_launcher.png`
  - [ ] All standard densities:
    - [ ] mdpi: 48×48
    - [ ] hdpi: 72×72
    - [ ] xhdpi: 96×96
    - [ ] xxhdpi: 144×144
    - [ ] xxxhdpi: 192×192
- [ ] **Feature Graphic (1024×500)** — PNG/JPEG
  - [ ] Brand colors prominent
  - [ ] Clear messaging ("Order · Track · Earn")
  - [ ] Logo visible
- [ ] **Screenshots (5-8 per language):**
  - [ ] Phone (1080×1920): 9:16 aspect ratio
  - [ ] Tablet (1200×1920): if supporting tablets
  - [ ] **Content:** Key features (menu, checkout, tracking, loyalty)
  - [ ] **Localization:** Same screens as iOS for consistency
- [ ] **YouTube trailer (optional):** 30-60s demo video

### Testing & Quality
- [ ] **Google Play Console Testing Track** (internal testing):
  - [ ] Testers invited (internal team)
  - [ ] APK uploaded to internal testing
  - [ ] Tested on ≥3 device configurations
  - [ ] Crash logs monitored (should be zero)
  - [ ] Performance verified (startup, memory, battery)
- [ ] **Open testing track** (optional, for beta):
  - [ ] Limited external testers (500-5000)
  - [ ] Feedback collected before full release

### Permissions Review
- [ ] **AndroidManifest.xml permissions justified:**
  - [ ] `android.permission.INTERNET` → API calls ✓
  - [ ] `android.permission.CAMERA` → Check if needed (card scan?)
  - [ ] `android.permission.ACCESS_FINE_LOCATION` → Check if needed (pickup location)
  - [ ] `android.permission.RECORD_AUDIO` → Check if needed
  - [ ] `com.google.android.c2dm.permission.RECEIVE` → Firebase FCM ✓
  - [ ] Others? → Remove unused permissions
- [ ] **Target API level** >= 31 (Google Play requirement)
- [ ] **Minimum API level** documented (likely 21 for broad compatibility)

### Content Ratings
- [ ] **Google Play Console Content Rating Questionnaire:**
  - [ ] Detailed questions about app content
  - [ ] Food/drink apps typically get PEGI 3 / ESRB Everyone
  - [ ] Alcohol references? → Rate accordingly (PEGI 12 if present)
- [ ] **Google Play rating** assigned (Everyone, Everyone 10+, etc.)

### Pricing & Distribution
- [ ] **Pricing:** Free (no in-app purchases)
- [ ] **Countries:** Select all where applicable (US, Canada, etc.)
- [ ] **Device categories:**
  - [ ] Phones ✓
  - [ ] Tablets ✓ (if UI supports landscape)
- [ ] **Release type:**
  - [ ] Staged rollout (recommended): 5% → 25% → 50% → 100%
  - [ ] OR Full release immediately (if confident)

### Submission Process
- [ ] **APK uploaded** to Google Play Console
- [ ] **App review checklist** completed
- [ ] **Compliance verified:**
  - [ ] No malware
  - [ ] Permissions justified
  - [ ] Content policy compliant
  - [ ] Ads policy compliant (if applicable)
- [ ] **Submit for review** clicked
- [ ] **Review status monitored** (1-3 hours typical, up to 48 hours)
- [ ] **Check email** for rejection reasons (if rejected)

### Post-Submission
- [ ] **Monitor Play Console for crashes** (first week critical)
- [ ] **Staged rollout progress:**
  - [ ] 5% for 24 hours (monitor crashes)
  - [ ] 25% for 24 hours (monitor crashes)
  - [ ] 50% for 24 hours (monitor crashes)
  - [ ] 100% rollout once stable
- [ ] **Create release notes:**
  ```
  Version 1.0.0 (Initial Release)

  • Browse restaurant menu with live availability
  • Secure online ordering with Authorize.Net
  • Real-time order status tracking
  • Loyalty rewards program
  • Push notifications for order updates
  ```
- [ ] **Monitor user reviews** + ratings (respond to feedback)
- [ ] **Track key metrics:**
  - [ ] Daily active users (DAU)
  - [ ] Crash-free sessions (target >99%)
  - [ ] Uninstall rate
  - [ ] Rating trend

---

## 🚨 **CRITICAL DEADLINES**

| Task | Timeline | Owner | Notes |
|------|----------|-------|-------|
| **Test coverage ≥80%** | By Mar 26 | Dev Team | Blocks submission |
| **Build artifacts ready** | By Mar 28 | Build Team | IPA + APK signed |
| **iOS App Store upload** | By Mar 29 | iOS Lead | Allow 2-3 days review |
| **Android Play upload** | By Mar 29 | Android Lead | Allow 24-48h review |
| **Monitor app reviews** | Daily | QA | Respond to issues |
| **Production deployment** | Apr 2 | DevOps | Once reviews clear |

---

## 🎯 **SUCCESS CRITERIA**

### Pre-Launch
- [ ] ✅ All tests passing (≥80% coverage)
- [ ] ✅ Builds signed & verified
- [ ] ✅ Both app stores accept uploads
- [ ] ✅ No critical bugs found during testing

### Launch Day
- [ ] ✅ Apps appear in stores within 24h
- [ ] ✅ Download/install process smooth
- [ ] ✅ First-time user flow works end-to-end
- [ ] ✅ Crash-free for first 100 installations

### Week 1
- [ ] ✅ 50+ downloads
- [ ] ✅ Crash-free sessions >99%
- [ ] ✅ Average rating ≥4.0 stars
- [ ] ✅ User feedback positive
- [ ] ✅ No critical bugs reported

---

## 📱 **DEVICE TESTING MATRIX**

| Platform | Device | OS Version | Resolution | Status |
|----------|--------|-----------|-----------|--------|
| **iOS** | iPhone 12 mini | iOS 16 | 1125×2436 | ⚠️ TODO |
| | iPhone 13 | iOS 17 | 1170×2532 | ⚠️ TODO |
| | iPhone 14 Pro Max | iOS 17 | 1290×2796 | ⚠️ TODO |
| | iPad Pro 12.9" | iPadOS 17 | 2048×2732 | ⚠️ TODO |
| **Android** | Pixel 6 | Android 13 | 1080×2400 | ⚠️ TODO |
| | Samsung S23 | Android 13 | 1440×3120 | ⚠️ TODO |
| | OnePlus 11 | Android 13 | 1440×3216 | ⚠️ TODO |
| | Galaxy Tab S8 | Android 12 | 2560×1600 | ⚠️ TODO |

---

## 📝 **NOTES FOR REVIEWERS**

### For Apple Review
```
This is a customer-facing ordering application for restaurants.
The app integrates with a legacy POS (Point of Sale) system via
secure backend APIs.

Test Account: Available upon request
Test Payment: Use Authorize.Net test cards provided in notes
Expected Flow: Login → Browse Menu → Add Items → Checkout →
               Confirm Order (10-30s POS sync) → Success

Important: Our app does not store payment card data. All sensitive
card information is tokenized via Authorize.Net Accept.js and
never touches our servers.

The app uses Firebase Cloud Messaging for transactional and
marketing push notifications, which requires user permission.
```

### For Google Review
```
Same as Apple, with addition:

Target API Level: 33+
Minimum API Level: 21
Permissions: Standard internet + Firebase messaging

This version 1.0 represents the initial launch. We plan ongoing
updates for features like geofencing, advanced recommendations,
and multi-location support in future releases.
```

---

## 🔐 **CREDENTIAL MANAGEMENT**

### Never Share / Keep Secure
- ❌ Keystore file (Android signing certificate)
- ❌ Provisioning profiles (iOS)
- ❌ Apple ID password
- ❌ Google Play account password
- ❌ Authorize.Net API credentials
- ❌ Firebase service account JSON
- ❌ Analytics API keys

### Store In
- ✅ LastPass / 1Password (team vault)
- ✅ GitHub Secrets (for CI/CD only)
- ✅ AWS Secrets Manager (for production)
- ✅ Local .env files (never committed)

### Rotation Schedule
- [ ] Android keystore password: Annually
- [ ] iOS provisioning profiles: Every 12 months
- [ ] API keys: Every 90 days
- [ ] Firebase credentials: Annually or on team changes

---

**Document Status:** READY FOR EXECUTION
**Last Updated:** March 23, 2026
**Next Review:** Upon app store approval
