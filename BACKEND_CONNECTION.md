# Backend Connection Setup

## Overview

Backend API is now connected to both Mobile App and Web Platform.

## Configuration Summary

### Backend (.NET API)

- **Port**: 5004 (HTTP) / 7289 (HTTPS)
- **Base URL**: `http://localhost:5004/api`
- **CORS**: Configured for web (localhost:3000, 3001) and mobile (any origin)

### Mobile App (React Native)

- **API Client**: Axios-based in `src/api/apiClient.ts`
- **Environment**: `src/config/environment.ts`
- **Development URL**: `http://10.0.2.2:5004/api` (Android emulator)
- **Production URL**: `https://api.imidus.com/api`

### Web Platform (Next.js)

- **API Client**: Fetch-based in `lib/api.ts`
- **Environment Variable**: `NEXT_PUBLIC_API_URL`
- **Default URL**: `http://localhost:5004/api`
- **Env File**: `.env.local` (development), `.env` (production)

## Available API Endpoints

### Auth

- `POST /Auth/login` - Login with phone/email + password
- `POST /Auth/register` - Register new customer
- `GET /Auth/me` - Get current user profile (requires auth)
- `POST /Auth/refresh` - Refresh JWT token

### Menu

- `GET /Menu/categories` - Get all categories
- `GET /Menu/items/{categoryId}` - Get items by category
- `GET /Menu` - Get full menu
- `GET /Menu/{itemId}/sizes` - Get item sizes

### Orders

- `POST /Orders` - Create new order (requires idempotency key)
- `GET /Orders/{id}/status` - Get order status
- `GET /Orders/history/{customerId}` - Get order history

### Customers

- `GET /Customers/lookup?phone={}&email={}` - Lookup customer

### Loyalty

- `GET /loyalty/balance` - Get loyalty points balance

## Running the Setup

### 1. Start the Backend

```bash
cd src/backend/IntegrationService.API
dotnet run
# API will be available at http://localhost:5004
# Swagger UI at http://localhost:5004/swagger
```

### 2. Run Web Platform

```bash
cd src/web
# Create .env.local for development
cp .env.example .env.local
# Edit .env.local to set NEXT_PUBLIC_API_URL if needed
npm run dev
# Web app at http://localhost:3000
```

### 3. Run Mobile App

```bash
cd src/mobile/ImidusCustomerApp
# Create .env for development
cp .env.example .env
# Update API_BASE_URL in .env if needed
npx react-native run-android
# or
npx react-native run-ios
```

## Environment Files

### Web Platform

- `.env` - Production settings (committed)
- `.env.local` - Local development (gitignored)
- `.env.example` - Template for new developers

### Mobile App

- `.env` - Development/production settings
- `.env.example` - Template with documentation

## Testing the Connection

1. **Backend Health Check**: Visit `http://localhost:5004/health`
2. **Swagger UI**: Visit `http://localhost:5004/swagger`
3. **Web Login**: Navigate to `/login` and test authentication
4. **Mobile Login**: Use the app's login screen

## Troubleshooting

### CORS Errors

- Ensure backend CORS policy includes your web app URL
- Check `Program.cs` CORS configuration

### Connection Refused

- Verify backend is running on port 5004
- Check firewall settings
- For mobile: ensure 10.0.2.2 (Android) or localhost (iOS) is correct

### Authentication Failures

- Check JWT secret matches between backend and frontend
- Verify token is being sent in Authorization header
- Ensure localStorage (web) or AsyncStorage (mobile) has valid token
