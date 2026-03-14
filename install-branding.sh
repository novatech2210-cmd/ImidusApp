#!/bin/bash

TOAST_DIR="/home/kali/Desktop/TOAST"
BRANDING_DIR="$TOAST_DIR/imidus-branding"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🎨 Installing Imidus branding across TOAST project...${NC}"

# 1. Mobile App (ImidusCustomerApp)
MOBILE_DIR="$TOAST_DIR/src/mobile/ImidusCustomerApp"
echo -e "${GREEN}📱 Setting up React Native mobile app...${NC}"

# Assets
mkdir -p "$MOBILE_DIR/src/assets/images"
# Map branding images to guide names
if [ -f "$BRANDING_DIR/mobile/src/assets/images/imidus_logo_blue_gradient.png" ]; then
    cp -f "$BRANDING_DIR/mobile/src/assets/images/imidus_logo_blue_gradient.png" "$MOBILE_DIR/src/assets/images/logo-imidus-blue.png"
else
    echo -e "${YELLOW}Warning: imidus_logo_blue_gradient.png not found${NC}"
fi

if [ -f "$BRANDING_DIR/mobile/src/assets/images/imidus_logo_white.png" ]; then
    cp -f "$BRANDING_DIR/mobile/src/assets/images/imidus_logo_white.png" "$MOBILE_DIR/src/assets/images/logo-imidus-white.png"
else
    echo -e "${YELLOW}Warning: imidus_logo_white.png not found${NC}"
fi

# Create a gold logo if not present (using blue as placeholder or check for alternative)
if [ -f "$BRANDING_DIR/mobile/src/assets/images/imidus_logo_blue_gradient.png" ]; then
    cp -f "$BRANDING_DIR/mobile/src/assets/images/imidus_logo_blue_gradient.png" "$MOBILE_DIR/src/assets/images/logo-imidus-gold.png"
fi

if [ -f "$BRANDING_DIR/mobile/src/assets/images/app-icon-512.png" ]; then
    cp -f "$BRANDING_DIR/mobile/src/assets/images/app-icon-512.png" "$MOBILE_DIR/src/assets/images/app-icon-512.png"
fi

if [ -f "$BRANDING_DIR/mobile/src/assets/images/splash.png" ]; then
    cp -f "$BRANDING_DIR/mobile/src/assets/images/splash.png" "$MOBILE_DIR/src/assets/images/splash.png"
fi

# Theme
mkdir -p "$MOBILE_DIR/src/theme"
if [ -d "$BRANDING_DIR/mobile/src/theme" ]; then
    cp -rf "$BRANDING_DIR/mobile/src/theme/"* "$MOBILE_DIR/src/theme/"
fi

# Components
mkdir -p "$MOBILE_DIR/src/components/common"
if [ -d "$BRANDING_DIR/mobile/src/components/common" ]; then
    cp -rf "$BRANDING_DIR/mobile/src/components/common/"* "$MOBILE_DIR/src/components/common/"
fi

# Android Config
mkdir -p "$MOBILE_DIR/android/app/src/main/res/values"
mkdir -p "$MOBILE_DIR/android/app/src/main/res/drawable"
if [ -f "$BRANDING_DIR/mobile/android/app/src/main/res/values/colors.xml" ]; then
cp -f "$BRANDING_DIR/mobile/android/app/src/main/res/values/colors.xml" "$MOBILE_DIR/android/app/src/main/res/values/"
cp -f "$BRANDING_DIR/mobile/android/app/src/main/res/values/styles.xml" "$MOBILE_DIR/android/app/src/main/res/values/"
cp -f "$BRANDING_DIR/mobile/android/app/src/main/res/drawable/splash_background.xml" "$MOBILE_DIR/android/app/src/main/res/drawable/"
cp -f "$BRANDING_DIR/mobile/android/app/src/main/res/drawable/splash.png" "$MOBILE_DIR/android/app/src/main/res/drawable/"
fi

# iOS Config
mkdir -p "$MOBILE_DIR/ios/ImidusCustomerApp/Images.xcassets/Splash.imageset"
if [ -f "$BRANDING_DIR/mobile/ios/LaunchScreen.storyboard" ]; then
    cp -f "$BRANDING_DIR/mobile/ios/LaunchScreen.storyboard" "$MOBILE_DIR/ios/ImidusCustomerApp/"
fi
# Copy splash to iOS
if [ -f "$MOBILE_DIR/src/assets/images/splash.png" ]; then
    cp -f "$MOBILE_DIR/src/assets/images/splash.png" "$MOBILE_DIR/ios/ImidusCustomerApp/Images.xcassets/Splash.imageset/splash.png"
