-- IntegrationService Overlay Tables for Milestone 4 Admin Portal
-- SSOT Compliance: All overlay tables only - never modify INI_Restaurant schema

-- Activity Log for admin actions
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ActivityLogs')
BEGIN
    CREATE TABLE ActivityLogs (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        AdminUserId INT NOT NULL,
        AdminEmail NVARCHAR(255) NOT NULL,
        Action NVARCHAR(100) NOT NULL,
        EntityType NVARCHAR(50) NULL, -- 'Order', 'Customer', 'Menu', 'Campaign', etc.
        EntityId INT NULL,
        Details NVARCHAR(MAX) NULL,
        IpAddress NVARCHAR(45) NULL,
        UserAgent NVARCHAR(500) NULL,
        Timestamp DATETIME2 NOT NULL DEFAULT GETDATE(),
        Success BIT NOT NULL DEFAULT 1
    );

    CREATE INDEX IX_ActivityLogs_Timestamp ON ActivityLogs(Timestamp DESC);
    CREATE INDEX IX_ActivityLogs_AdminUserId ON ActivityLogs(AdminUserId);
    CREATE INDEX IX_ActivityLogs_Action ON ActivityLogs(Action);

    PRINT 'ActivityLogs table created successfully';
END
ELSE
BEGIN
    PRINT 'ActivityLogs table already exists';
END
GO

-- Menu Overlay (enable/disable items without modifying POS)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'MenuOverlays')
BEGIN
    CREATE TABLE MenuOverlays (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        ItemID INT NOT NULL, -- References POS tblAvailableSize.ItemID
        SizeID INT NOT NULL, -- References POS tblAvailableSize.SizeID
        IsEnabled BIT NOT NULL DEFAULT 1,
        DisplayName NVARCHAR(255) NULL, -- Optional override
        DisplayDescription NVARCHAR(500) NULL, -- Optional override
        DisplayOrder INT NULL,
        CategoryOverride NVARCHAR(100) NULL,
        UpdatedBy INT NULL,
        UpdatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        CONSTRAINT UQ_MenuOverlays_ItemSize UNIQUE (ItemID, SizeID)
    );

    CREATE INDEX IX_MenuOverlays_ItemID ON MenuOverlays(ItemID);
    CREATE INDEX IX_MenuOverlays_IsEnabled ON MenuOverlays(IsEnabled);

    PRINT 'MenuOverlays table created successfully';
END
ELSE
BEGIN
    PRINT 'MenuOverlays table already exists';
END
GO

-- Push Notification Campaigns
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PushCampaigns')
BEGIN
    CREATE TABLE PushCampaigns (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Name NVARCHAR(255) NOT NULL,
        Description NVARCHAR(500) NULL,
        Title NVARCHAR(255) NOT NULL,
        Body NVARCHAR(500) NOT NULL,
        ImageUrl NVARCHAR(500) NULL,
        DeepLinkScreen NVARCHAR(100) NULL, -- 'Menu', 'OrderTracking', 'Profile', etc.
        
        -- Audience Targeting (RFM)
        MinSpend DECIMAL(10,2) NULL,
        MinFrequency INT NULL,
        MaxRecencyDays INT NULL,
        TargetCustomerIds NVARCHAR(MAX) NULL, -- JSON array of specific IDs
        
        -- Scheduling
        Status NVARCHAR(20) NOT NULL DEFAULT 'draft', -- draft, scheduled, sent, cancelled
        ScheduledDateTime DATETIME2 NULL,
        SentDateTime DATETIME2 NULL,
        
        -- Statistics
        TargetCount INT NULL,
        SentCount INT NULL,
        DeliveredCount INT NULL,
        OpenedCount INT NULL,
        
        CreatedBy INT NOT NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
    );

    CREATE INDEX IX_PushCampaigns_Status ON PushCampaigns(Status);
    CREATE INDEX IX_PushCampaigns_ScheduledDateTime ON PushCampaigns(ScheduledDateTime);

    PRINT 'PushCampaigns table created successfully';
