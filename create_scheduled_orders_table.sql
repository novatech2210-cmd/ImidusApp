-- Create ScheduledOrders table for scheduled pickup orders
-- Run this script against the INI_Restaurant database

USE INI_Restaurant;
GO

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ScheduledOrders' AND xtype='U')
BEGIN
    CREATE TABLE ScheduledOrders (
        ID INT IDENTITY(1,1) PRIMARY KEY,
        CustomerID INT NOT NULL,
        ScheduledDateTime DATETIME NOT NULL,
        Status VARCHAR(20) NOT NULL DEFAULT 'Pending',
        Items NVARCHAR(MAX),  -- JSON serialized items
        TipAmount DECIMAL(10,2) DEFAULT 0,
        SpecialInstructions NVARCHAR(500),
        ConfirmationCode VARCHAR(20) UNIQUE,
        CreatedAt DATETIME DEFAULT GETDATE(),
        ProcessedAt DATETIME NULL,
        SalesID INT NULL,  -- FK to tblSales after processing
        CONSTRAINT FK_ScheduledOrders_Customer FOREIGN KEY (CustomerID) REFERENCES tblCustomer(ID),
        CONSTRAINT FK_ScheduledOrders_Sales FOREIGN KEY (SalesID) REFERENCES tblSales(ID)
    );

    CREATE INDEX IX_ScheduledOrders_Status ON ScheduledOrders(Status);
    CREATE INDEX IX_ScheduledOrders_ScheduledDateTime ON ScheduledOrders(ScheduledDateTime);
    CREATE INDEX IX_ScheduledOrders_CustomerID ON ScheduledOrders(CustomerID);

    PRINT 'ScheduledOrders table created successfully';
END
ELSE
BEGIN
    PRINT 'ScheduledOrders table already exists';
END
GO
