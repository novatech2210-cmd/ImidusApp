#!/bin/bash

# ==========================================
# IMIDUS POS Integration - Database Setup (Linux/macOS)
# ==========================================

set -e

echo "=========================================="
echo "IMIDUS POS Integration - Database Setup"
echo "=========================================="
echo ""

# Check if sqlcmd is available
if ! command -v sqlcmd &> /dev/null; then
    echo "ERROR: sqlcmd not found. Please install SQL Server Command Line Tools."
    echo "Download from: https://docs.microsoft.com/en-us/sql/tools/sqlcmd-utility"
    exit 1
fi

# Default values
SQL_SERVER="localhost"
SQL_USER="sa"
SQL_PASSWORD=""
POS_DB_NAME="INI_Restaurant"
BACKUP_PATH=""

# Read configuration
echo "Configuration:"
read -p "Enter SQL Server name (default: localhost): " input
SQL_SERVER=${input:-$SQL_SERVER}

read -p "Enter SQL Username (default: sa): " input
SQL_USER=${input:-$SQL_USER}

read -sp "Enter SQL Password: " SQL_PASSWORD
echo ""

read -p "Enter POS Database name (default: INI_Restaurant): " input
POS_DB_NAME=${input:-$POS_DB_NAME}

read -p "Enter path to INI_Restaurant.Bak file: " BACKUP_PATH

if [ ! -f "$BACKUP_PATH" ]; then
    echo "ERROR: Backup file not found at $BACKUP_PATH"
    exit 1
fi

echo ""
echo "=========================================="
echo "Step 1: Restore POS Database (INI_Restaurant)"
echo "=========================================="
echo ""

echo "Restoring $POS_DB_NAME database from backup..."
sqlcmd -S "$SQL_SERVER" -U "$SQL_USER" -P "$SQL_PASSWORD" -Q "RESTORE DATABASE [$POS_DB_NAME] FROM DISK = N'$BACKUP_PATH' WITH REPLACE, RECOVERY"

echo "✓ POS Database restored successfully"
echo ""

echo "=========================================="
echo "Step 2: Create IntegrationService Database"
echo "=========================================="
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATIONS_DIR="$SCRIPT_DIR/../src/backend/IntegrationService.Infrastructure/Data/Migrations"

sqlcmd -S "$SQL_SERVER" -U "$SQL_USER" -P "$SQL_PASSWORD" -i "$MIGRATIONS_DIR/00_CreateDatabase.sql"

echo "✓ IntegrationService database created"
echo ""

echo "=========================================="
echo "Step 3: Create Backend Tables"
echo "=========================================="
echo ""

sqlcmd -S "$SQL_SERVER" -U "$SQL_USER" -P "$SQL_PASSWORD" -d IntegrationService -i "$MIGRATIONS_DIR/20260302_AddDeviceTokenAndNotificationLog.sql"
sqlcmd -S "$SQL_SERVER" -U "$SQL_USER" -P "$SQL_PASSWORD" -d IntegrationService -i "$MIGRATIONS_DIR/20260302_AddOnlineOrderStatus.sql"

echo "✓ Backend tables created"
echo ""

echo "=========================================="
echo "Step 4: Generate Connection Strings"
echo "=========================================="
echo ""

POS_CONNECTION="Server=$SQL_SERVER;Database=$POS_DB_NAME;User Id=$SQL_USER;Password=$SQL_PASSWORD;TrustServerCertificate=True;Encrypt=False;"
BACKEND_CONNECTION="Server=$SQL_SERVER;Database=IntegrationService;User Id=$SQL_USER;Password=$SQL_PASSWORD;TrustServerCertificate=True;Encrypt=False;"

echo "Connection Strings:"
echo "POS Database: $POS_CONNECTION"
echo "Backend DB:   $BACKEND_CONNECTION"
echo ""

echo "=========================================="
echo "Step 5: Test Database Connectivity"
echo "=========================================="
echo ""

echo "Testing POS database connection..."
if sqlcmd -S "$SQL_SERVER" -U "$SQL_USER" -P "$SQL_PASSWORD" -d "$POS_DB_NAME" -Q "SELECT COUNT(*) FROM tblItem" > /dev/null 2>&1; then
    echo "✓ POS database connection successful"
else
    echo "⚠ WARNING: Could not query POS database"
fi

echo ""
echo "Testing IntegrationService database connection..."
if sqlcmd -S "$SQL_SERVER" -U "$SQL_USER" -P "$SQL_PASSWORD" -d IntegrationService -Q "SELECT 1" > /dev/null 2>&1; then
    echo "✓ IntegrationService database connection successful"
else
    echo "⚠ WARNING: Could not connect to IntegrationService database"
fi

echo ""
echo "=========================================="
echo "Database Setup Complete!"
echo "=========================================="
echo ""
echo "Next Steps:"
echo "1. Update appsettings.json with these connection strings:"
echo "   POS Database: $POS_CONNECTION"
echo "   Backend DB:   $BACKEND_CONNECTION"
echo "2. Start the backend API: dotnet run --project src/backend/IntegrationService.API"
echo "3. Test API at: http://localhost:5004/health"
echo "4. Check Swagger UI: http://localhost:5004/swagger"
echo ""
