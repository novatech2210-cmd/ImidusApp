# IMIDUS POS Integration - Setup Guide

## Overview

This guide walks you through setting up the complete IMIDUS POS Integration Platform including:

- Backend API (Docker)
- Database (SQL Server)
- Web Application (Next.js)
- Mobile App (Android APK)

---

## Prerequisites

Before starting, ensure you have:

| Requirement | Minimum Version | Check Command |
|------------|-----------------|---------------|
| Docker | 24.0+ | `docker --version` |
| Docker Compose | 2.20+ | `docker compose version` |
| Node.js | 20+ | `node --version` |
| npm/pnpm | 9+ | `npm --version` |
| Git | 2.40+ | `git --version` |

**System Requirements:**
- 8GB RAM minimum
- 10GB free disk space
- Ports available: 80, 443, 1433, 3000, 5004, 8080

---

## Quick Start (5 minutes)

### Step 1: Extract the Package

```bash
unzip TOAST-Milestone-3.zip
cd TOAST-Milestone-3
```

### Step 2: Configure Environment

```bash
cd backend
cp .env.example .env
# Edit .env with your credentials (see Configuration section)
```

### Step 3: Start Backend Services

```bash
./start.sh
# Or manually:
docker compose up -d --build
```

### Step 4: Start Web Application

```bash
cd ../web/customer-web
npm install
npm run dev
```

### Step 5: Access the Platform

| Service | URL |
|---------|-----|
| Customer Web | http://localhost:3000 |
| Admin Portal | http://localhost:3000/merchant |
| API | http://localhost:5004 |
| API Docs | http://localhost:5004/swagger |
| Health Check | http://localhost:5004/health |

---

## Detailed Setup

### Backend Configuration

Edit `backend/.env` with your actual values:

```bash
# Database (keep default for local testing)
SA_PASSWORD=YourStrong@Passw0rd123

# Authentication
JWT_SECRET=YourSuperSecretKeyAtLeast32CharactersLong

# Payment Gateway (get from Authorize.net)
AUTHORIZENET_ENVIRONMENT=Sandbox
AUTHORIZENET_API_LOGIN_ID=your_api_login_id
AUTHORIZENET_TRANSACTION_KEY=your_transaction_key
```

### Database Setup

The system uses two databases:

1. **INI_Restaurant** - Legacy POS data (restore from backup)
2. **IntegrationService** - Backend overlay tables (auto-created)

**To restore INI_Restaurant from backup:**

```bash
# Copy backup file to SQL Server container
docker cp /path/to/INI_Restaurant.Bak imidus-sqlserver:/var/opt/mssql/backup/

# Connect to SQL Server
docker exec -it imidus-sqlserver /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P "YourStrong@Passw0rd123" -C -No

# Run restore command
RESTORE DATABASE INI_Restaurant
FROM DISK = '/var/opt/mssql/backup/INI_Restaurant.Bak'
WITH MOVE 'TPPro' TO '/var/opt/mssql/data/INI_Restaurant.mdf',
     MOVE 'TPPro_log' TO '/var/opt/mssql/data/INI_Restaurant.ldf';
GO
```

### Web Application Configuration

Edit `web/customer-web/.env.local`:

```bash
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:5004

# For production, use your domain:
# NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

### Mobile App Configuration

The APK is pre-built. For local testing:

1. Find your computer's local IP: `hostname -I` or `ifconfig`
2. Ensure mobile device is on same network
3. Configure API URL in app settings to: `http://<your-ip>:5004`

---

## Production Deployment

### Backend (Docker on Linux Server)

```bash
# Copy backend folder to server
scp -r backend/ user@server:/opt/imidus/

# SSH to server
ssh user@server

# Configure production environment
cd /opt/imidus/backend
cp .env.example .env
nano .env  # Update with production values

# Start services
docker compose up -d --build

# Enable auto-restart
docker update --restart=always imidus-api imidus-sqlserver imidus-nginx
```

### Web Application (Vercel/Node)

**Option A: Vercel (Recommended)**

```bash
cd web/customer-web
npx vercel
```

**Option B: Self-Hosted**

```bash
cd web/customer-web
npm install
npm run build
npm start  # Runs on port 3000
```

### SSL/HTTPS

1. Place certificates in `backend/nginx/ssl/`:
   - `cert.pem`
   - `key.pem`

2. Uncomment HTTPS section in `backend/nginx/nginx.conf`

3. Restart nginx: `docker compose restart nginx`

---

## Verification Checklist

After setup, verify each component:

- [ ] Docker containers running: `docker compose ps`
- [ ] API health check passes: `curl http://localhost:5004/health`
- [ ] Database connection: Swagger shows menu items
- [ ] Web app loads: Browse to http://localhost:3000
- [ ] Login works: Use test@imidus.com / Test123!
- [ ] Menu displays: Items load from database
- [ ] Cart works: Add items, see totals
- [ ] Admin access: Browse to /merchant with admin account

---

## Troubleshooting

### Container Issues

```bash
# View logs
docker compose logs -f

# Specific service logs
docker compose logs api
docker compose logs sqlserver

# Restart services
docker compose restart

# Full rebuild
docker compose down -v
docker compose up -d --build
```

### Database Connection Failed

1. Check SQL Server is running: `docker compose ps sqlserver`
2. Verify password meets complexity requirements
3. Check connection string in API logs

### Web App Build Errors

```bash
# Clear cache
rm -rf .next node_modules
npm install
npm run dev
```

### API Returns 404

1. Verify API is running: `curl http://localhost:5004/health`
2. Check CORS settings in Program.cs
3. Verify route matches Swagger documentation

---

## Support

For assistance:

- Email: novatech2210@gmail.com
- Include: Error logs, screenshots, environment details
