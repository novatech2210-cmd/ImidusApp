# End-to-End Testing Guide

## Overview

This document provides comprehensive testing procedures for the IMIDUS POS Integration system across all platforms.

## Test Environments

### Backend API

- **Development:** http://localhost:5004/api
- **Swagger UI:** http://localhost:5004/swagger
- **Health Check:** http://localhost:5004/health

### Web Platform

- **Development:** http://localhost:3000
- **Staging:** https://s3.inirestaurant/novatech/web/staging/
- **Production:** https://s3.inirestaurant/novatech/web/production/

### Mobile Apps

- **Android:** http://10.0.2.2:5004/api (emulator)
- **iOS:** http://localhost:5004/api (simulator)

## Quick Test Commands

### Run All Tests

```bash
./scripts/05_e2e_test.sh
```

### Test Individual Components

```bash
# Database setup
./scripts/01_setup_database.sh

# Payment testing
./scripts/02_test_payments.sh

# API connectivity
curl http://localhost:5004/health
curl http://localhost:5004/api/Menu/categories
```

## Test Scenarios

### 1. Complete Customer Flow (Mobile/Web)

**Steps:**

1. Register new customer account
2. Browse menu categories
3. View items by category
4. Add items to cart
5. View cart
6. Proceed to checkout
7. Enter payment details (test card)
8. Complete order
9. Verify order appears in POS
10. Track order status

**Expected Results:**

- Order created in tblSales with TransType=2 (Open)
- Items inserted in tblPendingOrders
- Payment recorded in tblPayment
- Order number assigned from tblMisc DON
- Customer receives confirmation notification

### 2. Payment Flow Testing

**Test Cards (Authorize.net Sandbox):**

- Visa: `4111111111111111`
- MasterCard: `5424000000000015`
- Amex: `378282246310005`
- Expiry: Any future date (e.g., `12/30`)
- CVV: Any 3-4 digits

**Scenarios:**

1. Full payment with credit card
2. Partial payment (card + cash)
3. Failed payment (use `4000000000000002`)
4. Refund processing

### 3. Order Lifecycle Testing

**States to Test:**

1. **Open (TransType=2)** - Order placed, payment pending
2. **Completed (TransType=1)** - Payment confirmed, items moved to tblSalesDetail
3. **Refunded (TransType=0)** - Refund processed

**Verification:**

- Check tblSales.TransType
- Verify tblPendingOrders vs tblSalesDetail
- Confirm payment in tblPayment

### 4. Idempotency Testing

**Test:**

1. Create order with idempotency key
2. Submit same request again with same key
3. Verify only one order created
4. Check response indicates duplicate was handled

### 5. Concurrency Testing

**Test:**

1. Submit multiple simultaneous orders
2. Verify all get unique DailyOrderNumbers
3. Check no duplicate order numbers
4. Verify atomic transactions

### 6. Admin Portal Testing

**Dashboard:**

1. View order queue
2. Filter by status (Open/Completed/Refunded)
3. Search by order number
4. View order details
5. Verify real-time updates (poll every 30s)

**Operational Views:**

1. Menu availability (read-only)
2. Inventory levels (read-only)
3. Sales reports
4. Customer lookup

### 7. POS Synchronization Testing

**Verify:**

1. Online orders appear in POS as regular tickets
2. Payment totals match
3. Tax calculations correct (GST/PST)
4. Item modifiers preserved
5. Kitchen routing flags (KitchenB, KitchenF, Bar)

## Acceptance Criteria

### Functional Requirements

- ✅ Orders appear in POS within 5 seconds
- ✅ Payments post correctly to tblPayment
- ✅ Order numbers are sequential and unique
- ✅ Tax calculations match POS
- ✅ Idempotency prevents duplicates
- ✅ Authentication/JWT works across all platforms

### Performance Requirements

- ✅ API responds within 500ms for menu queries
- ✅ Order creation completes within 2 seconds
- ✅ Payment processing completes within 5 seconds
- ✅ Admin dashboard updates every 30 seconds
- ✅ Mobile app loads menu within 3 seconds

### Security Requirements

