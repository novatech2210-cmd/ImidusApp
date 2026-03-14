#!/bin/bash
# scripts/deploy-web.sh

set -e

echo "Starting unified web deployment..."

# 1. Customer Ordering Site
echo "Building customer ordering site..."
cd src/web/imidus-ordering
npm install
npm run build
tar -czf customer-build.tar.gz .next/ public/ package.json
aws s3 cp customer-build.tar.gz s3://inirestaurant/novatech/web/customer-ordering/build.tar.gz

# 2. Admin Portal
echo "Building admin portal..."
cd ../imidus-admin
npm install
npm run build
tar -czf admin-build.tar.gz .next/ public/ package.json
aws s3 cp admin-build.tar.gz s3://inirestaurant/novatech/web/admin-portal/build.tar.gz

echo "Unified deployment complete!"
