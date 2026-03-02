-- Migration: Add DeviceTokens and NotificationLogs tables
-- Date: 2026-03-02
-- Purpose: FCM push notification support

-- DeviceTokens table
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

    -- Index on CustomerId for efficient token lookup
    CREATE INDEX IX_DeviceTokens_CustomerId ON DeviceTokens(CustomerId);

    -- Index on Token for duplicate checking
    CREATE INDEX IX_DeviceTokens_Token ON DeviceTokens(Token);

    PRINT 'DeviceTokens table created successfully';
END
ELSE
BEGIN
    PRINT 'DeviceTokens table already exists';
END
GO

-- NotificationLogs table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'NotificationLogs')
BEGIN
    CREATE TABLE NotificationLogs (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        CustomerId INT NOT NULL,
        DeviceTokenId INT NULL,
        NotificationType NVARCHAR(50) NOT NULL,
        Title NVARCHAR(200) NOT NULL,
        Body NVARCHAR(500) NOT NULL,
        Status NVARCHAR(20) NOT NULL, -- 'success', 'failed', 'retry'
        FcmResponse NVARCHAR(MAX) NULL,
        CreatedAt DATETIME NOT NULL DEFAULT GETDATE()
    );

    -- Index on CustomerId for log queries
    CREATE INDEX IX_NotificationLogs_CustomerId ON NotificationLogs(CustomerId);

    -- Index on CreatedAt for time-based queries
    CREATE INDEX IX_NotificationLogs_CreatedAt ON NotificationLogs(CreatedAt DESC);

    PRINT 'NotificationLogs table created successfully';
END
ELSE
BEGIN
    PRINT 'NotificationLogs table already exists';
END
GO
