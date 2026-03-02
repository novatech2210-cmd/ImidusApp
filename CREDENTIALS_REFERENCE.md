# Quick Reference - Project Credentials

**⚠️ SENSITIVE INFORMATION - DO NOT SHARE OR COMMIT TO GIT**

---

## AWS S3 Access

**Purpose:** Client resource storage (database backup, docs, branding)

```bash
# Access Configuration
AWS_ACCESS_KEY_ID=AKIA6BHJOUX74I57JI4D
AWS_SECRET_ACCESS_KEY=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
AWS_REGION=us-east-1

# Bucket Details
Bucket Name: inirestaurant
Path: /Novatech/  (Note: Capital 'N')
Full Path: s3://inirestaurant/Novatech/
```

**Quick Commands:**

```bash
# List files
aws s3 ls s3://inirestaurant/Novatech/ --recursive

# Download all files
aws s3 sync s3://inirestaurant/Novatech/ ./client-resources/

# Download specific file
aws s3 cp s3://inirestaurant/Novatech/database/INI_Restaurant.bak ./

# Upload file (for testing)
aws s3 cp ./test-file.txt s3://inirestaurant/Novatech/test/
```

---

## Authorize.net Payment Gateway

**Purpose:** Online payment processing (mobile app, web ordering)

```bash
# Credentials (Updated Jan 30, 2026)
API Login ID: 9JQVwben66U7
Transaction Key: 7eqvzKDRR5Q38898
KeyId / Public Client Key: 7t8S6K3E3VV3qry33ZEWqQWqLq9xs4UmeNn268gFmZ6mdWWvz22zjHbaQH9Qmsrg

# Legacy/Alternative User
User ID: WO10VA
PW: 10855immA$1
```

**API Endpoints:**

```
Sandbox: https://apitest.authorize.net/xml/v1/request.api
Production: https://api.authorize.net/xml/v1/request.api
```

**Accept.js URLs:**

```
Sandbox: https://jstest.authorize.net/v1/Accept.js
Production: https://js.authorize.net/v1/Accept.js
```

**Test Card Numbers (Sandbox):**

```
Visa: 4007000000027
Mastercard: 5424000000000015
Amex: 370000000000002
Discover: 6011000000000012
```

---

## SQL Server Database (PENDING - NOT YET RECEIVED)

**Purpose:** INI_Restaurant database (source of truth) read/write integration

```bash
# Connection Details (TO BE PROVIDED BY CLIENT)
Server: [PENDING]
Port: 1433 (assumed)
Database: INI_Restaurant (confirmed)
Username: [PENDING]
Password: [PENDING]
```

**Connection String Template:**

```
Server=[SERVER];Database=INI_Restaurant;User Id=[USERNAME];Password=[PASSWORD];Encrypt=true;TrustServerCertificate=false;
```

---

## Terminal Bridge API (PENDING - NOT YET RECEIVED)

**Purpose:** In-store payment terminal integration (Verifone/Ingenico)

```bash
# Endpoint (TO BE PROVIDED BY CLIENT)
URL: [PENDING]  # e.g., http://192.168.1.100:8080
Auth Method: [PENDING]
API Key: [PENDING]
```

---

## Environment Variables (.env file)

**Location:** `/home/kali/Desktop/POS2/.env`

**Current Status:**

- ✅ AWS credentials stored
- ✅ Authorize.net credentials stored
- ⏳ SQL Server credentials pending
- ⏳ Terminal Bridge credentials pending

**DO NOT COMMIT THIS FILE TO GIT!**

---

## Quick Access Scripts

### Check S3 for new uploads:

```bash
./scripts/check-s3-resources.sh
```

### Test database connection (once credentials received):

```bash
# Using sqlcmd (Linux)
sqlcmd -S [SERVER] -U [USERNAME] -P [PASSWORD] -d INI_Restaurant -Q "SELECT TOP 10 * FROM INFORMATION_SCHEMA.TABLES"

# Using .NET app
dotnet run --project ./backend/DatabaseTest
```

### Test Authorize.net connection:

```bash
curl -X POST https://apitest.authorize.net/xml/v1/request.api \
  -H "Content-Type: application/json" \
  -d '{
    "getCustomerProfileRequest": {
      "merchantAuthentication": {
        "name": "WO10VA",
        "transactionKey": "10855immA$1"
      }
    }
  }'
```

---

## Client Contact Information

**Primary Contact:** [Client Name]
**Email:** [Client Email]
**Phone:** [Client Phone]
**Timezone:** [Client Timezone]

**Project Start Date:** February 3, 2026 (Week 1)
**Project Due Date:** March 14, 2026 (End of Week 6)

---

## Waiting For (Action Items for Client)

**Critical (This Week):**

1. ⏳ SQL Server hostname, username, password
2. ⏳ Upload `INI_Restaurant.Bak` to S3
3. ⏳ Upload `INIRestaurantManual.pdf` to S3
4. ⏳ Terminal Bridge endpoint and credentials

**Nice to Have:** 5. ⏳ Branding assets (logo, colors) 6. ⏳ Confirm Authorize.net environment (sandbox vs production)

---

## Security Reminders

- ✅ All credentials stored in `.env` file
- ✅ `.env` file excluded from Git (.gitignore)
- ✅ AWS CLI credentials in `~/.aws/credentials` (not in project)
- ⚠️ Never commit credentials to GitHub
- ⚠️ Never share credentials via public channels
- ⚠️ Rotate credentials if exposed
- ⚠️ Use environment-specific credentials (dev/staging/prod)

---

**Last Updated:** January 30, 2026, 2:40 PM UTC+2  
**Updated By:** Chris
