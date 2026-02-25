# Technology Stack

**Analysis Date:** 2026-02-25

## Languages

**Primary:**
- TypeScript 5.0 - Web frontend (`src/web/`), mobile app (`src/mobile/ImidusCustomerApp/`)
- C# 8.0+ with .NET 8.0 - Backend API and services (`src/backend/`)

**Secondary:**
- JavaScript - Configuration files, build scripts, React Native Metro config

## Runtime

**Environment:**
- Node.js ≥18 (required by mobile app, enforced in `src/mobile/ImidusCustomerApp/package.json` engines)
- .NET 8.0 (backend runtime target in all .csproj files)
- React Native 0.73.0 (mobile runtime)

**Package Manager:**
- npm (web app: `src/web/package-lock.json` present)
- npm/yarn (mobile app: `src/mobile/ImidusCustomerApp/yarn.lock` present)
- NuGet (.NET package management, implicit via .csproj files)

## Frameworks

**Core Web:**
- Next.js 16.1.6 - Web application framework (`src/web/package.json`)
- React 19.2.3 - UI library for web

**Core Mobile:**
- React Native 0.73.0 - Mobile framework for iOS/Android
- React 18.2.0 - UI library for mobile

**Core Backend:**
- ASP.NET Core 8.0 Web API - REST API framework (`src/backend/IntegrationService.API/`)

**Styling:**
- Tailwind CSS 4.x - Web styling (`src/web/package.json`)
- PostCSS 4 - Web CSS processing

**State Management:**
- Redux Toolkit 2.11.2 - Mobile app state (`src/mobile/ImidusCustomerApp/package.json`)
- React Context API - Web app state (`src/web/context/AuthContext.tsx`, `CartContext.tsx`)

**Testing:**
- xUnit 2.5.3 - Backend unit testing framework
- Moq 4.20.70 - Backend mocking library
- Jest 29.6.3 - Mobile app testing framework
- coverlet.collector 6.0.0 - Backend code coverage

**Build/Dev:**
- Babel 7.20.0 - JavaScript transpilation (mobile)
- Metro - React Native bundler
- ESLint 9.x (web), 8.19.0 (mobile) - Code linting
- Prettier 2.8.8 - Code formatting (mobile)

## Key Dependencies

**Critical - Web:**
- @heroicons/react 2.2.0 - Icon components

**Critical - Mobile:**
- @react-navigation/native 7.1.28 - Navigation framework
- @react-navigation/stack 7.7.2 - Stack navigation
- axios 1.13.5 - HTTP client for API calls
- react-native-gesture-handler 2.14.1 - Touch gesture handling
- react-native-safe-area-context 4.8.2 - Safe area management
- react-native-screens 3.29.0 - Native screen optimization
- react-redux 9.2.0 - Redux integration
- lucide-react-native 0.575.0 - Icon library

**Critical - Backend:**
- Dapper 2.1.66 - ORM for SQL queries (`src/backend/IntegrationService.Infrastructure/IntegrationService.Infrastructure.csproj`)
- FirebaseAdmin 2.4.0 - Firebase integration (infrastructure layer)
- Microsoft.Data.SqlClient 6.1.4 - SQL Server connectivity
- Serilog.AspNetCore 8.0.1 - Structured logging
- Swashbuckle.AspNetCore 6.8.1 - Swagger/OpenAPI documentation
- Microsoft.AspNetCore.Authentication.JwtBearer 8.0.0 - JWT authentication
- Microsoft.AspNetCore.OpenApi 8.0.23 - OpenAPI support

**Infrastructure:**
- Microsoft.Extensions.Logging.Abstractions 10.0.3 - Logging abstractions
- Microsoft.NET.Test.Sdk 17.8.0 - Test framework support
- react-native-svg 14.1.0 - SVG rendering (mobile)

## Configuration

**Environment:**
- SQL Server LocalDB (development): `src/backend/IntegrationService.API/appsettings.Development.json`
  - Connection string configured for local SQL Server instance
  - Database: `INI_Restaurant`
- Production: Connection string to be provided via environment variables
- API Base URL: Web configured via `NEXT_PUBLIC_API_URL` environment variable (default: `http://localhost:5000/api`)
- Mobile API Base URL: Configured in `src/mobile/ImidusCustomerApp/src/config/environment.ts`
  - Development (Android emulator): `http://10.0.2.2:5004/api`
  - Production: `https://eda7-105-184-203-108.ngrok-free.app/api`

**Build:**
- Next.js configuration: `src/web/next.config.ts` (minimal, default config)
- TypeScript: `src/web/tsconfig.json`, `src/mobile/ImidusCustomerApp/tsconfig.json`
- ESLint: `src/web/eslint.config.mjs` (Next.js + TypeScript config)
- PostCSS: `src/web/postcss.config.mjs` (Tailwind integration)

## Platform Requirements

**Development:**
- Windows 10+ or macOS/Linux
- Node.js ≥18
- .NET 8.0 SDK
- SQL Server or SQL Server LocalDB
- Xcode (for iOS development on macOS)
- Android SDK / Android Studio (for Android development)

**Production:**
- .NET 8.0 runtime (backend)
- Node.js 18+ (web if using Node-based hosting)
- SQL Server instance (cloud or self-hosted)
- Mobile distribution: Apple App Store, Google Play Store

---

*Stack analysis: 2026-02-25*
