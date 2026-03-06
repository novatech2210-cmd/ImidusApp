@echo off
chcp 65001 >nul
echo ==========================================
echo IMIDUS POS Integration - Database Setup
echo ==========================================
echo.

REM Check if SQLCMD is available
where sqlcmd >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: SQLCMD not found. Please install SQL Server Command Line Tools.
    echo Download from: https://docs.microsoft.com/en-us/sql/tools/sqlcmd-utility
    pause
    exit /b 1
)

REM Configuration - MODIFY THESE VALUES
echo Configuration:
set /p SQL_SERVER="Enter SQL Server name (default: localhost): "
if "%SQL_SERVER%"=="" set SQL_SERVER=localhost

set /p SQL_USER="Enter SQL Username (default: sa): "
if "%SQL_USER%"=="" set SQL_USER=sa

set /p SQL_PASSWORD="Enter SQL Password: "

set /p POS_DB_NAME="Enter POS Database name (default: INI_Restaurant): "
if "%POS_DB_NAME%"=="" set POS_DB_NAME=INI_Restaurant

set /p BACKUP_PATH="Enter path to INI_Restaurant.Bak file: "

cls
echo ==========================================
echo Step 1: Restore POS Database (INI_Restaurant)
echo ==========================================
echo.

if not exist "%BACKUP_PATH%" (
    echo ERROR: Backup file not found at %BACKUP_PATH%
    pause
    exit /b 1
)

echo Restoring %POS_DB_NAME% database from backup...
sqlcmd -S %SQL_SERVER% -U %SQL_USER% -P %SQL_PASSWORD% -Q "RESTORE DATABASE [%POS_DB_NAME%] FROM DISK = N'%BACKUP_PATH%' WITH REPLACE, RECOVERY"

if %errorlevel% neq 0 (
    echo ERROR: Database restore failed
    pause
    exit /b 1
)

echo ✓ POS Database restored successfully
echo.

echo ==========================================
echo Step 2: Create IntegrationService Database
echo ==========================================
echo.

sqlcmd -S %SQL_SERVER% -U %SQL_USER% -P %SQL_PASSWORD% -i "..\backend\IntegrationService.Infrastructure\Data\Migrations\00_CreateDatabase.sql"

if %errorlevel% neq 0 (
    echo ERROR: Failed to create IntegrationService database
    pause
    exit /b 1
)

echo ✓ IntegrationService database created
echo.

echo ==========================================
echo Step 3: Create Backend Tables
echo ==========================================
echo.

sqlcmd -S %SQL_SERVER% -U %SQL_USER% -P %SQL_PASSWORD% -d IntegrationService -i "..\backend\IntegrationService.Infrastructure\Data\Migrations\20260302_AddDeviceTokenAndNotificationLog.sql"
sqlcmd -S %SQL_SERVER% -U %SQL_USER% -P %SQL_PASSWORD% -d IntegrationService -i "..\backend\IntegrationService.Infrastructure\Data\Migrations\20260302_AddOnlineOrderStatus.sql"

echo ✓ Backend tables created
echo.

echo ==========================================
echo Step 4: Update Backend Connection Strings
echo ==========================================
echo.

echo Updating appsettings.json files...

REM Create connection string
set POS_CONNECTION=Server=%SQL_SERVER%;Database=%POS_DB_NAME%;User Id=%SQL_USER%;Password=%SQL_PASSWORD%;TrustServerCertificate=True;Encrypt=False;
set BACKEND_CONNECTION=Server=%SQL_SERVER%;Database=IntegrationService;User Id=%SQL_USER%;Password=%SQL_PASSWORD%;TrustServerCertificate=True;Encrypt=False;

REM Update appsettings.json (requires PowerShell for JSON manipulation)
powershell -Command "
$path = '..\backend\IntegrationService.API\appsettings.json'
$content = Get-Content $path -Raw | ConvertFrom-Json
$content.ConnectionStrings.PosDatabase = '%POS_CONNECTION%'
$content.ConnectionStrings.BackendDatabase = '%BACKEND_CONNECTION%'
$content | ConvertTo-Json -Depth 10 | Set-Content $path
"

echo ✓ Connection strings updated
echo.

echo ==========================================
echo Step 5: Test Database Connectivity
echo ==========================================
echo.

echo Testing POS database connection...
sqlcmd -S %SQL_SERVER% -U %SQL_USER% -P %SQL_PASSWORD% -d %POS_DB_NAME% -Q "SELECT COUNT(*) FROM tblItem" >nul 2>&1

if %errorlevel% neq 0 (
    echo WARNING: Could not connect to POS database. Please verify credentials.
) else (
    echo ✓ POS database connection successful
)

echo.
echo Testing IntegrationService database connection...
sqlcmd -S %SQL_SERVER% -U %SQL_USER% -P %SQL_PASSWORD% -d IntegrationService -Q "SELECT COUNT(*) FROM DeviceTokens" >nul 2>&1

if %errorlevel% neq 0 (
    echo WARNING: Could not connect to IntegrationService database. Tables may not exist yet.
) else (
    echo ✓ IntegrationService database connection successful
)

echo.
echo ==========================================
echo Database Setup Complete!
echo ==========================================
echo.
echo Connection Strings:
echo POS Database: %POS_CONNECTION%
echo Backend DB:   %BACKEND_CONNECTION%
echo.
echo Next Steps:
echo 1. Start the backend API: dotnet run --project backend\IntegrationService.API
echo 2. Test API at: http://localhost:5004/health
echo 3. Check Swagger UI: http://localhost:5004/swagger
echo.
pause
