#==============================================================================
# Imidus POS Integration - Database Setup Utility (Windows)
#==============================================================================
param(
    [string]$PosConnString,
    [string]$IntConnString,
    [switch]$SkipScripts
)

$ErrorActionPreference = "Stop"

function Write-Header($text) {
    Write-Host "`n--- $text ---" -ForegroundColor Cyan
}

function Test-SqlConnection($connString) {
    try {
        $conn = New-Object System.Data.SqlClient.SqlConnection($connString)
        $conn.Open()
        $conn.Close()
        return $true
    } catch {
        return $false
    }
}

Write-Header "Validating Database Connections"

if (-not $PosConnString) {
    $PosConnString = Read-Host "Enter INI_Restaurant (POS) Connection String"
}

if (-not $IntConnString) {
    $IntConnString = Read-Host "Enter IntegrationService Connection String"
}

Write-Host "Testing POS Database connection..." -NoNewline
if (Test-SqlConnection $PosConnString) {
    Write-Host " SUCCESS" -ForegroundColor Green
} else {
    Write-Host " FAILED" -ForegroundColor Red
    Write-Error "Could not connect to POS database. Please check your connection string."
}

Write-Host "Testing Integration database connection..." -NoNewline
if (Test-SqlConnection $IntConnString) {
    Write-Host " SUCCESS" -ForegroundColor Green
} else {
    Write-Host " FAILED" -ForegroundColor Red
    Write-Host "Attempting to create IntegrationService database..." -ForegroundColor Yellow
    
    # Try to create database if it doesn't exist
    $masterConnString = $IntConnString -replace "Database=[^;]+", "Database=master"
    try {
        $conn = New-Object System.Data.SqlClient.SqlConnection($masterConnString)
        $conn.Open()
        $cmd = $conn.CreateCommand()
        $cmd.CommandText = "IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'IntegrationService') CREATE DATABASE IntegrationService"
        $cmd.ExecuteNonQuery()
        $conn.Close()
        Write-Host " Database created successfully." -ForegroundColor Green
    } catch {
        Write-Error "Failed to create IntegrationService database: $($_.Exception.Message)"
    }
}

if ($SkipScripts) {
    Write-Host "Skipping SQL script execution as requested." -ForegroundColor Yellow
    return
}

Write-Header "Executing Database Scripts"

$ScriptDir = "$PSScriptRoot\src\backend\Database\scripts"
$scripts = Get-ChildItem -Path $ScriptDir -Filter "*.sql" | Sort-Object Name

foreach ($script in $scripts) {
    Write-Host "Executing $($script.Name)..." -NoNewline
    try {
        $sql = Get-Content $script.FullName -Raw
        $conn = New-Object System.Data.SqlClient.SqlConnection($IntConnString)
        $conn.Open()
        $cmd = $conn.CreateCommand()
        $cmd.CommandText = $sql
        $cmd.ExecuteNonQuery()
        $conn.Close()
        Write-Host " DONE" -ForegroundColor Green
    } catch {
        Write-Host " ERROR: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`nDatabase setup complete." -ForegroundColor Green
