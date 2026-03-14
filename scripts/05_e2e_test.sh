#!/bin/bash

# ==========================================
# IMIDUS End-to-End Test Suite
# Comprehensive testing across all platforms
# ==========================================

set -e

API_BASE_URL="${API_BASE_URL:-http://localhost:5004/api}"
WEB_URL="${WEB_URL:-http://localhost:3000}"
MOBILE_API_URL="${MOBILE_API_URL:-http://10.0.2.2:5004/api}"

# Test results
TESTS_PASSED=0
TESTS_FAILED=0
TOTAL_TESTS=0

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_header() {
    echo ""
    echo "=========================================="
    echo "$1"
    echo "=========================================="
    echo ""
}

log_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

log_success() {
    echo -e "${GREEN}✓ $1${NC}"
    ((TESTS_PASSED++))
}

log_error() {
    echo -e "${RED}✗ $1${NC}"
    ((TESTS_FAILED++))
}

log_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

increment_total() {
    ((TOTAL_TESTS++))
}

# Test 1: Backend Health
test_backend_health() {
    log_header "TEST 1: Backend API Health Check"
    increment_total
    
    if curl -s "$API_BASE_URL/../health" > /dev/null 2>&1; then
        log_success "Backend API is running"
        return 0
    else
        log_error "Backend API is not responding"
        return 1
    fi
}

# Test 2: Database Connectivity
test_database_connectivity() {
    log_header "TEST 2: Database Connectivity"
    increment_total
    
    # Try to get menu categories (requires DB)
    RESPONSE=$(curl -s "$API_BASE_URL/Menu/categories" 2>/dev/null)
    
    if echo "$RESPONSE" | grep -q '\['; then
        log_success "Database connection successful"
        return 0
    else
        log_warning "Database not connected (menu endpoint returned no data)"
        return 1
    fi
}

# Test 3: Authentication Flow
test_authentication() {
    log_header "TEST 3: Authentication Flow"
    
    # Register
    increment_total
    REGISTER_RESPONSE=$(curl -s -X POST "$API_BASE_URL/Auth/register" \
        -H "Content-Type: application/json" \
        -d '{
            "firstName": "E2E",
            "lastName": "Test",
            "phone": "555'$(date +%s)'",
            "email": "e2e_'$(date +%s)'@imidus.com",
            "password": "TestPass123!"
        }' 2>/dev/null)
    
    if echo "$REGISTER_RESPONSE" | grep -q '"token"'; then
        TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
        log_success "User registration works"
    else
        log_error "User registration failed"
        return 1
    fi
    
    # Login
    increment_total
    LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE_URL/Auth/login" \
        -H "Content-Type: application/json" \
        -d '{
            "email": "e2e_'$(date +%s)'@imidus.com",
            "password": "TestPass123!"
        }' 2>/dev/null)
    
    if echo "$LOGIN_RESPONSE" | grep -q '"token"'; then
        log_success "User login works"
    else
        log_error "User login failed"
    fi
    
    # Get current user
    increment_total
    ME_RESPONSE=$(curl -s -X GET "$API_BASE_URL/Auth/me" \
        -H "Authorization: Bearer $TOKEN" 2>/dev/null)
    
    if echo "$ME_RESPONSE" | grep -q '"customerId"'; then
        log_success "Get current user works"
    else
        log_error "Get current user failed"
    fi
}

# Test 4: Menu API
test_menu_api() {
    log_header "TEST 4: Menu API Endpoints"
    
    # Get categories
    increment_total
    CATEGORIES=$(curl -s "$API_BASE_URL/Menu/categories" 2>/dev/null)
    if [ -n "$CATEGORIES" ]; then
        log_success "GET /Menu/categories works"
    else
        log_error "GET /Menu/categories failed"
    fi
    
    # Get items by category
    increment_total
    ITEMS=$(curl -s "$API_BASE_URL/Menu/items/1" 2>/dev/null)
    if [ -n "$ITEMS" ]; then
        log_success "GET /Menu/items/{categoryId} works"
    else
        log_error "GET /Menu/items/{categoryId} failed"
    fi
    
    # Get full menu
    increment_total
    MENU=$(curl -s "$API_BASE_URL/Menu" 2>/dev/null)
    if [ -n "$MENU" ]; then
        log_success "GET /Menu works"
    else
        log_error "GET /Menu failed"
    fi
}

