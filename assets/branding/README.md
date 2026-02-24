# IMIDUS Branding Assets

## Required Logo Files

Place the following logo files in this directory:

| Filename | Description | Usage |
|----------|-------------|-------|
| `imidusapp-icon.png` | App icon (blue triangle with gold "I") | iOS/Android app icon |
| `logo-blue-bg.png` | Gold text on blue gradient background | Splash screen |
| `logo-white-bg.png` | Gold text on white background | In-app header |
| `logo-white-bg-alt.png` | Alternate white background logo | Responsive layouts |
| `logo-with-phone.png` | Logo with phone number | Contact pages |

## Color Reference

```
Gold (Primary):    #D4AF37
Blue (Secondary):  #1E5AA8
White:             #FFFFFF
```

## App Icon Setup

### Android
1. Use `imidusapp-icon.png` as source
2. Generate adaptive icons using Android Studio
3. Place in `android/app/src/main/res/mipmap-*/`

### iOS
1. Use `imidusapp-icon.png` as source (1024x1024)
2. Open Xcode > Images.xcassets > AppIcon
3. Drag and drop to generate all sizes

## Splash Screen Setup

### Android
The splash screen uses the brand blue (#1E5AA8) background.
- Theme configured in `android/app/src/main/res/values/styles.xml`
- Colors defined in `android/app/src/main/res/values/colors.xml`

### iOS
Configure in `ios/POSMobile/LaunchScreen.storyboard`:
1. Set background color to #1E5AA8
2. Add logo-blue-bg.png centered

## File Placement Checklist

- [ ] `imidusapp-icon.png` - This directory
- [ ] `logo-blue-bg.png` - This directory
- [ ] `logo-white-bg.png` - This directory
- [ ] Android icons generated and placed
- [ ] iOS icons generated and placed
- [ ] Splash screens configured
