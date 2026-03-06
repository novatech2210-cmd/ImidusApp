#!/bin/bash
# =============================================================================
# TOAST Platform - Prepare Final Delivery to S3
# Run after all tests pass
# =============================================================================

TOAST_DIR="/home/kali/Desktop/TOAST"
DELIVERY_DIR="/home/kali/Desktop/TOAST_DELIVERY_$(date +%Y%m%d_%H%M%S)"
S3_BUCKET="s3://inirestaurant/Novatech"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     TOAST Platform - Final Delivery Preparation               ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Create delivery directory
mkdir -p "$DELIVERY_DIR"
cd "$DELIVERY_DIR"

# =============================================================================
# 1. Package Mobile Apps
# =============================================================================
echo -e "${YELLOW}[1/5] Packaging Mobile Apps...${NC}"

mkdir -p M2_Mobile_Apps

# Android APK
if [ -f "$TOAST_DIR/mobile/android/app/build/outputs/apk/release/app-release.apk" ]; then
    cp "$TOAST_DIR/mobile/android/app/build/outputs/apk/release/app-release.apk" \
        "M2_Mobile_Apps/TOAST-Android-v1.0.0.apk"
    echo -e "${GREEN}✓ Release APK packaged${NC}"
elif [ -f "$TOAST_DIR/mobile/android/app/build/outputs/apk/debug/app-debug.apk" ]; then
    cp "$TOAST_DIR/mobile/android/app/build/outputs/apk/debug/app-debug.apk" \
        "M2_Mobile_Apps/TOAST-Android-v1.0.0-debug.apk"
    echo -e "${YELLOW}⚠ Debug APK packaged (release not found)${NC}"
else
    echo -e "${RED}✗ No Android APK found${NC}"
fi

# iOS IPA (if exists)
if [ -f "$TOAST_DIR/mobile/ios/build/TOAST.ipa" ]; then
    cp "$TOAST_DIR/mobile/ios/build/TOAST.ipa" "M2_Mobile_Apps/TOAST-iOS-v1.0.0.ipa"
    echo -e "${GREEN}✓ iOS IPA packaged${NC}"
else
    echo -e "${YELLOW}⚠ iOS IPA not found (requires Mac to build)${NC}"
fi

# Mobile source code
echo "Zipping mobile source..."
cd "$TOAST_DIR"
zip -r "$DELIVERY_DIR/M2_Mobile_Apps/mobile_source.zip" mobile \
    -x "mobile/node_modules/*" \
    -x "mobile/android/.gradle/*" \
    -x "mobile/android/build/*" \
    -x "mobile/android/app/build/*" \
    -x "mobile/ios/build/*" \
    -x "mobile/ios/Pods/*" \
    2>/dev/null
cd "$DELIVERY_DIR"
echo -e "${GREEN}✓ Mobile source zipped${NC}"

# =============================================================================
# 2. Package Web Application
# =============================================================================
echo -e "${YELLOW}[2/5] Packaging Web Application...${NC}"

mkdir -p M3_Web_Admin

# Build production
cd "$TOAST_DIR/web" 2>/dev/null
if [ -f "package.json" ]; then
    pnpm build 2>/dev/null
    
    # Package build output
    if [ -d ".next" ]; then
        zip -r "$DELIVERY_DIR/M3_Web_Admin/web_build.zip" .next public package.json next.config.* \
            -x "node_modules/*" 2>/dev/null
        echo -e "${GREEN}✓ Web build packaged${NC}"
    fi
    
    # Source code
    cd "$TOAST_DIR"
    zip -r "$DELIVERY_DIR/M3_Web_Admin/web_source.zip" web \
        -x "web/node_modules/*" \
        -x "web/.next/*" \
        2>/dev/null
    echo -e "${GREEN}✓ Web source zipped${NC}"
else
    echo -e "${RED}✗ Web project not found${NC}"
fi
cd "$DELIVERY_DIR"

# =============================================================================
# 3. Package Backend Service
# =============================================================================
echo -e "${YELLOW}[3/5] Packaging Backend Service...${NC}"

mkdir -p M4_Backend_Service

cd "$TOAST_DIR/backend" 2>/dev/null
if [ -f "TOASTIntegration.sln" ] || [ -d "src/IntegrationService.API" ]; then
    # Publish for Windows (target environment)
    dotnet publish src/IntegrationService.API \
        -c Release \
        -r win-x64 \
        --self-contained true \
        -o publish 2>/dev/null
    
    if [ -d "publish" ]; then
        zip -r "$DELIVERY_DIR/M4_Backend_Service/backend_publish.zip" publish 2>/dev/null
        echo -e "${GREEN}✓ Backend published for Windows${NC}"
    fi
    
    # Source code
    cd "$TOAST_DIR"
    zip -r "$DELIVERY_DIR/M4_Backend_Service/backend_source.zip" backend \
        -x "backend/*/bin/*" \
        -x "backend/*/obj/*" \
        -x "backend/publish/*" \
        2>/dev/null
    echo -e "${GREEN}✓ Backend source zipped${NC}"
