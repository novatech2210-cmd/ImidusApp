#!/bin/bash
# Upload IPA to TestFlight
# Usage: ./scripts/upload-testflight.sh [path/to/ipa]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IOS_DIR="$(dirname "$SCRIPT_DIR")"
IPA_PATH=${1:-"$IOS_DIR/build/ImidusCustomerApp.ipa"}

echo "🚀 TestFlight Upload Script"
echo "==========================="
echo ""

# Check if running on macOS
if [[ "$(uname)" != "Darwin" ]]; then
    echo "❌ Error: This script must be run on macOS"
    exit 1
fi

# Check if IPA exists
if [ ! -f "$IPA_PATH" ]; then
    echo "❌ Error: IPA file not found: $IPA_PATH"
    echo ""
    echo "Build the IPA first:"
    echo "  ./scripts/build-local.sh"
    exit 1
fi

IPA_SIZE=$(ls -lh "$IPA_PATH" | awk '{print $5}')
echo "📦 IPA: $IPA_PATH ($IPA_SIZE)"
echo ""

# Check for required environment variables
if [[ -z "$FASTLANE_APPLE_ID" ]]; then
    echo "⚠️  FASTLANE_APPLE_ID not set"
    read -p "Enter Apple ID email: " FASTLANE_APPLE_ID
fi

if [[ -z "$FASTLANE_APPLE_APPLICATION_SPECIFIC_PASSWORD" ]]; then
    echo ""
    echo "⚠️  App-specific password required for uploads"
    echo "   Generate at: https://appleid.apple.com/account/manage"
    echo ""
    read -s -p "Enter app-specific password: " FASTLANE_APPLE_APPLICATION_SPECIFIC_PASSWORD
    echo ""
fi

cd "$IOS_DIR"

# Option 1: Use Fastlane (recommended)
echo ""
echo "📤 Uploading to TestFlight via Fastlane..."
bundle exec fastlane pilot upload \
    --ipa "$IPA_PATH" \
    --skip_waiting_for_build_processing true \
    --changelog "Build $(date +%Y%m%d%H%M)"

echo ""
echo "✅ Upload Complete!"
echo ""
echo "Next steps:"
echo "  1. Go to App Store Connect: https://appstoreconnect.apple.com"
echo "  2. Select ImidusCustomerApp → TestFlight"
echo "  3. Wait for processing (10-30 minutes)"
echo "  4. Add testers to Internal Testing group"
echo ""
