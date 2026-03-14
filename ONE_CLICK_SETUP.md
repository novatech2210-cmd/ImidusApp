# Imidus POS Integration - One-Click Local Setup

This guide provides a simple one-click setup to run the entire Imidus POS Integration system locally.

## Prerequisites

Before running the setup, ensure you have:

1. **Docker Desktop** - Running and logged in
   - Download: https://www.docker.com/products/docker-desktop/

2. **Node.js 18+** - For web and admin portals
   - Download: https://nodejs.org/

3. **pnpm** (recommended) or npm
   - Install pnpm: `npm install -g pnpm`

## Quick Start

### Linux/Mac

```bash
# Make script executable (first time only)
chmod +x start-local.sh

# Start everything
./start-local.sh
```

### Windows (PowerShell)

```powershell
.\start-local.ps1
```

## What Gets Started

| Service | URL | Description |
|---------|-----|-------------|
| Backend API | http://localhost:5004 | .NET 9 REST API |
| API Health | http://localhost:5004/health | Health check endpoint |
| API Docs | http://localhost:5004/swagger | Swagger API documentation |
| Customer Web | http://localhost:3000 | Customer ordering website |
| Admin Portal | http://localhost:3001 | Merchant/Admin dashboard |
| SQL Server | localhost:1433 | Database (INI_Restaurant) |

## Database

The setup automatically:
1. Starts SQL Server 2022 in Docker
2. Restores INI_Restaurant database from backup
3. Creates IntegrationService database for user data

### Database Credentials
- **Server:** localhost:1433
- **Username:** sa
- **Password:** YourStrong@Passw0rd
- **POS Database:** INI_Restaurant
- **App Database:** IntegrationService

## Command Line Options

### Linux/Mac
```bash
# Normal startup
./start-local.sh

# Rebuild all containers
./start-local.sh --rebuild

# Reset database (restore from backup)
./start-local.sh --reset-db
```

### Windows
```powershell
# Normal startup
.\start-local.ps1

# Rebuild all containers
.\start-local.ps1 -Rebuild

# Reset database
.\start-local.ps1 -ResetDb
```

## Stopping Services

Press `Ctrl+C` in the terminal to stop all services.

Or manually:
```bash
# Stop Docker containers
cd src/backend
docker-compose down
```

## Troubleshooting

### Port Already in Use
If you see "port already in use" errors:
```bash
# Find process using port
lsof -i :5004  # or :3000, :3001

# Kill the process
kill <PID>
```

### Database Not Connecting
1. Ensure Docker Desktop is running
2. Check SQL Server container is healthy:
   ```bash
   docker ps
   docker logs imidus-sqlserver
   ```

### API Not Starting
Check the API logs:
```bash
docker logs -f imidus-api
```

### Web/Admin Not Building
Clear node_modules and rebuild:
```bash
cd src/web  # or src/admin
rm -rf node_modules .next
pnpm install
pnpm run dev
```

## Manual Service Control

### Start Only Database
```bash
cd src/backend
docker-compose up -d sqlserver
```

### Start Only API
```bash
cd src/backend
docker-compose up -d api
```

### Start Only Web
```bash
cd src/web
pnpm run dev
```

### Start Only Admin
```bash
cd src/admin
PORT=3001 pnpm run dev
```

## Mobile App

The mobile app requires separate build tools:

### Android
```bash
cd src/mobile/ImidusCustomerApp
pnpm install
pnpm run android
```

### iOS (Mac only)
```bash
cd src/mobile/ImidusCustomerApp/ios
pod install
cd ..
pnpm run ios
```

## Environment Files

Each component has its own `.env` file:

| Component | Location | Key Settings |
|-----------|----------|--------------|
| Backend | `src/backend/.env` | Database connection strings |
| Web | `src/web/.env.local` | API URL, Authorize.net keys |
| Admin | `src/admin/.env.local` | API URL |
| Mobile | `src/mobile/ImidusCustomerApp/.env` | API URL, payment keys |

## Support

- **Team:** Novatech Build Team
- **Contact:** novatech2210@gmail.com
- **Client:** Sung Bin Im - Imidus Technologies
