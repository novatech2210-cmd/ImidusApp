-- ===========================================
-- MarketingRules Table - IntegrationService Database
-- OVERLAY TABLE - NOT in INI_Restaurant (source of truth)
-- SSOT Compliant: Stores upselling rules configured in Admin Portal
-- ===========================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'MarketingRules')
BEGIN
    CREATE TABLE MarketingRules (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- Rule Identity
        Name NVARCHAR(100) NOT NULL,
        Description NVARCHAR(500) NULL,
        
        -- Trigger (what item triggers this rule)
        TriggerItemId INT NOT NULL,
        TriggerItemName NVARCHAR(200) NULL,
        
        -- Suggestion (what item to recommend)
        SuggestItemId INT NOT NULL,
        SuggestItemName NVARCHAR(200) NULL,
        
        -- Display
        SuggestionMessage NVARCHAR(200) NOT NULL DEFAULT 'You might also like...',
        
        -- Optional Discount
        DiscountPercent INT NULL,
        
        -- Priority and Status
        Priority INT NOT NULL DEFAULT 100,
        IsActive BIT NOT NULL DEFAULT 1,
        
        -- Usage Limits
        MaxUsagePerOrder INT NULL,
        
        -- Time Constraints (optional)
        StartTime TIME NULL,
        EndTime TIME NULL,
        DaysOfWeek INT NULL DEFAULT 127, -- Bit flags: 1=Mon, 2=Tue, 4=Wed, 8=Thu, 16=Fri, 32=Sat, 64=Sun
        
        -- Cart Value Constraint
        MinOrderSubtotal DECIMAL(18,2) NULL,
        
        -- Customer Segment
        TargetLoyaltyTier NVARCHAR(50) NULL,
        
        -- Audit
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 NULL,
        CreatedBy NVARCHAR(100) NULL,
        
        -- Performance Tracking
        TimesShown INT NOT NULL DEFAULT 0,
        TimesAccepted INT NOT NULL DEFAULT 0
    );

    -- Indexes
    CREATE INDEX IX_MarketingRules_TriggerItem ON MarketingRules(TriggerItemId);
    CREATE INDEX IX_MarketingRules_SuggestItem ON MarketingRules(SuggestItemId);
    CREATE INDEX IX_MarketingRules_Active ON MarketingRules(IsActive) INCLUDE (Priority);
    CREATE INDEX IX_MarketingRules_Tier ON MarketingRules(TargetLoyaltyTier);
    
    PRINT 'MarketingRules table created successfully';
END
ELSE
BEGIN
    PRINT 'MarketingRules table already exists';
END
GO

-- ===========================================
-- UpsellTracking Table - Analytics
-- ===========================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'UpsellTracking')
BEGIN
    CREATE TABLE UpsellTracking (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- Can track by order or session
        ScheduledOrderId INT NULL,
        SessionId NVARCHAR(100) NULL,
        
        -- Which rule was shown
        MarketingRuleId INT NOT NULL,
        
        -- Outcome
        WasAccepted BIT NOT NULL DEFAULT 0,
        ShownAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        AcceptedAt DATETIME2 NULL,
        DiscountApplied DECIMAL(18,2) NULL,
        
        -- Foreign key constraint
        CONSTRAINT FK_UpsellTracking_MarketingRule FOREIGN KEY (MarketingRuleId) 
            REFERENCES MarketingRules(Id)
    );

    -- Indexes
    CREATE INDEX IX_UpsellTracking_Order ON UpsellTracking(ScheduledOrderId);
    CREATE INDEX IX_UpsellTracking_Session ON UpsellTracking(SessionId);
    CREATE INDEX IX_UpsellTracking_Rule ON UpsellTracking(MarketingRuleId);
    CREATE INDEX IX_UpsellTracking_Shown ON UpsellTracking(ShownAt);
    
    PRINT 'UpsellTracking table created successfully';
END
ELSE
BEGIN
    PRINT 'UpsellTracking table already exists';
END
GO

-- ===========================================
-- Sample Rules (can be removed or modified)
-- ===========================================

-- Only insert if MarketingRules table is empty
IF NOT EXISTS (SELECT 1 FROM MarketingRules)
BEGIN
    INSERT INTO MarketingRules (Name, Description, TriggerItemId, TriggerItemName, SuggestItemId, SuggestItemName, SuggestionMessage, Priority, IsActive)
    VALUES 
        ('Burger + Fries', 'Classic combo upsell', 1, 'Classic Burger', 15, 'French Fries', 'Complete your meal with our crispy fries!', 100, 1),
        ('Pizza + Drink', 'Pizza combo', 5, 'Pepperoni Pizza', 25, 'Soft Drink', 'Add a refreshing drink?', 90, 1),
        ('Coffee + Pastry', 'Breakfast combo', 30, 'House Coffee', 45, 'Croissant', 'Pair with a fresh pastry?', 80, 1);
    
    PRINT 'Sample marketing rules inserted';
END
GO
