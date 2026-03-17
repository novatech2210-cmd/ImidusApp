-- Add missing tables for INI POS integration
-- tblOrderNumber and tblTable are required for online order processing

USE INI_Restaurant;
GO

-- =============================================================================
-- ORDER NUMBER TRACKING
-- =============================================================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblOrderNumber')
CREATE TABLE tblOrderNumber (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    OrderNumber INT NOT NULL,
    CalledDateTime DATETIME NOT NULL DEFAULT GETDATE()
);

PRINT 'tblOrderNumber table created successfully';
GO

-- =============================================================================
-- TABLE SLOTS (including online order slots)
-- =============================================================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblTable')
CREATE TABLE tblTable (
    ID SMALLINT IDENTITY(1,1) PRIMARY KEY,
    OrderNum INT NULL,
    Linked BIT DEFAULT 0,
    TimeIn DATETIME NULL,
    ServerID SMALLINT NULL,
    NumOfGuests TINYINT DEFAULT 1,
    Opened BIT DEFAULT 0,
    TakeOut BIT DEFAULT 0,
    Online BIT DEFAULT 0,
    PhoneNum VARCHAR(10) NULL,
    PickupPerson VARCHAR(20) NULL,
    BillPrinted BIT DEFAULT 0,
    OnlineOrderCompanyID INT NULL,
    OnlineOrderNumber VARCHAR(20) NULL,
    TotalAmt SMALLMONEY DEFAULT 0,
    StationID SMALLINT NULL,
    StationIDInUse SMALLINT NULL,
    CONSTRAINT FK_tblTable_OnlineCompany FOREIGN KEY (OnlineOrderCompanyID) REFERENCES tblOnlineOrderCompany(ID)
);

PRINT 'tblTable table created successfully';
GO

-- =============================================================================
-- TBLMISC (for tax rates and configuration)
-- =============================================================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblMisc')
CREATE TABLE tblMisc (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    MiscName NVARCHAR(50) NOT NULL UNIQUE,
    Value NVARCHAR(255) NOT NULL
);

PRINT 'tblMisc table created successfully';
GO

-- Seed tblMisc with tax rates and configuration
IF NOT EXISTS (SELECT 1 FROM tblMisc WHERE MiscName = 'GSTPercentage')
BEGIN
    INSERT INTO tblMisc (MiscName, Value) VALUES
    ('GSTPercentage', '0.0600'),
    ('PSTPercentage', '0.0000'),
    ('PST2Percentage', '0.0000'),
    ('DON', '1'); -- Daily Order Number starting at 1
END

PRINT 'tblMisc seeded successfully';
GO
