-- Migration: Create IntegrationService database
-- Date: 2026-03-02
-- Purpose: Backend service database for integrations (idempotency, notifications, etc.)

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'IntegrationService')
BEGIN
    CREATE DATABASE IntegrationService;
    PRINT 'IntegrationService database created successfully';
END
ELSE
BEGIN
    PRINT 'IntegrationService database already exists';
END
GO
