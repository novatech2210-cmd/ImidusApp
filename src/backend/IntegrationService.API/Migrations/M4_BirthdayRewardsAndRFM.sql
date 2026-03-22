-- ========================================
-- Milestone 4: Birthday Rewards & RFM Service
-- Migration Script
-- Date: March 22, 2026
-- ========================================

-- NOTE: These tables are created in the IntegrationService backend database,
-- NOT in the INI_Restaurant (TPPro) POS database.
-- This honors the "no schema changes to POS" constraint.

-- ========================================
-- Table 1: BirthdayRewardConfig
-- Purpose: Store configuration for birthday reward automation
-- ========================================
IF OBJECT_ID('dbo.BirthdayRewardConfig', 'U') IS NULL
CREATE TABLE dbo.BirthdayRewardConfig
(
    ConfigID INT PRIMARY KEY IDENTITY(1,1),
    RewardPoints INT DEFAULT 500 NOT NULL,
    Enabled BIT DEFAULT 1 NOT NULL,
    LastModified DATETIME DEFAULT GETUTCDATE() NOT NULL
);

CREATE NONCLUSTERED INDEX IX_BirthdayRewardConfig_LastModified
    ON dbo.BirthdayRewardConfig(LastModified DESC);

-- Insert default configuration if not exists
IF NOT EXISTS (SELECT 1 FROM dbo.BirthdayRewardConfig WHERE ConfigID = 1)
BEGIN
    INSERT INTO dbo.BirthdayRewardConfig (RewardPoints, Enabled, LastModified)
    VALUES (500, 1, GETUTCDATE());
END;

PRINT 'Table BirthdayRewardConfig created/verified';

-- ========================================
-- Table 2: BirthdayRewards
-- Purpose: Audit trail for birthday reward issuance (idempotency tracking)
-- ========================================
IF OBJECT_ID('dbo.BirthdayRewards', 'U') IS NULL
CREATE TABLE dbo.BirthdayRewards
(
    RewardID INT PRIMARY KEY IDENTITY(1,1),
    CustomerID INT NOT NULL,
    RewardDate DATE NOT NULL,
    PointsAwarded INT NOT NULL,
    FcmSent BIT DEFAULT 0 NOT NULL,
    CreatedAt DATETIME DEFAULT GETUTCDATE() NOT NULL
);

-- Indexes for fast lookups
CREATE NONCLUSTERED INDEX IX_BirthdayRewards_CustomerID_RewardDate
    ON dbo.BirthdayRewards(CustomerID, RewardDate);

CREATE NONCLUSTERED INDEX IX_BirthdayRewards_RewardDate
    ON dbo.BirthdayRewards(RewardDate DESC);

CREATE NONCLUSTERED INDEX IX_BirthdayRewards_CreatedAt
    ON dbo.BirthdayRewards(CreatedAt DESC);

PRINT 'Table BirthdayRewards created/verified';

-- ========================================
-- Table 3: RFMSegments (Optional - for caching)
-- Purpose: Cache RFM segment calculations (24-hour TTL recommended)
-- ========================================
IF OBJECT_ID('dbo.RFMSegments', 'U') IS NULL
CREATE TABLE dbo.RFMSegments
(
    SegmentID INT PRIMARY KEY IDENTITY(1,1),
    CustomerID INT NOT NULL,
    RecencyScore INT NOT NULL, -- 1-4: Higher is more recent
    FrequencyScore INT NOT NULL, -- 1-4: Higher is more frequent
    MonetaryScore INT NOT NULL, -- 1-4: Higher is more valuable
    RFMCode VARCHAR(3) NOT NULL, -- e.g., '444', '443', '332'
    Segment VARCHAR(50) NOT NULL, -- Champions, Loyal, Potential, At Risk, Lost, Regular
    LastCalculated DATETIME DEFAULT GETUTCDATE() NOT NULL
);

-- Indexes for analytics queries
CREATE NONCLUSTERED INDEX IX_RFMSegments_CustomerID
    ON dbo.RFMSegments(CustomerID);

CREATE NONCLUSTERED INDEX IX_RFMSegments_Segment
    ON dbo.RFMSegments(Segment);

CREATE NONCLUSTERED INDEX IX_RFMSegments_LastCalculated
    ON dbo.RFMSegments(LastCalculated DESC);

PRINT 'Table RFMSegments created/verified';

-- ========================================
-- Stored Procedures for Birthday Rewards
-- ========================================

