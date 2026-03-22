# IMIDUSAPP Mobile Installation Guide

## Android APK Installation

### Method 1: Using ADB (Recommended)
```bash
# Connect Android device via USB with USB debugging enabled
adb devices  # Verify device is connected

# Install APK
adb install -r imidus-customer-app-release.apk

# Launch app
adb shell am start -n com.imidus.customer/com.imidus.customer.MainActivity

# View logs (if needed)
adb logcat
```

### Method 2: Android Emulator
```bash
# Start emulator
emulator -avd [emulator-name] &

# Wait for emulator to boot, then install
adb install -r imidus-customer-app-release.apk
```

### Method 3: Manual Installation (GUI)
1. Copy APK to device (via USB cable)
2. Open file manager on device
3. Navigate to APK file
4. Tap to install
5. Allow unknown sources if prompted

## First Launch

1. **Splash Screen**: IMIDUSAPP logo (2 seconds)
2. **Login Screen**: Enter credentials or create account
3. **Menu Screen**: Browse items by category
4. **Cart**: Add items and proceed to checkout
5. **Payment**: Authorize.net payment form
6. **Confirmation**: Order confirmation screen

## Testing Checklist

- [ ] App launches without crashes
- [ ] Splash screen displays correctly
- [ ] Login form is visible and responsive
- [ ] Can browse menu items
- [ ] Can add items to cart
- [ ] Cart totals calculate correctly (GST 6%)
- [ ] Checkout process works
- [ ] Payment screen appears
- [ ] Order confirmation displays
- [ ] Can view order history
- [ ] Loyalty points display
- [ ] Push notifications deliver (when enabled)

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Device not found" | Enable USB debugging: Settings → Developer Options → USB Debugging |
| "Installation failed" | Clear app cache: adb shell pm clear com.imidus.customer |
| "App crashes on launch" | Check logs: adb logcat \| grep ImidusApp |
| "Cannot connect to backend" | Verify backend running on localhost:5004 or update API URL |

## Support

For issues or questions:
- Email: novatech2210@gmail.com
- Provide: Device model, Android version, and logcat output
