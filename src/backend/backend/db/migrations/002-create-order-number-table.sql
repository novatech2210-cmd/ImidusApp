-- Migration: Create tblOrderNumber table for atomic daily order number generation
-- Database: INI_Restaurant (POS Database)
-- Purpose: Provides race-condition-safe order numbering that resets daily
-- Usage: Run this migration once before deploying Phase 3 order creation
-- Note: Uses existing POS schema (CalledDateTime column)

USE INI_Restaurant
GO

-- Check if table exists
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblOrderNumber')
BEGIN
    -- Create table with existing POS column names
    CREATE TABLE tblOrderNumber (
        ID INT IDENTITY(1,1) PRIMARY KEY,
        OrderNumber INT NOT NULL DEFAULT 1,
        CalledDateTime DATETIME NOT NULL DEFAULT GETDATE()
    )

    PRINT 'Created tblOrderNumber table'
END
ELSE
BEGIN
    PRINT 'tblOrderNumber table already exists'
END
GO
