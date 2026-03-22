-- IMIDUS POS Integration - Database Initialization Script
-- This script creates the IntegrationService database and required tables
-- The INI_Restaurant database should be restored from backup separately

USE master;
GO

-- Create IntegrationService database if not exists
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'IntegrationService')
BEGIN
    CREATE DATABASE IntegrationService;
    PRINT 'IntegrationService database created.';
END
GO

USE IntegrationService;
GO

-- =====================================================
-- IDEMPOTENCY KEYS TABLE
-- Prevents duplicate order processing
-- =====================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'IdempotencyKeys')
BEGIN
    CREATE TABLE IdempotencyKeys (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        IdempotencyKey NVARCHAR(100) NOT NULL UNIQUE,
        RequestPath NVARCHAR(500) NOT NULL,
        RequestMethod NVARCHAR(10) NOT NULL,
        ResponseStatusCode INT NULL,
        ResponseBody NVARCHAR(MAX) NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        ExpiresAt DATETIME2 NOT NULL,
        INDEX IX_IdempotencyKeys_Key (IdempotencyKey),
        INDEX IX_IdempotencyKeys_Expires (ExpiresAt)
    );
    PRINT 'IdempotencyKeys table created.';
END
GO

-- =====================================================
-- CUSTOMER PROFILE TABLE (Overlay for INI tblCustomer)
-- =====================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'CustomerProfiles')
BEGIN
    CREATE TABLE CustomerProfiles (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        PosCustomerId INT NOT NULL,  -- Links to INI_Restaurant.tblCustomer.ID
        Email NVARCHAR(255) NULL,
        PasswordHash NVARCHAR(500) NULL,
        FcmToken NVARCHAR(500) NULL,
        BirthMonth INT NULL,
        BirthDay INT NULL,
        LastLoginAt DATETIME2 NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_CustomerProfiles_PosCustomerId UNIQUE (PosCustomerId),
        CONSTRAINT UQ_CustomerProfiles_Email UNIQUE (Email),
        INDEX IX_CustomerProfiles_Email (Email),
        INDEX IX_CustomerProfiles_Birthday (BirthMonth, BirthDay)
    );
    PRINT 'CustomerProfiles table created.';
END
GO

-- =====================================================
-- MENU OVERLAY TABLE
-- Controls online visibility without modifying POS
-- =====================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'MenuOverlay')
BEGIN
    CREATE TABLE MenuOverlay (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        ItemId INT NOT NULL,  -- Links to INI_Restaurant.tblItem.ID
        CategoryId INT NULL,  -- Optional: Links to tblCategory.ID
        OnlineEnabled BIT NOT NULL DEFAULT 1,
        DisplayOrder INT NULL,
        CustomDescription NVARCHAR(500) NULL,
        CustomImageUrl NVARCHAR(500) NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_MenuOverlay_ItemId UNIQUE (ItemId),
        INDEX IX_MenuOverlay_Category (CategoryId)
    );
    PRINT 'MenuOverlay table created.';
END
GO

-- =====================================================
-- SCHEDULED ORDERS TABLE
-- Holds future orders until pickup time
-- =====================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ScheduledOrders')
BEGIN
    CREATE TABLE ScheduledOrders (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        CustomerId INT NOT NULL,
        ScheduledPickupTime DATETIME2 NOT NULL,
        OrderData NVARCHAR(MAX) NOT NULL,  -- JSON payload
        PaymentTransactionId NVARCHAR(100) NULL,
        Status NVARCHAR(50) NOT NULL DEFAULT 'Pending',
        -- Pending, Released, Cancelled, Failed
        ReleasedAt DATETIME2 NULL,
        PosSalesId INT NULL,  -- Links to INI_Restaurant.tblSales.ID after release
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        INDEX IX_ScheduledOrders_Pickup (ScheduledPickupTime, Status),
        INDEX IX_ScheduledOrders_Customer (CustomerId)
    );
    PRINT 'ScheduledOrders table created.';
END
GO

-- =====================================================
-- MARKETING RULES (Upselling)
-- =====================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'MarketingRules')
BEGIN
    CREATE TABLE MarketingRules (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        RuleName NVARCHAR(100) NOT NULL,
        TriggerItemId INT NOT NULL,
        SuggestItemId INT NOT NULL,
        Priority INT NOT NULL DEFAULT 1,
        IsActive BIT NOT NULL DEFAULT 1,
        StartDate DATETIME2 NULL,
        EndDate DATETIME2 NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        INDEX IX_MarketingRules_Trigger (TriggerItemId, IsActive)
    );
    PRINT 'MarketingRules table created.';
END
GO

-- =====================================================
-- PUSH NOTIFICATIONS TABLE
-- =====================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PushNotifications')
BEGIN
    CREATE TABLE PushNotifications (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Title NVARCHAR(200) NOT NULL,
        Body NVARCHAR(1000) NOT NULL,
        Data NVARCHAR(MAX) NULL,  -- JSON payload
        TargetType NVARCHAR(50) NOT NULL,  -- All, Segment, Individual
        TargetCriteria NVARCHAR(MAX) NULL,  -- JSON for segment rules
        Status NVARCHAR(50) NOT NULL DEFAULT 'Draft',
        -- Draft, Scheduled, Sending, Sent, Failed
        ScheduledFor DATETIME2 NULL,
        SentAt DATETIME2 NULL,
        SuccessCount INT NOT NULL DEFAULT 0,
        FailureCount INT NOT NULL DEFAULT 0,
        CreatedBy NVARCHAR(100) NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        INDEX IX_PushNotifications_Status (Status, ScheduledFor)
    );
    PRINT 'PushNotifications table created.';
