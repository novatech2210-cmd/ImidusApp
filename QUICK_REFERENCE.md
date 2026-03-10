# Quick Reference - Client Testing Package

## 📦 What Client Gets

### Android APK

```
File: deliverables/ImidusCustomerApp-v2.apk
Size: 59 MB
How to install:
  1. Transfer to Android phone
  2. Tap file
  3. Tap Install
  4. Done!
Time: 1 minute
```

### iOS App

```
Format: TestFlight
How to access:
  1. Receive TestFlight link
  2. Tap link on iPhone
  3. Tap Install in App Store
  4. Done!
Time: 1 minute
```

### Backend API

```
File: ImidusIntegrationService.msi
How to install on Windows:
  1. Double-click MSI
  2. Choose install location
  3. Specify SQL Server connection
  4. Click Install
  5. Service starts automatically
Time: 2-3 minutes
Verify: http://localhost:5004/api/Sync/status
```

### Web App

```
Format: Docker (recommended)
How to run:
  docker run -d -p 3000:3000 \
    -e NEXT_PUBLIC_API_URL=http://backend-server:5004/api \
    imidus/customer-web:latest
Access: http://localhost:3000
Time: 2 minutes
```

## 🧪 Test Scenarios (5 minutes each)

**Test 1: Registration**

- Web: Register → Verify email → Login
- Mobile: Register → Auto-login to menu

**Test 2: Menu Browse**

- Web: View 7 categories, 30+ items
- Mobile: Scroll categories, items load

**Test 3: Order Placement**

- Web: Add 3 items → Cart → Checkout → Pay
- Card: 4111111111111111 / 12/25 / 123

**Test 4: Order Tracking**

- Mobile: View order status (Pending)
- Backend: Change status to Ready
- Mobile: Refresh → See status update

**Test 5: Cross-Platform**

- Web: Place order
- Mobile: Login with same account
- Mobile: See same order in tracking

## 📚 Documentation Files

```
CLIENT_DELIVERY_PACKAGE.md
├── Android installation (2 methods)
├── iOS TestFlight setup
├── Backend MSI guide
├── Web deployment options
├── 15-minute quick start
├── 5 test scenarios
└── Known issues & workarounds

DELIVERY_CHECKLIST.md
├── Pre-deployment checklist
├── Detailed test scenarios
├── Expected results
├── Performance metrics
└── Support information

CLIENT_EMAIL_TEMPLATE.txt
└── Ready to send to client
```

## 💾 Files to Deliver

### Required Files

```
✅ ImidusCustomerApp-v2.apk (59 MB)
✅ CLIENT_DELIVERY_PACKAGE.md
✅ DELIVERY_CHECKLIST.md
✅ Backend MSI (from GitHub Actions)
✅ Web app source code (GitHub repo)
```

### Optional Files

```
✅ CLIENT_EMAIL_TEMPLATE.txt (copy-paste to email)
✅ MILESTONE_3_DELIVERY_COMPLETE.md (this summary)
✅ QUICK_REFERENCE.md (this file)
```

## 🎯 Client Installation Timeline

```
Total Time: 15 minutes

Step 1: Backend Setup (5 min)
├─ Run MSI installer
├─ Configure SQL connection
└─ Verify API online

Step 2: Web App (5 min)
├─ Run Docker command OR npm start
└─ Verify at http://localhost:3000

Step 3: Mobile (3 min)
├─ Android: Tap APK to install
└─ iOS: Access TestFlight link

Step 4: Quick Test (2 min)
├─ Web: Register & browse
├─ Mobile: Register & view status
└─ Success!
```

## 🔧 System Requirements

**Backend (Windows)**

- Windows Server 2016+ or Win10/11 Pro
- SQL Server 2005 Express+
- 2GB disk space
- Port 5004 available

**Web App**

- Docker installed (or Node.js 18+)
- Port 3000 available

**Mobile**

- Android 10+ device (APK)
- iOS 12+ device (TestFlight)

## 🧪 Testing Checklist

- [ ] Backend installed and running
- [ ] API responds at http://localhost:5004/api/Sync/status
- [ ] Web app accessible at http://localhost:3000
- [ ] Android APK installed on test device
- [ ] iOS TestFlight access obtained
- [ ] Test card credentials ready (4111111111111111)
- [ ] Network connectivity verified

## 📞 Support

**For Issues:**

- Email: novatech2210@gmail.com
- Include: Platform, error message, steps to reproduce
- Response: Within 24 hours

**Test Card:**

- Number: 4111111111111111
- Expiry: 12/25
- CVV: 123
- Provider: Authorize.net Sandbox (never charges)

## ✅ Success Criteria

- Backend API online and responding
- Web app accessible and functional
- Android APK installed and running
- iOS TestFlight or IPA accessible
- Complete order flow testable (register → order → track)
- Payment processing works with test card
- Order appears on all platforms
- Status updates propagate cross-platform

---

**Status:** ✅ READY FOR CLIENT TESTING
**Installation Time:** 15 minutes
**Technical Complexity:** None (no build process)

_Prepared: March 6, 2026_