END
ELSE
BEGIN
    PRINT 'PushCampaigns table already exists';
END
GO

-- Birthday Rewards Configuration
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'BirthdayRewardConfigs')
BEGIN
    CREATE TABLE BirthdayRewardConfigs (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        IsEnabled BIT NOT NULL DEFAULT 1,
        DaysBeforeBirthday INT NOT NULL DEFAULT 0, -- 0 = on birthday, 7 = week before
        RewardPoints INT NOT NULL DEFAULT 50,
        RewardDescription NVARCHAR(255) NOT NULL DEFAULT 'Birthday Bonus',
        BonusMultiplier DECIMAL(3,2) NULL, -- e.g., 2.00 for 2x points on birthday orders
        NotificationTitle NVARCHAR(255) NOT NULL DEFAULT 'Happy Birthday from IMIDUS!',
        NotificationBody NVARCHAR(500) NOT NULL DEFAULT 'We''ve added bonus points to your account. Enjoy your special day!',
        LastProcessedDate DATE NULL, -- Track which birthdays we've processed
        UpdatedBy INT NULL,
        UpdatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
    );

    PRINT 'BirthdayRewardConfigs table created successfully';
END
ELSE
BEGIN
    PRINT 'BirthdayRewardConfigs table already exists';
END
GO

-- Customer Birthday Tracking (overlay for customers)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'CustomerBirthdayTracking')
BEGIN
    CREATE TABLE CustomerBirthdayTracking (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        CustomerID INT NOT NULL, -- References POS tblCustomer.ID
        LastBirthdayRewardDate DATE NULL,
        TotalBirthdayRewards INT NOT NULL DEFAULT 0,
        IsBirthdayToday BIT NOT NULL DEFAULT 0,
        CONSTRAINT UQ_CustomerBirthdayTracking_CustomerID UNIQUE (CustomerID)
    );

    CREATE INDEX IX_CustomerBirthdayTracking_IsBirthdayToday ON CustomerBirthdayTracking(IsBirthdayToday);

    PRINT 'CustomerBirthdayTracking table created successfully';
END
ELSE
BEGIN
    PRINT 'CustomerBirthdayTracking table already exists';
END
GO

-- Terminal Bridge Transactions (for M6 integration)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TerminalBridgeTransactions')
BEGIN
    CREATE TABLE TerminalBridgeTransactions (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        SalesID INT NOT NULL, -- References POS tblSales.SalesID
        OrderNumber NVARCHAR(50) NOT NULL,
        Amount DECIMAL(10,2) NOT NULL,
        
        -- Bridge Request/Response
        BridgeRequestId NVARCHAR(100) NOT NULL,
        BridgeRequestData NVARCHAR(MAX) NULL, -- JSON
        BridgeResponseData NVARCHAR(MAX) NULL, -- JSON
        
        -- Status
        Status NVARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, processing, approved, declined, error
        StatusMessage NVARCHAR(500) NULL,
        
        -- Card Info (tokenized - safe to store)
        CardLastFour NVARCHAR(4) NULL,
        CardType NVARCHAR(20) NULL,
        AuthCode NVARCHAR(50) NULL,
        TransactionId NVARCHAR(100) NULL,
        
        -- Receipt
        ReceiptData NVARCHAR(MAX) NULL, -- JSON for receipt printing
        
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        CompletedAt DATETIME2 NULL
    );

    CREATE INDEX IX_TerminalBridgeTransactions_SalesID ON TerminalBridgeTransactions(SalesID);
    CREATE INDEX IX_TerminalBridgeTransactions_Status ON TerminalBridgeTransactions(Status);
    CREATE INDEX IX_TerminalBridgeTransactions_CreatedAt ON TerminalBridgeTransactions(CreatedAt);

    PRINT 'TerminalBridgeTransactions table created successfully';
END
ELSE
BEGIN
    PRINT 'TerminalBridgeTransactions table already exists';
