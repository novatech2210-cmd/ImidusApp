# IMIDUS POS Integration - Local Development Environment

One-click local development environment for the IMIDUS POS Integration project. This setup uses Docker Compose to run SQL Server and the .NET backend API locally.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (20.10+)
- [Docker Compose](https://docs.docker.com/compose/install/) (2.0+)
- Database backup file: `INI_Restaurant.Bak` (place in `db/backups/`)

## Quick Start

### One-Click Start (with database restore)

```bash
./start-local.sh --with-restore
```

This will:
1. Start SQL Server container
2. Restore INI_Restaurant database from backup
3. Build and start the backend API
4. Verify all services are healthy

### Start Without Database Restore

```bash
./start-local.sh
```

Use this if you've already restored the database and just need to restart services.

### Skip Docker Build (faster restart)

```bash
./start-local.sh --skip-build
```

## Manual Database Restore

If you need to restore the database separately:

```bash
./scripts/restore-database.sh
```

This script will:
- Check if SQL Server is running
- Wait for it to be ready
- Restore the database from `db/backups/INI_Restaurant.Bak`
- Verify the restore completed successfully

## Services

| Service | URL | Description |
|---------|-----|-------------|
| SQL Server | `localhost:1433` | INI_Restaurant POS database |
| Backend API | `http://localhost:5004` | .NET 9 Web API |
| Health Check | `http://localhost:5004/health` | API health status |
| Swagger UI | `http://localhost:5004/swagger` | API documentation |
| Adminer | `http://localhost:8080` | Database management UI |

## Connection Strings

### POS Database (Ground Truth)
```
Server=localhost,1433;Database=INI_Restaurant;User Id=sa;Password=YourStrong@Passw0rd;TrustServerCertificate=True;
```

### Backend Database (Overlay)
```
Server=localhost,1433;Database=IntegrationService;User Id=sa;Password=YourStrong@Passw0rd;TrustServerCertificate=True;
```

## Database Architecture

**INI_Restaurant Database** (Source of Truth)
- Read anytime for menu, orders, customers
- Write only through backend service
- Never modify schema
- Contains: tblItem, tblSales, tblCustomer, etc.

**IntegrationService Database** (Backend Overlay)
- Customer profiles (birthday, FCM tokens)
- Marketing rules (upselling configuration)
- Scheduled orders
- Push notification logs
- Idempotency keys
- Audit logs

## Testing the API

```bash
# Health check
curl http://localhost:5004/health

# Get menu categories
curl http://localhost:5004/api/Menu/categories

# Get menu items
curl http://localhost:5004/api/Menu

# Check API documentation
open http://localhost:5004/swagger
```

## Common Commands

```bash
# View API logs
docker-compose logs -f api

# View SQL Server logs
docker-compose logs -f sqlserver

# Stop all services
docker-compose down

# Stop and remove all data (including database)
docker-compose down -v

# Rebuild API after code changes
docker-compose up -d --build api

# Access SQL Server command line
docker exec -it imidus-sqlserver /opt/mssql-tools18/bin/sqlcmd \
    -S localhost -U sa -P "YourStrong@Passw0rd" -C
```

## Project Structure

```
local-dev/
├── docker-compose.yml          # Service definitions
├── start-local.sh              # One-click startup script
├── README.md                   # This file
├── db/
│   └── backups/
│       └── INI_Restaurant.Bak  # POS database backup
├── scripts/
│   └── restore-database.sh     # Database restore script
└── logs/                       # Log files
```

## Troubleshooting

### SQL Server Won't Start

Check if port 1433 is already in use:
```bash
sudo lsof -i :1433
```

### Database Restore Fails

1. Check backup file exists:
   ```bash
   ls -lh db/backups/INI_Restaurant.Bak
   ```

2. Check SQL Server logs:
   ```bash
   docker-compose logs sqlserver
   ```

3. Verify SQL Server is healthy:
   ```bash
   docker exec imidus-sqlserver /opt/mssql-tools18/bin/sqlcmd \
       -S localhost -U sa -P "YourStrong@Passw0rd" -C -Q "SELECT 1"
   ```

### API Won't Connect to Database

1. Check API logs:
   ```bash
   docker-compose logs api
   ```

2. Verify database is restored:
   ```bash
   docker exec imidus-sqlserver /opt/mssql-tools18/bin/sqlcmd \
       -S localhost -U sa -P "YourStrong@Passw0rd" -C \
       -Q "SELECT name FROM sys.databases"
   ```

3. Restart API:
   ```bash
   docker-compose restart api
   ```

## Client Delivery Package

To create the one-click delivery package for the client:

```bash
# Create delivery archive
tar -czvf imidus-local-dev-v1.0.tar.gz \
    local-dev/docker-compose.yml \
    local-dev/start-local.sh \
    local-dev/scripts/ \
    local-dev/README.md \
    INI_Restaurant.Bak
```

The client will need:
1. Docker Desktop installed
2. The tar.gz archive extracted
3. Run `./start-local.sh --with-restore`

## Security Notes

- Default SA password: `YourStrong@Passw0rd` (change for production)
- TrustServerCertificate=True for local development only
- Never commit real credentials to version control
- Authorize.net credentials are set to SANDBOX mode

## Support

For issues or questions:
1. Check logs: `docker-compose logs`
2. Review AGENTS.md in project root
3. Verify backend configuration in `src/backend/`
