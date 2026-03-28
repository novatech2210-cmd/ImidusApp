#!/bin/bash

# Get login token
echo "=== Getting admin token ==="
RESPONSE=$(curl -s -X POST http://localhost:5004/api/auth/admin-login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@imidus.com","password":"Admin123"}')

TOKEN=$(echo $RESPONSE | jq -r '.data.token')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Failed to get token"
  echo $RESPONSE | jq '.'
  exit 1
fi

echo "✓ Got token: ${TOKEN:0:50}..."

# Test menu overrides endpoint
echo ""
echo "=== Testing Menu Overrides Endpoint ==="
curl -s http://localhost:5004/api/admin/menu/overrides \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.'

# Test orders endpoint
echo ""
echo "=== Testing Orders Endpoint ==="
curl -s http://localhost:5004/api/admin/orders/queue \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.'

# Test dashboard
echo ""
echo "=== Testing Dashboard Endpoint ==="
curl -s http://localhost:5004/api/admin/dashboard/summary \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.'
