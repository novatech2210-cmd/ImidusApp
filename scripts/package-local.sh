#!/bin/bash

# TOAST Local Packaging Script (Robust Version)
set -e

PROJECT_ROOT=$(pwd)
DELIVERY_DIR="$PROJECT_ROOT/delivery"
BACKEND_DIR="$PROJECT_ROOT/src/backend/IntegrationService.API"
WEB_CUSTOMER_DIR="$PROJECT_ROOT/src/web"
WEB_ADMIN_DIR="$PROJECT_ROOT/src/admin"

echo "🚀 Starting Local Packaging..."

# Create delivery directory
mkdir -p "$DELIVERY_DIR"
rm -rf "$DELIVERY_DIR"/*
mkdir -p "$DELIVERY_DIR/backend"
mkdir -p "$DELIVERY_DIR/web"
mkdir -p "$DELIVERY_DIR/mobile"

package_web_app() {
    local app_dir=$1
    local output_name=$2
    
    echo "📦 Building $output_name..."
    cd "$app_dir"
    npm install --quiet
    npm run build --quiet
    
    echo "📥 Archiving $output_name..."
    # Determine what to archive
    local archive_list=""
    [ -d ".next" ] && archive_list="$archive_list .next"
    [ -d "out" ] && archive_list="$archive_list out"
    [ -d "build" ] && archive_list="$archive_list build"
    [ -d "public" ] && archive_list="$archive_list public"
    [ -f "package.json" ] && archive_list="$archive_list package.json"
    
    if [ -z "$archive_list" ]; then
        echo "❌ Error: No build artifacts found for $output_name"
        exit 1
    fi
    
    tar -czf "$DELIVERY_DIR/web/$output_name.tar.gz" $archive_list
    echo "✅ $output_name packaged."
}

# 1. Build Web Customer Ordering
package_web_app "$WEB_CUSTOMER_DIR" "customer-ordering"

# 2. Build Web Admin Portal
package_web_app "$WEB_ADMIN_DIR" "admin-portal"

# 3. Publish Backend API
echo "📦 Publishing Backend API (Linux x64)..."
cd "$BACKEND_DIR"
dotnet publish -c Release -r linux-x64 --self-contained true -o "$DELIVERY_DIR/backend/api-linux"
echo "✅ Backend API published to $DELIVERY_DIR/backend/api-linux"

# 4. Include Existing Mobile Artifacts (if available)
echo "📦 Checking for existing mobile artifacts..."
# Search in deliverables folder (preferred)
if [ -f "$PROJECT_ROOT/deliverables/ImidusCustomerApp-v2.apk" ]; then
    cp "$PROJECT_ROOT/deliverables/ImidusCustomerApp-v2.apk" "$DELIVERY_DIR/mobile/ImidusCustomerApp.apk"
    echo "✅ Existing APK found in deliverables/ and copied."
fi

# Search for any IPA in the project tree
EXISTING_IPA=$(find "$PROJECT_ROOT" -name "*.ipa" | head -n 1)
if [ -n "$EXISTING_IPA" ]; then
    cp "$EXISTING_IPA" "$DELIVERY_DIR/mobile/ImidusCustomerApp.ipa"
    echo "✅ Existing IPA found and copied."
else
    echo "ℹ️ No IPA found locally. (Requires macOS to build)."
fi

echo ""
echo "✨ Local Packaging Complete!"
echo "📂 Artifacts available in: $DELIVERY_DIR"
ls -R "$DELIVERY_DIR"
