-- IMIDUS POS Integration - Database Dump
-- Generated: 2026-03-19
--
-- This file contains:
-- 1. IntegrationService database schema (backend overlay tables)
-- 2. Seed data for testing
--
-- NOTE: INI_Restaurant database must be restored separately from
-- the provided INI_Restaurant.Bak file.
--
-- Restore Instructions:
-- 1. Copy INI_Restaurant.Bak to SQL Server backup directory
-- 2. Run: RESTORE DATABASE INI_Restaurant FROM DISK = '/path/to/INI_Restaurant.Bak'
--         WITH MOVE 'TPPro' TO '/var/opt/mssql/data/INI_Restaurant.mdf',
--              MOVE 'TPPro_log' TO '/var/opt/mssql/data/INI_Restaurant.ldf'

-- =====================================================
-- SECTION 1: IntegrationService Database
-- =====================================================

USE master;
GO

IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'IntegrationService')
BEGIN
    CREATE DATABASE IntegrationService;
END
GO

USE IntegrationService;
GO

-- IdempotencyKeys: Prevents duplicate API calls
CREATE TABLE IdempotencyKeys (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    IdempotencyKey NVARCHAR(100) NOT NULL UNIQUE,
    RequestPath NVARCHAR(500) NOT NULL,
    RequestMethod NVARCHAR(10) NOT NULL,
    ResponseStatusCode INT NULL,
    ResponseBody NVARCHAR(MAX) NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    ExpiresAt DATETIME2 NOT NULL
);
CREATE INDEX IX_IdempotencyKeys_Key ON IdempotencyKeys(IdempotencyKey);
CREATE INDEX IX_IdempotencyKeys_Expires ON IdempotencyKeys(ExpiresAt);
GO

-- CustomerProfiles: Extends POS customer data
CREATE TABLE CustomerProfiles (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    PosCustomerId INT NOT NULL UNIQUE,
    Email NVARCHAR(255) NULL UNIQUE,
    PasswordHash NVARCHAR(500) NULL,
    FcmToken NVARCHAR(500) NULL,
    BirthMonth INT NULL,
    BirthDay INT NULL,
    LastLoginAt DATETIME2 NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);
CREATE INDEX IX_CustomerProfiles_Email ON CustomerProfiles(Email);
CREATE INDEX IX_CustomerProfiles_Birthday ON CustomerProfiles(BirthMonth, BirthDay);
GO

-- MenuOverlay: Controls online item visibility
CREATE TABLE MenuOverlay (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    ItemId INT NOT NULL UNIQUE,
    CategoryId INT NULL,
    OnlineEnabled BIT NOT NULL DEFAULT 1,
    DisplayOrder INT NULL,
    CustomDescription NVARCHAR(500) NULL,
    CustomImageUrl NVARCHAR(500) NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);
CREATE INDEX IX_MenuOverlay_Category ON MenuOverlay(CategoryId);
GO

-- ScheduledOrders: Future pickup orders
CREATE TABLE ScheduledOrders (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    CustomerId INT NOT NULL,
    ScheduledPickupTime DATETIME2 NOT NULL,
    OrderData NVARCHAR(MAX) NOT NULL,
    PaymentTransactionId NVARCHAR(100) NULL,
    Status NVARCHAR(50) NOT NULL DEFAULT 'Pending',
    ReleasedAt DATETIME2 NULL,
    PosSalesId INT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);
CREATE INDEX IX_ScheduledOrders_Pickup ON ScheduledOrders(ScheduledPickupTime, Status);
CREATE INDEX IX_ScheduledOrders_Customer ON ScheduledOrders(CustomerId);
GO

-- MarketingRules: Upselling configuration
CREATE TABLE MarketingRules (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    RuleName NVARCHAR(100) NOT NULL,
    TriggerItemId INT NOT NULL,
    SuggestItemId INT NOT NULL,
    Priority INT NOT NULL DEFAULT 1,
    IsActive BIT NOT NULL DEFAULT 1,
    StartDate DATETIME2 NULL,
    EndDate DATETIME2 NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);
CREATE INDEX IX_MarketingRules_Trigger ON MarketingRules(TriggerItemId, IsActive);
GO

-- PushNotifications: Campaign management
CREATE TABLE PushNotifications (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Title NVARCHAR(200) NOT NULL,
    Body NVARCHAR(1000) NOT NULL,
    Data NVARCHAR(MAX) NULL,
    TargetType NVARCHAR(50) NOT NULL,
    TargetCriteria NVARCHAR(MAX) NULL,
    Status NVARCHAR(50) NOT NULL DEFAULT 'Draft',
    ScheduledFor DATETIME2 NULL,
    SentAt DATETIME2 NULL,
    SuccessCount INT NOT NULL DEFAULT 0,
    FailureCount INT NOT NULL DEFAULT 0,
    CreatedBy NVARCHAR(100) NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);
