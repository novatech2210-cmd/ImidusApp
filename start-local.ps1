#==============================================================================
# Imidus POS Integration - One-Click Local Development Startup (Windows)
#==============================================================================
# Usage: .\start-local.ps1 [-Rebuild] [-ResetDb]
#
# This script starts ALL services needed for local development:
# - SQL Server (Docker) with INI_Restaurant database
# - Backend API (.NET 9)
# - Web Customer Portal (Next.js)
# - Admin Portal (Next.js)
#
# Prerequisites:
# - Docker Desktop running
# - Node.js 18+ installed
# - pnpm or npm installed
#==============================================================================

param(
    [switch]$Rebuild,
    [switch]$ResetDb
)

$ErrorActionPreference = "Stop"

# Colors
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) { Write-Output $args }
    $host.UI.RawUI.ForegroundColor = $fc
}

# Configuration
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir = Join-Path $ScriptDir "src\backend"
$WebDir = Join-Path $ScriptDir "src\web"
$AdminDir = Join-Path $ScriptDir "src\admin"

$jobs = @()

function Print-Banner {
    Write-Host ""
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host "   IMIDUS POS INTEGRATION" -ForegroundColor Green
    Write-Host "   One-Click Local Development Environment" -ForegroundColor White
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host ""
}

function Check-Prerequisites {
    Write-Host "[1/6] Checking prerequisites..." -ForegroundColor Blue

    # Check Docker
    try {
        docker info 2>&1 | Out-Null
        Write-Host "  ✓ Docker running" -ForegroundColor Green
    } catch {
        Write-Host "Error: Docker is not running. Please start Docker Desktop." -ForegroundColor Red
        exit 1
    }

    # Check Node.js
    try {
        $nodeVersion = node -v
        Write-Host "  ✓ Node.js $nodeVersion" -ForegroundColor Green
    } catch {
        Write-Host "Error: Node.js not found" -ForegroundColor Red
        exit 1
    }

    # Check package manager
    $script:PkgManager = "npm"
    try {
        $pnpmVersion = pnpm -v 2>$null
        if ($pnpmVersion) {
            Write-Host "  ✓ pnpm $pnpmVersion" -ForegroundColor Green
            $script:PkgManager = "pnpm"
        }
    } catch {
        $npmVersion = npm -v
        Write-Host "  ✓ npm $npmVersion" -ForegroundColor Green
    }
    Write-Host ""
}

function Start-Database {
    Write-Host "[2/6] Starting SQL Server..." -ForegroundColor Blue

    Push-Location $BackendDir

    # Check if container is running
    $containerRunning = docker ps --format '{{.Names}}' | Where-Object { $_ -eq "imidus-sqlserver" }

    if ($containerRunning) {
        if ($ResetDb) {
            Write-Host "  Resetting database..."
            docker exec imidus-sqlserver /opt/mssql-tools18/bin/sqlcmd `
                -S localhost -U sa -P "YourStrong@Passw0rd" -C `
                -Q "IF EXISTS (SELECT name FROM sys.databases WHERE name = 'INI_Restaurant') DROP DATABASE INI_Restaurant" 2>$null
        } else {
            Write-Host "  ✓ SQL Server already running" -ForegroundColor Green
        }
    } else {
        Write-Host "  Starting SQL Server container..."
        docker-compose up -d sqlserver

        # Wait for SQL Server
        Write-Host "  Waiting for SQL Server to be ready..."
        for ($i = 1; $i -le 30; $i++) {
            try {
                docker exec imidus-sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "YourStrong@Passw0rd" -C -Q "SELECT 1" 2>$null | Out-Null
                break
            } catch {
                Start-Sleep -Seconds 2
            }
        }
    }

    # Check if database exists
    $dbExists = docker exec imidus-sqlserver /opt/mssql-tools18/bin/sqlcmd `
        -S localhost -U sa -P "YourStrong@Passw0rd" -C -h -1 `
        -Q "SET NOCOUNT ON; SELECT COUNT(*) FROM sys.databases WHERE name = 'INI_Restaurant'" 2>$null

    if ([int]$dbExists.Trim() -eq 0) {
        Write-Host "  Restoring INI_Restaurant database..."

        # Check for backup file
        $backupFile = "/var/opt/mssql/backup/INI_Restaurant.Bak"
        $backupExists = docker exec imidus-sqlserver test -f $backupFile 2>$null
        if (-not $backupExists) {
            $backupFile = "/var/opt/mssql/backup/INI_Restaruant.Bak"
        }

        # Get logical file names and restore
        $fileList = docker exec imidus-sqlserver /opt/mssql-tools18/bin/sqlcmd `
            -S localhost -U sa -P "YourStrong@Passw0rd" -C -h -1 `
            -Q "SET NOCOUNT ON; RESTORE FILELISTONLY FROM DISK = '$backupFile'" 2>$null

        $logicalData = ($fileList -split "`n")[0].Trim().Split()[0]
        $logicalLog = ($fileList -split "`n")[1].Trim().Split()[0]

        docker exec imidus-sqlserver /opt/mssql-tools18/bin/sqlcmd `
            -S localhost -U sa -P "YourStrong@Passw0rd" -C `
            -Q "RESTORE DATABASE [INI_Restaurant] FROM DISK = '$backupFile' WITH MOVE '$logicalData' TO '/var/opt/mssql/data/INI_Restaurant.mdf', MOVE '$logicalLog' TO '/var/opt/mssql/data/INI_Restaurant_log.ldf', REPLACE"

        Write-Host "  ✓ INI_Restaurant database restored" -ForegroundColor Green
    } else {
        Write-Host "  ✓ INI_Restaurant database exists" -ForegroundColor Green
    }

    # Create IntegrationService database
    docker exec imidus-sqlserver /opt/mssql-tools18/bin/sqlcmd `
        -S localhost -U sa -P "YourStrong@Passw0rd" -C `
        -Q "IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'IntegrationService') CREATE DATABASE IntegrationService" 2>$null

    Pop-Location
    Write-Host ""
}

