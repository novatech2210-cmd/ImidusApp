# IMIDUSAPP Installation Guide
## Step-by-Step Setup for Android & iOS

**Version:** 1.0.0
**Last Updated:** March 19, 2026
**Status:** Ready for Client Deployment

---

## 📱 ANDROID INSTALLATION

### Prerequisites

- Android device: Android 7.0 (API 24) or higher
- ~100 MB free storage space
- Internet connection (WiFi or mobile data)
- USB cable (for ADB installation) OR direct APK download link

### Method 1: Direct Download & Install (Easiest)

**Step 1: Download APK**
```
1. Open browser on Android device
2. Navigate to:
   https://inirestaurant.s3.us-east-1.amazonaws.com/novatech/builds/m2-mobile/imidus-customer-app-release.apk
3. Tap "Download"
4. Wait for download to complete (~58 MB, 2-5 minutes on LTE)
```

**Step 2: Install APK**
```
1. Open file manager or Downloads folder
2. Tap downloaded file: imidus-customer-app-release.apk
3. Tap "Install" when prompted
4. Accept permissions if asked
5. Wait for installation to complete
```

**Step 3: Launch App**
```
1. Tap "Open" (if available immediately)
   OR
2. Go to App Drawer → Find "IMIDUSAPP"
3. Tap to launch
4. Grant permissions when prompted:
   - Location access
   - Camera access
   - File storage access
   - Notification permissions
```

### Method 2: USB/ADB Installation (For Developers)

**Prerequisites:**
- Android SDK/ADB tools installed
- USB debugging enabled on device
- Device connected via USB

**Steps:**
```bash
# Connect device
adb devices
# Should show: [device-id]  device

# Download APK from S3
wget https://inirestaurant.s3.us-east-1.amazonaws.com/novatech/builds/m2-mobile/imidus-customer-app-release.apk

# Install
adb install -r imidus-customer-app-release.apk

# Wait for success message:
# "Success"

# Launch app
adb shell am start -n com.imidus.customer/.MainActivity
```

### Method 3: QR Code (If Provided)

```
1. Generate QR code pointing to S3 URL
2. Scan with device camera
3. Tap link → Downloads APK
4. Proceed with Step 2 above
```

### First Launch Setup

**Initial Permissions:**
```
When app launches, you'll be prompted:

□ Allow IMIDUSAPP to access your location?
  → Tap "Allow While Using App"

□ Allow IMIDUSAPP to send you notifications?
  → Tap "Allow"

□ Allow IMIDUSAPP to access camera?
  → Tap "Allow" (for profile pictures)

Note: You can change these later in Android Settings
```

**Create Account or Login:**
```
OPTION A: New User
1. Tap "Create Account"
2. Enter email address
3. Enter password (min 8 characters)
4. Confirm password
5. Tap "Register"
6. Wait for account creation

OPTION B: Existing User
1. Tap "Login"
2. Enter email
3. Enter password
4. Tap "Login"
```

### Troubleshooting Android Installation

| Problem | Solution |
|---------|----------|
| **"App not installed"** | Clear app cache, uninstall old version, try again |
| **"Parse error"** | Download APK again, ensure file is not corrupted |
| **"Storage full"** | Delete old apps or files, need min 100 MB free |
| **App crashes on launch** | Ensure backend API is running at http://localhost:5004 |
| **Can't connect to server** | Check WiFi/data connection, verify firewall |
| **Permission denied errors** | Grant permissions in Android Settings → Apps → IMIDUSAPP |

---

## 🍎 iOS INSTALLATION

### Prerequisites

- iPhone or iPad: iOS 13.0 or higher
- ~200 MB free storage space
- Internet connection (WiFi recommended)
- Apple ID (for TestFlight)
- TestFlight app (free, from App Store)

### Method 1: TestFlight (Recommended for QA)

**Step 1: Install TestFlight**
```
1. Open App Store on iOS device
2. Search for "TestFlight"
3. Install TestFlight app (by Apple)
4. Open TestFlight app
5. Sign in with Apple ID
```

**Step 2: Accept Invite**
```
1. Check email for TestFlight invite from novatech2210@gmail.com
2. Tap link: "Install IMIDUSAPP via TestFlight"
3. You'll be directed to TestFlight app
4. Tap "Accept"
5. Tap "Install"
6. Wait for download (~120 MB, 3-5 minutes on LTE)
```

**Step 3: Launch App**
```
1. In TestFlight app, tap "IMIDUSAPP" → "Open"
   OR
2. Go to Home screen → Find IMIDUSAPP
3. Grant permissions when prompted:
   - Location access
   - Camera access
   - Photo library access
   - Notification permissions
```