CREATE INDEX IX_PushNotifications_Status ON PushNotifications(Status, ScheduledFor);
GO

-- DeviceTokens: FCM registration
CREATE TABLE DeviceTokens (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    CustomerId INT NOT NULL,
    Token NVARCHAR(500) NOT NULL,
    Platform NVARCHAR(20) NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    LastUsedAt DATETIME2 NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);
CREATE INDEX IX_DeviceTokens_Customer ON DeviceTokens(CustomerId);
CREATE INDEX IX_DeviceTokens_Token ON DeviceTokens(Token);
GO

-- NotificationLog: Delivery tracking
CREATE TABLE NotificationLog (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    NotificationId INT NOT NULL,
    DeviceTokenId INT NOT NULL,
    Status NVARCHAR(50) NOT NULL,
    ErrorMessage NVARCHAR(500) NULL,
    SentAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);
CREATE INDEX IX_NotificationLog_Notification ON NotificationLog(NotificationId);
GO

-- BirthdayRewardLog: Annual reward tracking
CREATE TABLE BirthdayRewardLog (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    CustomerId INT NOT NULL,
    RewardYear INT NOT NULL,
    PointsAwarded INT NOT NULL,
    NotificationSent BIT NOT NULL DEFAULT 0,
    ProcessedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT UQ_BirthdayReward_Customer_Year UNIQUE (CustomerId, RewardYear)
);
CREATE INDEX IX_BirthdayRewardLog_Year ON BirthdayRewardLog(RewardYear);
GO

-- AuditLog: Action tracking
CREATE TABLE AuditLog (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Action NVARCHAR(100) NOT NULL,
    EntityType NVARCHAR(100) NOT NULL,
    EntityId NVARCHAR(100) NULL,
    OldValues NVARCHAR(MAX) NULL,
    NewValues NVARCHAR(MAX) NULL,
    UserId NVARCHAR(100) NULL,
    IpAddress NVARCHAR(50) NULL,
    Timestamp DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);
CREATE INDEX IX_AuditLog_Entity ON AuditLog(EntityType, EntityId);
CREATE INDEX IX_AuditLog_Timestamp ON AuditLog(Timestamp);
GO

-- OnlineOrderStatus: Status tracking
CREATE TABLE OnlineOrderStatus (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    PosSalesId INT NOT NULL UNIQUE,
    Status NVARCHAR(50) NOT NULL,
    EstimatedReadyTime DATETIME2 NULL,
    ActualReadyTime DATETIME2 NULL,
    PickedUpAt DATETIME2 NULL,
    Notes NVARCHAR(500) NULL,
    UpdatedBy NVARCHAR(100) NULL,
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);
CREATE INDEX IX_OnlineOrderStatus_Status ON OnlineOrderStatus(Status);
GO

-- =====================================================
-- SECTION 2: Seed Data
-- =====================================================

-- Test Customer (Password: Test123!)
INSERT INTO CustomerProfiles (PosCustomerId, Email, PasswordHash, BirthMonth, BirthDay)
VALUES (1, 'test@imidus.com',
        '$2a$11$rBcJpPOoRMKrwzLKqKGKl.XQkYJ1vNvN9DqZqMNMBPCqJ.jHpIlYK',
        6, 15);

-- Admin User (Password: Admin123!)
INSERT INTO CustomerProfiles (PosCustomerId, Email, PasswordHash, BirthMonth, BirthDay)
VALUES (0, 'admin@imidus.com',
        '$2a$11$K2gJrYhWY.0i5yTR6VPqT.qT6Y6rX8sPx2CGQK.bN.HqNRJqXOlYO',
        1, 1);

-- Sample Upselling Rules
INSERT INTO MarketingRules (RuleName, TriggerItemId, SuggestItemId, Priority)
VALUES
    ('Burger + Fries', 1, 2, 1),
    ('Pizza + Drink', 5, 10, 1),
    ('Entree + Dessert', 3, 15, 2);

-- Enable some items for online ordering
INSERT INTO MenuOverlay (ItemId, OnlineEnabled, DisplayOrder)
VALUES
    (1, 1, 1),
    (2, 1, 2),
    (3, 1, 3),
    (5, 1, 5),
    (10, 1, 10);

PRINT 'Database initialization complete.';
GO
