# iOS TestFlight Setup Checklist

**Project:** Imidus Customer App  
**Client:** Imidus Technologies  
**Prepared:** March 6, 2026

---

## Pre-Setup Verification

**Before starting, verify you have:**

- [ ] Apple Developer Account (active & paid)
- [ ] Apple ID for app submission
- [ ] Bundle ID allocated: `com.imidus.customerapp`
- [ ] Privacy Policy URL ready (must be HTTPS)
- [ ] Contact email for testers
- [ ] Mac with Xcode 14+ (or CI/CD runner with build tools)
- [ ] Test device UDIDs collected from all testers

---

## Part 1: App Store Connect Setup (Est. 15 min)

**Checklist for Part 1a - Create App Record:**

- [ ] Logged into App Store Connect
- [ ] Created new app on iOS platform
- [ ] App name: `Imidus Customer App`
- [ ] Bundle ID: `com.imidus.customerapp` (exact match required)
- [ ] SKU entered: `IMIDUS-CUSTOMER-001`
- [ ] User Access option selected
- [ ] App record created successfully

**Checklist for Part 1b - Add Privacy Policy:**

- [ ] Privacy Policy URL entered (HTTPS required)
- [ ] URL tested in browser (loads without errors)
- [ ] Saved in App Store Connect

**Checklist for Part 1c - Add Test Information:**

- [ ] Beta App Name: `Imidus Customer (Beta)`
- [ ] Beta App Description: Filled in
- [ ] Test Notes: Filled in with test instructions
- [ ] Feedback Email: `novatech2210@gmail.com`
- [ ] Contact Email: Filled in
- [ ] "Significant Change" checkbox evaluated
- [ ] Saved

---

## Part 2: Certificates & Provisioning (Est. 30 min)

**Checklist for Part 2a - Create Signing Certificate:**

**On Local Machine:**
- [ ] Opened Keychain Access
- [ ] Requested Certificate from Certificate Authority
- [ ] Email: Your Apple ID email
- [ ] Common Name: Your name or company name
- [ ] Saved as `CertificateSigningRequest.certSigningRequest`
- [ ] `.certSigningRequest` file ready to upload

**In App Store Connect:**
- [ ] Navigated to Certificates section
- [ ] Created new "Apple Distribution" certificate
- [ ] Uploaded `.certSigningRequest` file
- [ ] Downloaded generated `.cer` file
- [ ] Double-clicked `.cer` file to install in Keychain
- [ ] Verified certificate appears in Keychain Access

**Checklist for Part 2b - Register Device UDIDs:**

- [ ] Collected UDID from each test device (40-char identifier)
- [ ] UDIDs stored in secure location
- [ ] For each UDID:
  - [ ] Registered in App Store Connect → Devices
  - [ ] Device Name: Descriptive (e.g., "Tester iPhone - John")
  - [ ] Device ID (UDID): Pasted correctly
  - [ ] Platform: iOS
  - [ ] Confirmed and registered

**Checklist for Part 2c - Create Provisioning Profile:**

- [ ] Navigated to Provisioning Profiles section
- [ ] Created new "App Store Connect" profile
- [ ] Selected Bundle ID: `com.imidus.customerapp`
- [ ] Selected Distribution certificate (created in Part 2a)
- [ ] Selected all registered test devices
- [ ] Profile Name: `Imidus Customer App Distribution`
- [ ] Downloaded `.mobileprovision` file
- [ ] Double-clicked to install in Keychain
- [ ] Verified installed: `~/Library/MobileDevice/Provisioning\ Profiles/`

---

## Part 3: App Store Connect API Key (Est. 10 min)

**For Automated CI/CD Uploads:**

- [ ] Navigated to App Store Connect → Users and Access → Integrations
- [ ] Generated new API Key
- [ ] Selected role: "App Manager"
- [ ] Key name: `CI_CD_TestFlight_Upload`
- [ ] Downloaded `.p8` key file
- [ ] Noted Key ID (10-character code)
- [ ] Noted Issuer ID (UUID)
- [ ] Created base64-encoded version of API key:
  ```bash
  base64 -i AuthKey_*.p8 | pbcopy
  ```
