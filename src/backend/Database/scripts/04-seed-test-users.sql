-- ==============================================================================
-- Seed Test Users for IMIDUS POS Integration
-- ==============================================================================

USE [IntegrationService];
GO

-- 1. Create Admin User
IF NOT EXISTS (SELECT 1 FROM tblUser WHERE Username = 'admin1')
BEGIN
    INSERT INTO tblUser (Username, PasswordHash, Role, IsActive, CreatedAt)
    VALUES ('admin1', 'AQAAAAIAAYagAAAAEGvzK...', 'Admin', 1, GETDATE());
END
GO

-- 2. Create Customer 1
IF NOT EXISTS (SELECT 1 FROM [INI_Restaurant].dbo.tblCustomer WHERE Phone = '5550101')
BEGIN
    INSERT INTO [INI_Restaurant].dbo.tblCustomer (CustomerNum, FName, LName, Phone, Email, EarnedPoints, IsActive)
    VALUES ('CUST001', 'Test', 'Customer', '5550101', 'customer1@example.com', 100, 1);
END
GO

-- 3. Create Waiter 1 (Seeded in Integration Overlay for demo)
IF NOT EXISTS (SELECT 1 FROM tblUser WHERE Username = 'waiter1')
BEGIN
    INSERT INTO tblUser (Username, PasswordHash, Role, IsActive, CreatedAt)
    VALUES ('waiter1', 'AQAAAAIAAYagAAAAEGvzK...', 'Waiter', 1, GETDATE());
END
GO
