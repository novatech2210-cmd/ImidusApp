#!/bin/bash

# ==========================================
# SQL Server Docker Setup for IMIDUS
# ==========================================

set -e

echo "=========================================="
echo "Setting up SQL Server Docker container"
echo "=========================================="
echo ""

CONTAINER_NAME="imidus-sqlserver"
SA_PASSWORD="ToastSQL@2025!"
BACKUP_FILE="/home/kali/Desktop/TOAST/INI_Restaurant.Bak"

# Stop and remove existing container if it exists
echo "Cleaning up existing container..."
docker stop $CONTAINER_NAME 2>/dev/null || true
docker rm $CONTAINER_NAME 2>/dev/null || true

# Pull and run SQL Server 2022 (accepts SQL 2005 backups)
echo "Starting SQL Server Docker container..."
docker run -e "ACCEPT_EULA=Y" \
  -e "MSSQL_SA_PASSWORD=$SA_PASSWORD" \
  -e "MSSQL_PID=Developer" \
  -p 1433:1433 \
  --name $CONTAINER_NAME \
  --hostname sqlserver \
  -d mcr.microsoft.com/mssql/server:2022-latest

echo "Waiting for SQL Server to start..."
sleep 15

# Wait for SQL Server to be ready
echo "Checking SQL Server status..."
for i in {1..30}; do
    if docker exec $CONTAINER_NAME /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "$SA_PASSWORD" -Q "SELECT 1" > /dev/null 2>&1; then
        echo "✓ SQL Server is ready!"
        break
    fi
    echo "  Waiting... ($i/30)"
    sleep 2
done

echo ""
echo "=========================================="
echo "SQL Server Docker Setup Complete!"
echo "=========================================="
echo ""
echo "Connection Details:"
echo "  Server:   localhost,1433"
echo "  Username: sa"
echo "  Password: $SA_PASSWORD"
echo ""
echo "Next steps:"
echo "  1. Run 02_restore_database.sh to restore INI_Restaurant.Bak"
echo "  2. Run 03_create_backend_db.sh to create IntegrationService DB"
echo ""
