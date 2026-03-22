# IMIDUS Admin Portal

## Important Note

The Admin Portal is **integrated into the main web application** at the `/merchant` routes.

**Do not deploy this folder separately** - it's included for documentation purposes only.

## Admin Routes

Access the admin portal through the main web app:

- Dashboard: `http://localhost:3000/merchant/dashboard`
- Orders: `http://localhost:3000/merchant/orders`
- Customers: `http://localhost:3000/merchant/customers`
- Menu Management: `http://localhost:3000/merchant/menu`
- Marketing Campaigns: `http://localhost:3000/merchant/marketing/campaigns`
- Rewards: `http://localhost:3000/merchant/marketing/rewards`

## Authentication

Admin routes require authentication. Use admin credentials:

- Email: `admin@imidus.com`
- Password: `Admin123!`

## To Start

1. Navigate to `../customer-web/`
2. Run `npm install`
3. Run `npm run dev`
4. Access admin at `http://localhost:3000/merchant`

## API Endpoints (Admin)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/banners` | GET/POST | Banner management |
| `/api/admin/upsell-rules` | GET/POST | Upselling rules |
| `/api/admin/pos` | GET | POS data validation |
| `/api/orders` | GET | Order listing |
