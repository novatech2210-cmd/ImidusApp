# TOAST POS Integration - Work State

## Current Status
**Last Updated**: March 9, 2026
**Current Blocker**: tblPendingOrders INSERT failing with NULL error on DSCAmtEmployee

## Issue Summary

The order creation flow works partially:
- ✅ Customer registration works
- ✅ Order creates in tblSales
- ✅ Online order link created in tblSalesOfOnlineOrders
- ❌ **tblPendingOrders INSERT fails** - NULL error on DSCAmtEmployee column

## What Was Fixed

1. **X-Idempotency-Key header** - Frontend sending `X-Idempotency-Key`, backend accepts both formats
2. **Payment fields required** - Made `PaymentAuthorizationNo` and `PaymentTypeId` optional
3. **tblOrderNumber column** - Fixed `OrderDate` → `CalledDateTime`
4. **Online order defaults** - CashierID=999, StationID=2 for online orders
5. **Missing POS data** - Added user ID 999 to tblUser, OnlineOrderCompany ID 1
6. **tblPendingOrders column order** - Fixed INSERT to match DB schema

## Files Modified

### Backend
- `/src/backend/IntegrationService.API/DTOs/OrderDTOs.cs`
- `/src/backend/IntegrationService.API/Middleware/IdempotencyMiddleware.cs`
- `/src/backend/IntegrationService.API/Controllers/OrdersController.cs`
- `/src/backend/IntegrationService.Core/Services/OrderProcessingService.cs`
- `/src/backend/IntegrationService.Core/Domain/Entities/PosEntities.cs`
- `/src/backend/IntegrationService.Infrastructure/Data/PosRepository.cs`
- `/src/backend/IntegrationService.Infrastructure/Data/OrderNumberRepository.cs`

### Frontend
- `/src/web/lib/api.ts`

## Running Services

- SQL Server: `imidus-sqlserver` container on localhost:1433
- Backend: dotnet on localhost:5004
- Frontend: Next.js on localhost:3000

## Next Steps

1. **Clean rebuild backend** - The COALESCE fix may not have been deployed
   ```bash
   cd /home/kali/Desktop/TOAST/src/backend/IntegrationService.API
   dotnet clean
   dotnet build
   ```

2. **Re-test order creation** - Register user → Create order

3. **Complete Phase 18** - Admin Dashboard with Orders/Customers
