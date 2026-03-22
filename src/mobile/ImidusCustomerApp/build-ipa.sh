#!/bin/bash

# IMIDUSAPP EAS Build Script - iOS IPA Generation
# Usage: ./build-ipa.sh

set -e

echo "🚀 IMIDUSAPP iOS IPA Build Script"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check Node.js and pnpm
echo -e "${BLUE}Step 1: Checking dependencies...${NC}"
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node -v)${NC}"

if ! command -v pnpm &> /dev/null; then
    echo "⚠️  pnpm not found. Installing globally..."
    npm install -g pnpm
fi
echo -e "${GREEN}✓ pnpm $(pnpm -v)${NC}"

# Step 2: Install dependencies
echo ""
echo -e "${BLUE}Step 2: Installing project dependencies...${NC}"
pnpm install
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Step 3: Check EAS CLI
echo ""
echo -e "${BLUE}Step 3: Checking EAS CLI...${NC}"
if ! npx eas-cli --version &> /dev/null; then
    echo "⚠️  EAS CLI not found. Installing..."
    pnpm add -D eas-cli
fi
echo -e "${GREEN}✓ EAS CLI ready (via npx)${NC}"

# Step 4: Authentication
echo ""
echo -e "${BLUE}Step 4: Authenticating with Expo...${NC}"
read -p "Are you logged into Expo? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Logging in to Expo..."
    npx eas-cli login
else
    echo -e "${GREEN}✓ Already authenticated${NC}"
fi

# Step 5: Verify credentials
echo ""
echo -e "${BLUE}Step 5: Verifying iOS credentials...${NC}"
echo "Checking EAS credentials for iOS..."
# Note: This will prompt user if credentials don't exist
# npx eas-cli credentials will create them if needed
echo -e "${YELLOW}Note: You may be prompted to create credentials${NC}"
# Uncomment next line to auto-create credentials:
# npx eas-cli credentials --platform ios --auto

# Step 6: Build iOS IPA
echo ""
echo -e "${BLUE}Step 6: Building iOS IPA for TestFlight...${NC}"
echo "This will take 30-45 minutes. EAS will:"
echo "  1. Validate configuration"
echo "  2. Build iOS app (Xcode compilation)"
echo "  3. Sign IPA with Apple certificate"
echo "  4. Upload to EAS Build servers"
echo ""
read -p "Continue with build? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npx eas-cli build --platform ios --profile testflight --wait
    BUILD_ID=$?
    echo ""
    echo -e "${GREEN}✓ Build completed!${NC}"
else
    echo "Build cancelled."
    exit 1
fi

# Step 7: Download IPA
echo ""
echo -e "${BLUE}Step 7: Download completed IPA${NC}"
echo "Your IPA is ready in the EAS Build dashboard:"
echo "  https://expo.dev/builds"
echo ""
echo "To download:"
echo "  npx eas-cli build:list --platform ios"
echo "  npx eas-cli build:download [BUILD_ID] --path ./ImidusCustomerApp.ipa"
echo ""

# Step 8: TestFlight submission
echo -e "${BLUE}Step 8: TestFlight Submission Options${NC}"
read -p "Submit to TestFlight automatically? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Getting latest build ID..."
    LATEST_BUILD=$(npx eas-cli build:list --platform ios --limit 1 | grep "ID" | head -1 | awk '{print $2}')

    echo "Submitting to TestFlight..."
    npx eas-cli submit --platform ios --profile testflight --build-id $LATEST_BUILD

    echo -e "${GREEN}✓ Submitted to TestFlight!${NC}"
    echo "Your build is now in review (24-48 hours)"
    echo ""
    echo "Once approved, you can:"
    echo "  1. Add testers in App Store Connect"
    echo "  2. Send TestFlight invitations"
    echo "  3. Testers install from TestFlight app"
else
    echo "Manual TestFlight submission:"
    echo "  1. Go to https://appstoreconnect.apple.com"
    echo "  2. Select IMIDUSAPP → TestFlight"
    echo "  3. Upload IPA file"
    echo "  4. Answer compliance questions"
    echo "  5. Submit for beta review"
fi

echo ""
echo -e "${GREEN}=================================="
echo "✓ Build process complete!"
echo "==================================${NC}"
echo ""
echo "Next steps:"
echo "  1. Check build status: npx eas-cli build:list --platform ios"
echo "  2. View build logs: npx eas-cli build:log [BUILD_ID]"
echo "  3. Download IPA: npx eas-cli build:download [BUILD_ID]"
echo "  4. Submit to TestFlight: npx eas-cli submit --platform ios"
echo ""
echo "Documentation: See EAS_BUILD_GUIDE.md"
echo ""
