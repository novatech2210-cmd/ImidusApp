# IMIDUS POS Integration - Client Testing Package

**Prepared:** March 6, 2026  
**Milestone:** 3 (Customer Web Platform) - Ready for Testing  
**Status:** ✅ All Three Platforms Available

---

## 📱 **ANDROID APK - Ready to Install**

### Download

- **File:** `app-release.apk` (59 MB)
- **Version:** 2.0 (March 5, 2026 build)
- **Status:** ✅ READY FOR TESTING

### Installation Steps

**Method 1: Direct Install (If from email/USB)**

1. Transfer `app-release.apk` to your Android phone
2. Open **Files** app → Navigate to download location
3. Tap `app-release.apk` → Tap **Install**
4. Grant permissions when prompted
5. App installs and is ready to use

**Method 2: Via USB Cable**

1. Connect Android phone to computer via USB
2. Enable "USB Debugging" in Developer Settings
3. Run: `adb install app-release.apk`
4. Wait for "Success" message

### Testing Credentials

- **Test Card:** 4111111111111111
- **Expiry:** 12/25
- **CVV:** 123
- **Register:** Create new account or use existing credentials

### What to Test

- ✅ Login/Registration
- ✅ Browse menu categories (7 categories)
- ✅ Add items to cart
- ✅ Checkout and payment
- ✅ Order tracking
- ✅ Order status updates
- ✅ Push notifications

---

## 🍎 **iOS - TestFlight or IPA Build**

### Option A: TestFlight (Recommended - Easiest)

**Prerequisites:** Apple ID

**Steps:**

1. On your iPhone, open **App Store** app
2. Tap your profile icon → **TestFlight**
3. Look for "Imidus Customer App"
4. Tap **Install**
5. App is ready to test

**Note:** TestFlight link will be provided separately by the development team.

### Option B: Direct IPA Build (For IT/Developer Teams)

- IPA build available upon request
- Requires Xcode and Apple Developer account for installation
- Contact: novatech2210@gmail.com

---

## 🖥️ **BACKEND - One-Click Windows Service Installer**

### MSI Installer (Windows Service)

- **File:** `ImidusIntegrationService.msi`
- **Version:** Latest (March 2026)
- **Status:** ✅ READY FOR DEPLOYMENT

### System Requirements

- Windows Server 2016 or later (or Windows 10/11 Pro)
- .NET Runtime 8.0 (included in MSI)
- SQL Server 2005 Express or later
- 2GB free disk space
- Network access to POS database

### Installation Steps

**Quick Install:**

