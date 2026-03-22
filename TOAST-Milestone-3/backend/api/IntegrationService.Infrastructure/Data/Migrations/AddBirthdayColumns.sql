-- Add BirthMonth and BirthDay columns to CustomerBirthdayTracking
-- These are stored in the IntegrationService overlay database, not the POS database.

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'CustomerBirthdayTracking')
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('CustomerBirthdayTracking') AND name = 'BirthMonth')
    BEGIN
        ALTER TABLE CustomerBirthdayTracking ADD BirthMonth INT NULL;
        PRINT 'Column BirthMonth added to CustomerBirthdayTracking';
    END

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('CustomerBirthdayTracking') AND name = 'BirthDay')
    BEGIN
        ALTER TABLE CustomerBirthdayTracking ADD BirthDay INT NULL;
        PRINT 'Column BirthDay added to CustomerBirthdayTracking';
    END
END
ELSE
BEGIN
    -- This shouldn't happen if migrations are run in order, but for safety:
    CREATE TABLE CustomerBirthdayTracking (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        CustomerID INT NOT NULL,
        BirthMonth INT NULL,
        BirthDay INT NULL,
        LastBirthdayRewardDate DATE NULL,
        TotalBirthdayRewards INT NOT NULL DEFAULT 0,
        IsBirthdayToday BIT NOT NULL DEFAULT 0,
        CONSTRAINT UQ_CustomerBirthdayTracking_CustomerID UNIQUE (CustomerID)
    );
    PRINT 'CustomerBirthdayTracking table created with birthday columns';
END
GO