- [ ] Stored base64 value securely (for GitHub Secrets)

---

## Part 4: Configure iOS Project in Xcode (Est. 15 min)

- [ ] Navigated to: `src/mobile/ImidusCustomerApp/ios`
- [ ] Opened `ImidusCustomerApp.xcworkspace` (not `.xcodeproj`)
- [ ] Selected ImidusCustomerApp target
- [ ] Went to "Signing & Capabilities" tab
- [ ] Team: Selected from dropdown (auto-populated)
- [ ] Bundle Identifier: Verified as `com.imidus.customerapp`
- [ ] Provisioning Profile: Set to "Automatic"
- [ ] Code Sign Identity: Set to "Apple Distribution"
- [ ] Repeated for ImidusCustomerAppTests target

**ExportOptions.plist Configuration:**

- [ ] Created file: `src/mobile/ImidusCustomerApp/ios/ExportOptions.plist`
- [ ] Copied template from setup guide
- [ ] Replaced `YOUR_TEAM_ID` with 10-digit Apple Team ID
- [ ] Saved file
- [ ] Verified plist is valid XML

---

## Part 5: Build Process (Est. 30 min)

**Pre-Build Verification:**

- [ ] macOS 13+ confirmed
- [ ] Xcode 14+ confirmed
- [ ] Node.js 18+ confirmed
- [ ] CocoaPods installed: `gem list cocoapods`
- [ ] pnpm installed: `which pnpm`

**Build Steps:**

- [ ] Navigated to `src/mobile/ImidusCustomerApp`
- [ ] Ran: `pnpm install --frozen-lockfile`
- [ ] Navigated to `ios` subfolder
- [ ] Ran: `pod install`
- [ ] Navigated back to project root
- [ ] Ran archive command:
  ```bash
  cd ios
  xcodebuild -workspace ImidusCustomerApp.xcworkspace \
    -scheme ImidusCustomerApp \
    -sdk iphoneos \
    -configuration Release \
    -archivePath $PWD/build/ImidusCustomerApp.xcarchive \
    archive
  ```
- [ ] Archive completed without errors
- [ ] Ran export command:
  ```bash
  xcodebuild -exportArchive \
    -archivePath $PWD/build/ImidusCustomerApp.xcarchive \
    -exportOptionsPlist ExportOptions.plist \
    -exportPath $PWD/build
  ```
- [ ] `.ipa` file created: `ios/build/ImidusCustomerApp.ipa`
- [ ] IPA file size reasonable (~50-100 MB expected)

---

## Part 6: TestFlight Upload (Est. 10 min)

**Using Transporter App (Recommended):**

- [ ] Downloaded Transporter from Mac App Store
- [ ] Opened Transporter
- [ ] Signed in with Apple ID
- [ ] Dragged `.ipa` file into Transporter window
- [ ] Clicked "Deliver"
- [ ] Watched progress bar (5-10 min upload)
- [ ] Received "Upload Successful" message
- [ ] Noted timestamp for tracking

**Alternative: Command Line Upload:**

- [ ] Created app-specific password at https://appleid.apple.com
- [ ] Ran:
  ```bash
  xcrun altool --upload-app \
    -f ImidusCustomerApp.ipa \
    -t ios \
    -u your-apple-id@email.com \
    -p your-app-specific-password
  ```
- [ ] Received success message with Request ID

---

## Part 7: Build Processing (Est. 10-30 min)

**Monitoring in App Store Connect:**

- [ ] Navigated to App Store Connect → TestFlight
- [ ] Viewed "Builds" section
- [ ] Located uploaded build
- [ ] Watched status progression:
  - [ ] "Uploading"
  - [ ] "Processing"
  - [ ] "Ready for Testing" (final status)
- [ ] Noted build number and version
- [ ] Build appeared in TestFlight tester section

---

## Part 8: Configure TestFlight Testers (Est. 10 min)

