# Tech Stack

## Primary Technologies

### Mobile
- **Framework**: React Native 0.73
- **Platforms**: iOS + Android (shared codebase)
- **Location**: `src/mobile/ImidusCustomerApp/`

### Web Frontend
- **Framework**: Next.js 14
- **Apps**:
  - Customer ordering site (`src/web/`)
  - Admin Portal (`src/admin/`)

### Backend
- **Framework**: .NET 8
- **Type**: Windows Service
- **Delivery**: Self-installing MSI
- **Location**: `src/backend/`
- **Projects**:
  - IntegrationService.API
  - IntegrationService.Core
  - IntegrationService.Infrastructure
  - IntegrationService.Tests

### Database
- **Type**: MS SQL Server 2005 Express
- **Logical Name**: TPPro (restored as INI_Restaurant)
- **Original Path**: `C:\TopPos\Data\TPPro.mdf`
- **Integration**: Read/write SQL only (no POS source code access)

### Payment Processing
- **Provider**: Authorize.net
- **Method**: Accept.js tokenization
- **Storage**: Token only, no raw card data

### Push Notifications
- **Service**: Firebase Cloud Messaging (FCM)
- **Use**: Transactional + marketing campaigns

### Terminal Integration
- **Vendors**: Verifone / Ingenico
- **Type**: Client-provided bridge (M5 milestone)

## Infrastructure

### Deployment
- **Cloud**: AWS S3
- **Bucket**: `s3://inirestaurant/novatech/`
- **Delivery**: GitHub + S3 upload required for milestone acceptance

### Repository
- **Host**: GitHub
- **Repo**: https://github.com/novatech642/pos-integration

## Project Constants

| Constant | Value | Notes |
|----------|-------|-------|
| CashierID (online) | 999 | Production orders |
| CashierID (test) | 998 | Test orders |
| StationID (online) | 2 | DESKTOP-DEMO |
| GST Rate | 0.0600 (6%) | Read from tblMisc Code='GST' |
| PST Rate | 0.0000 (0%) | Maryland - read from tblMisc Code='PST' |
| Loyalty earn | 1 pt per $10 | tblMisc SRPR = '10@1' |
| Loyalty redeem | $0.40 per point | tblMisc DRPR = '40@1' |
| DailyOrderNumber | tblMisc Code='DON' | Read + increment with UPDLOCK |

## Database Tables (INI_Restaurant)

### Core Tables
- `tblAvailableSize` - Menu items and pricing
- `tblCustomer` - Customer data with EarnedPoints
- `tblPointsDetail` - Loyalty points transactions
- `tblMisc` - System configuration constants
- `tblPayment` - Payment transaction records
- `OnlineOrderCompanyID` - Integration company mapping

## Key Dependencies

### Mobile
- React Native 0.73
- (See `src/mobile/ImidusCustomerApp/package.json` for full list)

### Web
- Next.js 14
- React 18+
- TypeScript
- Tailwind CSS
- (See `src/web/package.json` and `src/admin/package.json`)

### Backend
- .NET 8
- Entity Framework Core
- SQL Server client libraries
- (See `.csproj` files in backend directories)