function Start-Backend {
    Write-Host "[3/6] Starting Backend API..." -ForegroundColor Blue

    Push-Location $BackendDir

    if ($Rebuild) {
        Write-Host "  Rebuilding API container..."
        docker-compose build api
    }

    $apiRunning = docker ps --format '{{.Names}}' | Where-Object { $_ -eq "imidus-api" }

    if (-not $apiRunning -or $Rebuild) {
        Write-Host "  Starting Backend API..."
        docker-compose up -d api
    } else {
        Write-Host "  ✓ Backend API already running" -ForegroundColor Green
    }

    # Wait for health check
    Write-Host "  Waiting for API health check..."
    for ($i = 1; $i -le 30; $i++) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:5004/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                Write-Host "  ✓ Backend API running at http://localhost:5004" -ForegroundColor Green
                break
            }
        } catch {
            Start-Sleep -Seconds 2
        }
    }

    Pop-Location
    Write-Host ""
}

function Start-Web {
    Write-Host "[4/6] Starting Customer Web Portal..." -ForegroundColor Blue

    Push-Location $WebDir

    if (-not (Test-Path "node_modules") -or $Rebuild) {
        Write-Host "  Installing dependencies..."
        & $script:PkgManager install
    }

    Write-Host "  Starting Next.js dev server..."
    $env:PORT = "3000"
    $script:jobs += Start-Job -ScriptBlock {
        param($dir, $pkg)
        Set-Location $dir
        & $pkg run dev
    } -ArgumentList $WebDir, $script:PkgManager

    # Wait for server
    for ($i = 1; $i -le 20; $i++) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                Write-Host "  ✓ Customer Web running at http://localhost:3000" -ForegroundColor Green
                break
            }
        } catch {
            Start-Sleep -Seconds 1
        }
    }

    Pop-Location
    Write-Host ""
}

function Start-Admin {
    Write-Host "[5/6] Starting Admin Portal..." -ForegroundColor Blue

    Push-Location $AdminDir

    if (-not (Test-Path "node_modules") -or $Rebuild) {
        Write-Host "  Installing dependencies..."
        & $script:PkgManager install
    }

    Write-Host "  Starting Next.js dev server..."
    $env:PORT = "3001"
    $script:jobs += Start-Job -ScriptBlock {
        param($dir, $pkg)
        Set-Location $dir
        $env:PORT = "3001"
        & $pkg run dev
    } -ArgumentList $AdminDir, $script:PkgManager

    # Wait for server
    for ($i = 1; $i -le 20; $i++) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3001" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                Write-Host "  ✓ Admin Portal running at http://localhost:3001" -ForegroundColor Green
                break
            }
        } catch {
            Start-Sleep -Seconds 1
        }
    }

    Pop-Location
    Write-Host ""
}

function Print-Summary {
    Write-Host "[6/6] All services started!" -ForegroundColor Blue
    Write-Host ""
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host "   ALL SERVICES RUNNING" -ForegroundColor Green
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "   Backend API:      http://localhost:5004" -ForegroundColor Yellow
    Write-Host "   API Health:       http://localhost:5004/health" -ForegroundColor Yellow
    Write-Host "   API Docs:         http://localhost:5004/swagger" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   Customer Web:     http://localhost:3000" -ForegroundColor Yellow
    Write-Host "   Admin Portal:     http://localhost:3001" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   SQL Server:       localhost:1433" -ForegroundColor Yellow
    Write-Host "   Database:         INI_Restaurant" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host "   Press Ctrl+C to stop all services" -ForegroundColor Red
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host ""
}

# Main execution
Print-Banner
Check-Prerequisites
Start-Database
Start-Backend
Start-Web
Start-Admin
Print-Summary

# Keep running
Write-Host "Monitoring services... (Ctrl+C to stop)" -ForegroundColor Gray
try {
    while ($true) {
        Start-Sleep -Seconds 5
        # Check job status
        foreach ($job in $script:jobs) {
            if ($job.State -eq 'Failed') {
                Write-Host "Warning: A service has stopped" -ForegroundColor Yellow
            }
        }
    }
} finally {
    Write-Host "Stopping services..." -ForegroundColor Yellow
    $script:jobs | Stop-Job -PassThru | Remove-Job
    docker-compose -f "$BackendDir\docker-compose.yml" stop 2>$null
    Write-Host "Cleanup complete." -ForegroundColor Green
}
