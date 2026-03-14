#!/bin/bash
# iOS Signing Setup Script
# This script helps set up code signing for iOS builds

set -e

echo "🔐 iOS Code Signing Setup"
echo "========================="
echo ""

# Check if running on macOS
if [[ "$(uname)" != "Darwin" ]]; then
    echo "❌ Error: This script must be run on macOS"
    exit 1
fi

# Configuration
APP_IDENTIFIER="com.imidus.customer"
APP_NAME="ImidusCustomerApp"

echo "📋 Prerequisites Checklist:"
echo "  [ ] Apple Developer Account ($99/year)"
echo "  [ ] Team ID from Apple Developer Portal"
echo "  [ ] Xcode installed with Apple ID signed in"
echo ""

read -p "Have you completed the prerequisites? (y/n): " PREREQ
if [[ "$PREREQ" != "y" ]]; then
    echo ""
    echo "Please complete the following steps first:"
    echo ""
    echo "1. Enroll in Apple Developer Program:"
    echo "   https://developer.apple.com/programs/enroll/"
    echo ""
    echo "2. Get your Team ID:"
    echo "   https://developer.apple.com/account/#/membership"
    echo ""
    echo "3. Sign in to Xcode:"
    echo "   Xcode → Preferences → Accounts → Add Apple ID"
    echo ""
    exit 0
fi

# Get Team ID
echo ""
read -p "Enter your Apple Developer Team ID: " TEAM_ID

if [[ -z "$TEAM_ID" ]]; then
    echo "❌ Team ID is required"
    exit 1
fi

# Update ExportOptions.plist
echo ""
echo "📝 Updating ExportOptions.plist..."
cat > ExportOptions.plist << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>app-store</string>
    <key>teamID</key>
    <string>$TEAM_ID</string>
    <key>signingStyle</key>
    <string>automatic</string>
    <key>stripSwiftSymbols</key>
    <true/>
    <key>uploadBitcode</key>
    <false/>
    <key>uploadSymbols</key>
    <true/>
    <key>destination</key>
    <string>export</string>
</dict>
</plist>
EOF
echo "✅ ExportOptions.plist updated with Team ID: $TEAM_ID"

# Update Fastlane configuration
echo ""
echo "📝 Updating Fastlane configuration..."

# Update Appfile
sed -i '' "s/YOUR_TEAM_ID/$TEAM_ID/g" fastlane/Appfile 2>/dev/null || true
echo "✅ Appfile updated"

# Update Matchfile
sed -i '' "s/YOUR_TEAM_ID/$TEAM_ID/g" fastlane/Matchfile 2>/dev/null || true
echo "✅ Matchfile updated"

# Setup environment variables
echo ""
echo "📝 Setting up environment variables..."
cat >> ~/.zshrc << EOF

# iOS Build Configuration (ImidusCustomerApp)
export FASTLANE_TEAM_ID="$TEAM_ID"
export FASTLANE_APPLE_ID="novatech2210@gmail.com"
EOF
echo "✅ Environment variables added to ~/.zshrc"

# Create certificates using Match (optional)
echo ""
read -p "Do you want to setup Match for certificate management? (y/n): " SETUP_MATCH

if [[ "$SETUP_MATCH" == "y" ]]; then
    echo ""
    echo "🔑 Setting up Match..."
    echo ""
    echo "Match will store your certificates in a Git repository."
    read -p "Enter Git repository URL for certificates: " MATCH_GIT_URL

    if [[ -n "$MATCH_GIT_URL" ]]; then
        sed -i '' "s|https://github.com/novatech642/ios-certificates|$MATCH_GIT_URL|g" fastlane/Matchfile 2>/dev/null || true

        # Initialize match
        bundle exec fastlane match init

        # Generate App Store certificates
        echo ""
        echo "Generating App Store certificates..."
        bundle exec fastlane match appstore

        echo "✅ Match setup complete!"
    fi
fi

# Summary
echo ""
echo "🎉 Signing Setup Complete!"
echo "=========================="
echo ""
echo "Configuration:"
echo "  Team ID: $TEAM_ID"
echo "  App ID: $APP_IDENTIFIER"
echo "  App Name: $APP_NAME"
echo ""
echo "Files updated:"
echo "  ✅ ExportOptions.plist"
echo "  ✅ fastlane/Appfile"
echo "  ✅ fastlane/Matchfile"
echo "  ✅ ~/.zshrc (environment variables)"
echo ""
echo "Next steps:"
echo "  1. Restart terminal or run: source ~/.zshrc"
echo "  2. Open Xcode and configure signing:"
echo "     xed ImidusCustomerApp.xcworkspace"
echo "  3. Build the app:"
echo "     ./scripts/build-local.sh"
echo ""
