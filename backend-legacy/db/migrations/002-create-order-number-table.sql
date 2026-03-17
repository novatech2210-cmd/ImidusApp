-- Migration: Create tblOrderNumber table for atomic daily order number generation
-- Database: TPPro (POS Database)
-- Purpose: Provides race-condition-safe order numbering that resets daily
-- Usage: Run this migration once before deploying Phase 3 order creation
-- Version: 2.0 - Fixed column name from OrderDate to BusinessDate

USE TPPro
GO

-- Check if table exists
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblOrderNumber')
BEGIN
    -- Create table with correct column name
    CREATE TABLE tblOrderNumber (
        BusinessDate DATE NOT NULL,
        OrderNumber INT NOT NULL DEFAULT 1,
        CONSTRAINT PK_tblOrderNumber PRIMARY KEY (BusinessDate)
    )

    PRINT 'Created tblOrderNumber table'
END
ELSE
BEGIN
    -- Table exists - check if column needs to be renamed
    -- This handles the case where initial migration used wrong column name
    IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'tblOrderNumber' AND COLUMN_NAME = 'OrderDate')
    BEGIN
        -- Rename column from OrderDate to BusinessDate
        EXEC sp_rename 'tblOrderNumber.OrderDate', 'BusinessDate', 'COLUMN'
        
        -- Update primary key constraint
        IF EXISTS (SELECT 1 FROM sys.key_constraints 
                   WHERE name = 'PK__tblOrderN__F4C9A3AA5D3F7B3C')
        BEGIN
            ALTER TABLE tblOrderNumber DROP CONSTRAINT PK__tblOrderN__F4C9A3AA5D3F7B3C
            ALTER TABLE tblOrderNumber ADD CONSTRAINT PK_tblOrderNumber PRIMARY KEY (BusinessDate)
        END
        
        PRINT 'Renamed tblOrderNumber.OrderDate to BusinessDate'
    END
    ELSE
    BEGIN
        PRINT 'tblOrderNumber table already has correct schema'
    END
END
GO
