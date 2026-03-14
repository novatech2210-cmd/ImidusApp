#!/bin/bash
# Android Release Build Script
# Usage: ./scripts/build-release.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ANDROID_DIR="$(dirname "$SCRIPT_DIR")"
APP_DIR="$ANDROID_DIR/app"
BUILD_DIR="$APP_DIR/build/outputs/apk/release"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo "🤖 ImidusCustomerApp Android Build Script"
echo "=========================================="
echo "Build Dir: $BUILD_DIR"
echo "Timestamp: $TIMESTAMP"
echo ""

cd "$ANDROID_DIR"

# Check for keystore
if [ ! -f "app/imidus-release.keystore" ]; then
    echo "❌ Error: Release keystore not found"
    echo "   Expected: app/imidus-release.keystore"
    exit 1
fi

# Check for keystore.properties
if [ ! -f "keystore.properties" ]; then
    echo "⚠️  Warning: keystore.properties not found"
    echo "   Creating from template..."
    cat > keystore.properties << EOF
storeFile=imidus-release.keystore
storePassword=your-store-password
keyAlias=imidus-key
keyPassword=your-key-password
EOF
    echo "   Please update keystore.properties with actual credentials"
fi

# Clean previous build
echo "🧹 Cleaning previous builds..."
./gradlew clean

# Build release APK
echo "🔨 Building release APK..."
./gradlew assembleRelease

# Check if APK was created
if [ -f "$BUILD_DIR/app-release.apk" ]; then
    APK_SIZE=$(ls -lh "$BUILD_DIR/app-release.apk" | awk '{print $5}')

    # Copy with timestamp
    cp "$BUILD_DIR/app-release.apk" "$BUILD_DIR/ImidusCustomerApp-$TIMESTAMP.apk"

    echo ""
    echo "🎉 Build Complete!"
    echo "=================="
    echo "📦 APK: $BUILD_DIR/app-release.apk ($APK_SIZE)"
    echo "📦 Timestamped: $BUILD_DIR/ImidusCustomerApp-$TIMESTAMP.apk"
    echo ""
    echo "Next steps:"
    echo "  1. Test on device: adb install -r $BUILD_DIR/app-release.apk"
    echo "  2. Upload to S3: aws s3 cp $BUILD_DIR/app-release.apk s3://inirestaurant/novatech/"
    echo "  3. Upload to Play Store: ./scripts/upload-playstore.sh"
else
    echo "❌ Build failed - APK not found"
    exit 1
fi
