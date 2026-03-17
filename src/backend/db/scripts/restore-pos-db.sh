#!/bin/bash
# Restore INI_Restaurant database from INI_Restaruant.Bak
# Usage: ./restore-pos-db.sh
#
# Prerequisites:
# - SQL Server container running (imidus-sqlserver)
# - INI_Restaruant.Bak placed in db/backups/

set -e

CONTAINER_NAME="${CONTAINER_NAME:-imidus-sqlserver}"
SA_PASSWORD="${SA_PASSWORD:-YourStrong@Passw0rd}"
BACKUP_FILE="/var/opt/mssql/backup/INI_Restaruant.Bak"
DATABASE_NAME="INI_Restaurant"

echo "=========================================="
echo "INI_Restaurant Database Restore"
echo "=========================================="

# Check if container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "Error: Container ${CONTAINER_NAME} is not running"
    echo "Start it with: docker-compose up -d sqlserver"
    exit 1
fi

# Check if backup file exists in container
echo "Checking for backup file..."
if ! docker exec ${CONTAINER_NAME} test -f "${BACKUP_FILE}"; then
    echo "Error: Backup file not found at ${BACKUP_FILE}"
    echo "Place INI_Restaruant.Bak in src/backend/db/backups/"
    exit 1
fi

# Wait for SQL Server to be ready
echo "Waiting for SQL Server to be ready..."
for i in {1..30}; do
    if docker exec ${CONTAINER_NAME} /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "${SA_PASSWORD}" -C -Q "SELECT 1" &>/dev/null; then
        echo "SQL Server is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "Error: SQL Server not ready after 60 seconds"
        exit 1
    fi
    echo "  Attempt $i/30..."
    sleep 2
done

# Check if database already exists
echo ""
echo "Checking if database already exists..."
DB_EXISTS=$(docker exec ${CONTAINER_NAME} /opt/mssql-tools18/bin/sqlcmd \
    -S localhost -U sa -P "${SA_PASSWORD}" -C -h -1 \
    -Q "SET NOCOUNT ON; SELECT COUNT(*) FROM sys.databases WHERE name = '${DATABASE_NAME}'")

if [ "${DB_EXISTS//[[:space:]]/}" -gt 0 ]; then
    echo "Database ${DATABASE_NAME} already exists. Skipping restore."
    echo "To force restore, drop the database first:"
    echo "  docker exec ${CONTAINER_NAME} /opt/mssql-tools18/bin/sqlcmd \\"
    echo "    -S localhost -U sa -P \"\$SA_PASSWORD\" -C \\"
    echo "    -Q \"DROP DATABASE ${DATABASE_NAME}\""
    exit 0
fi

# Get logical file names from backup
echo ""
echo "Discovering logical file names from backup..."
docker exec ${CONTAINER_NAME} /opt/mssql-tools18/bin/sqlcmd \
    -S localhost -U sa -P "${SA_PASSWORD}" -C \
    -Q "RESTORE FILELISTONLY FROM DISK = '${BACKUP_FILE}'"

# Extract logical names (assumes standard naming: first is data, second is log)
# Adjust if your backup has different logical names
LOGICAL_DATA=$(docker exec ${CONTAINER_NAME} /opt/mssql-tools18/bin/sqlcmd \
    -S localhost -U sa -P "${SA_PASSWORD}" -C -h -1 \
    -Q "SET NOCOUNT ON; RESTORE FILELISTONLY FROM DISK = '${BACKUP_FILE}'" | head -n 1 | awk '{print $1}')

LOGICAL_LOG=$(docker exec ${CONTAINER_NAME} /opt/mssql-tools18/bin/sqlcmd \
    -S localhost -U sa -P "${SA_PASSWORD}" -C -h -1 \
    -Q "SET NOCOUNT ON; RESTORE FILELISTONLY FROM DISK = '${BACKUP_FILE}'" | tail -n +2 | head -n 1 | awk '{print $1}')

echo "Logical data file: ${LOGICAL_DATA}"
echo "Logical log file: ${LOGICAL_LOG}"

# Restore database with MOVE to Linux paths
echo ""
echo "Restoring database..."
docker exec ${CONTAINER_NAME} /opt/mssql-tools18/bin/sqlcmd \
    -S localhost -U sa -P "${SA_PASSWORD}" -C \
    -Q "RESTORE DATABASE [${DATABASE_NAME}]
        FROM DISK = '${BACKUP_FILE}'
        WITH MOVE '${LOGICAL_DATA}' TO '/var/opt/mssql/data/${DATABASE_NAME}.mdf',
             MOVE '${LOGICAL_LOG}' TO '/var/opt/mssql/data/${DATABASE_NAME}_log.ldf',
             REPLACE"

# Verify restore
echo ""
echo "Verifying restore..."
docker exec ${CONTAINER_NAME} /opt/mssql-tools18/bin/sqlcmd \
    -S localhost -U sa -P "${SA_PASSWORD}" -C \
    -Q "USE ${DATABASE_NAME}; SELECT COUNT(*) AS TableCount FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE='BASE TABLE'"

echo ""
echo "=========================================="
echo "Database restore complete!"
echo "=========================================="
echo ""
echo "Connection string:"
echo "  Server=sqlserver;Database=${DATABASE_NAME};User Id=sa;Password=\${SA_PASSWORD};TrustServerCertificate=True;"
