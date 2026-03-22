-- ===========================================
-- ScheduledOrders Table - IntegrationService Database
-- OVERLAY TABLE - NOT in INI_Restaurant (source of truth)
-- SSOT Compliant: Stores future orders until release time
-- ===========================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ScheduledOrders')
BEGIN
    CREATE TABLE ScheduledOrders (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        
        -- POS Customer Reference (tblCustomer.CustomerNum)
        PosCustomerId INT NOT NULL,
        CustomerFirstName NVARCHAR(100) NULL,
        CustomerLastName NVARCHAR(100) NULL,
        CustomerPhone NVARCHAR(20) NULL,
        
        -- Scheduling
        ScheduledDateTime DATETIME2 NOT NULL,
        ReleasedDateTime DATETIME2 NULL,
        
        -- Status: pending, released, cancelled, failed
        Status NVARCHAR(20) NOT NULL DEFAULT 'pending',
        
        -- Order Data
        ItemsJson NVARCHAR(MAX) NOT NULL,
        Subtotal DECIMAL(18,2) NOT NULL DEFAULT 0,
        TaxAmount DECIMAL(18,2) NOT NULL DEFAULT 0,
        TotalAmount DECIMAL(18,2) NOT NULL DEFAULT 0,
        
        -- Payment (Authorize.net tokens)
        PaymentAuthorizationNo NVARCHAR(500) NULL,
        PaymentBatchNo NVARCHAR(10) NULL DEFAULT '1',
        PaymentTypeId INT NOT NULL DEFAULT 3, -- Visa
        TipAmount DECIMAL(18,2) NOT NULL DEFAULT 0,
        
        -- Special Instructions
        SpecialInstructions NVARCHAR(500) NULL,
        
        -- POS Reference (populated after release)
        PosSalesId INT NULL,
        PosOrderNumber NVARCHAR(50) NULL,
        
        -- Idempotency (contractual requirement)
        IdempotencyKey NVARCHAR(100) NOT NULL UNIQUE,
        
        -- Audit
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 NULL,
        CreatedBy NVARCHAR(100) NULL,
        
        -- Failure Tracking
        ReleaseErrorMessage NVARCHAR(500) NULL,
        ReleaseRetryCount INT NOT NULL DEFAULT 0
    );

    -- Indexes for performance
    CREATE INDEX IX_ScheduledOrders_CustomerId ON ScheduledOrders(PosCustomerId);
    CREATE INDEX IX_ScheduledOrders_Status ON ScheduledOrders(Status);
    CREATE INDEX IX_ScheduledOrders_ScheduledDate ON ScheduledOrders(ScheduledDateTime);
    CREATE INDEX IX_ScheduledOrders_Status_Date ON ScheduledOrders(Status, ScheduledDateTime) 
        INCLUDE (Id, PosCustomerId) 
        WHERE Status = 'pending';
    
    PRINT 'ScheduledOrders table created successfully';
END
ELSE
BEGIN
    PRINT 'ScheduledOrders table already exists';
END
GO

-- ===========================================
-- View: Orders Ready for Release
-- Used by background service to find orders to process
-- ===========================================
IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_OrdersReadyForRelease')
    DROP VIEW vw_OrdersReadyForRelease;
GO

CREATE VIEW vw_OrdersReadyForRelease AS
SELECT 
    Id,
    PosCustomerId,
    CustomerFirstName,
    CustomerLastName,
    CustomerPhone,
    ScheduledDateTime,
    ItemsJson,
    Subtotal,
    TaxAmount,
    TotalAmount,
    PaymentAuthorizationNo,
    PaymentBatchNo,
    PaymentTypeId,
    TipAmount,
    SpecialInstructions,
    IdempotencyKey,
    ReleaseRetryCount
FROM ScheduledOrders
WHERE Status = 'pending'
    AND ScheduledDateTime <= GETUTCDATE()
    AND ReleasedDateTime IS NULL
    AND ReleaseRetryCount < 3;
GO

PRINT 'View vw_OrdersReadyForRelease created';
GO
