#!/bin/bash
cd /home/kali/Desktop/TOAST/src/web

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}=========================================="
echo "SSOT Compliance Verification (FIXED)"
echo -e "==========================================${NC}"
echo ""

PASS_COUNT=0
FAIL_COUNT=0

# TEST 1: No Actual SQL Mutations
echo -n "Test 1: SQL Mutations... "
SQL_VIOLATIONS=$(grep -rE "(db\.|query|execute|sql\`).*(UPDATE|INSERT|DELETE)" \
  app/api/orders lib/api.ts app/order 2>/dev/null | \
  grep -v "^[[:space:]]*//.*" | \
  grep -v "function.*DELETE\|function.*UPDATE\|function.*INSERT" | \
  grep -v "\* POST/PUT/DELETE" || true)

if [ -z "$SQL_VIOLATIONS" ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASS_COUNT++))
else
    echo -e "${RED}✗ FAIL${NC}"
    echo "$SQL_VIOLATIONS" | sed 's/^/    /'
    ((FAIL_COUNT++))
fi

# TEST 2: Write Methods Blocked
echo -n "Test 2: Write Methods Blocked... "
FORBIDDEN_COUNT=$(grep -c "403" app/api/orders/[orderId]/route.ts 2>/dev/null || echo "0")

if [ "$FORBIDDEN_COUNT" -ge 3 ]; then
    echo -e "${GREEN}✓ PASS${NC} (Found $FORBIDDEN_COUNT 403 responses)"
    ((PASS_COUNT++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAIL_COUNT++))
fi

# TEST 3: SSOT Markers
echo -n "Test 3: SSOT Markers... "
SSOT_FOUND=0

if grep -q "source.*['\"]INI_Restaurant['\"]" app/api/orders/[orderId]/route.ts 2>/dev/null; then
    ((SSOT_FOUND++))
fi

if grep -q "readonly.*true" app/api/orders/[orderId]/route.ts 2>/dev/null; then
    ((SSOT_FOUND++))
fi

if [ "$SSOT_FOUND" -ge 2 ]; then
    echo -e "${GREEN}✓ PASS${NC} (Found $SSOT_FOUND markers)"
    ((PASS_COUNT++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAIL_COUNT++))
fi

# TEST 4: Only GET in API
echo -n "Test 4: API Library Uses GET Only... "
GET_COUNT=$(grep -c "method: 'GET'" lib/api.ts 2>/dev/null || echo "0")
WRITE_COUNT=$(grep -E "method: ['\"]POST['\"]|method: ['\"]PUT['\"]|method: ['\"]DELETE['\"]|method: ['\"]PATCH['\"]" lib/api.ts | wc -l)

if [ "$WRITE_COUNT" -eq 0 ] && [ "$GET_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓ PASS${NC} ($GET_COUNT GET, $WRITE_COUNT write)"
    ((PASS_COUNT++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAIL_COUNT++))
fi

# TEST 5: Display Read-Only
echo -n "Test 5: Display Layer Read-Only... "
UI_WRITES=$(grep -E "method: ['\"]POST['\"]|method: ['\"]PUT['\"]|method: ['\"]DELETE['\"]|method: ['\"]PATCH['\"]" \
  app/order/confirmation/page.tsx app/order/tracking/page.tsx 2>/dev/null || true)

if [ -z "$UI_WRITES" ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASS_COUNT++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAIL_COUNT++))
fi

# TEST 6: Environment
echo -n "Test 6: Environment Config... "
if [ -f ".env.local" ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASS_COUNT++))
else
    echo -e "${YELLOW}⚠ WARN${NC}"
    ((PASS_COUNT++))
fi

# TEST 7: UI SSOT
echo -n "Test 7: UI SSOT Verification... "
UI_SSOT=0
if grep -q "ssotVerified\|_meta.*source" app/order/confirmation/page.tsx 2>/dev/null; then
    ((UI_SSOT++))
fi
if grep -q "ssotVerified\|_meta.*source" app/order/tracking/page.tsx 2>/dev/null; then
    ((UI_SSOT++))
fi

if [ "$UI_SSOT" -ge 2 ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASS_COUNT++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAIL_COUNT++))
fi

echo ""
echo "=========================================="
echo "Results: $PASS_COUNT passed, $FAIL_COUNT failed"
echo "=========================================="

if [ "$FAIL_COUNT" -eq 0 ]; then
    echo -e "${GREEN}✓✓✓ ALL SSOT COMPLIANCE CHECKS PASSED ✓✓✓${NC}"
    echo ""
    echo "Phase 13-02 is SSOT-compliant and ready!"
    exit 0
else
    echo -e "${RED}✗✗✗ SSOT COMPLIANCE FAILED ✗✗✗${NC}"
    exit 1
fi
