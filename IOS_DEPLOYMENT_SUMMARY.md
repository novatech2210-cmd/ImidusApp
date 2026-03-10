# iOS TestFlight Deployment - Complete Setup Ready

**Date:** March 6, 2026  
**Client:** Imidus Technologies / INI_Restaurant  
**Status:** ✅ Documentation Complete & in S3

---

## 📊 What You're Getting

Complete iOS TestFlight deployment documentation with step-by-step instructions for non-technical client setup.

**Files in S3:**

1. **IOS_TESTFLIGHT_SETUP.md** (13.8 KB)
   - 10-part comprehensive guide
   - 3000+ words covering every step
   - Includes screenshots descriptions & commands
   - Parts 1-10 with detailed instructions
   - Troubleshooting reference included

2. **IOS_TESTFLIGHT_CHECKLIST.md** (9.8 KB)
   - Part-by-part checkbox validation
   - Estimated time for each section
   - Quick reference troubleshooting table
   - Sign-off completion section
   - 80+ checkboxes for tracking progress

---

## 🎯 What Client Needs To Do

### Phase 1: Initial Setup (Est. 1-2 hours)

**Client provides:**

1. Apple Developer Account credentials
2. Bundle ID: `com.imidus.customerapp`
3. Privacy Policy URL (HTTPS required)
4. Test device UDIDs (from testers' iPhones)
5. Contact email for TestFlight notifications

**We provide:**

1. Complete setup guide (IOS_TESTFLIGHT_SETUP.md)
2. Step-by-step checklist (IOS_TESTFLIGHT_CHECKLIST.md)
3. Technical support email: novatech2210@gmail.com

### Phase 2: Apple Account Configuration (Est. 45 min)

- Create app record in App Store Connect
- Generate signing certificates
- Register test devices
- Create provisioning profile
- Configure API key for CI/CD

### Phase 3: Build & Upload (Est. 30 min)

- Build iOS IPA locally (or trigger via GitHub Actions)
- Upload to TestFlight via Transporter
- Wait for Apple processing (10-30 min)
- Enable testers access

### Phase 4: Tester Distribution (Est. 10 min)

- Create tester groups (internal + external)
- Invite testers via email
- Testers accept and install via TestFlight app
- Feedback collection begins

---

## 🔑 Critical Configuration Values

**Must be exactly:**

- Bundle ID: `com.imidus.customerapp`
- Privacy Policy URL: Must be HTTPS (no exceptions)
- Certificate type: Apple Distribution (not Development)
- Export method: app-store (for TestFlight)

---

## 📋 Document Overview

### IOS_TESTFLIGHT_SETUP.md

**Structure:**

- Overview & timeline
- Prerequisites (what client needs)
- Part 1: App Store Connect Setup (15 min)
- Part 2: Certificates & Provisioning (30 min)
- Part 3: API Key for Automation (10 min)
- Part 4: Xcode Project Configuration (15 min)
- Part 5: Build Process (30 min)
- Part 6: Upload to TestFlight (10 min)
- Part 7: Build Processing & Testing (10-30 min)
- Part 8: Manage TestFlight Testers
- Part 9: Version Management
- Part 10: Feedback & Iteration
- Troubleshooting section
- Files & links reference

**Key Features:**

- Shell command snippets (copy-paste ready)
- Decision trees for choosing options
- Common issues with solutions
- Screenshots descriptions (tells what user should see)
- Links to official Apple documentation

### IOS_TESTFLIGHT_CHECKLIST.md

**Structure:**

- Pre-setup verification (8 items)
- Part 1: App Store Connect (12 items)
- Part 2: Certificates & Provisioning (22 items)
- Part 3: API Key Setup (6 items)
- Part 4: Xcode Configuration (12 items)
- Part 5: Build Process (18 items)
- Part 6: TestFlight Upload (9 items)
- Part 7: Build Processing (5 items)
- Part 8: Tester Configuration (11 items)
- Part 9: Tester Onboarding (5 items)
- Part 10: Feedback & Iteration (6 items)
- Part 11: GitHub Secrets (if using CI/CD) (8 items)
- Troubleshooting quick reference table
- Completion sign-off section

**Key Features:**

- 80+ checkboxes for progress tracking
- Estimated time per section
- Quick reference troubleshooting table
- Completion sign-off with date/name fields

---

## 🚀 Implementation Timeline

| Phase               | Time      | Client Action               | Novatech Support       |
| ------------------- | --------- | --------------------------- | ---------------------- |
| Setup               | 1-2 hrs   | Follow guide & run commands | 24-hr email support    |
| Apple Processing    | 10-30 min | Wait (automatic)            | Monitor & assist       |
| Tester Distribution | 10 min    | Invite testers              | Provide test scenarios |
| Testing             | 1-2 weeks | Run test scenarios          | Track feedback         |
| Iteration           | Ongoing   | Report bugs                 | Fix & redeploy builds  |

---

## 📲 iOS Build Availability

**Current Status:**

- React Native source code ready at: `src/mobile/ImidusCustomerApp`
- GitHub workflow configured: `.github/workflows/ios-build.yml`
- Can build locally on Mac or via GitHub Actions

**Build Specifications:**

- Target iOS: 13.0+
- Bundle ID: `com.imidus.customerapp`
- Version: 1.0
- Build: Auto-incremented per upload

---

## 🔐 Security Considerations

**What we're handling:**

- Signing certificates (encrypted in keychain)
- Provisioning profiles (installed locally only)
- API keys (stored in GitHub Secrets, never in code)
- Tester device UDIDs (registered in Apple Developer)

**What client manages:**

- Apple ID credentials (never shared with us)
- Privacy Policy (their responsibility)
- Tester list management
- App Store & TestFlight access

---

## ⚠️ Known Limitations

1. **macOS Requirement** — Build must happen on Mac with Xcode
   - Alternative: Use GitHub Actions (macOS runners available)

2. **Apple Account Requirement** — Apple Developer enrollment ($99/year)
   - Required for signing certificates and TestFlight

3. **Privacy Policy Required** — HTTPS URL mandatory
   - TestFlight will reject build without valid privacy policy

4. **Build Processing** — Apple processing takes 10-30 minutes
   - Varies based on app content and Apple's load
   - Rare compliance reviews can extend this

5. **Device Registration** — Each test device UDID must be registered
   - Cannot use simulator for external testers
   - Max 100 devices per year

---

## 🎯 Success Criteria

**TestFlight deployment is successful when:**

- [ ] IPA built without errors (~50-100 MB)
- [ ] IPA uploaded to TestFlight successfully
- [ ] Apple processing completed → "Ready for Testing"
- [ ] Testers invited and received email notifications
- [ ] Testers installed app and can launch
- [ ] 5 test scenarios complete successfully:
  1. New user registration & order
  2. Existing user quick reorder
  3. Order tracking & notifications
  4. Payment retry flow
  5. Loyalty points application
- [ ] No crashes during testing
- [ ] Feedback collected and documented

---

## 📞 Support Structure

**Client has 24-hour response SLA for:**

- Build failures or errors
- Apple account issues
- TestFlight deployment questions
- Tester onboarding problems
- Bug reports during testing

**Email:** novatech2210@gmail.com  
**Contact:** Chris (Lead Developer), Novatech Build Team

---

## 🔄 Next Steps After M3 Acceptance

**Sequence:**

1. **M3 Acceptance** — Client confirms web platform works
2. **iOS TestFlight Setup** — Client follows setup guide
3. **iOS Testing** — 1-2 weeks of tester feedback
4. **iOS Fixes** — We iterate on reported bugs
5. **M4 Admin Portal** — Begin admin dashboard development (parallel)
6. **App Store Review** (optional) — If client wants production iOS

---

## 📚 Document Locations

| Document                      | Location                            | Purpose                           |
| ----------------------------- | ----------------------------------- | --------------------------------- |
| IOS_TESTFLIGHT_SETUP.md       | S3 + Repo                           | Complete setup guide (read first) |
| IOS_TESTFLIGHT_CHECKLIST.md   | S3 + Repo                           | Progress tracking during setup    |
| ios-build.yml                 | `.github/workflows/`                | CI/CD workflow for builds         |
| ImidusCustomerApp.xcworkspace | `src/mobile/ImidusCustomerApp/ios/` | Xcode project                     |

---

## ✅ Delivery Checklist

- [x] iOS TestFlight setup guide written (3000+ words)
- [x] Step-by-step checklist created (80+ items)
- [x] ExportOptions.plist template included
- [x] Troubleshooting reference provided
- [x] Shell commands (copy-paste ready)
- [x] GitHub Actions workflow ready
- [x] Security best practices documented
- [x] Files uploaded to S3
- [x] Committed to repository
- [x] Ready for client deployment

---

## 🎉 Status

**iOS TestFlight deployment documentation is COMPLETE and READY for client use.**

Client can now:

1. Download IOS_TESTFLIGHT_SETUP.md from S3
2. Follow 10-part guide step-by-step
3. Use IOS_TESTFLIGHT_CHECKLIST.md to track progress
4. Deploy iOS app to TestFlight within 2-3 hours
5. Distribute to testers for testing
6. Collect feedback and iterate

---

_Documentation prepared: March 6, 2026_  
_Support: novatech2210@gmail.com_  
_Next: Await M3 acceptance, then begin M4 planning_
