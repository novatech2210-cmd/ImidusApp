#!/bin/bash

# ==========================================
# Create IntegrationService Backend Database
# ==========================================

set -e

echo "=========================================="
echo "Creating IntegrationService Database"
echo "=========================================="
echo ""

CONTAINER_NAME="imidus-sqlserver"
SA_PASSWORD="ToastSQL@2025!"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATIONS_DIR="$SCRIPT_DIR/../src/backend/IntegrationService.Infrastructure/Data/Migrations"

# Check if container is running
if ! docker ps | grep -q $CONTAINER_NAME; then
    echo "ERROR: SQL Server container not running!"
    echo "Run: ./01_start_sqlserver_docker.sh first"
    exit 1
fi

echo "Creating IntegrationService database..."
docker exec $CONTAINER_NAME /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "$SA_PASSWORD" -Q "
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'IntegrationService')
BEGIN
    CREATE DATABASE IntegrationService;
    PRINT 'IntegrationService database created successfully';
END
ELSE
BEGIN
    PRINT 'IntegrationService database already exists';
END
"

echo "✓ Database created/verified"
echo ""

# Create DeviceTokens table
echo "Creating DeviceTokens table..."
docker exec $CONTAINER_NAME /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "$SA_PASSWORD" -d IntegrationService -Q "
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'DeviceTokens')
BEGIN
    CREATE TABLE DeviceTokens (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        CustomerId INT NOT NULL,
        Token NVARCHAR(200) NOT NULL,
        Platform NVARCHAR(10) NOT NULL,
        IsActive BIT NOT NULL DEFAULT 1,
        LastActive DATETIME NOT NULL,
        CreatedAt DATETIME NOT NULL DEFAULT GETDATE()
    );
    CREATE INDEX IX_DeviceTokens_CustomerId ON DeviceTokens(CustomerId);
    CREATE INDEX IX_DeviceTokens_Token ON DeviceTokens(Token);
    PRINT 'DeviceTokens table created';
END
ELSE
BEGIN
    PRINT 'DeviceTokens table already exists';
END
"

echo ""

# Create NotificationLogs table
echo "Creating NotificationLogs table..."
docker exec $CONTAINER_NAME /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "$SA_PASSWORD" -d IntegrationService -Q "
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'NotificationLogs')
BEGIN
    CREATE TABLE NotificationLogs (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        CustomerId INT NOT NULL,
        DeviceTokenId INT NULL,
        NotificationType NVARCHAR(50) NOT NULL,
        Title NVARCHAR(200) NOT NULL,
        Body NVARCHAR(500) NOT NULL,
        Status NVARCHAR(20) NOT NULL,
        FcmResponse NVARCHAR(MAX) NULL,
        CreatedAt DATETIME NOT NULL DEFAULT GETDATE()
    );
    CREATE INDEX IX_NotificationLogs_CustomerId ON NotificationLogs(CustomerId);
    CREATE INDEX IX_NotificationLogs_CreatedAt ON NotificationLogs(CreatedAt DESC);
    PRINT 'NotificationLogs table created';
END
ELSE
BEGIN
    PRINT 'NotificationLogs table already exists';
END
"

echo ""

# Create OnlineOrderStatus table
echo "Creating OnlineOrderStatus table..."
docker exec $CONTAINER_NAME /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "$SA_PASSWORD" -d IntegrationService -Q "
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'OnlineOrderStatus')
BEGIN
    CREATE TABLE OnlineOrderStatus (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        SalesId INT NOT NULL,
        ReadyNotificationSent BIT NOT NULL DEFAULT 0,
        ConfirmationNotificationSent BIT NOT NULL DEFAULT 0,
        LastCheckedAt DATETIME NULL,
        CreatedAt DATETIME NOT NULL DEFAULT GETDATE()
    );
    CREATE INDEX IX_OnlineOrderStatus_SalesId ON OnlineOrderStatus(SalesId);
    CREATE INDEX IX_OnlineOrderStatus_LastCheckedAt ON OnlineOrderStatus(LastCheckedAt);
    PRINT 'OnlineOrderStatus table created';
END
ELSE
BEGIN
    PRINT 'OnlineOrderStatus table already exists';
END
"

echo ""

# Create IdempotencyKeys table
echo "Creating IdempotencyKeys table..."
docker exec $CONTAINER_NAME /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "$SA_PASSWORD" -d IntegrationService -Q "
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'IdempotencyKeys')
BEGIN
    CREATE TABLE IdempotencyKeys (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        KeyHash NVARCHAR(64) NOT NULL,
        RequestPath NVARCHAR(500) NOT NULL,
        ResponseBody NVARCHAR(MAX) NULL,
        CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT UQ_IdempotencyKeys_KeyHash UNIQUE (KeyHash)
    );
    CREATE INDEX IX_IdempotencyKeys_KeyHash ON IdempotencyKeys(KeyHash);
    CREATE INDEX IX_IdempotencyKeys_CreatedAt ON IdempotencyKeys(CreatedAt);
    PRINT 'IdempotencyKeys table created';
END
ELSE
BEGIN
    PRINT 'IdempotencyKeys table already exists';
END
"

echo ""
echo "=========================================="
echo "IntegrationService Database Setup Complete!"
echo "=========================================="
echo ""

# Verify tables
echo "Verifying tables..."
docker exec $CONTAINER_NAME /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "$SA_PASSWORD" -d IntegrationService -Q "
SELECT 
    t.name as TableName,
    p.rows as RowCount
FROM sys.tables t
INNER JOIN sys.partitions p ON t.object_id = p.object_id
WHERE t.name IN ('DeviceTokens', 'NotificationLogs', 'OnlineOrderStatus', 'IdempotencyKeys')
AND p.index_id IN (0, 1)
"

echo ""
echo "Next: Update connection strings and start the backend"
