# EAS Build Guide - iOS IPA Generation

**Project**: IMIDUSAPP Mobile (React Native)
**Platform**: iOS
**Build Service**: Expo Application Services (EAS)
**Target**: TestFlight Distribution

---

## Prerequisites

### 1. EAS CLI Installation
```bash
cd /home/kali/Desktop/TOAST/src/mobile/ImidusCustomerApp

# Install EAS CLI locally
pnpm add -D eas-cli

# Or use globally (if installed)
npm install -g eas-cli
eas --version
```

### 2. Expo Account
- Email: novatech2210@gmail.com
- Password: [Set via: eas login]
- Status: Login required

### 3. Apple Developer Account
- Apple ID: novatech2210@gmail.com
- Team ID: ABC123DEF4 (from Imidus)
- App ID: 6740450923
- Bundle Identifier: com.imidus.customer

### 4. Xcode Command Line Tools (for local signing)
```bash
# Check if installed
xcode-select -p

# If not installed, install via:
xcode-select --install
```

---

## Configuration Files

### eas.json (Created ✅)
```json
{
  "build": {
    "testflight": {
      "distribution": "internal",
      "ios": {
        "buildConfiguration": "Release",
        "enterpriseProvisioning": "universal",
        "scheme": "ImidusCustomerApp"
      }
    }
  }
}
```

### app.json (Updated ✅)
- iOS Bundle ID: `com.imidus.customer`
- iOS Build Number: `1`
- Notifications configured
- Location permissions set
- Firebase enabled

---

## Build Steps

### Step 1: Authenticate with EAS
```bash
cd /home/kali/Desktop/TOAST/src/mobile/ImidusCustomerApp

# Login to Expo/EAS
npx eas login

# Or use pnpm
pnpm eas login

# Follow prompts:
# Email: novatech2210@gmail.com
# Password: [Your password]
```

### Step 2: Configure iOS Credentials
```bash
# Let EAS handle iOS credentials automatically
pnpm eas credentials

# Select: iOS
# Select: Create new
# EAS will generate provisioning profiles and certificates
```

### Step 3: Build iOS IPA
```bash
# Build for TestFlight (internal distribution)
pnpm eas build --platform ios --profile testflight

# Or build interactively
pnpm eas build --platform ios

# Options:
# - testflight (recommended)
# - production
# - preview
# - development
```

### Step 4: Monitor Build
```bash
# Watch build progress
pnpm eas build --platform ios --profile testflight --wait

# Or check status separately
pnpm eas build:list

# View specific build
pnpm eas build:view [BUILD_ID]
```

---

## Expected Output

### Build Process (30-45 minutes)
1. ✅ Validate project configuration
2. ✅ Install dependencies
3. ✅ Compile TypeScript/JavaScript
4. ✅ Build iOS app (Xcode compilation)
5. ✅ Sign IPA with provisioning profile
6. ✅ Generate IPA file (~50-60 MB)
7. ✅ Upload to EAS Build artifacts

### IPA File Details
- **Filename**: ImidusCustomerApp.ipa
- **Size**: ~50-60 MB
- **Build Type**: Release (optimized)
- **Signed**: Yes (Apple certificate)
- **Distribution**: TestFlight
- **Expires**: 90 days (TestFlight limit)

---

## Download IPA

### Option 1: From EAS Dashboard
```bash
# Download from artifacts
pnpm eas build:download [BUILD_ID] --path ./ImidusCustomerApp.ipa
```

### Option 2: From Build Details
```bash
# View build details
pnpm eas build:view [BUILD_ID]

# Copy IPA download link from output
# Download manually or via curl:
curl -o ImidusCustomerApp.ipa "https://eas-builds.s3.us-west-2.amazonaws.com/..."
```

---

## Upload to TestFlight

### Option 1: Automatic Submission (Recommended)
```bash
# Configure submit in eas.json
pnpm eas submit --platform ios --profile testflight --build-id [BUILD_ID]

# EAS will automatically:
# - Upload IPA to App Store Connect
# - Submit for TestFlight beta review
# - Create beta testers group
# - Send invitations
```

### Option 2: Manual Upload via App Store Connect

1. **Go to App Store Connect**
   - https://appstoreconnect.apple.com
   - Select "Apps" → "IMIDUSAPP"
   - Click "TestFlight" tab

2. **Create New Build**
   - Click "+" to add build
   - Upload IPA file
   - Answer Compliance questions:
     - Contains encryption: Yes
     - Category: Business
     - Uses cryptography: Yes
     - Contains encryption from U.S.: Yes

3. **Submit for Review**
   - Click "Submit for Beta Review"
   - Wait 24-48 hours for review

