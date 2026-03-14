#!/bin/bash
# Upload APK to S3
# Usage: ./scripts/upload-s3.sh [path/to/apk]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ANDROID_DIR="$(dirname "$SCRIPT_DIR")"
APK_PATH=${1:-"$ANDROID_DIR/app/build/outputs/apk/release/app-release.apk"}

S3_BUCKET="inirestaurant"
S3_PATH="novatech"
VERSION="1.0"
BUILD_NUMBER=$(date +"%Y%m%d%H%M")

echo "☁️  S3 Upload Script"
echo "==================="
echo ""

# Check if APK exists
if [ ! -f "$APK_PATH" ]; then
    echo "❌ Error: APK not found: $APK_PATH"
    echo ""
    echo "Build the APK first:"
    echo "  cd android && ./gradlew assembleRelease"
    exit 1
fi

APK_SIZE=$(ls -lh "$APK_PATH" | awk '{print $5}')
echo "📦 APK: $APK_PATH ($APK_SIZE)"
echo ""

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not installed"
    echo "   Install: pip install awscli"
    echo "   Or: brew install awscli"
    exit 1
fi

# Upload to S3
S3_DEST="s3://$S3_BUCKET/$S3_PATH/android/ImidusCustomerApp-v$VERSION-$BUILD_NUMBER.apk"

echo "📤 Uploading to S3..."
aws s3 cp "$APK_PATH" "$S3_DEST"

# Also upload as "latest"
aws s3 cp "$APK_PATH" "s3://$S3_BUCKET/$S3_PATH/android/ImidusCustomerApp-latest.apk"

# Generate pre-signed URL (7 days)
echo ""
echo "🔗 Generating download URL..."
DOWNLOAD_URL=$(aws s3 presign "$S3_DEST" --expires-in 604800)

echo ""
echo "✅ Upload Complete!"
echo "=================="
echo ""
echo "S3 Location: $S3_DEST"
echo ""
echo "Download URL (valid 7 days):"
echo "$DOWNLOAD_URL"
echo ""
echo "Latest URL:"
echo "s3://$S3_BUCKET/$S3_PATH/android/ImidusCustomerApp-latest.apk"