- ✅ JWT tokens expire after 30 days
- ✅ Refresh tokens valid for 60 days
- ✅ Card data never stored (tokenization only)
- ✅ SQL injection prevention (parameterized queries)
- ✅ CORS configured for approved origins only

## Automated Test Scripts

### Backend Unit Tests

```bash
cd src/backend
dotnet test --verbosity normal
```

### Payment Integration Tests

```bash
./scripts/02_test_payments.sh
```

### End-to-End Tests

```bash
./scripts/05_e2e_test.sh
```

## Manual Testing Checklist

### Mobile App (iOS/Android)

- [ ] App launches without crashes
- [ ] Splash screen displays correctly
- [ ] Login works with valid credentials
- [ ] Registration creates new account
- [ ] Menu loads with categories
- [ ] Items display with correct prices
- [ ] Cart adds/removes items
- [ ] Checkout flow completes
- [ ] Payment processes successfully
- [ ] Order confirmation displays
- [ ] Order tracking shows status
- [ ] Push notifications received
- [ ] Logout clears session

### Web Platform

- [ ] Homepage loads
- [ ] Menu displays correctly
- [ ] Responsive design on mobile browsers
- [ ] Login authentication works
- [ ] Cart functionality works
- [ ] Checkout process completes
- [ ] Payment processes successfully
- [ ] Order history displays

### Admin Portal

- [ ] Dashboard loads with KPIs
- [ ] Order queue displays
- [ ] Status filtering works
- [ ] Search functionality works
- [ ] Order detail modal opens
- [ ] Real-time updates occur
- [ ] Reports generate correctly

### Backend API

- [ ] Health check returns 200
- [ ] Swagger UI accessible
- [ ] All endpoints respond
- [ ] Authentication validates tokens
- [ ] Database queries execute
- [ ] Error handling works
- [ ] Logging captures events

## Debugging Failed Tests

### Database Connection Issues

1. Verify SQL Server is running
2. Check connection strings in appsettings.json
3. Test with sqlcmd: `sqlcmd -S localhost -U sa -P <password> -Q "SELECT 1"`
4. Check firewall settings (port 1433)

### Payment Failures

1. Verify Authorize.net credentials
2. Check if using sandbox vs production
3. Review backend logs for API errors
4. Test with valid sandbox card numbers
5. Check network connectivity

### Authentication Issues

1. Verify JWT secret matches
2. Check token expiration
3. Test with fresh registration
4. Review AuthController logs
5. Verify CORS allows origin

### Order Creation Failures

1. Check database connectivity
2. Verify idempotency key is unique
3. Review OrderProcessingService logs
4. Check POS table permissions
5. Validate item and size IDs exist

## Test Data Management

### Cleaning Up Test Data

```sql
-- Remove test customers
DELETE FROM tblCustomer WHERE Email LIKE '%test%' OR Email LIKE '%e2e%';

-- Remove test orders (be careful!)
DELETE FROM tblSales WHERE CustomerID IN (
    SELECT ID FROM tblCustomer WHERE Email LIKE '%test%'
);
```

### Creating Test Data

```bash
# Generate test orders
curl -X POST http://localhost:5004/api/Orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "customerId": 1,
    "items": [{"menuItemId": 1, "sizeId": 1, "quantity": 1, "unitPrice": 10.00}],
    "paymentAuthorizationNo": "TEST001",
    "paymentBatchNo": "BATCH001",
    "paymentTypeId": 3
  }'
```

## Continuous Testing

### Pre-Commit Checks

```bash
# Run before every commit
dotnet build
dotnet test
npm run lint  # in web directory
```

### CI/CD Pipeline Tests

- Backend builds on every PR
- Tests run on every push
- Mobile builds on tag creation
- Web deploys on main branch merge
- MSI builds on release creation

## Reporting Issues

When reporting test failures, include:

1. Test scenario name
2. Expected vs actual result
3. Error messages/logs
4. Steps to reproduce
5. Environment details (OS, versions)
6. Screenshots (if UI-related)

## Success Metrics

**Minimum Viable Product (MVP):**

- 90%+ of automated tests passing
- All critical paths manually tested
- No blocking bugs
- POS integration verified

**Production Ready:**

- 95%+ of automated tests passing
- Performance requirements met
- Security audit passed
- Documentation complete
- CI/CD pipelines green
