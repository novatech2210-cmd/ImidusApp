#!/bin/bash
#==============================================================================
# Imidus POS Integration - Deployment Script
#==============================================================================
# Usage: ./deploy.sh [staging|production]
#==============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
AWS_S3_BUCKET="inirestaurant"
AWS_REGION="us-east-1"
VERSION=$(date +%Y%m%d)-$(git rev-parse --short HEAD 2>/dev/null || echo "manual")

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}Imidus POS Integration - Deployment Script${NC}"
echo -e "${BLUE}Version: $VERSION${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Parse arguments
ENVIRONMENT=${1:-staging}
if [ "$ENVIRONMENT" != "staging" ] && [ "$ENVIRONMENT" != "production" ]; then
    echo -e "${RED}Error: Invalid environment. Use 'staging' or 'production'${NC}"
    exit 1
fi

echo -e "${YELLOW}Environment: $ENVIRONMENT${NC}"
echo ""

#==============================================================================
# Function: Deploy Backend
#==============================================================================
deploy_backend() {
    echo -e "${BLUE}[1/4] Deploying Backend Service...${NC}"
    
    cd ../src/backend
    
    # Build the application
    echo "Building .NET application..."
    dotnet publish IntegrationService.API/IntegrationService.API.csproj \
        --configuration Release \
        --output ../../deployment/backend-publish \
        --self-contained true \
        -r win-x64
    
    # Create versioned release
    cd ../../deployment
    zip -r backend-$VERSION.zip backend-publish/
    
    # Upload to S3
    echo "Uploading to S3..."
    aws s3 cp backend-$VERSION.zip \
        s3://$AWS_S3_BUCKET/releases/backend/$VERSION/
    
    # Create latest symlink
    echo $VERSION > latest-backend.txt
    aws s3 cp latest-backend.txt s3://$AWS_S3_BUCKET/releases/backend/latest.txt
    
    echo -e "${GREEN}✓ Backend deployed successfully${NC}"
    echo "  MSI: s3://$AWS_S3_BUCKET/releases/backend/$VERSION/"
    echo ""
}

#==============================================================================
# Function: Deploy Web
#==============================================================================
deploy_web() {
    echo -e "${BLUE}[2/4] Deploying Web Platform...${NC}"
    
    cd ../src/web
    
    # Install dependencies
    echo "Installing npm dependencies..."
    npm ci
    
    # Build the application
    echo "Building Next.js application..."
    if [ "$ENVIRONMENT" = "production" ]; then
        NEXT_PUBLIC_API_URL="https://api.imidus.com/api" npm run build
    else
        NEXT_PUBLIC_API_URL="http://localhost:5004/api" npm run build
    fi
    
    # Export static files
    npm run export
    
    # Deploy to S3
    cd ../..
    if [ "$ENVIRONMENT" = "production" ]; then
        S3_PATH="s3://$AWS_S3_BUCKET/"
    else
        S3_PATH="s3://$AWS_S3_BUCKET/staging/"
    fi
    
    echo "Deploying to S3: $S3_PATH"
    
    # Sync with cache headers
    aws s3 sync src/web/dist $S3_PATH \
        --delete \
        --cache-control "max-age=31536000,immutable" \
        --exclude "*.html" \
        --exclude "*.json"
    
    aws s3 sync src/web/dist $S3_PATH \
        --cache-control "max-age=0,no-cache,no-store,must-revalidate" \
        --include "*.html" \
        --include "*.json"
    
    echo -e "${GREEN}✓ Web platform deployed successfully${NC}"
    echo "  URL: https://$AWS_S3_BUCKET.s3-website-$AWS_REGION.amazonaws.com/"
    echo ""
}

#==============================================================================
# Function: Deploy Mobile
#==============================================================================
deploy_mobile() {
    echo -e "${BLUE}[3/4] Building Mobile Apps...${NC}"
    
    cd ../src/mobile
    
    # Install dependencies
    echo "Installing npm dependencies..."
    npm ci
    
    # Build Android APK
    echo "Building Android APK..."
    cd android
    ./gradlew assembleRelease
    
    # Upload to S3
    cd ../..
    aws s3 cp src/mobile/android/app/build/outputs/apk/release/app-release.apk \
        s3://$AWS_S3_BUCKET/mobile/android/imidus-customer-app-$VERSION.apk
    
    echo -e "${GREEN}✓ Mobile apps built successfully${NC}"
    echo "  APK: s3://$AWS_S3_BUCKET/mobile/android/"
    echo ""
}

