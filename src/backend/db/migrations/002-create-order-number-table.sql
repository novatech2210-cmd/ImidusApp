-- Migration: Create tblOrderNumber table for atomic daily order number generation
-- Database: TPPro (POS Database)
-- Purpose: Provides race-condition-safe order numbering that resets daily
-- Usage: Run this migration once before deploying Phase 3 order creation

USE TPPro
GO

-- Check if table exists
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tblOrderNumber')
BEGIN
    CREATE TABLE tblOrderNumber (
        OrderDate DATE NOT NULL,
        OrderNumber INT NOT NULL DEFAULT 1,
        CONSTRAINT PK_tblOrderNumber PRIMARY KEY (OrderDate)
    )

    PRINT 'Created tblOrderNumber table'
END
ELSE
BEGIN
    PRINT 'tblOrderNumber table already exists'
END
GO
