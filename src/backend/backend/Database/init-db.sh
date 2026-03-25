#!/bin/bash
# Initialize INI POS Database (TPPro) in Docker SQL Server
# Usage: ./init-db.sh

set -e

CONTAINER_NAME="imidus-sqlserver"
SA_PASSWORD="YourStrong@Passw0rd"

echo "=========================================="
echo "INI POS Database Initialization"
echo "=========================================="

# Check if container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "Error: Container ${CONTAINER_NAME} is not running"
    echo "Start it with: docker-compose up -d sqlserver"
    exit 1
fi

# Wait for SQL Server to be ready
echo "Waiting for SQL Server to be ready..."
for i in {1..30}; do
    if docker exec ${CONTAINER_NAME} /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "${SA_PASSWORD}" -C -Q "SELECT 1" &>/dev/null; then
        echo "SQL Server is ready!"
        break
    fi
    echo "  Attempt $i/30..."
    sleep 2
done

# Run schema creation
echo ""
echo "Creating database schema..."
docker exec ${CONTAINER_NAME} /opt/mssql-tools18/bin/sqlcmd \
    -S localhost -U sa -P "${SA_PASSWORD}" -C \
    -i /docker-entrypoint-initdb.d/01-create-database.sql

# Run seed data
echo ""
echo "Inserting seed data..."
docker exec ${CONTAINER_NAME} /opt/mssql-tools18/bin/sqlcmd \
    -S localhost -U sa -P "${SA_PASSWORD}" -C \
    -i /docker-entrypoint-initdb.d/02-seed-data.sql

echo ""
echo "=========================================="
echo "Database initialization complete!"
echo "=========================================="
echo ""
echo "Connection string:"
echo "  Server=localhost;Database=TPPro;User Id=sa;Password=${SA_PASSWORD};TrustServerCertificate=True;"
echo ""
echo "Tables created:"
docker exec ${CONTAINER_NAME} /opt/mssql-tools18/bin/sqlcmd \
    -S localhost -U sa -P "${SA_PASSWORD}" -C \
    -d TPPro \
    -Q "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE='BASE TABLE' ORDER BY TABLE_NAME"
