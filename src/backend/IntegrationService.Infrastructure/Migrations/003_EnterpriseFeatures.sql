-- Enterprise Features Migration
-- Database: IntegrationService (overlay database, NOT INI_Restaurant)
-- Run this AFTER 001_InitialSchema.sql and 002_* migrations

USE IntegrationService;
GO

-- ============================================================================
-- Push Campaigns Table
-- Stores marketing push notification campaigns with RFM targeting
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[PushCampaigns]') AND type = 'U')
BEGIN
    CREATE TABLE [dbo].[PushCampaigns] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [Name] NVARCHAR(200) NOT NULL,
        [Title] NVARCHAR(200) NOT NULL,
        [Body] NVARCHAR(MAX) NOT NULL,
        [ImageUrl] NVARCHAR(500) NULL,

        -- RFM Targeting Criteria
        [MinSpend] DECIMAL(10,2) NULL,
        [MaxSpend] DECIMAL(10,2) NULL,
        [MinVisits] INT NULL,
        [MaxVisits] INT NULL,
        [RecencyDays] INT NULL,           -- Ordered within X days
        [InactiveDays] INT NULL,          -- No order for X days (at-risk)
        [HasBirthdayToday] BIT NULL,
        [SegmentFilter] NVARCHAR(50) NULL, -- VIP, Loyal, At-Risk, Regular

        -- Scheduling
        [ScheduledAt] DATETIME NULL,
        [Status] NVARCHAR(20) NOT NULL DEFAULT 'draft',

        -- Stats
        [TargetCount] INT NOT NULL DEFAULT 0,
        [SentCount] INT NOT NULL DEFAULT 0,
        [FailedCount] INT NOT NULL DEFAULT 0,

        [CreatedAt] DATETIME NOT NULL DEFAULT GETDATE(),
        [SentAt] DATETIME NULL
    );

    CREATE INDEX IX_PushCampaigns_Status ON PushCampaigns([Status]);
    CREATE INDEX IX_PushCampaigns_ScheduledAt ON PushCampaigns([ScheduledAt]) WHERE [Status] = 'scheduled';

    PRINT 'Created PushCampaigns table';
END
GO

-- ============================================================================
-- Scheduled Orders Table
-- Holds future orders until injection time
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ScheduledOrders]') AND type = 'U')
BEGIN
    CREATE TABLE [dbo].[ScheduledOrders] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [CustomerId] INT NOT NULL,
        [IdempotencyKey] NVARCHAR(100) NOT NULL,

        -- Order data (JSON serialized)
        [OrderJson] NVARCHAR(MAX) NOT NULL,
        [SubTotal] DECIMAL(10,2) NOT NULL,
        [TaxAmount] DECIMAL(10,2) NOT NULL,
        [TotalAmount] DECIMAL(10,2) NOT NULL,

        -- Payment data (tokenized, no raw card data)
        [PaymentToken] NVARCHAR(500) NULL,
        [CardType] NVARCHAR(20) NULL,
        [Last4] NVARCHAR(4) NULL,

        -- Scheduling
        [TargetDateTime] DATETIME NOT NULL,
        [PrepTimeMinutes] INT NOT NULL DEFAULT 30,

        -- Status tracking
        [Status] NVARCHAR(20) NOT NULL DEFAULT 'pending',
        [SalesId] INT NULL,               -- POS SalesID after injection
        [ErrorMessage] NVARCHAR(MAX) NULL,

        [CreatedAt] DATETIME NOT NULL DEFAULT GETDATE(),
        [InjectedAt] DATETIME NULL,

        CONSTRAINT UQ_ScheduledOrders_IdempotencyKey UNIQUE ([IdempotencyKey])
    );

    CREATE INDEX IX_ScheduledOrders_Status ON ScheduledOrders([Status]);
    CREATE INDEX IX_ScheduledOrders_CustomerId ON ScheduledOrders([CustomerId]);
    CREATE INDEX IX_ScheduledOrders_Injection ON ScheduledOrders([Status], [TargetDateTime])
        WHERE [Status] = 'pending';

    PRINT 'Created ScheduledOrders table';
END
GO

