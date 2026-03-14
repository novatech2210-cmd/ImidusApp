#!/bin/bash
# Create client delivery package for IMIDUS POS Integration
# One-click executable with database and local development environment

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

VERSION="${1:-v1.0}"
PACKAGE_NAME="imidus-local-dev-${VERSION}"

echo "=========================================="
echo "  Creating Client Delivery Package"
echo "  Version: ${VERSION}"
echo "=========================================="
echo ""

# Check prerequisites
echo "Checking prerequisites..."

if [ ! -f "/home/kali/Desktop/TOAST/INI_Restaurant.Bak" ]; then
    echo -e "${RED}✗ Database backup not found${NC}"
    echo "Expected: /home/kali/Desktop/TOAST/INI_Restaurant.Bak"
    exit 1
fi

echo -e "${GREEN}✓ Database backup found${NC}"

# Create temp directory
TEMP_DIR=$(mktemp -d)
echo "Working in: ${TEMP_DIR}"

# Copy files
echo ""
echo "Copying files to package..."

mkdir -p "${TEMP_DIR}/${PACKAGE_NAME}"

# Core files
cp -r /home/kali/Desktop/TOAST/local-dev/* "${TEMP_DIR}/${PACKAGE_NAME}/"

# Copy database backup
cp /home/kali/Desktop/TOAST/INI_Restaurant.Bak "${TEMP_DIR}/${PACKAGE_NAME}/db/backups/"

# Create client-specific README
cat > "${TEMP_DIR}/${PACKAGE_NAME}/README-FIRST.txt" << 'EOF'
╔══════════════════════════════════════════════════════════════╗
║  IMIDUS POS Integration - Local Development Package          ║
║  One-Click Setup for Testing & Development                   ║
╚══════════════════════════════════════════════════════════════╝

QUICK START:
  1. Install Docker Desktop: https://docs.docker.com/get-docker/
  2. Double-click START.bat (Windows) or run ./start-local.sh (Linux/Mac)
  3. Wait 2-3 minutes for services to start
  4. Access backend at: http://localhost:5004

WHAT'S INCLUDED:
  ✓ SQL Server 2022 (Express) with INI_Restaurant POS database
  ✓ .NET 9 Backend API (IntegrationService.API)
  ✓ Adminer database management UI
  ✓ Pre-configured connection strings
  ✓ Authorize.net SANDBOX payment processing

DEFAULT CREDENTIALS:
  SQL Server:
    - Server: localhost:1433
    - Username: sa
    - Password: YourStrong@Passw0rd
  
  Backend API:
    - URL: http://localhost:5004
    - Swagger: http://localhost:5004/swagger

DATABASE ARCHITECTURE:
  INI_Restaurant (POS Database - Source of Truth):
    - Read anytime for menu, orders, customers
    - Write only through backend API
    - Contains: tblItem, tblSales, tblCustomer, etc.
  
  IntegrationService (Backend Overlay):
    - Customer profiles, marketing rules
    - Scheduled orders, notifications
    - Idempotency keys, audit logs

TEST CARD NUMBERS (Authorize.net Sandbox):
  Visa: 4111111111111111
  MasterCard: 5424000000000015
  Amex: 378282246310005
  Expiry: Any future date (e.g., 12/30)
  CVV: Any 3-4 digits

IMPORTANT NOTES:
  ⚠ This package is for LOCAL TESTING ONLY
  ⚠ Default passwords should be changed for production
  ⚠ Never commit real credentials to version control
  ⚠ POS database schema should NEVER be modified

TROUBLESHOOTING:
  Port 1433 or 5004 already in use?
    → Stop other SQL Server / applications using these ports
  
  Database restore fails?
    → Ensure INI_Restaurant.Bak is in db/backups/ folder
    → Run: ./scripts/restore-database.sh
  
  API won't start?
    → Check logs: docker-compose logs api
    → Restart: docker-compose restart api

SUPPORT:
  See full documentation: local-dev/README.md
  Check AGENTS.md in project root

═══════════════════════════════════════════════════════════════
Generated: $(date)
Package: IMIDUS POS Integration Local Development
Version: ${VERSION}
═══════════════════════════════════════════════════════════════
EOF

# Create Windows batch file
cat > "${TEMP_DIR}/${PACKAGE_NAME}/START.bat" << 'EOF'
@echo off
echo ==========================================
echo   IMIDUS POS Integration - Local Dev
echo ==========================================
echo.
echo Starting services... This may take 2-3 minutes.
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not installed.
    echo Please install Docker Desktop from:
    echo https://docs.docker.com/get-docker/
    pause
    exit /b 1
)

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker Compose is not installed.
    pause
    exit /b 1
)

echo [1/3] Starting Docker services...
docker-compose up -d

echo [2/3] Waiting for SQL Server...
timeout /t 30 /nobreak >nul

echo [3/3] Checking if database exists...
docker exec imidus-sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "YourStrong@Passw0rd" -C -Q "SELECT name FROM sys.databases WHERE name = 'INI_Restaurant'" | findstr "INI_Restaurant" >nul

if errorlevel 1 (
    echo.
    echo Database not found. Restoring from backup...
    bash scripts/restore-database.sh
) else (
    echo Database already restored.
)

echo.
echo ==========================================
echo   Services Ready!
echo ==========================================
echo.
echo Backend API:    http://localhost:5004
echo Health Check:   http://localhost:5004/health
echo Swagger UI:     http://localhost:5004/swagger
echo Database UI:    http://localhost:8080
echo.
echo Press any key to open Swagger UI...
pause >nul
start http://localhost:5004/swagger
EOF

# Create PowerShell script (alternative for Windows)
cat > "${TEMP_DIR}/${PACKAGE_NAME}/START.ps1" << 'EOF'
# IMIDUS POS Integration - Local Development Starter
# Run with: PowerShell -ExecutionPolicy Bypass -File START.ps1

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  IMIDUS POS Integration - Local Dev" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

try {
    $dockerVersion = docker --version 2>$null
    if (-not $dockerVersion) {
        throw "Docker not found"
    }
    Write-Host "✓ Docker found: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker is not installed" -ForegroundColor Red
    Write-Host "Please install Docker Desktop from: https://docs.docker.com/get-docker/"
    Read-Host "Press Enter to exit"
    exit 1
}

try {
    $composeVersion = docker-compose --version 2>$null
    if (-not $composeVersion) {
        throw "Docker Compose not found"
    }
    Write-Host "✓ Docker Compose found: $composeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker Compose is not installed" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "[1/3] Starting Docker services..." -ForegroundColor Yellow
docker-compose up -d

Write-Host "[2/3] Waiting for SQL Server (30 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

Write-Host "[3/3] Checking database..." -ForegroundColor Yellow
$dbCheck = docker exec imidus-sqlserver /opt/mssql-tools18/bin/sqlcmd `
    -S localhost -U sa -P "YourStrong@Passw0rd" -C `
    -Q "SELECT COUNT(*) FROM sys.databases WHERE name = 'INI_Restaurant'" 2>$null

if ($dbCheck -match "0" -or -not $dbCheck) {
    Write-Host "Database not found. Restoring from backup..." -ForegroundColor Yellow
    if (Test-Path "scripts/restore-database.sh") {
        bash scripts/restore-database.sh
    } else {
        Write-Host "⚠ Restore script not found. Database may need manual restore." -ForegroundColor Yellow
    }
} else {
    Write-Host "✓ Database already restored" -ForegroundColor Green
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "  ✓ Services Ready!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backend API:    http://localhost:5004" -ForegroundColor Cyan
Write-Host "Health Check:   http://localhost:5004/health" -ForegroundColor Cyan
Write-Host "Swagger UI:     http://localhost:5004/swagger" -ForegroundColor Cyan
Write-Host "Database UI:    http://localhost:8080" -ForegroundColor Cyan
Write-Host ""

$openBrowser = Read-Host "Open Swagger UI in browser? (Y/n)"
if ($openBrowser -ne 'n') {
    Start-Process "http://localhost:5004/swagger"
}
EOF

# Create Linux/Mac script (already exists, just ensure it's executable)
chmod +x "${TEMP_DIR}/${PACKAGE_NAME}/start-local.sh"
chmod +x "${TEMP_DIR}/${PACKAGE_NAME}/scripts/restore-database.sh"

# Create the archive
echo ""
echo "Creating archive..."
cd "${TEMP_DIR}"

# Create tar.gz
tar -czf "${PACKAGE_NAME}.tar.gz" "${PACKAGE_NAME}"

# Create zip for Windows
if command -v zip &> /dev/null; then
    zip -r "${PACKAGE_NAME}.zip" "${PACKAGE_NAME}"
    echo -e "${GREEN}✓ Created ${PACKAGE_NAME}.zip${NC}"
fi

# Move to project root
mv "${PACKAGE_NAME}.tar.gz" /home/kali/Desktop/TOAST/
if [ -f "${PACKAGE_NAME}.zip" ]; then
    mv "${PACKAGE_NAME}.zip" /home/kali/Desktop/TOAST/
fi

# Cleanup
rm -rf "${TEMP_DIR}"

# Create delivery report
cat > /home/kali/Desktop/TOAST/DELIVERY_REPORT.md << EOF
# Client Delivery Package - ${VERSION}

## Package Contents

Created: $(date)
Version: ${VERSION}

### Files Included

| File | Description |
|------|-------------|
| ${PACKAGE_NAME}.tar.gz | Unix/Linux/Mac package |
| ${PACKAGE_NAME}.zip | Windows package |
| INI_Restaurant.Bak | POS database backup (8.3 MB) |

### Package Structure

\`\`\`
${PACKAGE_NAME}/
├── START.bat              # Windows one-click starter
├── START.ps1              # Windows PowerShell starter
├── start-local.sh         # Linux/Mac one-click starter
├── docker-compose.yml     # Service definitions
├── README-FIRST.txt       # Quick start guide
├── README.md             # Full documentation
├── db/
│   └── backups/
│       └── INI_Restaurant.Bak
└── scripts/
    └── restore-database.sh
\`\`\`

## Quick Start for Client

### Windows
1. Extract ${PACKAGE_NAME}.zip
2. Double-click **START.bat**
3. Wait 2-3 minutes for services to start
4. Access backend at http://localhost:5004

### Linux/Mac
1. Extract ${PACKAGE_NAME}.tar.gz
2. cd ${PACKAGE_NAME}
3. ./start-local.sh --with-restore
4. Access backend at http://localhost:5004

## What's Included

✅ SQL Server 2022 Express with INI_Restaurant database
✅ .NET 9 Backend API (IntegrationService.API)
✅ Adminer database management UI
✅ Pre-configured Authorize.net SANDBOX
✅ One-click restore script
✅ Health checks and monitoring

## Default Ports

| Service | Port | URL |
|---------|------|-----|
| SQL Server | 1433 | localhost:1433 |
| Backend API | 5004 | http://localhost:5004 |
| Adminer DB UI | 8080 | http://localhost:8080 |

## Security

- Default SA password: YourStrong@Passw0rd
- Authorize.net: SANDBOX environment
- Test card numbers provided
- For LOCAL TESTING ONLY

## Delivery Checklist

- [x] Docker Compose configuration
- [x] One-click startup scripts (Windows/Linux/Mac)
- [x] Database restore automation
- [x] POS database backup included
- [x] Backend API pre-configured
- [x] Documentation and README
- [x] Troubleshooting guide

## Next Steps for Client

1. Install Docker Desktop
2. Extract delivery package
3. Run one-click starter
4. Test API at http://localhost:5004/swagger
5. Review POS data in Adminer at http://localhost:8080

## Support

For technical support:
- Check local-dev/README.md in package
- Review AGENTS.md in project repository
- Contact development team

---
*Package generated by GSD agent on $(date)*
EOF

echo ""
echo "=========================================="
echo -e "${GREEN}  ✓ Package created successfully!${NC}"
echo "=========================================="
echo ""
echo "Files created:"
echo "  📦 /home/kali/Desktop/TOAST/${PACKAGE_NAME}.tar.gz"
if [ -f "/home/kali/Desktop/TOAST/${PACKAGE_NAME}.zip" ]; then
    echo "  📦 /home/kali/Desktop/TOAST/${PACKAGE_NAME}.zip"
fi
echo "  📄 /home/kali/Desktop/TOAST/DELIVERY_REPORT.md"
echo ""
echo "Size:"
ls -lh /home/kali/Desktop/TOAST/${PACKAGE_NAME}.* 2>/dev/null | awk '{print "  " $9 " -> " $5}'
echo ""
echo "=========================================="
