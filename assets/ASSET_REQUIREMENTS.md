# Mobile App Asset Requirements

## App Icons

### iOS App Icons (Required)

Place in `ios/[AppName]/Images.xcassets/AppIcon.appiconset/`

| Size          | Filename         | Usage                |
| ------------- | ---------------- | -------------------- |
| 20x20         | icon-20.png      | iPad Notifications   |
| 20x20 @2x     | icon-20@2x.png   | iPhone Notifications |
| 20x20 @3x     | icon-20@3x.png   | iPhone Notifications |
| 29x29         | icon-29.png      | iPad Settings        |
| 29x29 @2x     | icon-29@2x.png   | iPhone Settings      |
| 29x29 @3x     | icon-29@3x.png   | iPhone Settings      |
| 40x40         | icon-40.png      | iPad Spotlight       |
| 40x40 @2x     | icon-40@2x.png   | iPhone Spotlight     |
| 40x40 @3x     | icon-40@3x.png   | iPhone Spotlight     |
| 60x60 @2x     | icon-60@2x.png   | iPhone App           |
| 60x60 @3x     | icon-60@3x.png   | iPhone App           |
| 76x76         | icon-76.png      | iPad App             |
| 76x76 @2x     | icon-76@2x.png   | iPad App             |
| 83.5x83.5 @2x | icon-83.5@2x.png | iPad Pro App         |
| 1024x1024     | icon-1024.png    | App Store            |

### Android App Icons (Required)

Place in `android/app/src/main/res/`

| Folder         | Size    | Filename        |
| -------------- | ------- | --------------- |
| mipmap-mdpi    | 48x48   | ic_launcher.png |
| mipmap-hdpi    | 72x72   | ic_launcher.png |
| mipmap-xhdpi   | 96x96   | ic_launcher.png |
| mipmap-xxhdpi  | 144x144 | ic_launcher.png |
| mipmap-xxxhdpi | 192x192 | ic_launcher.png |

Also create round icons:
| Folder | Size | Filename |
|--------|------|----------|
| mipmap-mdpi | 48x48 | ic_launcher_round.png |
| mipmap-hdpi | 72x72 | ic_launcher_round.png |
| mipmap-xhdpi | 96x96 | ic_launcher_round.png |
| mipmap-xxhdpi | 144x144 | ic_launcher_round.png |
| mipmap-xxxhdpi | 192x192 | ic_launcher_round.png |

---

## Splash Screen

### iOS Launch Screen

Configure in `ios/[AppName]/LaunchScreen.storyboard`

- Background color: #FFFFFF (or brand color)
- Centered logo: 200x200 recommended

### Android Splash Screen

1. Create `android/app/src/main/res/drawable/splash.png` (or SVG)
2. Configure in `android/app/src/main/res/values/styles.xml`

Recommended sizes for splash logo:
| Folder | Logo Size |
|--------|-----------|
| drawable-mdpi | 100x100 |
| drawable-hdpi | 150x150 |
| drawable-xhdpi | 200x200 |
| drawable-xxhdpi | 300x300 |
| drawable-xxxhdpi | 400x400 |

---

## Source Files to Provide

### Required from Client/Designer:

1. **App Icon Source** (1024x1024 PNG, no transparency)
   - Square corners (iOS will round automatically)
   - No alpha channel

2. **Logo for Splash** (SVG or high-res PNG)
   - Transparent background
   - Works on light/dark backgrounds

3. **Brand Colors**
   - Primary color (hex)
   - Secondary color (hex)
   - Background color (hex)

---

## Automated Icon Generation

Use one of these tools to generate all sizes from a single 1024x1024 source:

### Option 1: react-native-make

```bash
npx react-native set-icon --path ./assets/icons/app-icon.png
```

### Option 2: App Icon Generator (Online)

- https://appicon.co
- https://makeappicon.com

### Option 3: ImageMagick Script

```bash
# Generate Android icons
for size in 48 72 96 144 192; do
  convert app-icon.png -resize ${size}x${size} ic_launcher_${size}.png
done

# Generate iOS icons
for size in 20 29 40 60 76 167 1024; do
  convert app-icon.png -resize ${size}x${size} icon-${size}.png
done
```

---

## Checklist

- [ ] Received 1024x1024 app icon from client
- [ ] Generated all iOS icon sizes
- [ ] Generated all Android icon sizes (regular + round)
- [ ] Created splash screen background
- [ ] Created splash screen logo
- [ ] Configured iOS LaunchScreen.storyboard
- [ ] Configured Android splash in styles.xml
- [ ] Tested on iOS simulator
- [ ] Tested on Android emulator