END
GO

-- IP Whitelist for admin access
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AdminIpWhitelists')
BEGIN
    CREATE TABLE AdminIpWhitelists (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        AdminUserId INT NOT NULL,
        IpAddress NVARCHAR(45) NOT NULL, -- Supports IPv4 and IPv6
        Description NVARCHAR(255) NULL,
        IsEnabled BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        CreatedBy INT NOT NULL,
        CONSTRAINT UQ_AdminIpWhitelists_AdminIp UNIQUE (AdminUserId, IpAddress)
    );

    CREATE INDEX IX_AdminIpWhitelists_AdminUserId ON AdminIpWhitelists(AdminUserId);
    CREATE INDEX IX_AdminIpWhitelists_IpAddress ON AdminIpWhitelists(IpAddress);

    PRINT 'AdminIpWhitelists table created successfully';
END
ELSE
BEGIN
    PRINT 'AdminIpWhitelists table already exists';
END
GO

-- Admin User Roles
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AdminRoles')
BEGIN
    CREATE TABLE AdminRoles (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Name NVARCHAR(50) NOT NULL UNIQUE,
        Description NVARCHAR(255) NULL,
        Permissions NVARCHAR(MAX) NOT NULL, -- JSON array of permission strings
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
    );

    PRINT 'AdminRoles table created successfully';
END
ELSE
BEGIN
    PRINT 'AdminRoles table already exists';
END
GO

-- Admin Users
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AdminUsers')
BEGIN
    CREATE TABLE AdminUsers (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Email NVARCHAR(255) NOT NULL UNIQUE,
        PasswordHash NVARCHAR(500) NOT NULL,
        FirstName NVARCHAR(100) NOT NULL,
        LastName NVARCHAR(100) NOT NULL,
        Phone NVARCHAR(20) NULL,
        RoleId INT NOT NULL,
        IsActive BIT NOT NULL DEFAULT 1,
        LastLoginAt DATETIME2 NULL,
        LastLoginIp NVARCHAR(45) NULL,
        FailedLoginAttempts INT NOT NULL DEFAULT 0,
        LockoutUntil DATETIME2 NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_AdminUsers_Role FOREIGN KEY (RoleId) REFERENCES AdminRoles(Id)
    );

    CREATE INDEX IX_AdminUsers_Email ON AdminUsers(Email);
    CREATE INDEX IX_AdminUsers_IsActive ON AdminUsers(IsActive);

    PRINT 'AdminUsers table created successfully';
END
ELSE
BEGIN
    PRINT 'AdminUsers table already exists';
END
GO

-- Seed default roles
IF NOT EXISTS (SELECT 1 FROM AdminRoles WHERE Name = 'SuperAdmin')
BEGIN
    INSERT INTO AdminRoles (Name, Description, Permissions)
    VALUES ('SuperAdmin', 'Full system access', '["*"]');
END

IF NOT EXISTS (SELECT 1 FROM AdminRoles WHERE Name = 'Manager')
BEGIN
    INSERT INTO AdminRoles (Name, Description, Permissions)
    VALUES ('Manager', 'Order management and reports', '["orders.read", "orders.write", "customers.read", "reports.read", "menu.read", "menu.write", "campaigns.read", "campaigns.write"]');
END

IF NOT EXISTS (SELECT 1 FROM AdminRoles WHERE Name = 'Cashier')
BEGIN
    INSERT INTO AdminRoles (Name, Description, Permissions)
    VALUES ('Cashier', 'Order processing only', '["orders.read", "orders.write", "customers.read"]');
END

-- Seed default birthday reward config
IF NOT EXISTS (SELECT 1 FROM BirthdayRewardConfigs)
BEGIN
    INSERT INTO BirthdayRewardConfigs (IsEnabled, DaysBeforeBirthday, RewardPoints, RewardDescription)
    VALUES (1, 0, 50, 'Birthday Bonus Points');
END

PRINT 'Milestone 4 Admin Portal tables created successfully';
GO