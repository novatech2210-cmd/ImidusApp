#==============================================================================
# Imidus POS Integration - Web Apps Deployment (Windows)
#==============================================================================
$ErrorActionPreference = "Stop"

$ScriptDir = $PSScriptRoot
$WebDir = Join-Path $ScriptDir "src\web\imidus-ordering"
$AdminDir = Join-Path $ScriptDir "src\admin"
$WaiterDir = Join-Path $ScriptDir "src\waiter"

function Deploy-NextApp($appDir, $appName, $port) {
    Write-Host "`nDeploying $appName..." -ForegroundColor Cyan
    Push-Location $appDir
    
    Write-Host "  Installing dependencies..."
    npm install
    
    Write-Host "  Building for production..."
    npm run build
    
    # In a real Windows environment, we'd use a service manager or pm2-windows-service.
    # For this one-click script, we'll create a simple launch script.
    $launchScript = @"
@echo off
set PORT=$port
npm run start
"@
    $launchScript | Out-File -FilePath "start-production.bat" -Encoding ascii
    
    Write-Host "  $appName ready on port $port." -ForegroundColor Green
    Pop-Location
}

Deploy-NextApp $WebDir "Customer Ordering App" 3000
Deploy-NextApp $AdminDir "Admin Portal" 3001
Deploy-NextApp $WaiterDir "Waiter App" 3002

Write-Host "`nWeb applications deployment complete." -ForegroundColor Green
