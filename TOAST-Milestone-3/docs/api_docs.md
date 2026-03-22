# IMIDUS POS Integration API Documentation

## Base URL

- Development: `http://localhost:5004`
- Production: `https://api.yourdomain.com`

## Authentication

The API uses JWT Bearer tokens for authentication.

### Obtain Token

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "test@imidus.com",
  "password": "Test123!"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 1440,
  "customer": {
    "id": 1,
    "firstName": "Test",
    "lastName": "User",
    "email": "test@imidus.com",
    "earnedPoints": 150
  }
}
```

### Use Token

Include in all authenticated requests:
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

---

## Endpoints

### Health Check

```http
GET /health
```

Returns service health status with database connectivity.

---

### Menu

#### Get All Categories

```http
GET /api/menu/categories
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Appetizers",
    "displayOrder": 1
  },
  {
    "id": 2,
    "name": "Entrees",
    "displayOrder": 2
  }
]
```

#### Get Items by Category

```http
GET /api/menu/items?categoryId=1
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Spring Rolls",
    "description": "Crispy vegetable rolls",
    "categoryId": 1,
    "sizes": [
      {
        "sizeId": 1,
        "sizeName": "Regular",
        "price": 8.99,
        "available": true
      }
    ],
    "imageUrl": null,
    "isAlcohol": false,
    "onlineEnabled": true
  }
]
```

#### Get Item Details

```http
GET /api/menu/items/{itemId}
```

---

### Cart & Orders

#### Create Order

```http
POST /api/orders
Content-Type: application/json
Authorization: Bearer {token}
X-Idempotency-Key: {unique-key}

{
  "customerId": 1,
  "items": [
    {
      "itemId": 1,
      "sizeId": 1,
      "quantity": 2,
      "specialInstructions": "No onions"
    }
  ],
  "orderType": "Pickup",
  "scheduledTime": null,
  "paymentMethod": "Card",
  "paymentToken": "tok_xxx"
}
```

**Response:**
```json
{
  "orderId": 12345,
  "orderNumber": "ONL-001",
  "status": "Received",
  "subtotal": 17.98,
  "tax": 1.08,
  "total": 19.06,
  "estimatedReadyTime": "2026-03-19T17:30:00Z"
}
```

#### Get Order Status

```http
GET /api/orders/{orderId}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "orderId": 12345,
  "status": "Preparing",
  "items": [...],
  "subtotal": 17.98,
  "tax": 1.08,
  "total": 19.06,
  "createdAt": "2026-03-19T17:00:00Z",
  "estimatedReadyTime": "2026-03-19T17:30:00Z"
}
```

#### Get Order History

```http
GET /api/orders/history
Authorization: Bearer {token}
```

---

### Customers

#### Register

```http
POST /api/customers/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "phone": "555-1234"
}
```

#### Get Profile

```http
GET /api/customers/profile
Authorization: Bearer {token}
```

#### Update Profile

```http
PUT /api/customers/profile
Authorization: Bearer {token}
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "555-5678"
}
```

#### Get Loyalty Points

```http
GET /api/customers/loyalty
Authorization: Bearer {token}
```

**Response:**
```json
{
  "earnedPoints": 150,
  "availablePoints": 120,
  "pendingPoints": 30,
  "pointValue": 0.40,
  "recentTransactions": [
    {
      "date": "2026-03-15",
      "description": "Order #ONL-095",
      "points": 15,
      "type": "Earned"
    }
  ]
}
```

---

### Payments

#### Process Payment

```http
POST /api/payments/process
Authorization: Bearer {token}
Content-Type: application/json

{
  "orderId": 12345,
  "paymentToken": "tok_xxx",
  "amount": 19.06
}
```

**Note:** Payment tokens are obtained client-side using Authorize.net Accept.js SDK.

---

### Upselling

#### Get Suggestions

```http
POST /api/upsell/suggestions
Content-Type: application/json

{
  "cartItems": [1, 5, 10]
}
```

**Response:**
```json
{
  "suggestions": [
    {
      "itemId": 15,
      "name": "Chocolate Cake",
      "price": 6.99,
      "reason": "Popular with your selections"
    }
  ]
}
```

---

### Admin Endpoints

**Require admin authentication**

#### Get All Orders (Admin)

```http
GET /api/admin/orders?status=Pending&page=1&limit=20
Authorization: Bearer {admin-token}
```

#### Update Order Status

```http
PATCH /api/orders/{orderId}/status
Authorization: Bearer {admin-token}
Content-Type: application/json

{
  "status": "Ready",
  "estimatedReadyTime": "2026-03-19T17:45:00Z"
}
```

#### Manage Banners

```http
GET /api/admin/banners
POST /api/admin/banners
PUT /api/admin/banners/{id}
DELETE /api/admin/banners/{id}
```

#### Manage Upsell Rules

```http
GET /api/admin/upsell-rules
POST /api/admin/upsell-rules
PUT /api/admin/upsell-rules/{id}
DELETE /api/admin/upsell-rules/{id}
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid item quantity",
    "details": {
      "field": "items[0].quantity",
      "constraint": "Must be greater than 0"
    }
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `DUPLICATE_REQUEST` | 409 | Idempotency key reused |
| `PAYMENT_FAILED` | 402 | Payment processing failed |
| `SERVER_ERROR` | 500 | Internal server error |

---

## Idempotency

All POST/PUT/PATCH requests that modify data support idempotency keys:

```http
X-Idempotency-Key: unique-request-id-12345
```

Keys are valid for 24 hours. Duplicate requests return the original response.

---

## Rate Limiting

- 100 requests per minute per IP
- 1000 requests per hour per authenticated user
- Headers included in response:
  - `X-RateLimit-Limit`
  - `X-RateLimit-Remaining`
  - `X-RateLimit-Reset`

---

## Interactive Documentation

Access Swagger UI for interactive API testing:

```
http://localhost:5004/swagger
```
