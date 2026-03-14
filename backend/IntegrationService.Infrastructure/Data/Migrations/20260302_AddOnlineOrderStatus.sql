-- Migration: Add OnlineOrderStatus table
-- Date: 2026-03-02
-- Purpose: Track notification status for online orders without modifying POS schema

-- OnlineOrderStatus table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'OnlineOrderStatus')
BEGIN
    CREATE TABLE OnlineOrderStatus (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        SalesId INT NOT NULL,
        ReadyNotificationSent BIT NOT NULL DEFAULT 0,
        ConfirmationNotificationSent BIT NOT NULL DEFAULT 0,
        LastCheckedAt DATETIME NOT NULL,
        CreatedAt DATETIME NOT NULL DEFAULT GETDATE()
    );

    -- Unique index on SalesId to ensure one status record per order
    CREATE UNIQUE INDEX IX_OnlineOrderStatus_SalesId ON OnlineOrderStatus(SalesId);

    -- Index on ReadyNotificationSent for efficient polling queries
    CREATE INDEX IX_OnlineOrderStatus_ReadyNotificationSent ON OnlineOrderStatus(ReadyNotificationSent);

    PRINT 'OnlineOrderStatus table created successfully';
END
ELSE
BEGIN
    PRINT 'OnlineOrderStatus table already exists';
END
GO
