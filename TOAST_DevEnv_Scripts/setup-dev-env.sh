#!/bin/bash
# =============================================================================
# TOAST Platform - Complete Local Development Environment Setup
# Run this on your Kali machine: chmod +x setup-dev-env.sh && ./setup-dev-env.sh
# =============================================================================

set -e  # Exit on error

TOAST_DIR="/home/kali/Desktop/TOAST"
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     TOAST Platform - Development Environment Setup            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# -----------------------------------------------------------------------------
# 1. NVM & Node.js
# -----------------------------------------------------------------------------
echo -e "${YELLOW}[1/8] Setting up Node.js via NVM...${NC}"

export NVM_DIR="$HOME/.config/nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Fix npmrc issue
nvm use --delete-prefix v22.20.0 --silent 2>/dev/null || true

# Install and use Node 18
nvm install 18 2>/dev/null || true
nvm use 18
nvm alias default 18

echo "Node version: $(node --version)"
echo "npm version: $(npm --version)"

# -----------------------------------------------------------------------------
# 2. pnpm Package Manager
# -----------------------------------------------------------------------------
echo -e "${YELLOW}[2/8] Installing pnpm...${NC}"

npm install -g pnpm@8
echo "pnpm version: $(pnpm --version)"

# -----------------------------------------------------------------------------
# 3. React Native CLI
# -----------------------------------------------------------------------------
echo -e "${YELLOW}[3/8] Installing React Native CLI...${NC}"

npm install -g react-native-cli
npm install -g @react-native-community/cli

# -----------------------------------------------------------------------------
# 4. Android SDK Environment
# -----------------------------------------------------------------------------
echo -e "${YELLOW}[4/8] Configuring Android SDK environment...${NC}"

# Check if Android Studio is installed
if [ -d "/opt/android-studio" ]; then
    echo "Android Studio found at /opt/android-studio"
else
    echo -e "${RED}Android Studio not found. Please install first.${NC}"
fi

# Set Android environment variables
cat >> ~/.zshrc << 'ANDROID_ENV'

# Android SDK Environment (TOAST Platform)
export ANDROID_HOME=$HOME/Android/Sdk
export ANDROID_SDK_ROOT=$ANDROID_HOME
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:/opt/android-studio/bin
ANDROID_ENV

source ~/.zshrc 2>/dev/null || true

# -----------------------------------------------------------------------------
# 5. .NET 8 SDK
# -----------------------------------------------------------------------------
echo -e "${YELLOW}[5/8] Installing .NET 8 SDK...${NC}"

# Check if .NET is installed
if command -v dotnet &> /dev/null; then
    echo ".NET already installed: $(dotnet --version)"
else
    # Install .NET 8 on Kali Linux
    wget https://dot.net/v1/dotnet-install.sh -O dotnet-install.sh
    chmod +x dotnet-install.sh
    ./dotnet-install.sh --channel 8.0
    rm dotnet-install.sh
    
    # Add to PATH
    echo 'export DOTNET_ROOT=$HOME/.dotnet' >> ~/.zshrc
    echo 'export PATH=$PATH:$DOTNET_ROOT:$DOTNET_ROOT/tools' >> ~/.zshrc
    export DOTNET_ROOT=$HOME/.dotnet
    export PATH=$PATH:$DOTNET_ROOT:$DOTNET_ROOT/tools
fi

# -----------------------------------------------------------------------------
# 6. Docker SQL Server Check
# -----------------------------------------------------------------------------
echo -e "${YELLOW}[6/8] Checking Docker SQL Server...${NC}"

if docker ps | grep -q sql_server; then
    echo -e "${GREEN}✓ SQL Server container is running${NC}"
    docker exec sql_server /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P 'ToastSQL@2025!' -C -Q "SELECT name FROM sys.databases WHERE name='INI_Restaurant'" 2>/dev/null && \
        echo -e "${GREEN}✓ INI_Restaurant database exists${NC}" || \
        echo -e "${RED}✗ INI_Restaurant database not found - need to restore${NC}"
else
    echo -e "${YELLOW}SQL Server container not running. Starting...${NC}"
    docker start sql_server 2>/dev/null || \
    docker run -d --name sql_server \
        -e MSSQL_SA_PASSWORD='ToastSQL@2025!' \
        -e ACCEPT_EULA=Y \
        -p 1434:1433 \
        -v ~/sql_server_data:/var/opt/mssql \
        mcr.microsoft.com/mssql/server:2022-latest
fi

# -----------------------------------------------------------------------------
# 7. Project Structure Setup
# -----------------------------------------------------------------------------
echo -e "${YELLOW}[7/8] Setting up TOAST project structure...${NC}"

cd "$TOAST_DIR" || { echo "TOAST directory not found at $TOAST_DIR"; exit 1; }

# Create directory structure if missing
mkdir -p mobile/ios mobile/android
mkdir -p web
mkdir -p backend/src/IntegrationService.API
mkdir -p backend/src/IntegrationService.Core
mkdir -p backend/src/IntegrationService.Infrastructure

echo "Project structure:"
ls -la

# -----------------------------------------------------------------------------
# 8. Install Dependencies
# -----------------------------------------------------------------------------
echo -e "${YELLOW}[8/8] Installing project dependencies...${NC}"

# Mobile app dependencies
if [ -f "mobile/package.json" ]; then
    echo "Installing mobile dependencies..."
    cd mobile
    pnpm install
    cd ..
fi

# Web app dependencies  
if [ -f "web/package.json" ]; then
    echo "Installing web dependencies..."
    cd web
    pnpm install
    cd ..
fi

# Backend dependencies
if [ -f "backend/TOASTIntegration.sln" ]; then
    echo "Restoring .NET packages..."
    cd backend
    dotnet restore
    cd ..
fi

# =============================================================================
# SUMMARY
# =============================================================================
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     SETUP COMPLETE - Development Environment Ready            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Components installed:"
echo "  ✓ Node.js $(node --version)"
echo "  ✓ pnpm $(pnpm --version)"
echo "  ✓ React Native CLI"
echo "  ✓ Android SDK environment configured"
echo "  ✓ .NET SDK"
echo "  ✓ Docker SQL Server (port 1434)"
echo ""
echo -e "${YELLOW}NEXT STEPS:${NC}"
echo ""
echo "1. Start Android Emulator:"
echo "   /opt/android-studio/bin/studio.sh"
echo "   Tools → Device Manager → Create AVD"
echo ""
echo "2. Run Mobile App (Android):"
echo "   cd $TOAST_DIR/mobile"
echo "   pnpm start"
echo "   pnpm android"
echo ""
echo "3. Run Web App:"
echo "   cd $TOAST_DIR/web"
echo "   pnpm dev"
echo "   Open http://localhost:3000"
echo ""
echo "4. Run Backend API:"
echo "   cd $TOAST_DIR/backend"
echo "   dotnet run --project src/IntegrationService.API"
echo "   Open http://localhost:5000/swagger"
echo ""
echo "5. Database Connection:"
echo "   Server: localhost,1434"
echo "   Database: INI_Restaurant"
echo "   User: sa"
echo "   Password: ToastSQL@2025!"
echo ""