**Internal Testing Group:**

- [ ] Navigated to TestFlight → Internal Testing
- [ ] Added team members/internal testers
- [ ] Invited testers via email (if not already invited)

**External Testing Group:**

- [ ] Navigated to TestFlight → External Testing
- [ ] Clicked "Create Group"
- [ ] Group Name: `Beta Testers`
- [ ] Added tester email addresses
- [ ] Clicked "Create"
- [ ] Selected build to test
- [ ] Accepted beta agreement
- [ ] Clicked "Notify Testers"
- [ ] Testers received notification emails

---

## Part 9: Tester Onboarding (Est. 5 min)

**For Each Tester:**

- [ ] Tester received TestFlight invitation email
- [ ] Tester clicked link in email
- [ ] TestFlight app opened (or App Store)
- [ ] Tester clicked "Accept" or "Start Testing"
- [ ] App downloaded and installed on their device
- [ ] App launched successfully
- [ ] Tester provided feedback via TestFlight app

---

## Part 10: Feedback & Iteration (Ongoing)

**Collecting Feedback:**

- [ ] Monitored App Store Connect → TestFlight → Feedback
- [ ] Reviewed crash reports
- [ ] Reviewed session logs
- [ ] Reviewed user-submitted feedback
- [ ] Prioritized bugs for next iteration

**For Next Build:**

- [ ] Fixed identified issues in code
- [ ] Incremented build number in Info.plist
- [ ] Ran rebuild (Steps 5-7 above)
- [ ] Uploaded new IPA to TestFlight
- [ ] Notified testers of new build
- [ ] Collected feedback on fixes

---

## Part 11: GitHub Secrets Setup (For CI/CD)

**If using automated deployment:**

- [ ] Created base64-encoded P12 certificate:
  ```bash
  base64 -i MyCertificate.p12 | pbcopy
  ```
  - [ ] Stored as `IOS_P12_CERTIFICATE_BASE64`

- [ ] Created P12 password:
  - [ ] Stored as `IOS_P12_PASSWORD`

- [ ] Created Keychain password:
  - [ ] Stored as `IOS_KEYCHAIN_PASSWORD`

- [ ] Created base64-encoded provisioning profile:
  ```bash
  base64 -i "Imidus Customer App Distribution.mobileprovision" | pbcopy
  ```
  - [ ] Stored as `IOS_PROVISIONING_PROFILE_BASE64`

- [ ] Stored API Key credentials:
  - [ ] `APP_STORE_CONNECT_API_KEY_ID`
  - [ ] `APP_STORE_CONNECT_API_ISSUER_ID`
  - [ ] `APP_STORE_CONNECT_API_KEY_BASE64`

**In GitHub:**

- [ ] Navigated to Repo → Settings → Secrets and variables → Actions
- [ ] Added all secrets above
- [ ] Verified secrets saved (list shows placeholder dots)

---

## Troubleshooting Quick Reference

| Issue | Solution | Checklist |
|-------|----------|-----------|
| Missing Privacy Policy | Add HTTPS URL in App Store Connect → App Information | [ ] |
| Certificate not trusted | Re-download & install from App Store Connect → Certificates | [ ] |
| Bundle ID mismatch | Verify in Xcode matches `com.imidus.customerapp` exactly | [ ] |
| Build fails to export | Check ExportOptions.plist Team ID is correct | [ ] |
| TestFlight upload fails | Verify IPA file integrity & re-download Transporter | [ ] |
| Build still processing | Wait 30+ min or contact Apple Support | [ ] |
| Testers can't install | Verify their device UDID is registered & in provisioning profile | [ ] |

---

## Sign-Off

**Completion Status:**

- [ ] All setup steps completed
- [ ] First build successfully uploaded to TestFlight
- [ ] Testers invited and notified
- [ ] Feedback collection process established
- [ ] CI/CD automation ready (optional)

**Date Completed:** _______________

**Completed By:** _______________

**Contact for Issues:** novatech2210@gmail.com

