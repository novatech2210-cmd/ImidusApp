# IMIDUS Platform - Test Credentials

## User Accounts

### Test Customer

| Field | Value |
|-------|-------|
| Email | test@imidus.com |
| Password | Test123! |
| Customer ID | 1 |
| Loyalty Points | 150 |

### Admin User

| Field | Value |
|-------|-------|
| Email | admin@imidus.com |
| Password | Admin123! |
| Role | Administrator |
| Access | Full merchant portal |

---

## Database

### SQL Server (Docker)

| Property | Value |
|----------|-------|
| Host | localhost |
| Port | 1433 |
| Username | sa |
| Password | YourStrong@Passw0rd123 |
| POS Database | INI_Restaurant |
| Backend Database | IntegrationService |

**Connection String:**
```
Server=localhost,1433;Database=INI_Restaurant;User Id=sa;Password=YourStrong@Passw0rd123;TrustServerCertificate=True;
```

---

## Payment Gateway (Authorize.net)

### Sandbox Credentials

| Property | Value |
|----------|-------|
| Environment | Sandbox |
| API Login ID | `(configure in .env)` |
| Transaction Key | `(configure in .env)` |

### Test Card Numbers

| Card Type | Number | CVV | Expiry |
|-----------|--------|-----|--------|
| Visa | 4111111111111111 | 123 | Any future |
| MasterCard | 5424000000000015 | 123 | Any future |
| Amex | 370000000000002 | 1234 | Any future |
| Discover | 6011000000000012 | 123 | Any future |

### Test Responses

| Amount | Result |
|--------|--------|
| Any amount | Approved (sandbox mode) |
| Amount ending in .01 | Declined |
| Amount ending in .02 | Call issuer |

---

## Firebase (Push Notifications)

### Configuration

1. Create project at https://console.firebase.google.com
2. Download service account key
3. Rename to `firebase-admin-key.json`
4. Place in `backend/api/` directory

**FCM Test Token:**
```
(Generate from mobile app or use Firebase Console test messaging)
```

---

## API Authentication

### JWT Token (Development)

**Secret:** `YourSuperSecretKeyAtLeast32CharactersLong`

**Token Settings:**
| Property | Value |
|----------|-------|
| Issuer | IMIDUS |
| Audience | IMIDUS-Clients |
| Expiry | 1440 minutes (24 hours) |

### Sample Token Request

```bash
curl -X POST http://localhost:5004/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@imidus.com","password":"Test123!"}'
```

---

## Service URLs

### Development

| Service | URL |
|---------|-----|
| Web App | http://localhost:3000 |
| Admin Portal | http://localhost:3000/merchant |
| API | http://localhost:5004 |
| Swagger | http://localhost:5004/swagger |
| Health | http://localhost:5004/health |
| Adminer (DB GUI) | http://localhost:8080 |

### Docker Network (Internal)

| Service | Internal URL |
|---------|--------------|
| SQL Server | sqlserver:1433 |
| API | api:8080 |
| Nginx | nginx:80 |

---

## Important Notes

1. **Change all passwords** before production deployment
2. **Never commit** credentials to version control
3. **Rotate secrets** regularly
4. **Use environment variables** for all sensitive values
5. **Enable HTTPS** in production

---

## Production Checklist

Before going live, update these credentials:

- [ ] SA_PASSWORD (strong, unique)
- [ ] JWT_SECRET (random 64+ characters)
- [ ] Authorize.net (production credentials)
- [ ] Firebase (production project)
- [ ] SSL certificates
- [ ] Remove test accounts or change passwords