fi
# Create Contents.json for Splash.imageset
if [ ! -f "$MOBILE_DIR/ios/ImidusCustomerApp/Images.xcassets/Splash.imageset/Contents.json" ]; then
    cat > "$MOBILE_DIR/ios/ImidusCustomerApp/Images.xcassets/Splash.imageset/Contents.json" <<EOF
{
  "images" : [
    {
      "filename" : "splash.png",
      "idiom" : "universal",
      "scale" : "1x"
    }
  ],
  "info" : {
    "author" : "xcode",
    "version" : 1
  }
}
EOF
fi

# Path Aliases
echo -e "${GREEN}Configuring path aliases...${NC}"
# Update tsconfig.json
cat > "$MOBILE_DIR/tsconfig.json" <<EOF
{
  "extends": "@react-native/typescript-config/tsconfig.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/theme": ["src/theme/index.ts"],
      "@/components/*": ["src/components/*"],
      "@/assets/*": ["src/assets/*"]
    }
  }
}
EOF

# Update babel.config.js
cat > "$MOBILE_DIR/babel.config.js" <<EOF
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: {
          '@/theme': './src/theme',
          '@/components': './src/components',
          '@/assets': './src/assets',
        },
      },
    ],
  ],
};
EOF

# Install babel-plugin-module-resolver
echo -e "${GREEN}Installing babel-plugin-module-resolver...${NC}"
cd "$MOBILE_DIR"
# Check if npm or yarn or pnpm is used
if [ -f "pnpm-lock.yaml" ]; then
    pnpm install --save-dev babel-plugin-module-resolver
elif [ -f "yarn.lock" ]; then
    yarn add --dev babel-plugin-module-resolver
else
    npm install --save-dev babel-plugin-module-resolver
fi

# 2. Web Ordering Site (src/web)
WEB_DIR="$TOAST_DIR/src/web"
echo -e "${GREEN}🌐 Setting up web ordering site...${NC}"
mkdir -p "$WEB_DIR/public/images"
mkdir -p "$WEB_DIR/src/styles"
mkdir -p "$WEB_DIR/src/components/layout"

cp -f "$BRANDING_DIR/web/public/images/"* "$WEB_DIR/public/images/"
cp -f "$BRANDING_DIR/web/src/styles/globals.css" "$WEB_DIR/src/styles/"
if [ -d "$BRANDING_DIR/web/src/components/layout" ]; then
    cp -rf "$BRANDING_DIR/web/src/components/layout/"* "$WEB_DIR/src/components/layout/"
fi

# 3. Admin Portal (src/admin)
ADMIN_DIR="$TOAST_DIR/src/admin"
echo -e "${GREEN}⚙️  Setting up admin portal...${NC}"
mkdir -p "$ADMIN_DIR/public/images"
mkdir -p "$ADMIN_DIR/src/styles"
mkdir -p "$ADMIN_DIR/src/components/layout"

cp -f "$BRANDING_DIR/admin/public/images/"* "$ADMIN_DIR/public/images/"
if [ -f "$BRANDING_DIR/admin/src/styles/globals.css" ]; then
    cp -f "$BRANDING_DIR/admin/src/styles/globals.css" "$ADMIN_DIR/src/styles/"
else
    cp -f "$BRANDING_DIR/web/src/styles/globals.css" "$ADMIN_DIR/src/styles/"
fi
if [ -d "$BRANDING_DIR/admin/src/components/layout" ]; then
    cp -rf "$BRANDING_DIR/admin/src/components/layout/"* "$ADMIN_DIR/src/components/layout/"
fi

# 4. Backend
BACKEND_DIR="$TOAST_DIR/src/backend/IntegrationService.API"
echo -e "${GREEN}⚡ Setting up .NET backend...${NC}"
mkdir -p "$BACKEND_DIR/Constants"
mkdir -p "$BACKEND_DIR/Templates/Email"
mkdir -p "$BACKEND_DIR/Services"

if [ -f "$BRANDING_DIR/backend/ImidusConstants.cs" ]; then
    cp -f "$BRANDING_DIR/backend/ImidusConstants.cs" "$BACKEND_DIR/Constants/"
fi

if [ -f "$BRANDING_DIR/backend/BaseEmailTemplate.html" ]; then
    cp -f "$BRANDING_DIR/backend/BaseEmailTemplate.html" "$BACKEND_DIR/Templates/Email/"
fi

# Note: EmailService.cs is not in the branding package based on the list, so we skip it.

echo -e "${GREEN}✅ Branding installation complete!${NC}"
