---
name: deployment-and-msi
description: Activate when implementing CI/CD pipelines, the Windows MSI installer, AWS S3 artifact uploads, or Docker-based deployment for the IMIDUS backend. Covers the self-installing MSI contractual requirement, GitHub Actions workflows, and AWS S3 delivery channel configuration.
---

# Deployment & MSI Skill

## Delivery Architecture

```
AWS S3 Bucket: s3://inirestaurant/novatech/
├── backend/
│   ├── IntegrationService-Setup.msi    ← Self-installing Windows MSI (contractual)
│   └── docker/
│       └── integrationservice-latest.tar.gz
├── mobile/
│   ├── ios/
│   │   └── ImidusCustomerApp.ipa
│   └── android/
│       └── ImidusCustomerApp.apk
└── web/
    ├── imidus-ordering/
    │   └── build.tar.gz
    └── imidus-admin/
        └── build.tar.gz
```

**AWS S3 is the authoritative delivery channel** — all build artifacts must be uploaded here.

---

## Windows MSI (Contractual — Milestone 5)

The backend must ship as a self-installing Windows MSI that:

1. Installs the .NET 8 runtime if not present
2. Configures the Windows Service (`IntegrationService.API`)
3. Writes connection strings to a protected config location
4. Creates install/uninstall registry entries

### Toolchain: WiX Toolset v4

```xml
<!-- installer/IntegrationService.wxs -->
<Wix xmlns="http://wixtoolset.org/schemas/v4/wxs">
  <Package Name="IMIDUS Integration Service"
           Manufacturer="NovaTech"
           Version="1.0.0"
           UpgradeCode="YOUR-GUID-HERE">

    <MajorUpgrade DowngradeErrorMessage="A newer version is installed." />

    <Feature Id="ProductFeature">
      <ComponentGroupRef Id="ProductComponents" />
    </Feature>

  </Package>
</Wix>
```

MSI build command:

```bash
dotnet tool install --global wix
wix build installer/IntegrationService.wxs -o dist/IntegrationService-Setup.msi
```

> ⚠️ MSI build requires **Windows** — use GitHub Actions `windows-latest` runner.

---

## GitHub Actions Workflows

### Backend CI (Linux)

```yaml
# .github/workflows/backend-ci.yml
name: Backend CI
on: [push, pull_request]
jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-dotnet@v4
        with: { dotnet-version: "8.0.x" }
      - run: dotnet restore src/backend/
      - run: dotnet build src/backend/ --no-restore
      - run: dotnet test src/backend/IntegrationService.Tests/ --no-build
```

### iOS Build (macOS runner — contractual)

```yaml
# .github/workflows/ios-build.yml
name: iOS Build
on: [push]
jobs:
  ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "20" }
      - run: npm ci
        working-directory: src/mobile/ImidusCustomerApp
      - run: npx pod-install ios
        working-directory: src/mobile/ImidusCustomerApp
      - run: xcodebuild archive -scheme ImidusCustomerApp -archivePath build/ImidusCustomerApp.xcarchive
        working-directory: src/mobile/ImidusCustomerApp/ios
      - run: xcodebuild -exportArchive -archivePath build/ImidusCustomerApp.xcarchive -exportPath build/ -exportOptionsPlist ExportOptions.plist
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      - run: aws s3 cp build/ImidusCustomerApp.ipa s3://inirestaurant/novatech/mobile/ios/
```

### Windows MSI Build (windows-latest)

```yaml
# .github/workflows/msi-build.yml
name: MSI Build
on: [release]
jobs:
  msi:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-dotnet@v4
        with: { dotnet-version: "8.0.x" }
      - run: dotnet publish src/backend/IntegrationService.API/ -c Release -o publish/
      - run: dotnet tool install --global wix
        shell: powershell
      - run: wix build installer/IntegrationService.wxs -o dist/IntegrationService-Setup.msi
        shell: powershell
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      - run: aws s3 cp dist/IntegrationService-Setup.msi s3://inirestaurant/novatech/backend/
```

---

## Web Deployment Script (Contractual: Single Scripted Deployment)

```bash
#!/bin/bash
# scripts/deploy-web.sh

set -e

echo "Building customer ordering site..."
cd src/web/imidus-ordering
npm ci
npm run build
tar -czf /tmp/ordering-build.tar.gz .next/

echo "Building admin portal..."
cd ../imidus-admin
npm ci
npm run build
tar -czf /tmp/admin-build.tar.gz .next/

echo "Uploading to AWS S3..."
aws s3 cp /tmp/ordering-build.tar.gz s3://inirestaurant/novatech/web/imidus-ordering/build.tar.gz
aws s3 cp /tmp/admin-build.tar.gz    s3://inirestaurant/novatech/web/imidus-admin/build.tar.gz

echo "Deploy complete!"
```

---

## Docker (Backend on Azure App Service)

```dockerfile
# src/backend/IntegrationService.API/Dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 5004

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["IntegrationService.API/IntegrationService.API.csproj", "IntegrationService.API/"]
COPY ["IntegrationService.Core/IntegrationService.Core.csproj", "IntegrationService.Core/"]
COPY ["IntegrationService.Infrastructure/IntegrationService.Infrastructure.csproj", "IntegrationService.Infrastructure/"]
RUN dotnet restore "IntegrationService.API/IntegrationService.API.csproj"
COPY . .
RUN dotnet build "IntegrationService.API/IntegrationService.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "IntegrationService.API/IntegrationService.API.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "IntegrationService.API.dll"]
```

---

## Required GitHub Secrets

| Secret                       | Description                       |
| ---------------------------- | --------------------------------- |
| `AWS_ACCESS_KEY_ID`          | AWS IAM key for S3 uploads        |
| `AWS_SECRET_ACCESS_KEY`      | AWS IAM secret                    |
| `AUTHNET_API_LOGIN_ID`       | Authorize.net login               |
| `AUTHNET_TRANSACTION_KEY`    | Authorize.net transaction key     |
| `APPLE_CERTIFICATE_P12`      | iOS signing cert (base64)         |
| `APPLE_PROVISIONING_PROFILE` | iOS provisioning profile (base64) |
| `FCM_SERVER_KEY`             | Firebase server key for push      |

---

## Local Dev Startup

```bash
# Start all services locally
./start-local.sh

# Or individually:
cd src/backend && dotnet run --project IntegrationService.API --urls http://localhost:5004
cd src/web/imidus-ordering && npm run dev     # port 3000
cd src/web/imidus-admin && npm run dev         # port 3001
```