#==============================================================================
# Function: Generate Deployment Report
#==============================================================================
generate_report() {
    echo -e "${BLUE}[4/4] Generating Deployment Report...${NC}"
    
    cat > DEPLOYMENT-$VERSION.md <<EOF
# Imidus POS Integration - Deployment Report

**Version:** $VERSION  
**Environment:** $ENVIRONMENT  
**Date:** $(date)  
**Deployed By:** $(whoami)

## Artifacts

### Backend Service
- **MSI Installer:** s3://$AWS_S3_BUCKET/releases/backend/$VERSION/ImidusPOSIntegration-Setup.msi
- **Portable ZIP:** s3://$AWS_S3_BUCKET/releases/backend/$VERSION/ImidusPOSIntegration-Portable.zip

### Web Platform
- **URL:** https://$AWS_S3_BUCKET.s3-website-$AWS_REGION.amazonaws.com/
- **Environment:** $ENVIRONMENT

### Mobile Apps
- **Android APK:** s3://$AWS_S3_BUCKET/mobile/android/imidus-customer-app-$VERSION.apk

## Installation Instructions

### Backend Service (Windows Server)

1. Download the MSI installer:
   \`\`\`powershell
   aws s3 cp s3://$AWS_S3_BUCKET/releases/backend/$VERSION/ImidusPOSIntegration-Setup.msi .
   \`\``

2. Run the installer as Administrator:
   \`\`\`powershell
   msiexec /i ImidusPOSIntegration-Setup.msi /qn
   \`\``

3. Configure the service:
   - Edit \`C:\\Program Files\\Imidus POS Integration\\appsettings.json\`
   - Update database connection strings
   - Set Authorize.net credentials
   - Configure JWT secret

4. Start the service:
   \`\`\`powershell
   net start ImidusPOSIntegration
   \`\``

### Web Platform (Customer Ordering)

Already deployed to S3 static website hosting.

URL: https://$AWS_S3_BUCKET.s3-website-$AWS_REGION.amazonaws.com/

### Mobile Apps

Download APK from S3 and distribute via:
- Direct download link
- Firebase App Distribution
- Google Play Store (requires Play Console setup)

## Configuration Checklist

- [ ] POS Database connection string configured
- [ ] IntegrationService database connection string configured
- [ ] Authorize.net API credentials (production)
- [ ] Firebase project configured
- [ ] JWT secret key set
- [ ] CORS origins configured for web/mobile
- [ ] Windows Service configured
- [ ] Firewall rules applied (port 5004)

## Verification

1. Health Check: http://localhost:5004/health
2. Menu API: http://localhost:5004/api/menu/categories
3. Web Platform: https://$AWS_S3_BUCKET.s3-website-$AWS_REGION.amazonaws.com/

## Rollback Plan

To rollback to previous version:
\`\`\`powershell
# Download previous version
aws s3 cp s3://$AWS_S3_BUCKET/releases/backend/PREVIOUS_VERSION/ImidusPOSIntegration-Setup.msi .

# Uninstall current version
msiexec /x ImidusPOSIntegration-Setup.msi /qn

# Install previous version
msiexec /i ImidusPOSIntegration-Setup-PREVIOUS.msi /qn
\`\``

## Support

- **Team:** Novatech Build Team
- **Contact:** novatech2210@gmail.com
- **Client:** Sung Bin Im - Imidus Technologies

EOF

    aws s3 cp DEPLOYMENT-$VERSION.md s3://$AWS_S3_BUCKET/releases/deployment-reports/
    
    echo -e "${GREEN}✓ Deployment report generated${NC}"
    echo "  Report: DEPLOYMENT-$VERSION.md"
    echo ""
}

#==============================================================================
# Main Execution
#==============================================================================

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed${NC}"
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}Error: AWS credentials not configured${NC}"
    exit 1
fi

# Check .NET SDK
if ! command -v dotnet &> /dev/null; then
    echo -e "${RED}Error: .NET SDK is not installed${NC}"
    exit 1
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ All prerequisites met${NC}"
echo ""

# Execute deployments
cd "$(dirname "$0")"

deploy_backend
deploy_web
deploy_mobile
generate_report

# Summary
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "${BLUE}Version:${NC} $VERSION"
echo -e "${BLUE}Environment:${NC} $ENVIRONMENT"
echo ""
echo -e "${YELLOW}Backend:${NC} s3://$AWS_S3_BUCKET/releases/backend/$VERSION/"
echo -e "${YELLOW}Web:${NC} https://$AWS_S3_BUCKET.s3-website-$AWS_REGION.amazonaws.com/"
echo -e "${YELLOW}Mobile:${NC} s3://$AWS_S3_BUCKET/mobile/android/"
echo ""
echo -e "${GREEN}All components deployed successfully!${NC}"
