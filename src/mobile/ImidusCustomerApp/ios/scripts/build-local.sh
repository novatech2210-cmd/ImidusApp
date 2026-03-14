#!/bin/bash
# Local iOS build script
# Usage: ./scripts/build-local.sh [staging|production]

set -e

ENVIRONMENT=${1:-staging}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IOS_DIR="$(dirname "$SCRIPT_DIR")"
BUILD_DIR="$IOS_DIR/build"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo "🍎 ImidusCustomerApp iOS Build Script"
echo "======================================"
echo "Environment: $ENVIRONMENT"
echo "Build Dir: $BUILD_DIR"
echo "Timestamp: $TIMESTAMP"
echo ""

# Check if running on macOS
if [[ "$(uname)" != "Darwin" ]]; then
    echo "❌ Error: This script must be run on macOS"
    echo "   iOS builds require Xcode which is only available on macOS"
    exit 1
fi

# Check Xcode installation
if ! command -v xcodebuild &> /dev/null; then
    echo "❌ Error: Xcode is not installed"
    echo "   Please install Xcode from the App Store"
    exit 1
fi

# Show Xcode version
echo "📱 Xcode Version:"
xcodebuild -version
echo ""

# Navigate to iOS directory
cd "$IOS_DIR"

# Install Ruby dependencies
echo "💎 Installing Ruby dependencies..."
if command -v bundle &> /dev/null; then
    bundle install
else
    echo "   Installing Bundler..."
    gem install bundler
    bundle install
fi

# Install CocoaPods dependencies
echo "📦 Installing CocoaPods dependencies..."
if [ ! -f "Podfile.lock" ] || [ "Podfile" -nt "Podfile.lock" ]; then
    pod install --repo-update
else
    pod install
fi

# Create build directory
mkdir -p "$BUILD_DIR"

# Clean previous build
echo "🧹 Cleaning previous builds..."
xcodebuild clean -workspace ImidusCustomerApp.xcworkspace -scheme ImidusCustomerApp -configuration Release

# Build archive
echo "🔨 Building iOS archive ($ENVIRONMENT)..."
xcodebuild archive \
    -workspace ImidusCustomerApp.xcworkspace \
    -scheme ImidusCustomerApp \
    -configuration Release \
    -archivePath "$BUILD_DIR/ImidusCustomerApp-$TIMESTAMP.xcarchive" \
    -destination "generic/platform=iOS" \
    CODE_SIGN_IDENTITY="" \
    CODE_SIGNING_REQUIRED=NO \
    CODE_SIGNING_ALLOWED=NO

echo "✅ Archive created: $BUILD_DIR/ImidusCustomerApp-$TIMESTAMP.xcarchive"

# Export IPA (requires valid signing)
echo "📤 Exporting IPA..."
if [ -f "ExportOptions.plist" ]; then
    xcodebuild -exportArchive \
        -archivePath "$BUILD_DIR/ImidusCustomerApp-$TIMESTAMP.xcarchive" \
        -exportPath "$BUILD_DIR" \
        -exportOptionsPlist ExportOptions.plist \
        || echo "⚠️  IPA export failed - check signing configuration"
else
    echo "⚠️  ExportOptions.plist not found, skipping IPA export"
fi

# Check if IPA was created
if [ -f "$BUILD_DIR/ImidusCustomerApp.ipa" ]; then
    IPA_SIZE=$(ls -lh "$BUILD_DIR/ImidusCustomerApp.ipa" | awk '{print $5}')
    echo ""
    echo "🎉 Build Complete!"
    echo "=================="
    echo "📦 IPA: $BUILD_DIR/ImidusCustomerApp.ipa ($IPA_SIZE)"
    echo "📁 Archive: $BUILD_DIR/ImidusCustomerApp-$TIMESTAMP.xcarchive"
    echo ""
    echo "Next steps:"
    echo "  1. Upload to TestFlight: fastlane upload_testflight"
    echo "  2. Upload to S3: aws s3 cp $BUILD_DIR/ImidusCustomerApp.ipa s3://inirestaurant/novatech/ios/"
else
    echo ""
    echo "⚠️  Archive created but IPA export requires signing"
    echo "    Archive: $BUILD_DIR/ImidusCustomerApp-$TIMESTAMP.xcarchive"
    echo ""
    echo "To export IPA with signing:"
    echo "  1. Open Xcode: open ImidusCustomerApp.xcworkspace"
    echo "  2. Product → Archive"
    echo "  3. Distribute App → App Store Connect"
fi