1. Double-click `ImidusIntegrationService.msi`
2. Follow the installer wizard
3. Choose installation path (default: `C:\Program Files\Imidus\`)
4. Specify database connection:
   - **Server:** localhost or your SQL Server hostname
   - **Database:** INI_Restaurant
   - **User:** sa
   - **Password:** [your SQL Server password]
5. Click **Install**
6. Service starts automatically

**Verify Installation:**

- Open **Services** (Win+R → `services.msc`)
- Look for "ImidusIntegrationService"
- Status should show "Running"

**Test Connectivity:**

```
Open browser → http://localhost:5004/api/Sync/status
Should return: {"status":"online","isHealthy":true}
```

### Configuration

- **API Port:** 5004 (configurable)
- **Database Connection:** Configured during install
- **Log Location:** `C:\Program Files\Imidus\logs\`

### Uninstall

- Windows Control Panel → Programs → Programs and Features
- Find "Imidus Integration Service"
- Click **Uninstall**

---

## 🌐 **WEB APP - Deployment Options**

### Option A: Docker Container (Recommended for Non-Windows)

```
docker run -d \
  -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=http://your-backend-server:5004/api \
  imidus/customer-web:latest
```

Access: http://localhost:3000

### Option B: Direct Node.js Deployment

**Prerequisites:** Node.js 18+ installed

**Steps:**

1. Extract web application files
2. Navigate to web directory
3. Run: `npm install`
4. Configure environment: `NEXT_PUBLIC_API_URL=http://backend-server:5004/api`
5. Run: `npm start` or `npm run build && npm start`
6. Access: http://localhost:3000

### Option C: Static Build (Zero-Dependency)

1. Extract pre-built static files
2. Deploy to any web server (Apache, Nginx, IIS)
3. Configure reverse proxy to backend API
4. Access via web server URL

### Configuration

- **Backend API URL:** http://your-backend-server:5004/api
- **Port:** 3000 (configurable)
- **Database:** Auto-detected from backend

---

## 🧪 **QUICK START - 15 Minute Setup**

### Step 1: Install Backend (Windows Server)

1. Run `ImidusIntegrationService.msi`
2. Specify SQL Server connection
3. Click Install (2-3 minutes)
4. Verify: http://localhost:5004/api/Sync/status

### Step 2: Deploy Web App

```
docker run -d -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=http://backend-server:5004/api \
  imidus/customer-web:latest
```

Access: http://your-server:3000

### Step 3: Install Mobile App

- Download `app-release.apk` to Android device
- Tap to install (1 minute)
- App is ready to use

### Step 4: Test End-to-End

1. Open web app → Register customer
2. Open mobile app → Register with same email
3. Place test order on web: Add items → Checkout → Pay with 4111111111111111
4. Track order on mobile: Should see "pending" then "ready"
5. Success! 🎉

---

## 📊 **Test Environment Details**

### Backend API

- **URL:** http://[server-ip]:5004
- **Health Check:** GET /api/Sync/status
- **Documentation:** API swagger docs at /swagger

### Web App

- **URL:** http://[server-ip]:3000
- **Features:** Register, browse menu, checkout, order tracking
- **Responsive:** Desktop and tablet optimized

### Mobile App

- **Features:** Same as web + push notifications
- **Offline:** Gracefully shows "connecting..." when API unavailable
- **Performance:** Optimized for 4G/WiFi networks

### Test Data

- **7 Menu Categories:** Available in all platforms
- **Test Card:** 4111111111111111 (Authorize.net sandbox)
- **Test CashierID:** 999 (online orders), 998 (test orders)
- **Taxes:** GST 6% (Maryland)

---

## 🐛 **Known Issues & Workarounds**

| Issue                   | Impact | Workaround                                       |
| ----------------------- | ------ | ------------------------------------------------ |
| Order History Empty     | Low    | See past orders via order tracking screen        |
| iOS requires TestFlight | Medium | Link provided separately by dev team             |
| Disk space (98% full)   | Low    | Development environment only - not in production |

---

## 📞 **Support & Questions**

**For Issues:**

- Email: novatech2210@gmail.com
- Include: Platform (Android/Web/Backend), steps to reproduce, error message

**For Credentials:**

- Authorize.net Test Card: 4111111111111111
- SQL Server Connection: Configured during backend install
- API Access: No authentication required for this test build

---

## ✅ **Pre-Testing Checklist**

- [ ] Backend installed and running (Service shows "Running")
- [ ] Backend API responds at http://server:5004/api/Sync/status
- [ ] Web app deployed and accessible at http://server:3000
- [ ] Android APK installed on test device
- [ ] iOS TestFlight access obtained (or IPA deployed)
- [ ] Network connectivity verified between all three platforms
- [ ] Test card credentials noted (4111111111111111)
- [ ] Database connection verified (backend logs show "POS Connected")

---

## 🚀 **Testing Workflow**

1. **Start Backend:** MSI installer runs service automatically
2. **Open Web App:** Navigate to http://server:3000
3. **Register Customer:** Create test account
4. **Place Test Order:** Add items, checkout, pay
5. **Track on Mobile:** Install APK, login, see order status
6. **Verify Status Change:** Backend can mark order as complete
7. **Document Results:** Screenshot/note any issues

---

**All systems ready for testing!**

_Package prepared: March 6, 2026_
_Contact: Novatech Build Team (novatech2210@gmail.com)_
