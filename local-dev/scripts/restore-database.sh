#!/bin/bash
# INI_Restaurant Database Restore Script
# One-click restore for local development
# Usage: ./restore-database.sh

set -e

# Configuration
CONTAINER_NAME="imidus-sqlserver"
SA_PASSWORD="${SA_PASSWORD:-YourStrong@Passw0rd}"
BACKUP_FILE="/var/opt/mssql/backup/INI_Restaurant.Bak"
DATABASE_NAME="INI_Restaurant"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "  IMIDUS POS Database Restore"
echo "=========================================="
echo ""

# Check if container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo -e "${YELLOW}⚠ SQL Server container is not running${NC}"
    echo "Starting containers..."
    docker-compose up -d sqlserver
    echo ""
    echo -e "${YELLOW}⏳ Waiting for SQL Server to be ready (this may take 30-60 seconds)...${NC}"
    sleep 30
fi

# Check if backup file exists in container
echo "Checking for backup file..."
if ! docker exec ${CONTAINER_NAME} test -f "${BACKUP_FILE}"; then
    echo -e "${RED}✗ Backup file not found in container${NC}"
    echo "Ensure INI_Restaurant.Bak is in the db/backups directory"
    exit 1
fi

echo -e "${GREEN}✓ Backup file found${NC}"
echo ""

# Wait for SQL Server to be ready
echo "Verifying SQL Server connection..."
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if docker exec ${CONTAINER_NAME} /opt/mssql-tools18/bin/sqlcmd \
        -S localhost -U sa -P "${SA_PASSWORD}" -C -Q "SELECT 1" &>/dev/null; then
        echo -e "${GREEN}✓ SQL Server is ready${NC}"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "  Attempt $RETRY_COUNT/$MAX_RETRIES..."
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo -e "${RED}✗ SQL Server not ready after $MAX_RETRIES attempts${NC}"
    exit 1
fi

echo ""

# Check if database already exists
echo "Checking if database already exists..."
DB_EXISTS=$(docker exec ${CONTAINER_NAME} /opt/mssql-tools18/bin/sqlcmd \
    -S localhost -U sa -P "${SA_PASSWORD}" -C -h -1 \
    -Q "SET NOCOUNT ON; SELECT COUNT(*) FROM sys.databases WHERE name = '${DATABASE_NAME}'" 2>/dev/null | tr -d '[:space:]')

if [ "${DB_EXISTS}" -gt 0 ]; then
    echo -e "${YELLOW}⚠ Database '${DATABASE_NAME}' already exists${NC}"
    read -p "Do you want to drop and re-restore? (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Dropping existing database..."
        docker exec ${CONTAINER_NAME} /opt/mssql-tools18/bin/sqlcmd \
            -S localhost -U sa -P "${SA_PASSWORD}" -C \
            -Q "ALTER DATABASE [${DATABASE_NAME}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE [${DATABASE_NAME}]"
        echo -e "${GREEN}✓ Database dropped${NC}"
    else
        echo "Skipping restore. Using existing database."
        exit 0
    fi
fi

echo ""

# Get logical file names from backup
echo "Discovering logical file names from backup..."
docker exec ${CONTAINER_NAME} /opt/mssql-tools18/bin/sqlcmd \
    -S localhost -U sa -P "${SA_PASSWORD}" -C \
    -Q "RESTORE FILELISTONLY FROM DISK = '${BACKUP_FILE}'" | head -20

echo ""

# Extract logical names
LOGICAL_DATA=$(docker exec ${CONTAINER_NAME} /opt/mssql-tools18/bin/sqlcmd \
    -S localhost -U sa -P "${SA_PASSWORD}" -C -h -1 \
    -Q "SET NOCOUNT ON; SELECT LogicalName FROM (RESTORE FILELISTONLY FROM DISK = '${BACKUP_FILE}') AS f WHERE Type = 'D'" 2>/dev/null | head -1 | tr -d '[:space:]')

LOGICAL_LOG=$(docker exec ${CONTAINER_NAME} /opt/mssql-tools18/bin/sqlcmd \
    -S localhost -U sa -P "${SA_PASSWORD}" -C -h -1 \
    -Q "SET NOCOUNT ON; SELECT LogicalName FROM (RESTORE FILELISTONLY FROM DISK = '${BACKUP_FILE}') AS f WHERE Type = 'L'" 2>/dev/null | head -1 | tr -d '[:space:]')

echo "Logical data file: ${LOGICAL_DATA:-TPPro}"
echo "Logical log file: ${LOGICAL_LOG:-TPPro_log}"
echo ""

# Restore database
echo "Restoring database..."
docker exec ${CONTAINER_NAME} /opt/mssql-tools18/bin/sqlcmd \
    -S localhost -U sa -P "${SA_PASSWORD}" -C \
    -Q "RESTORE DATABASE [${DATABASE_NAME}]
        FROM DISK = '${BACKUP_FILE}'
        WITH MOVE '${LOGICAL_DATA:-TPPro}' TO '/var/opt/mssql/data/${DATABASE_NAME}.mdf',
             MOVE '${LOGICAL_LOG:-TPPro_log}' TO '/var/opt/mssql/data/${DATABASE_NAME}_log.ldf',
             RECOVERY"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database restore successful${NC}"
else
    echo -e "${RED}✗ Database restore failed${NC}"
    exit 1
fi

echo ""

# Verify restore
echo "Verifying database..."
TABLE_COUNT=$(docker exec ${CONTAINER_NAME} /opt/mssql-tools18/bin/sqlcmd \
    -S localhost -U sa -P "${SA_PASSWORD}" -C -h -1 \
    -Q "SET NOCOUNT ON; USE ${DATABASE_NAME}; SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE='BASE TABLE'" 2>/dev/null | tr -d '[:space:]')

echo -e "${GREEN}✓ Database restored with ${TABLE_COUNT} tables${NC}"
echo ""

# Show sample tables
echo "Sample tables in database:"
docker exec ${CONTAINER_NAME} /opt/mssql-tools18/bin/sqlcmd \
    -S localhost -U sa -P "${SA_PASSWORD}" -C \
    -Q "USE ${DATABASE_NAME}; SELECT TOP 10 TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE='BASE TABLE' ORDER BY TABLE_NAME"

echo ""
echo "=========================================="
echo -e "${GREEN}  ✓ Database restore complete!${NC}"
echo "=========================================="
echo ""
echo "Connection string for backend:"
echo "  Server=localhost,1433;Database=${DATABASE_NAME};User Id=sa;Password=${SA_PASSWORD};TrustServerCertificate=True;"
echo ""
echo "Adminer (DB management): http://localhost:8080"
echo "  Server: sqlserver"
echo "  Username: sa"
echo "  Password: ${SA_PASSWORD}"
echo "  Database: ${DATABASE_NAME}"
echo ""
