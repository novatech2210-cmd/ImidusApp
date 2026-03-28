#!/bin/bash

echo "Testing admin login..."

curl -s -X POST http://localhost:5004/api/auth/admin-login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@imidus.com","password":"Admin123"}' \
  | jq '.'
