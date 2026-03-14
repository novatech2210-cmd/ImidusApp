USE IntegrationService;
GO

-- Users table for authentication
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
BEGIN
    CREATE TABLE Users (
        ID INT IDENTITY(1,1) PRIMARY KEY,
        CustomerID INT NULL, -- Link to tblCustomer.CustomerNum in POS DB
        Email NVARCHAR(256) NOT NULL,
        EmailConfirmed BIT NOT NULL DEFAULT 0,
        PasswordHash NVARCHAR(MAX) NULL,
        SecurityStamp NVARCHAR(MAX) NULL,
        PhoneNumber NVARCHAR(50) NULL,
        PhoneConfirmed BIT NOT NULL DEFAULT 0,
        TwoFactorEnabled BIT NOT NULL DEFAULT 0,
        LockoutEnd DATETIMEOFFSET(7) NULL,
        LockoutEnabled BIT NOT NULL DEFAULT 1,
        AccessFailedCount INT NOT NULL DEFAULT 0,
        CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
        UpdatedAt DATETIME NULL,
        LastLoginAt DATETIME NULL,
        IsActive BIT NOT NULL DEFAULT 1
    );
    CREATE UNIQUE INDEX IX_Users_Email ON Users(Email);
    CREATE INDEX IX_Users_CustomerID ON Users(CustomerID);
END
GO

-- Audit log for write operations
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