### Method 2: Direct Installation (After Production Release)

**Step 1: Install from App Store**
```
1. Open App Store on iOS device
2. Search for "IMIDUSAPP"
3. Tap "Get" → "Install"
4. Authenticate with Face ID / Touch ID / Apple ID password
5. Wait for installation
6. Tap "Open" when ready
```

**Step 2: Grant Permissions**
```
Same as TestFlight method above
```

### First Launch Setup (iOS)

**Initial Permissions:**
```
When app launches:

□ "IMIDUSAPP" Would Like to Send You Notifications
  → Tap "Allow"

□ "IMIDUSAPP" Wants to Access Your Location
  → Tap "Allow While Using App"

□ "IMIDUSAPP" Requests Access to Camera
  → Tap "OK"

□ "IMIDUSAPP" Requests Access to Photos
  → Tap "OK"
```

**Create Account or Login:**
```
Same as Android setup above
```

### Troubleshooting iOS Installation

| Problem | Solution |
|---------|----------|
| **"TestFlight invite expired"** | Request new invite, contact support@imidus.com |
| **"This app is no longer available"** | Remove from device, reinstall via TestFlight |
| **App won't download** | Check iCloud storage isn't full, try WiFi connection |
| **App crashes on launch** | Update iOS to latest version, force quit & relaunch |
| **Push notifications not working** | Check Settings → Notifications → IMIDUSAPP is enabled |
| **Location not working** | Check Settings → Privacy → Location → IMIDUSAPP allowed |

---

## 🔧 BACKEND CONNECTIVITY

### Verify Backend API is Running

Before launching the app, verify the backend is accessible:

```bash
# Check if backend is running
curl http://localhost:5004/health

# Expected response:
# {"status":"Healthy","timestamp":"2026-03-19T23:53:54Z","version":"2.0.0"}
```

### If Backend is Not Running

```bash
# Navigate to backend directory
cd /home/kali/Desktop/TOAST/src/backend/IntegrationService.API

# Start backend service
dotnet run

# Or in background
dotnet run &

# Backend will be available at http://localhost:5004
```

### Network Configuration for Device Testing

#### Using Android Emulator
```
If testing on Android emulator, use IP 10.0.2.2 instead of localhost:

Update in app.json:
  "apiUrl": "http://10.0.2.2:5004"
```

#### Using Physical Device (Same Network)
```
1. Get backend machine IP:
   Linux: hostname -I
   Mac: ifconfig | grep "inet "

2. Update API URL in app.json:
   "apiUrl": "http://192.168.x.x:5004"

3. Ensure firewall allows port 5004:
   Windows: netsh advfirewall firewall add rule name="IMIDUS API" dir=in action=allow protocol=tcp localport=5004
   Mac/Linux: sudo ufw allow 5004/tcp
```

#### Using iOS Simulator
```
Simulator can access localhost:
  "apiUrl": "http://localhost:5004"

But ensure backend is running on host machine.
```

---

## 🧪 TESTING THE APP

### Quick Test Checklist

After installation, verify these features work:

#### 1. User Authentication
```
□ Register new account
□ Login with credentials
□ View menu (should load after login)
□ Logout
□ Login again (verify persistent session)
```

#### 2. Menu & Shopping
```
□ Browse menu items
□ Filter by category
□ View item details
□ Add item to cart
□ Increase/decrease quantity
□ View cart total with tax
```

#### 3. Checkout & Payment
```
□ Proceed to checkout
□ Enter delivery address
□ Proceed to payment
□ Enter payment details (use test card)
□ Complete payment
□ See order confirmation
```

#### 4. Order Tracking
```
□ From confirmation screen, view order status
□ Go to "Orders" tab
□ See order in history
□ Tap order to view details
```

#### 5. Push Notifications
```
□ Permissions granted
□ Minimize app
□ Admin sends test notification (backend)
□ Notification appears on device
□ Tap notification → Opens to order
```

#### 6. Loyalty Points
```
□ View loyalty balance (Profile tab)
□ Make purchase
□ Check if points earned (1 pt per $10)
□ Attempt to redeem points
```

### Test Card Information

**For Authorize.net Sandbox Testing:**

```
Card Number:    4111 1111 1111 1111 (Visa - accepted)
Expiration:     12/25 (any future date)
CVV:            123 (any 3-digit number)
Name:           Test User
Zip Code:       12345 (any 5-digit)

✅ This card will be tokenized, not stored
✅ Use for testing payment flow only
✅ No real charges will occur in sandbox
```