4. **Distribute to Testers**
   - Once approved, go to "Testers and Groups"
   - Create group: "IMIDUS Team"
   - Add tester emails
   - Send invitations

---

## Troubleshooting

### Issue: "Build failed: Xcode compilation error"
**Solution**:
```bash
# Clean build cache
pnpm eas build:cache clean --platform ios

# Retry build
pnpm eas build --platform ios --profile testflight --wait
```

### Issue: "Provisioning profile not found"
**Solution**:
```bash
# Reset credentials
pnpm eas credentials --platform ios --clear

# Re-create credentials
pnpm eas credentials
```

### Issue: "Certificate expired"
**Solution**:
```bash
# Revoke old certificate
pnpm eas credentials --platform ios --revoke-all

# Generate new certificate
pnpm eas credentials
```

### Issue: "App review rejected"
**Common Reasons**:
- Missing privacy policy URL
- Incomplete app description
- Non-compliance with guidelines
- Encryption not properly disclosed

**Resolution**:
1. Fix the issue in app.json or AppDelegate.swift
2. Increment build number
3. Rebuild and resubmit

---

## Testing Locally (Before EAS Build)

### Option: Development Build
```bash
# Create development build locally
pnpm expo run:ios

# Or debug build
pnpm eas build --platform ios --profile development
```

---

## Production Deployment (Later)

### For App Store Release
```bash
# Use production profile
pnpm eas build --platform ios --profile production

# Then submit to App Store
pnpm eas submit --platform ios --profile production --build-id [BUILD_ID]

# Changes needed:
# 1. Update app.json version
# 2. Set enterpriseProvisioning to "universal"
# 3. Change distribution to "store"
```

---

## Monitoring & Management

### View All Builds
```bash
# List iOS builds
pnpm eas build:list --platform ios

# List last 10 builds
pnpm eas build:list --platform ios --limit 10
```

### View Build Logs
```bash
# Stream logs during build
pnpm eas build --platform ios --profile testflight --wait

# Or view after build
pnpm eas build:log [BUILD_ID]
```

### Cancel Build
```bash
# Cancel in-progress build
pnpm eas build:cancel [BUILD_ID]
```

---

## Timeline

| Step | Duration | Status |
|------|----------|--------|
| Setup & Auth | 5 min | ✅ |
| Configure Credentials | 5 min | 🔄 |
| Build (EAS) | 30-45 min | 🔄 |
| Download IPA | 2 min | 📅 |
| Upload to TestFlight | 5 min | 📅 |
| App Review | 24-48 hrs | 📅 |
| Invite Testers | 1 min | 📅 |
| Tester Installation | varies | 📅 |

**Total to TestFlight**: ~60-90 minutes

---

## Files Reference

| File | Purpose | Status |
|------|---------|--------|
| `eas.json` | EAS build configuration | ✅ Created |
| `app.json` | Expo & iOS config | ✅ Updated |
| `ios/ImidusCustomerApp/Info.plist` | iOS app info | ✅ Auto-updated by EAS |
| `ios/ImidusCustomerApp.xcodeproj` | Xcode project | ✅ Present |
| `.easrc` | EAS credentials (created after login) | 🔄 On demand |

---

## Next Steps

### Immediate (Now)
1. [ ] Run: `pnpm eas login`
2. [ ] Run: `pnpm eas credentials`
3. [ ] Run: `pnpm eas build --platform ios --profile testflight`

### Short-term (1-2 hours)
1. [ ] Monitor build progress
2. [ ] Download IPA when ready
3. [ ] Upload to TestFlight

### Client Delivery (2-3 hours)
1. [ ] Send TestFlight invitations to client
2. [ ] Provide Apple ID email list
3. [ ] Document testing access

---

## Support & Debugging

**EAS Documentation**: https://docs.expo.dev/build/
**EAS Dashboard**: https://expo.dev/builds
**Apple Developer**: https://developer.apple.com

**Local Issues**: Check Xcode logs
```bash
cat ~/Library/Logs/eas-build/...
```

**Cloud Issues**: View EAS Build logs
```bash
pnpm eas build:log [BUILD_ID]
```

---

## Success Criteria

✅ Build completes without errors
✅ IPA file generated (~50-60 MB)
✅ IPA signed for TestFlight
✅ Uploaded to App Store Connect
✅ TestFlight review approved
✅ Testers can install from TestFlight
✅ App launches on iOS device
✅ All features functional on iOS

---

**Ready to build?** Run: `pnpm eas build --platform ios --profile testflight`

Build time: **~60 minutes** (including EAS processing + upload)
