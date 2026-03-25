#==============================================================================
# Imidus POS Integration - MSI Build Script (Windows)
#==============================================================================
$ErrorActionPreference = "Stop"

$ProjectDir = "$PSScriptRoot\..\IntegrationService.API"
$InstallerDir = $PSScriptRoot
$PublishDir = "$InstallerDir\publish"
$WiXBinDir = "C:\Program Files (x86)\WiX Toolset v3.11\bin"

# Check if WiX is installed
if (-not (Test-Path "$WiXBinDir\candle.exe")) {
    Write-Error "WiX Toolset v3.11 not found. Please install it from https://wixtoolset.org/releases/"
}

# 1. Publish the .NET API
Write-Host "Publishing .NET API..." -ForegroundColor Cyan
dotnet publish $ProjectDir -c Release -r win-x64 --self-contained true -o $PublishDir

# 2. Compile WiX Source
Write-Host "Compiling WiX source..." -ForegroundColor Cyan
& "$WiXBinDir\candle.exe" `
    -dPublishDir="$PublishDir" `
    -o "$InstallerDir\ImidusService.wixobj" `
    "$InstallerDir\ImidusService.wxs"

# 3. Link MSI
Write-Host "Linking MSI..." -ForegroundColor Cyan
& "$WiXBinDir\light.exe" `
    -ext WixUIExtension `
    -o "$InstallerDir\ImidusIntegrationService.msi" `
    "$InstallerDir\ImidusService.wixobj"

Write-Host "`nMSI Build Complete: $InstallerDir\ImidusIntegrationService.msi" -ForegroundColor Green