-- ============================================================================
-- Menu Overlays Table
-- Online enable/disable and custom images for menu items
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[MenuOverlays]') AND type = 'U')
BEGIN
    CREATE TABLE [dbo].[MenuOverlays] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [ItemId] INT NULL,                -- References tblItem.ID in POS
        [CategoryId] INT NULL,            -- Or override entire category

        [IsEnabled] BIT NOT NULL DEFAULT 1,
        [OverrideImageUrl] NVARCHAR(500) NULL,
        [OverrideDescription] NVARCHAR(MAX) NULL,
        [DisplayOrder] INT NULL,

        -- Availability windows
        [AvailableFrom] TIME NULL,        -- e.g., 11:00 (lunch items)
        [AvailableTo] TIME NULL,          -- e.g., 14:00
        [AvailableDays] NVARCHAR(50) NULL, -- e.g., 'Mon,Tue,Wed,Thu,Fri'

        [CreatedAt] DATETIME NOT NULL DEFAULT GETDATE(),
        [UpdatedAt] DATETIME NOT NULL DEFAULT GETDATE()
    );

    CREATE UNIQUE INDEX IX_MenuOverlays_ItemId ON MenuOverlays([ItemId]) WHERE [ItemId] IS NOT NULL;
    CREATE UNIQUE INDEX IX_MenuOverlays_CategoryId ON MenuOverlays([CategoryId]) WHERE [CategoryId] IS NOT NULL AND [ItemId] IS NULL;

    PRINT 'Created MenuOverlays table';
END
GO

-- ============================================================================
-- Marketing Rules Table
-- Upsell/cross-sell rules
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[MarketingRules]') AND type = 'U')
BEGIN
    CREATE TABLE [dbo].[MarketingRules] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [RuleType] NVARCHAR(20) NOT NULL DEFAULT 'upsell',

        [TriggerItemId] INT NULL,
        [TriggerCategoryId] INT NULL,
        [TriggerMinCartValue] DECIMAL(10,2) NULL,

        [SuggestItemId] INT NOT NULL,
        [Message] NVARCHAR(200) NOT NULL,
        [Position] NVARCHAR(20) NOT NULL DEFAULT 'cart',

        [IsActive] BIT NOT NULL DEFAULT 1,
        [Priority] INT NOT NULL DEFAULT 0,

        [CreatedAt] DATETIME NOT NULL DEFAULT GETDATE()
    );

    CREATE INDEX IX_MarketingRules_Active ON MarketingRules([IsActive], [Priority] DESC);
    CREATE INDEX IX_MarketingRules_TriggerItem ON MarketingRules([TriggerItemId]) WHERE [IsActive] = 1;
    CREATE INDEX IX_MarketingRules_TriggerCategory ON MarketingRules([TriggerCategoryId]) WHERE [IsActive] = 1;

    PRINT 'Created MarketingRules table';
END
GO

-- ============================================================================
-- Customer Profiles Table (if not exists)
-- Extended customer data overlay
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[CustomerProfiles]') AND type = 'U')
BEGIN
    CREATE TABLE [dbo].[CustomerProfiles] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [PosCustomerId] INT NOT NULL,     -- References tblCustomer.ID in POS

        [Email] NVARCHAR(200) NULL,
        [PasswordHash] NVARCHAR(500) NULL,
        [BirthMonth] INT NULL,
        [BirthDay] INT NULL,
        [PreferredLanguage] NVARCHAR(10) NULL DEFAULT 'en',

        [LastBirthdayRewardYear] INT NULL,  -- Track annual reward
        [MarketingOptIn] BIT NOT NULL DEFAULT 1,

        [CreatedAt] DATETIME NOT NULL DEFAULT GETDATE(),
        [UpdatedAt] DATETIME NOT NULL DEFAULT GETDATE(),

        CONSTRAINT UQ_CustomerProfiles_PosCustomerId UNIQUE ([PosCustomerId])
    );

    CREATE INDEX IX_CustomerProfiles_Email ON CustomerProfiles([Email]);
    CREATE INDEX IX_CustomerProfiles_Birthday ON CustomerProfiles([BirthMonth], [BirthDay]);

    PRINT 'Created CustomerProfiles table';
END
GO

PRINT 'Enterprise features migration complete';