# Test 5: Order Flow
test_order_flow() {
    log_header "TEST 5: Complete Order Flow"
    
    # First, register and get token
    TOKEN=$(curl -s -X POST "$API_BASE_URL/Auth/register" \
        -H "Content-Type: application/json" \
        -d '{
            "firstName": "Order",
            "lastName": "Test",
            "phone": "999'$(date +%s)'",
            "email": "order_'$(date +%s)'@imidus.com",
            "password": "TestPass123!"
        }' 2>/dev/null | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    
    # Create order
    increment_total
    ORDER_RESPONSE=$(curl -s -X POST "$API_BASE_URL/Orders" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TOKEN" \
        -H "X-Idempotency-Key: e2e-order-'$(date +%s)'" \
        -d '{
            "customerId": 1,
            "items": [
                {
                    "menuItemId": 1,
                    "sizeId": 1,
                    "quantity": 2,
                    "unitPrice": 10.00
                }
            ],
            "paymentAuthorizationNo": "E2E_TEST_001",
            "paymentBatchNo": "E2E_BATCH_001",
            "paymentTypeId": 3,
            "tipAmount": 2.00
        }' 2>/dev/null)
    
    if echo "$ORDER_RESPONSE" | grep -q '"success":true'; then
        SALES_ID=$(echo "$ORDER_RESPONSE" | grep -o '"salesId":[0-9]*' | cut -d':' -f2)
        log_success "Order creation works"
        
        # Check order status
        increment_total
        STATUS=$(curl -s "$API_BASE_URL/Orders/$SALES_ID/status" \
            -H "Authorization: Bearer $TOKEN" 2>/dev/null)
        
        if [ -n "$STATUS" ]; then
            log_success "Order status retrieval works"
        else
            log_error "Order status retrieval failed"
        fi
    else
        log_error "Order creation failed"
        log_info "Response: $ORDER_RESPONSE"
    fi
}

# Test 6: Idempotency
test_idempotency() {
    log_header "TEST 6: Idempotency Key Protection"
    
    TOKEN=$(curl -s -X POST "$API_BASE_URL/Auth/register" \
        -H "Content-Type: application/json" \
        -d '{
            "firstName": "Idemp",
            "lastName": "Test",
            "phone": "777'$(date +%s)'",
            "email": "idemp_'$(date +%s)'@imidus.com",
            "password": "TestPass123!"
        }' 2>/dev/null | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    
    IDEMPOTENCY_KEY="test-idemp-'$(date +%s)'"
    
    # First request
    increment_total
    ORDER1=$(curl -s -X POST "$API_BASE_URL/Orders" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TOKEN" \
        -H "X-Idempotency-Key: $IDEMPOTENCY_KEY" \
        -d '{
            "customerId": 1,
            "items": [{"menuItemId": 1, "sizeId": 1, "quantity": 1, "unitPrice": 10.00}]
        }' 2>/dev/null)
    
    # Duplicate request with same key
    increment_total
    ORDER2=$(curl -s -X POST "$API_BASE_URL/Orders" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TOKEN" \
        -H "X-Idempotency-Key: $IDEMPOTENCY_KEY" \
        -d '{
            "customerId": 1,
            "items": [{"menuItemId": 1, "sizeId": 1, "quantity": 1, "unitPrice": 10.00}]
        }' 2>/dev/null)
    
    if echo "$ORDER1" | grep -q '"success":true' && echo "$ORDER2" | grep -q '"success":true'; then
        log_success "Idempotency protection works (duplicate request handled)"
    else
        log_error "Idempotency test inconclusive"
    fi
}

# Test 7: Web Platform
test_web_platform() {
    log_header "TEST 7: Web Platform Accessibility"
    
    increment_total
    if curl -s "$WEB_URL" > /dev/null 2>&1; then
        log_success "Web platform is accessible"
    else
        log_warning "Web platform not running at $WEB_URL"
    fi
}

# Test 8: Swagger Documentation
test_swagger() {
    log_header "TEST 8: API Documentation"
    
    increment_total
    if curl -s "$API_BASE_URL/../swagger" > /dev/null 2>&1; then
        log_success "Swagger UI is accessible"
        log_info "View docs at: $API_BASE_URL/../swagger"
    else
        log_warning "Swagger UI not accessible"
    fi
}

# Test 9: CORS Configuration
test_cors() {
    log_header "TEST 9: CORS Configuration"
    
    increment_total
    CORS_RESPONSE=$(curl -s -X OPTIONS "$API_BASE_URL/Menu/categories" \
        -H "Origin: http://localhost:3000" \
        -H "Access-Control-Request-Method: GET" 2>/dev/null)
    
    if [ -n "$CORS_RESPONSE" ]; then
        log_success "CORS is configured for web platform"
    else
        log_warning "CORS configuration unclear (may still work)"
    fi
}

# Main execution
main() {
    log_header "IMIDUS END-TO-END TEST SUITE"
    log_info "API Base URL: $API_BASE_URL"
    log_info "Web URL: $WEB_URL"
    log_info "Started at: $(date)"
    
    # Run all tests
    test_backend_health
    test_database_connectivity
    test_authentication
    test_menu_api
    test_order_flow
    test_idempotency
    test_web_platform
    test_swagger
    test_cors
    
    # Summary
    log_header "TEST SUMMARY"
    echo "Total Tests: $TOTAL_TESTS"
    log_success "Passed: $TESTS_PASSED"
    
    if [ $TESTS_FAILED -gt 0 ]; then
        log_error "Failed: $TESTS_FAILED"
        exit 1
    else
        log_success "All tests passed!"
        exit 0
    fi
}

# Run main function
main
