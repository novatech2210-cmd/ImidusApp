USE master;
GO

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'IntegrationService')
BEGIN
    CREATE DATABASE IntegrationService;
END
GO

USE IntegrationService;
GO

-- Idempotency keys for duplicate request prevention
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'IdempotencyKeys')
BEGIN
    CREATE TABLE IdempotencyKeys (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        IdempotencyKey NVARCHAR(255) NOT NULL,
        RequestHash NVARCHAR(64) NOT NULL,
        ResponseJson NVARCHAR(MAX) NULL,
        StatusCode INT NOT NULL,
        CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
        ExpiresAt DATETIME NOT NULL
    );
    CREATE UNIQUE INDEX IX_IdempotencyKeys_Key ON IdempotencyKeys(IdempotencyKey);
    CREATE INDEX IX_IdempotencyKeys_Expires ON IdempotencyKeys(ExpiresAt);
END
GO

-- Audit log for all write operations
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AuditLog')
BEGIN
    CREATE TABLE AuditLog (
        Id BIGINT IDENTITY(1,1) PRIMARY KEY,
        EntityType NVARCHAR(100) NOT NULL,
        EntityId NVARCHAR(100) NOT NULL,
        Action NVARCHAR(50) NOT NULL,
        OldValues NVARCHAR(MAX) NULL,
        NewValues NVARCHAR(MAX) NULL,
        UserId NVARCHAR(100) NULL,
        Timestamp DATETIME NOT NULL DEFAULT GETDATE(),
        CorrelationId NVARCHAR(100) NULL
    );
    CREATE INDEX IX_AuditLog_Entity ON AuditLog(EntityType, EntityId);
    CREATE INDEX IX_AuditLog_Timestamp ON AuditLog(Timestamp);
END
GO