-- Check if reward already issued today (idempotency check)
IF OBJECT_ID('dbo.sp_CheckBirthdayRewardIssuedToday', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_CheckBirthdayRewardIssuedToday;
GO

CREATE PROCEDURE dbo.sp_CheckBirthdayRewardIssuedToday
    @CustomerID INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT COUNT(*) AS RewardCount
    FROM dbo.BirthdayRewards
    WHERE CustomerID = @CustomerID
      AND CAST(RewardDate AS DATE) = CAST(GETUTCDATE() AS DATE);
END;
GO

PRINT 'Stored Procedure sp_CheckBirthdayRewardIssuedToday created';

-- Get upcoming birthdays
IF OBJECT_ID('dbo.sp_GetUpcomingBirthdays', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_GetUpcomingBirthdays;
GO

CREATE PROCEDURE dbo.sp_GetUpcomingBirthdays
    @DaysAhead INT = 7
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        c.CustomerID,
        c.FName,
        c.LName,
        c.Phone,
        c.Email,
        c.BirthDate,
        c.EarnedPoints,
        DATEDIFF(day, GETUTCDATE(),
            DATEFROMPARTS(YEAR(GETUTCDATE()), MONTH(c.BirthDate), DAY(c.BirthDate))
        ) AS DaysUntilBirthday
    FROM TPPro.dbo.tblCustomer c
    WHERE c.CustomerID > 0
      AND c.BirthDate IS NOT NULL
      AND DATEDIFF(day, GETUTCDATE(),
            DATEFROMPARTS(YEAR(GETUTCDATE()), MONTH(c.BirthDate), DAY(c.BirthDate))
        ) BETWEEN 0 AND @DaysAhead
    ORDER BY DaysUntilBirthday;
END;
GO

PRINT 'Stored Procedure sp_GetUpcomingBirthdays created';

-- Get customers with birthdays today
IF OBJECT_ID('dbo.sp_GetBirthdayCustomersToday', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_GetBirthdayCustomersToday;
GO

CREATE PROCEDURE dbo.sp_GetBirthdayCustomersToday
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        c.CustomerID,
        c.FName,
        c.LName,
        c.Phone,
        c.Email,
        c.BirthDate,
        c.EarnedPoints
    FROM TPPro.dbo.tblCustomer c
    WHERE c.CustomerID > 0
      AND c.BirthDate IS NOT NULL
      AND MONTH(c.BirthDate) = MONTH(GETUTCDATE())
      AND DAY(c.BirthDate) = DAY(GETUTCDATE())
    ORDER BY c.CustomerID;
END;
GO

PRINT 'Stored Procedure sp_GetBirthdayCustomersToday created';

-- ========================================
-- Stored Procedures for RFM Segmentation
-- ========================================

-- Calculate RFM segments (refresh cache)
IF OBJECT_ID('dbo.sp_CalculateRFMSegments', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_CalculateRFMSegments;
GO

CREATE PROCEDURE dbo.sp_CalculateRFMSegments
AS
BEGIN
    SET NOCOUNT ON;

    -- Clear old cache (optional: keep for 24 hours)
    DELETE FROM dbo.RFMSegments
    WHERE DATEDIFF(hour, LastCalculated, GETUTCDATE()) > 24;

    -- Calculate and insert new RFM data
    WITH RFMData AS (
        SELECT
            c.CustomerID,
            DATEDIFF(day, MAX(s.SalesDateTime), GETUTCDATE()) AS RecencyDays,
            COUNT(DISTINCT s.SalesID) AS FrequencyOrders,
            ISNULL(SUM(s.Total), 0) AS MonetaryValue
        FROM TPPro.dbo.tblCustomer c
        LEFT JOIN TPPro.dbo.tblSales s ON c.CustomerID = s.CustomerID
            AND s.SalesDateTime >= DATEADD(year, -1, GETUTCDATE())
            AND s.TransType = 1
        WHERE c.CustomerID > 0
        GROUP BY c.CustomerID
    ),
    RFMScores AS (
        SELECT
            CustomerID,
            RecencyDays,
            FrequencyOrders,
            MonetaryValue,
            NTILE(4) OVER (ORDER BY RecencyDays DESC) AS RecencyScore,
            NTILE(4) OVER (ORDER BY FrequencyOrders) AS FrequencyScore,
            NTILE(4) OVER (ORDER BY MonetaryValue) AS MonetaryScore
        FROM RFMData
    )
    INSERT INTO dbo.RFMSegments (CustomerID, RecencyScore, FrequencyScore, MonetaryScore, RFMCode, Segment, LastCalculated)
    SELECT
        CustomerID,
        RecencyScore,
        FrequencyScore,
        MonetaryScore,
        CONCAT(RecencyScore, FrequencyScore, MonetaryScore) AS RFMCode,
        CASE
            WHEN RecencyScore = 4 AND FrequencyScore = 4 AND MonetaryScore = 4 THEN 'Champions'
            WHEN RecencyScore >= 3 AND FrequencyScore >= 3 AND MonetaryScore >= 3 THEN 'Loyal'
            WHEN RecencyScore >= 3 AND (FrequencyScore >= 3 OR MonetaryScore >= 3) THEN 'Potential'
            WHEN RecencyScore <= 2 AND FrequencyScore >= 3 THEN 'At Risk'
            WHEN RecencyScore <= 1 THEN 'Lost'
            ELSE 'Regular'
        END AS Segment,
        GETUTCDATE() AS LastCalculated
    FROM RFMScores;
END;
GO

PRINT 'Stored Procedure sp_CalculateRFMSegments created';

-- ========================================
-- Data Validation
-- ========================================

-- Verify tables exist
SELECT
    'BirthdayRewardConfig' AS TableName, COUNT(*) AS RowCount
FROM dbo.BirthdayRewardConfig
UNION ALL
SELECT
    'BirthdayRewards', COUNT(*)
FROM dbo.BirthdayRewards
UNION ALL
SELECT
    'RFMSegments', COUNT(*)
FROM dbo.RFMSegments;

PRINT '========================================';
PRINT 'Milestone 4 Migration Complete';
PRINT '========================================';
PRINT 'Tables created: BirthdayRewardConfig, BirthdayRewards, RFMSegments';
PRINT 'Stored Procedures created: sp_CheckBirthdayRewardIssuedToday, sp_GetUpcomingBirthdays, sp_GetBirthdayCustomersToday, sp_CalculateRFMSegments';
PRINT 'All tables configured in IntegrationService backend database';
PRINT 'No changes made to INI_Restaurant (TPPro) POS database';
