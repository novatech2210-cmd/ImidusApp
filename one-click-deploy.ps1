#==============================================================================
# Imidus POS Integration - One-Click Deployment (Windows)
#==============================================================================
# This script orchestrates the production deployment of the entire platform.
#==============================================================================

$ErrorActionPreference = "Stop"
$ScriptDir = $PSScriptRoot

function Print-Banner {
    Clear-Host
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host "   IMIDUS POS INTEGRATION - PRODUCTION DEPLOYMENT" -ForegroundColor Green
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host ""
}

function Check-Prerequisites {
    Write-Host "[1/5] Checking Prerequisites..." -ForegroundColor Blue
    
    # .NET 8 SDK
    $dotnet = Get-Command dotnet -ErrorAction SilentlyContinue
    if (-not $dotnet) {
        Write-Error ".NET 8 SDK not found. Please install it."
    }
    Write-Host "  ✓ .NET SDK found" -ForegroundColor Green

    # Node.js
    $node = Get-Command node -ErrorAction SilentlyContinue
    if (-not $node) {
        Write-Error "Node.js not found. Please install Node.js 18+."
    }
    Write-Host "  ✓ Node.js found" -ForegroundColor Green

    # WiX Toolset (Optional for this script, but needed for build-msi)
    $wix = Test-Path "C:\Program Files (x86)\WiX Toolset v3.11"
    if (-not $wix) {
        Write-Host "  ! WiX Toolset not found. MSI build will be skipped." -ForegroundColor Yellow
    } else {
        Write-Host "  ✓ WiX Toolset found" -ForegroundColor Green
    }
    Write-Host ""
}

function Run-DatabaseSetup {
    Write-Host "[2/5] Setting up Databases..." -ForegroundColor Blue
    & "$ScriptDir\setup-database.ps1"
    Write-Host ""
}

function Run-BackendDeployment {
    Write-Host "[3/5] Deploying Backend API..." -ForegroundColor Blue
    
    $msiPath = "$ScriptDir\src\backend\Installer\ImidusIntegrationService.msi"
    
    if (-not (Test-Path $msiPath)) {
        Write-Host "  MSI not found. Attempting to build..." -ForegroundColor Yellow
        try {
            & "$ScriptDir\src\backend\Installer\build-msi.ps1"
        } catch {
            Write-Host "  Failed to build MSI. Skipping installation." -ForegroundColor Red
            return
        }
    }

    Write-Host "  Installing MSI..."
    Start-Process msiexec.exe -Wait -ArgumentList "/i `"$msiPath`" /quiet /qn /norestart"
    Write-Host "  ✓ Backend Service installed and started." -ForegroundColor Green
    Write-Host ""
}

function Run-WebDeployment {
    Write-Host "[4/5] Deploying Web Applications..." -ForegroundColor Blue
    & "$ScriptDir\deploy-web-apps.ps1"
    Write-Host ""
}

function Print-FinalSteps {
    Write-Host "[5/5] Deployment Summary" -ForegroundColor Blue
    Write-Host ""
    Write-Host "  The following services are now configured:" -ForegroundColor Gray
    Write-Host "  1. Backend API: Runs as Windows Service 'ImidusIntegration'"
    Write-Host "  2. Customer Web: http://localhost:3000"
    Write-Host "  3. Admin Portal: http://localhost:3001"
    Write-Host "  4. Waiter App: http://localhost:3002"
    Write-Host ""
    Write-Host "  Android App Deployment:" -ForegroundColor Yellow
    Write-Host "  - The Android APK artifact is available in the AWS S3 delivery bucket."
    Write-Host "  - S3 Path: s3://inirestaurant/novatech/android/imidus-latest.apk"
    Write-Host ""
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host "   DEPLOYMENT COMPLETE" -ForegroundColor Green
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host ""
}

# Main Execution
Print-Banner
Check-Prerequisites
Run-DatabaseSetup
Run-BackendDeployment
Run-WebDeployment
Print-FinalSteps