else
    echo -e "${RED}✗ Backend project not found${NC}"
fi
cd "$DELIVERY_DIR"

# =============================================================================
# 4. Documentation
# =============================================================================
echo -e "${YELLOW}[4/5] Packaging Documentation...${NC}"

mkdir -p Documentation

# Copy any existing docs
cp "$TOAST_DIR"/*.md Documentation/ 2>/dev/null
cp "$TOAST_DIR"/*.docx Documentation/ 2>/dev/null
cp "$TOAST_DIR"/docs/*.md Documentation/ 2>/dev/null
cp "$TOAST_DIR"/docs/*.docx Documentation/ 2>/dev/null

# Create delivery manifest
cat > Documentation/DELIVERY_MANIFEST.md << EOF
# TOAST Platform - Final Delivery
## IMIDUS Technologies / Novatech

**Delivery Date:** $(date +"%B %d, %Y")
**Delivery Channel:** s3://inirestaurant/Novatech/

---

## Package Contents

### M2_Mobile_Apps/
- TOAST-Android-v1.0.0.apk - Production Android app
- TOAST-iOS-v1.0.0.ipa - Production iOS app (if available)
- mobile_source.zip - Complete React Native source code

### M3_Web_Admin/
- web_build.zip - Production Next.js build
- web_source.zip - Complete Next.js source code

### M4_Backend_Service/
- backend_publish.zip - Windows self-contained .NET 8 service
- backend_source.zip - Complete .NET source code

### Documentation/
- Integration specifications
- Deployment guides
- API documentation

---

## Installation Instructions

### Mobile Apps
1. Android: Install APK directly or upload to Play Console
2. iOS: Upload IPA to App Store Connect / TestFlight

### Web Application
1. Extract web_build.zip
2. Deploy to hosting (Vercel, AWS, etc.)
3. Configure environment variables

### Backend Service
1. Extract backend_publish.zip to Windows server
2. Configure appsettings.json with database connection
3. Install as Windows Service or run directly

---

## Database Configuration

- Server: [POS Server IP],1433
- Database: INI_Restaurant (from INI_Restaurant.Bak)
- CashierID: 999 (production), 998 (testing)

---

**Prepared by:** Novatech Development Team
**Contact:** novatech2210@gmail.com
EOF

echo -e "${GREEN}✓ Documentation packaged${NC}"

# =============================================================================
# 5. Upload to S3
# =============================================================================
echo -e "${YELLOW}[5/5] Uploading to AWS S3...${NC}"

# Check AWS credentials
if aws sts get-caller-identity &>/dev/null; then
    echo "AWS credentials configured"
    
    # Upload each package
    echo "Uploading M2_Mobile_Apps..."
    aws s3 cp M2_Mobile_Apps/ "$S3_BUCKET/M2_Mobile_Apps/" --recursive
    
    echo "Uploading M3_Web_Admin..."
    aws s3 cp M3_Web_Admin/ "$S3_BUCKET/M3_Web_Admin/" --recursive
    
    echo "Uploading M4_Backend_Service..."
    aws s3 cp M4_Backend_Service/ "$S3_BUCKET/M4_Backend_Service/" --recursive
    
    echo "Uploading Documentation..."
    aws s3 cp Documentation/ "$S3_BUCKET/Documentation/" --recursive
    
    echo ""
    echo -e "${GREEN}✓ All packages uploaded to S3${NC}"
    
    # List uploaded files
    echo ""
    echo "S3 Bucket Contents:"
    aws s3 ls "$S3_BUCKET/" --recursive
else
    echo -e "${YELLOW}AWS credentials not configured${NC}"
    echo ""
    echo "To upload manually, run:"
    echo "  aws configure"
    echo "  # Enter credentials from CREDENTIALS_REFERENCE.md"
    echo "  aws s3 cp $DELIVERY_DIR/ $S3_BUCKET/ --recursive"
fi

# =============================================================================
# SUMMARY
# =============================================================================
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                 DELIVERY PACKAGE READY                         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Local package location: $DELIVERY_DIR"
echo ""
echo "Contents:"
find "$DELIVERY_DIR" -type f -exec ls -lh {} \; 2>/dev/null
echo ""
echo -e "${GREEN}Ready for client delivery!${NC}"
