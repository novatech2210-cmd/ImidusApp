#!/bin/bash
# =============================================================================
# TOAST Platform - Test All Apps Locally
# Run after setup-dev-env.sh completes
# =============================================================================

TOAST_DIR="/home/kali/Desktop/TOAST/src"
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          TOAST Platform - Local Testing Suite                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Load NVM
export NVM_DIR="$HOME/.config/nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 18 2>/dev/null

# =============================================================================
# TEST 1: Database Connection
# =============================================================================
echo -e "${YELLOW}━━━ TEST 1: Database Connection ━━━${NC}"

DB_TEST=$(docker exec sql_server /opt/mssql-tools18/bin/sqlcmd \
    -S localhost -U sa -P 'ToastSQL@2025!' -C \
    -Q "SELECT COUNT(*) as TableCount FROM INI_Restaurant.INFORMATION_SCHEMA.TABLES" \
    -h -1 2>/dev/null | head -1 | tr -d ' ')

if [ "$DB_TEST" -gt 0 ] 2>/dev/null; then
    echo -e "${GREEN}✓ Database connected - $DB_TEST tables found${NC}"
    
    # Check critical tables
    echo "  Checking critical tables..."
    for table in tblSales tblItem tblMisc tblOnlineOrders tblPayment tblCustomer; do
        EXISTS=$(docker exec sql_server /opt/mssql-tools18/bin/sqlcmd \
            -S localhost -U sa -P 'ToastSQL@2025!' -C \
            -Q "SELECT COUNT(*) FROM INI_Restaurant.INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME='$table'" \
            -h -1 2>/dev/null | head -1 | tr -d ' ')
        if [ "$EXISTS" == "1" ]; then
            echo -e "  ${GREEN}✓ $table${NC}"
        else
            echo -e "  ${RED}✗ $table NOT FOUND${NC}"
        fi
    done
    
    # Check tax rates
    echo ""
    echo "  Tax configuration from tblMisc:"
    docker exec sql_server /opt/mssql-tools18/bin/sqlcmd \
        -S localhost -U sa -P 'ToastSQL@2025!' -C \
        -Q "SELECT Code, Value FROM INI_Restaurant.dbo.tblMisc WHERE Code IN ('GST','PST')" \
        2>/dev/null
else
    echo -e "${RED}✗ Database connection failed${NC}"
    echo "  Make sure Docker SQL Server is running: docker start sql_server"
fi
echo ""

# =============================================================================
# TEST 2: Backend API
# =============================================================================
echo -e "${YELLOW}━━━ TEST 2: Backend API (.NET) ━━━${NC}"

cd "$TOAST_DIR/backend" 2>/dev/null

if [ -f "ImidusPos.slnx" ] || [ -d "IntegrationService.API" ]; then
    if [ -d "IntegrationService.API" ]; then
        echo -e "${GREEN}✓ Backend project found${NC}"
        echo "  Path: $TOAST_DIR/backend"
        echo ""
        echo "To build & run the API:"
        echo "  cd $TOAST_DIR/backend"
        echo "  dotnet build IntegrationService.API"
        echo "  dotnet run --project IntegrationService.API"
        echo "  Then open: http://localhost:5000/swagger"
    fi
else
    echo -e "${YELLOW}⚠ Backend project not found${NC}"
    echo "  Expected: $TOAST_DIR/backend/IntegrationService.API"
fi
echo ""

# =============================================================================
# TEST 3: Web Application
# =============================================================================
echo -e "${YELLOW}━━━ TEST 3: Web Application (Next.js) ━━━${NC}"

cd "$TOAST_DIR/web" 2>/dev/null

if [ -f "package.json" ]; then
    echo -e "${GREEN}✓ Web project found${NC}"
    echo "  Path: $TOAST_DIR/web"
    echo ""
    echo "To run the web app:"
    echo "  cd $TOAST_DIR/web"
    echo "  pnpm install"
    echo "  pnpm dev"
    echo "  Then open: http://localhost:3000"
else
    echo -e "${YELLOW}⚠ Web project not found at $TOAST_DIR/web${NC}"
fi
echo ""

# =============================================================================
# TEST 4: Mobile Application
# =============================================================================
echo -e "${YELLOW}━━━ TEST 4: Mobile Application (React Native) ━━━${NC}"

cd "$TOAST_DIR/mobile/ImidusCustomerApp" 2>/dev/null

if [ -f "package.json" ]; then
    echo -e "${GREEN}✓ Mobile project found${NC}"
    echo "  Path: $TOAST_DIR/mobile/ImidusCustomerApp"
    
    # Check Android build
    if [ -f "android/gradlew" ]; then
        if [ -f "android/app/build/outputs/apk/debug/app-debug.apk" ]; then
            APK_SIZE=$(du -h android/app/build/outputs/apk/debug/app-debug.apk | cut -f1)
            echo -e "${GREEN}✓ Android APK built ($APK_SIZE)${NC}"
            echo "  APK: $TOAST_DIR/mobile/ImidusCustomerApp/android/app/build/outputs/apk/debug/app-debug.apk"
        else
            echo -e "${YELLOW}⚠ Android APK not built yet${NC}"
        fi
    fi
    
    echo ""
    echo "To run on Android emulator:"
    echo "  1. Start Android Studio: /opt/android-studio/bin/studio.sh"
    echo "  2. Create/start an AVD"
    echo "  3. cd $TOAST_DIR/mobile/ImidusCustomerApp"
    echo "  4. pnpm install"
    echo "  5. pnpm start (in one terminal)"
    echo "  6. pnpm android (in another terminal)"
else
    echo -e "${YELLOW}⚠ Mobile project not found at $TOAST_DIR/mobile/ImidusCustomerApp${NC}"
fi
echo ""

# =============================================================================
# SUMMARY
# =============================================================================
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    TEST SUMMARY                                ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Manual Testing Checklist:"
echo ""
echo "□ 1. DATABASE: Verify INI_Restaurant tables exist"
echo "     sqlcmd query: SELECT * FROM tblMisc WHERE Code='GST'"
echo ""
echo "□ 2. BACKEND API: Start and test endpoints"
echo "     GET /api/menu - Should return menu items from tblItem"
echo "     POST /api/orders - Should write to tblSales"
echo ""
echo "□ 3. WEB APP: Test ordering flow"
echo "     - Browse menu"
echo "     - Add to cart"
echo "     - Checkout with test card 4111111111111111"
echo "     - Verify order in POS database"
echo ""
echo "□ 4. ANDROID APP: Test on emulator"
echo "     - Same flow as web"
echo "     - Test push notifications"
echo ""
echo "□ 5. iOS APP: Test via Xcode/Simulator (if on Mac)"
echo "     - Or via TestFlight if deployed"
echo ""
echo -e "${YELLOW}Once all tests pass, run: ./prepare-delivery.sh${NC}"
