# IMIDUS POS Integration Platform

## Milestone 3 Delivery Package

**Version:** 1.0.0
**Date:** March 19, 2026
**Client:** IMIDUS Technologies Inc.

---

## Overview

This package contains the complete IMIDUS POS Integration Platform, enabling restaurant customers to order online through mobile apps and web, with orders syncing directly to the legacy INI POS system.

### Platform Components

| Component | Technology | Status |
|-----------|------------|--------|
| Mobile App (Android) | React Native | ✅ Release APK |
| Mobile App (iOS) | React Native | 📋 TestFlight Ready |
| Customer Web | Next.js 16 | ✅ Complete |
| Admin Portal | Next.js 16 | ✅ Complete |
| Backend API | .NET 8 | ✅ Dockerized |
| Database | SQL Server 2022 | ✅ Dockerized |

---

## Quick Start

### 1. Start Backend Services

```bash
cd backend
cp .env.example .env
# Edit .env with your credentials
./start.sh
```

### 2. Start Web Application

```bash
cd web/customer-web
npm install
npm run dev
```

### 3. Access Platform

| Service | URL |
|---------|-----|
| Customer Web | http://localhost:3000 |
| Admin Portal | http://localhost:3000/merchant |
| API Swagger | http://localhost:5004/swagger |

### 4. Test Credentials

| Account | Email | Password |
|---------|-------|----------|
| Customer | test@imidus.com | Test123! |
| Admin | admin@imidus.com | Admin123! |

---

## Package Structure

```
TOAST-Milestone-3/
├── mobile/
│   ├── android/
│   │   └── ImidusCustomerApp-release.apk    # Android release build
│   ├── ios/
│   │   └── (TestFlight instructions)
│   └── install_guide.md                      # Installation guide
│
├── web/
│   ├── customer-web/                         # Next.js app (customer + admin)
│   │   ├── app/                              # App routes
│   │   ├── components/                       # React components
│   │   └── package.json
│   └── admin-portal/
│       └── README.md                         # Admin portal access info
│
├── backend/
│   ├── docker-compose.yml                    # Container orchestration
│   ├── .env.example                          # Environment template
│   ├── start.sh                              # Startup script
│   ├── api/                                  # .NET 8 API source
│   │   ├── Dockerfile
│   │   ├── IntegrationService.API/
│   │   ├── IntegrationService.Core/
│   │   └── IntegrationService.Infrastructure/
│   ├── nginx/
│   │   └── nginx.conf                        # Reverse proxy config
│   └── scripts/
│       └── init-db.sql                       # Database initialization
│
├── database/
│   └── dump.sql                              # Schema + seed data
│
├── docs/
│   ├── setup_guide.md                        # Full setup instructions
│   ├── api_docs.md                           # API documentation
│   └── credentials.md                        # Test accounts & keys
│
└── README.md                                 # This file
```

---

## Features Included

### Customer App (Mobile + Web)

- [x] Menu browsing by category
- [x] Item details with size selection
- [x] Shopping cart management
- [x] Checkout with payment
- [x] Order tracking
- [x] Order history
- [x] Loyalty points display
- [x] Account management
- [x] Push notifications

### Admin Portal

- [x] Dashboard overview
- [x] Order management
- [x] Customer database
- [x] Marketing campaigns
- [x] Upselling rules
- [x] Menu visibility control
- [x] Birthday rewards

### Backend API

- [x] JWT authentication
- [x] Menu endpoints
- [x] Order processing
- [x] Payment integration (Authorize.net)
- [x] Loyalty points tracking
- [x] Push notifications (FCM)
- [x] Idempotency protection
- [x] Health monitoring
- [x] Swagger documentation

---

## System Requirements

### Server (Backend)

- Docker 24.0+
- Docker Compose 2.20+
- 4GB RAM minimum
- 10GB disk space

### Development (Web)

- Node.js 20+
- npm 9+ or pnpm 8+

### Mobile Testing

- Android 8.0+ device/emulator
- iOS 13.0+ device (TestFlight)

---

## Configuration Required

Before deployment, configure these items:

1. **Database Password** (`SA_PASSWORD` in .env)
2. **JWT Secret** (`JWT_SECRET` in .env)
3. **Authorize.net Keys** (`AUTHORIZENET_*` in .env)
4. **Firebase Key** (firebase-admin-key.json)
5. **INI_Restaurant Backup** (restore separately)

---

## Documentation

| Document | Description |
|----------|-------------|
| [Setup Guide](docs/setup_guide.md) | Complete installation steps |
| [API Documentation](docs/api_docs.md) | Endpoint reference |
| [Credentials](docs/credentials.md) | Test accounts & API keys |
| [Mobile Install](mobile/install_guide.md) | APK/IPA installation |

---

## Support

For technical support:

- **Email:** novatech2210@gmail.com
- **Response Time:** 24-48 hours

Please include:
- Environment details
- Error messages/screenshots
- Steps to reproduce

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-03-19 | Initial M3 delivery |

---

## Legal

© 2026 Novatech Build Team for IMIDUS Technologies Inc.

This software is proprietary and confidential. Unauthorized copying, transfer, or reproduction is prohibited.
