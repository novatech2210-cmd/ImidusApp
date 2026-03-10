# iOS TestFlight - Quick Start (Step-by-Step)

**Total Time: 2-3 hours**

---

## STEP 1: Prepare Your Information (5 min)

Before starting, gather:

- [ ] Your Apple ID email: `novatech2210@gmail.com`
- [ ] Your Apple ID password: ••••••••••••••
- [ ] Privacy Policy URL (HTTPS): `https://inirestaurant.com/privacy`
- [ ] Test device UDIDs (if you have iPhones to test on)
- [ ] Contact email for testers

---

## STEP 2: Create App Store Connect Account (Already have it)

**Status:** ✅ Your account exists

Just log in:

1. Go to https://appstoreconnect.apple.com
2. Click "Sign In"
3. Enter: `novatech2210@gmail.com`
4. Enter your password
5. Click "Next"
6. You're in!

---

## STEP 3: Create Your App (10 min)

**In App Store Connect:**

1. Click **"Apps"** (top menu)
2. Click **"+"** button (New App)
3. Select **"iOS"**
4. Fill in these fields:

   | Field            | Value                    |
   | ---------------- | ------------------------ |
   | Platform         | iOS                      |
   | Name             | `Imidus Customer App`    |
   | Primary Language | English                  |
   | Bundle ID        | `com.imidus.customerapp` |
   | SKU              | `IMIDUS-CUSTOMER-001`    |
   | User Access      | Select "Yes"             |

5. Click **"Create"**

**Result:** App record created in App Store Connect

---

## STEP 4: Add Privacy Policy (3 min)

**In App Store Connect:**

1. Your app is now showing
2. Click **"App Information"** (left menu)
3. Scroll down to **"Privacy Policy"**
4. Paste URL: `https://inirestaurant.com/privacy`
5. Click **"Save"** (top right)

**Result:** Privacy policy configured

---

## STEP 5: Generate Signing Certificate (15 min)

**On Your Mac:**

1. Open **Keychain Access** (Applications → Utilities → Keychain Access)
2. Menu: **Keychain Access** → **Certificate Assistant** → **Request a Certificate from a Certificate Authority**
3. Fill in:
   - Email: `novatech2210@gmail.com`
   - Common Name: `Chris` (your name)
   - Request is: **"Saved to disk"**
4. Click **"Continue"**
5. Save as: `CertificateSigningRequest.certSigningRequest`
6. Click **"Save"**

**Result:** `.certSigningRequest` file created on your Mac

**Back in App Store Connect:**

1. Go to **"Certificates, Identifiers & Profiles"** (left menu)
2. Click **"Certificates"**
3. Click **"+"** button (Create new)
4. Select **"Apple Distribution"**
5. Click **"Continue"**
6. Click **"Choose File"**
7. Select your `CertificateSigningRequest.certSigningRequest` file
8. Click **"Continue"**
9. Click **"Download"** (saves as `.cer` file)

**Back on Your Mac:**

1. Find the downloaded `.cer` file
2. Double-click it
3. Keychain Access opens and installs it
4. ✅ Certificate now in Keychain

**Result:** Apple Distribution certificate installed

---

## STEP 6: Register Test Devices (10 min per device)

**If you have iPhones to test on:**

**Get Device UDID:**

For each iPhone:

1. Connect to a Mac
2. Open **Xcode**
3. Menu: **Window** → **Devices and Simulators**
4. Select the iPhone
5. Copy the long "Identifier" code (40 characters)

**Register in App Store Connect:**

1. Go to **"Certificates, Identifiers & Profiles"**
2. Click **"Devices"**
3. Click **"+"** button
4. Fill in:
   - Platform: **iOS**
   - Device Name: `Test iPhone - John`
   - Device ID (UDID): Paste the UDID
5. Click **"Continue"**
6. Click **"Register"**

**Repeat for each test device**

**Result:** Test devices registered

---

## STEP 7: Create Provisioning Profile (10 min)

**In App Store Connect:**

1. Go to **"Certificates, Identifiers & Profiles"**
2. Click **"Provisioning Profiles"**
3. Click **"+"** button
4. Select **"App Store Connect"**
5. Click **"Continue"**
6. Select Bundle ID: `com.imidus.customerapp`
7. Click **"Continue"**
8. Select Certificate: (the one you created in Step 5)
9. Click **"Continue"**
10. Select Devices: (check all your test devices, or skip if none yet)
11. Click **"Continue"**
12. Profile Name: `Imidus Customer App Distribution`
13. Click **"Continue"**
14. Click **"Download"**

**On Your Mac:**

1. Find downloaded file (ends in `.mobileprovision`)
2. Double-click it
3. Xcode opens and installs it
4. ✅ Provisioning profile installed

**Result:** Provisioning profile installed in Xcode

---

## STEP 8: Configure Xcode Project (10 min)

**On Your Mac:**

1. Open Finder
2. Navigate to: `Desktop/TOAST/src/mobile/ImidusCustomerApp/ios`
3. Double-click: `ImidusCustomerApp.xcworkspace` (NOT .xcodeproj)
4. Xcode opens
5. Left sidebar → Click **ImidusCustomerApp** (project)
6. Select **ImidusCustomerApp** target
7. Click **"Signing & Capabilities"** tab

**Fill in:**

- Team: Select your team from dropdown (auto-populates)
- Bundle Identifier: Verify it's `com.imidus.customerapp`
- Provisioning Profile: **Automatic**
- Code Sign Identity: **Apple Distribution**

**Repeat for "ImidusCustomerAppTests" target**

**Result:** Xcode signing configured

---

## STEP 9: Create ExportOptions.plist (5 min)

**On Your Mac:**