**Test Results:**
- ✅ Valid charge: Amount > $0
- ❌ Declined: Amount = $0.00
- ❌ Card error: Amount = $100.00

---

## 📊 SYSTEM REQUIREMENTS

### Android

| Component | Requirement |
|-----------|-------------|
| OS | Android 7.0 (API 24) or higher |
| RAM | Minimum 2 GB (recommended 4 GB+) |
| Storage | 100 MB free space |
| Network | 4G LTE or WiFi |
| Screen | 4.5" - 6.7" (phones) or larger (tablets) |

### iOS

| Component | Requirement |
|-----------|-------------|
| OS | iOS 13.0 or higher |
| RAM | Minimum 2 GB (recommended 4 GB+) |
| Storage | 200 MB free space |
| Network | LTE or WiFi |
| Device | iPhone 6s or later, iPad (5th gen+) |

---

## 🔄 UPDATE INSTRUCTIONS

### Updating Android App

```
1. Open Settings → Apps → IMIDUSAPP
2. If update available, tap "Update"
3. Or download new APK and install via same method
4. Old version will be replaced
```

### Updating iOS App

**TestFlight:**
```
1. Open TestFlight app
2. If update available, notification will appear
3. Tap "Update"
4. New version auto-installs
```

**App Store:**
```
1. Open App Store
2. Go to account → Updates
3. Tap "Update" next to IMIDUSAPP
4. Or enable auto-update in settings
```

---

## 🔐 SECURITY & PRIVACY

### Data Handled by App

```
✅ Email address - for authentication only
✅ Password - hashed in backend, not stored locally in plain text
✅ Order history - stored in backend only
✅ Loyalty points - managed by backend
✅ Payment token - generated by Authorize.net, not stored
❌ Credit card numbers - NEVER stored or transmitted to our servers
```

### Permissions Explanation

| Permission | Why It's Needed |
|-----------|-----------------|
| **Internet** | Connect to backend API and Authorize.net |
| **Location** | Show delivery status and nearby locations (future) |
| **Camera** | Take profile picture (optional) |
| **Photos** | Select photo for profile (optional) |
| **Notifications** | Receive order updates and marketing messages |

### Best Practices

```
✅ Use strong passwords (min 8 characters)
✅ Don't share login credentials
✅ Log out when finished (especially on shared devices)
✅ Keep app updated for security patches
✅ Grant only necessary permissions
✅ Don't screenshot or share payment screens
```

---

## ❓ FAQ

**Q: I'm getting "Cannot connect to server" error**
A: Ensure backend API is running (`dotnet run` in backend directory) and device has internet access.

**Q: Can I use the app offline?**
A: No, the app requires internet to fetch menu and submit orders. Offline mode is planned for v2.

**Q: How often should I update the app?**
A: Update when prompted. We recommend enabling auto-updates to stay secure.

**Q: Can I use multiple devices?**
A: Yes, use the same login on multiple devices. Sessions are independent per device.

**Q: What happens if I uninstall the app?**
A: Your account and order history are preserved. Just reinstall and login to access them.

**Q: Is my payment information safe?**
A: Yes, we use Authorize.net tokenization. Card numbers are never sent to our servers.

**Q: Can I request a refund?**
A: Contact restaurant support. Refund policy is set by IMIDUS Technologies.

**Q: How do I delete my account?**
A: Go to Profile → Account Settings → Delete Account. This cannot be undone.

---

## 📞 SUPPORT

**Technical Support:**
- Email: novatech2210@gmail.com
- Available: Monday-Friday, 9 AM - 5 PM EST
- Response time: <24 hours

**Customer Support (Restaurant):**
- Email: support@imidus.com
- Available: During restaurant hours

**Bug Reports:**
- Please include:
  - Device model and OS version
  - Exact error message
  - Steps to reproduce
  - Screenshot (if applicable)

---

## ✅ Installation Verification Checklist

After installation, verify:

- [ ] App launches without crashing
- [ ] Can register new account
- [ ] Can login with credentials
- [ ] Menu loads with items
- [ ] Can add items to cart
- [ ] Can proceed to checkout
- [ ] Backend API is accessible
- [ ] Permissions are properly granted
- [ ] No console errors in debug logs
- [ ] Push notifications are enabled

**All items checked?** ✅ **Installation successful!**

---

**Version:** 1.0.0
**Last Updated:** March 19, 2026
**Status:** Ready for Client Deployment
