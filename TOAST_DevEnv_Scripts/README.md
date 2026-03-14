# TOAST Platform - Development & Testing Scripts

## Quick Start

```bash
# 1. Setup development environment
chmod +x setup-dev-env.sh
./setup-dev-env.sh

# 2. Test all applications locally
./test-apps.sh

# 3. Prepare and upload final delivery
./prepare-delivery.sh
```

## Prerequisites

- Kali Linux with Docker
- TOAST project at /home/kali/Desktop/TOAST
- INI_Restaurant.Bak restored to SQL Server

## Script Details

### setup-dev-env.sh
- Configures Node.js 18 via NVM
- Installs pnpm package manager
- Sets up Android SDK environment
- Installs .NET 8 SDK
- Verifies Docker SQL Server

### test-apps.sh
- Tests database connectivity
- Builds and tests backend API
- Builds and tests web application
- Builds Android APK

### prepare-delivery.sh
- Packages all deliverables
- Creates documentation
- Uploads to AWS S3

## Database Connection

```
Server: localhost,1434
Database: INI_Restaurant
User: sa
Password: ToastSQL@2025!
```

## S3 Delivery Path

```
s3://inirestaurant/Novatech/
├── M2_Mobile_Apps/
├── M3_Web_Admin/
├── M4_Backend_Service/
└── Documentation/
```