END
GO

-- =====================================================
-- DEVICE TOKENS TABLE
-- =====================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'DeviceTokens')
BEGIN
    CREATE TABLE DeviceTokens (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        CustomerId INT NOT NULL,
        Token NVARCHAR(500) NOT NULL,
        Platform NVARCHAR(20) NOT NULL,  -- iOS, Android, Web
        IsActive BIT NOT NULL DEFAULT 1,
        LastUsedAt DATETIME2 NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        INDEX IX_DeviceTokens_Customer (CustomerId),
        INDEX IX_DeviceTokens_Token (Token)
    );
    PRINT 'DeviceTokens table created.';
END
GO

-- =====================================================
-- NOTIFICATION LOG TABLE
-- =====================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'NotificationLog')
BEGIN
    CREATE TABLE NotificationLog (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        NotificationId INT NOT NULL,
        DeviceTokenId INT NOT NULL,
        Status NVARCHAR(50) NOT NULL,  -- Sent, Delivered, Failed
        ErrorMessage NVARCHAR(500) NULL,
        SentAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        INDEX IX_NotificationLog_Notification (NotificationId)
    );
    PRINT 'NotificationLog table created.';
END
GO

-- =====================================================
-- BIRTHDAY REWARDS LOG
-- =====================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'BirthdayRewardLog')
BEGIN
    CREATE TABLE BirthdayRewardLog (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        CustomerId INT NOT NULL,
        RewardYear INT NOT NULL,
        PointsAwarded INT NOT NULL,
        NotificationSent BIT NOT NULL DEFAULT 0,
        ProcessedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_BirthdayReward_Customer_Year UNIQUE (CustomerId, RewardYear),
        INDEX IX_BirthdayRewardLog_Year (RewardYear)
    );
    PRINT 'BirthdayRewardLog table created.';
END
GO

-- =====================================================
-- AUDIT LOG TABLE
-- =====================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AuditLog')
BEGIN
    CREATE TABLE AuditLog (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Action NVARCHAR(100) NOT NULL,
        EntityType NVARCHAR(100) NOT NULL,
        EntityId NVARCHAR(100) NULL,
        OldValues NVARCHAR(MAX) NULL,
        NewValues NVARCHAR(MAX) NULL,
        UserId NVARCHAR(100) NULL,
        IpAddress NVARCHAR(50) NULL,
        Timestamp DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        INDEX IX_AuditLog_Entity (EntityType, EntityId),
        INDEX IX_AuditLog_Timestamp (Timestamp)
    );
    PRINT 'AuditLog table created.';
END
GO

-- =====================================================
-- ONLINE ORDER STATUS TABLE
-- Tracks online order status separately from POS
-- =====================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'OnlineOrderStatus')
BEGIN
    CREATE TABLE OnlineOrderStatus (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        PosSalesId INT NOT NULL,
        Status NVARCHAR(50) NOT NULL,
        -- Received, Preparing, Ready, PickedUp, Cancelled
        EstimatedReadyTime DATETIME2 NULL,
        ActualReadyTime DATETIME2 NULL,
        PickedUpAt DATETIME2 NULL,
        Notes NVARCHAR(500) NULL,
        UpdatedBy NVARCHAR(100) NULL,
        UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_OnlineOrderStatus_Sales UNIQUE (PosSalesId),
        INDEX IX_OnlineOrderStatus_Status (Status)
    );
    PRINT 'OnlineOrderStatus table created.';
END
GO

-- =====================================================
-- SEED DATA
-- =====================================================

-- Test customer profile
IF NOT EXISTS (SELECT * FROM CustomerProfiles WHERE Email = 'test@imidus.com')
BEGIN
    INSERT INTO CustomerProfiles (PosCustomerId, Email, PasswordHash, BirthMonth, BirthDay)
    VALUES (1, 'test@imidus.com',
            -- Password: Test123! (BCrypt hash)
            '$2a$11$rBcJpPOoRMKrwzLKqKGKl.XQkYJ1vNvN9DqZqMNMBPCqJ.jHpIlYK',
            6, 15);
    PRINT 'Test customer profile created.';
END
GO

-- Admin profile
IF NOT EXISTS (SELECT * FROM CustomerProfiles WHERE Email = 'admin@imidus.com')
BEGIN
    INSERT INTO CustomerProfiles (PosCustomerId, Email, PasswordHash, BirthMonth, BirthDay)
    VALUES (0, 'admin@imidus.com',
            -- Password: Admin123! (BCrypt hash)
            '$2a$11$K2gJrYhWY.0i5yTR6VPqT.qT6Y6rX8sPx2CGQK.bN.HqNRJqXOlYO',
            1, 1);
    PRINT 'Admin profile created.';
END
GO

-- Sample upselling rule
IF NOT EXISTS (SELECT * FROM MarketingRules WHERE RuleName = 'Burger + Fries')
BEGIN
    INSERT INTO MarketingRules (RuleName, TriggerItemId, SuggestItemId, Priority, IsActive)
    VALUES ('Burger + Fries', 1, 2, 1, 1);
    PRINT 'Sample upselling rule created.';
END
GO

PRINT '============================================';
PRINT 'IntegrationService database initialization complete!';
PRINT '============================================';
GO
