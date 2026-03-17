USE [IntegrationService];
GO

-- 1. Ensure Roles exist
IF NOT EXISTS (SELECT 1 FROM AdminRoles WHERE Name = 'SuperAdmin')
    INSERT INTO AdminRoles (Name, Description, Permissions) VALUES ('SuperAdmin', 'Full Access', '["*"]');
IF NOT EXISTS (SELECT 1 FROM AdminRoles WHERE Name = 'Manager')
    INSERT INTO AdminRoles (Name, Description, Permissions) VALUES ('Manager', 'Managerial Access', '["orders.*", "customers.*"]');
IF NOT EXISTS (SELECT 1 FROM AdminRoles WHERE Name = 'Cashier')
    INSERT INTO AdminRoles (Name, Description, Permissions) VALUES ('Cashier', 'Floor Staff Access', '["orders.*"]');

DECLARE @AdminRoleId INT = (SELECT Id FROM AdminRoles WHERE Name = 'SuperAdmin');
DECLARE @WaiterRoleId INT = (SELECT Id FROM AdminRoles WHERE Name = 'Cashier');

-- 2. Seed Admin User
DELETE FROM AdminUsers WHERE Email = 'admin1@imidus.com';
INSERT INTO AdminUsers (Email, PasswordHash, FirstName, LastName, RoleId, IsActive, CreatedAt, UpdatedAt)
VALUES ('admin1@imidus.com', 'YourStrong@Passw0rd', 'System', 'Admin', @AdminRoleId, 1, GETDATE(), GETDATE());

-- 3. Seed Waiter User
DELETE FROM AdminUsers WHERE Email = 'waiter1@imidus.com';
INSERT INTO AdminUsers (Email, PasswordHash, FirstName, LastName, RoleId, IsActive, CreatedAt, UpdatedAt)
VALUES ('waiter1@imidus.com', 'YourStrong@Passw0rd', 'Service', 'Waiter', @WaiterRoleId, 1, GETDATE(), GETDATE());

-- 4. Seed Customer in Users table
DELETE FROM Users WHERE Email = 'customer1@example.com';
INSERT INTO Users (Email, PasswordHash, EmailConfirmed, CreatedAt, IsActive)
VALUES ('customer1@example.com', 'YourStrong@Passw0rd', 1, GETDATE(), 1);

-- 5. Ensure Linking Customer exists in POS
USE [INI_Restaurant];
GO

IF NOT EXISTS (SELECT 1 FROM tblCustomer WHERE Email = 'customer1@example.com')
BEGIN
    INSERT INTO tblCustomer (CustomerNum, FName, LName, Phone, Email, EarnedPoints)
    VALUES ('CUST001', 'Test', 'Customer', '555-1234', 'customer1@example.com', 100);
END

-- Update User table in IntegrationService to link to this customer
DECLARE @CustomerId INT = (SELECT ID FROM tblCustomer WHERE Email = 'customer1@example.com');
USE [IntegrationService];
UPDATE Users SET CustomerID = @CustomerId WHERE Email = 'customer1@example.com';
GO