1. In Xcode, go to Project → File → New
2. Select **"Empty"** file type
3. Name: `ExportOptions.plist`
4. Location: Same folder as `.xcworkspace` (the `ios` folder)
5. Create

**Paste this content:**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>app-store</string>
    <key>teamID</key>
    <string>REPLACE_WITH_TEAM_ID</string>
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

**Important:** Replace `REPLACE_WITH_TEAM_ID` with your 10-digit Apple Team ID

**Where to find your Team ID:**

1. App Store Connect → **Agreements, Tax & Banking** → **Team Information**
2. Copy the "Team ID" (10 characters)

**Result:** ExportOptions.plist created with correct Team ID

---

## STEP 10: Build the iOS App (30 min)

**On Your Mac, open Terminal:**

```bash
cd ~/Desktop/TOAST/src/mobile/ImidusCustomerApp

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
```

**Wait for "Build successful"** (5-10 minutes)

**Then export:**

```bash
xcodebuild -exportArchive \
  -archivePath $PWD/build/ImidusCustomerApp.xcarchive \
  -exportOptionsPlist ExportOptions.plist \
  -exportPath $PWD/build
```

**Wait for "Export successful"** (1-2 minutes)

**Result:** File created at `ios/build/ImidusCustomerApp.ipa`

---

## STEP 11: Upload IPA to TestFlight (10 min)

**Option A: Using Transporter App (Easiest)**

1. Download **Transporter** from Mac App Store
2. Open Transporter
3. Sign in with Apple ID: `novatech2210@gmail.com`
4. Drag the `.ipa` file from `ios/build/` into Transporter window
5. Click **"Deliver"**
6. Wait for "Successfully delivered" message (5-10 min)

**Option B: Using Command Line**

```bash
cd ~/Desktop/TOAST/src/mobile/ImidusCustomerApp/ios/build

xcrun altool --upload-app \
  -f ImidusCustomerApp.ipa \
  -t ios \
  -u novatech2210@gmail.com \
  -p your-app-specific-password
```

**Note:** Create app-specific password at https://appleid.apple.com → Security → App Passwords

**Result:** IPA uploaded to Apple

---

## STEP 12: Wait for Apple Processing (10-30 min)

**In App Store Connect:**

1. Go to **"TestFlight"** (left menu)
2. Click **"Builds"**
3. Watch your build status:
   - "Uploading" → "Processing" → "Ready for Testing"

**When it says "Ready for Testing" — you're done!**

---

## STEP 13: Invite Testers (5 min)

**In App Store Connect:**

1. Click **"TestFlight"**
2. Click **"External Testing"** (or "Internal Testing")
3. Click **"Create Group"**
4. Group Name: `Beta Testers`
5. Add tester email addresses (one per line)
6. Click **"Create"**
7. Select your build from the list
8. Click **"Add Build to Test"**
9. Accept the beta agreement
10. Click **"Notify Testers"**

**Result:** Testers receive email invitations

---

## STEP 14: Testers Install App (5 min)

**Each tester:**

1. Receives email with TestFlight link
2. Clicks link → Opens TestFlight app (or App Store)
3. Clicks **"Accept"** or **"Start Testing"**
4. App downloads and installs
5. Opens app and can test!

---

## STEP 15: Collect Feedback (Ongoing)

**In App Store Connect:**

1. Go to **"TestFlight"**
2. Click **"Feedback"**
3. View crash reports, logs, and user feedback
4. Note any bugs or issues

**To deploy a fix:**

1. Fix code in Xcode
2. Increment build number (Info.plist)
3. Repeat Steps 10-11 (build & upload)
4. Wait for Apple processing
5. Notify testers of new build

---

## ✅ Success Checklist

- [ ] App created in App Store Connect
- [ ] Privacy policy added
- [ ] Apple Distribution certificate created
- [ ] Provisioning profile created
- [ ] Test devices registered (optional, but recommended)
- [ ] Xcode project configured
- [ ] ExportOptions.plist created with correct Team ID
- [ ] IPA built successfully
- [ ] IPA uploaded to TestFlight
- [ ] Build processed → "Ready for Testing"
- [ ] Testers invited
- [ ] Testers received invitation email
- [ ] Testers installed and launched app
- [ ] Feedback collection system established

---

## 🆘 Troubleshooting

| Problem                               | Solution                                                                 |
| ------------------------------------- | ------------------------------------------------------------------------ |
| "Privacy Policy URL not valid"        | Verify URL is HTTPS (not HTTP). Test URL in browser.                     |
| "Certificate not trusted"             | Re-download `.cer` from App Store Connect, double-click to reinstall.    |
| "Bundle ID doesn't match"             | Verify Xcode project Bundle ID is exactly `com.imidus.customerapp`       |
| "ExportOptions.plist error"           | Check Team ID is correct (10 digits). Verify XML syntax is valid.        |
| "Build fails to archive"              | Check all CocoaPods installed: `pod install` in `ios/` folder.           |
| "IPA upload fails"                    | Try Transporter app instead of command line. Verify IPA file exists.     |
| "Build still processing after 1 hour" | Rare. Contact Apple Support. Usually indicates compliance review needed. |
| "Testers can't install app"           | Verify their device UDID is registered in Provisioning Profile.          |

---

## 📞 Support

**If you get stuck:**

Email: novatech2210@gmail.com  
Response time: 24 hours

Include:

- Screenshot of error message
- Step number where you got stuck
- Build log output (if applicable)

---

## 🎉 You're Done!

Once "Ready for Testing" appears in TestFlight and testers have installed the app, your iOS app is live for testing!

From here:

- Testers run test scenarios
- You collect feedback
- You fix bugs and deploy new builds
- Repeat until ready for production

---

_Total setup time: 2-3 hours_  
_Future build uploads: 30 minutes_
