#!/bin/bash

# ==========================================
# Restore INI_Restaurant Database
# ==========================================

set -e

echo "=========================================="
echo "Restoring INI_Restaurant Database"
echo "=========================================="
echo ""

CONTAINER_NAME="imidus-sqlserver"
SA_PASSWORD="ToastSQL@2025!"
SQL_PORT="1434"
BACKUP_SOURCE="/home/kali/Desktop/TOAST/INI_Restaurant.Bak"
BACKUP_DEST="/var/opt/mssql/backup/INI_Restaurant.Bak"
DB_NAME="INI_Restaurant"

# Check if container is running
if ! docker ps | grep -q $CONTAINER_NAME; then
    echo "ERROR: SQL Server container not running!"
    echo "Run: docker run -e ACCEPT_EULA=Y -e MSSQL_SA_PASSWORD=$SA_PASSWORD -p $SQL_PORT:1433 --name $CONTAINER_NAME -d mcr.microsoft.com/mssql/server:2022-latest"
    exit 1
fi

# Check if backup file exists
if [ ! -f "$BACKUP_SOURCE" ]; then
    echo "ERROR: Backup file not found at $BACKUP_SOURCE"
    exit 1
fi

echo "✓ Found backup file: $BACKUP_SOURCE"
echo ""

# Create backup directory in container
echo "Creating backup directory in container..."
docker exec $CONTAINER_NAME mkdir -p /var/opt/mssql/backup

# Copy backup file to container
echo "Copying backup file to container..."
docker cp "$BACKUP_SOURCE" "$CONTAINER_NAME:$BACKUP_DEST"

echo "✓ Backup file copied"
echo ""

# Get logical file names from backup
echo "Reading backup file metadata..."
docker exec $CONTAINER_NAME /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "$SA_PASSWORD" -Q "
RESTORE FILELISTONLY FROM DISK = N'$BACKUP_DEST'
" | head -20

echo ""
echo "Restoring database..."

# Restore the database (using REPLACE to overwrite if exists)
docker exec $CONTAINER_NAME /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "$SA_PASSWORD" -Q "
RESTORE DATABASE [$DB_NAME] 
FROM DISK = N'$BACKUP_DEST'
WITH 
    FILE = 1,
    MOVE N'TPPro' TO N'/var/opt/mssql/data/${DB_NAME}.mdf',
    MOVE N'TPPro_log' TO N'/var/opt/mssql/data/${DB_NAME}_log.ldf',
    REPLACE,
    RECOVERY,
    STATS = 10
"

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ Database restored successfully!"
    echo ""
else
    echo ""
    echo "⚠ Restore may have issues, trying alternative approach..."
    
    # Try to restore with automatic file naming
    docker exec $CONTAINER_NAME /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "$SA_PASSWORD" -Q "
    RESTORE DATABASE [$DB_NAME] 
    FROM DISK = N'$BACKUP_DEST'
    WITH REPLACE, RECOVERY
    "
fi

# Verify database exists
echo ""
echo "Verifying database..."
docker exec $CONTAINER_NAME /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "$SA_PASSWORD" -Q "
SELECT name, state_desc, create_date 
FROM sys.databases 
WHERE name = '$DB_NAME'
"

echo ""
echo "=========================================="
echo "Database Restore Complete!"
echo "=========================================="
echo ""
echo "Database: $DB_NAME"
echo "Status: Check output above for state_desc"
echo ""

# Quick verification - count some tables
echo "Verifying tables..."
docker exec $CONTAINER_NAME /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "$SA_PASSWORD" -d $DB_NAME -Q "
SELECT 
    'tblItem' as TableName, COUNT(*) as RowCount FROM tblItem UNION ALL
    SELECT 'tblCategory', COUNT(*) FROM tblCategory UNION ALL
    SELECT 'tblCustomer', COUNT(*) FROM tblCustomer UNION ALL
    SELECT 'tblSales', COUNT(*) FROM tblSales
"

echo ""
echo "Next: Run 03_create_backend_db.sh to create IntegrationService database"
