#!/usr/bin/env python3
"""
Authorize.net End-to-End Payment Testing Script
Tests the complete payment flow using standard library only
"""

import http.client
import json
import sys
import uuid
from datetime import datetime

API_BASE_URL = "localhost:5004"

def test_health_check():
    """Test backend API health"""
    print("\n" + "="*60)
    print("TEST 1: Backend API Health Check")
    print("="*60)
    
    try:
        conn = http.client.HTTPConnection(API_BASE_URL, timeout=5)
        conn.request("GET", "/api/Menu/categories")
        response = conn.getresponse()
        
        if response.status == 200:
            data = json.loads(response.read().decode())
            print(f"✅ Backend API is healthy")
            print(f"   Found {len(data)} categories")
            conn.close()
            return True, data
        else:
            print(f"❌ Backend returned status {response.status}")
            conn.close()
            return False, None
    except Exception as e:
        print(f"❌ Backend API error: {e}")
        print(f"   Make sure the backend is running on port 5004")
        return False, None


def test_get_menu_items(categories):
    """Test retrieving menu items with sizes and prices"""
    print("\n" + "="*60)
    print("TEST 2: Menu Items (SSOT Read from POS)")
    print("="*60)
    
    if not categories:
        print("❌ No categories available")
        return False, None
    
    try:
        category_id = categories[0]["categoryId"]
        category_name = categories[0]["name"]
        
        conn = http.client.HTTPConnection(API_BASE_URL, timeout=5)
        conn.request("GET", f"/api/Menu/items/{category_id}")
        response = conn.getresponse()
        
        if response.status == 200:
            items = json.loads(response.read().decode())
            print(f"✅ Retrieved {len(items)} items from category '{category_name}'")
            
            # Display first 3 items with sizes
            for item in items[:3]:
                print(f"\n   📦 {item['name']} (ID: {item['itemId']})")
                if item.get('sizes'):
                    for size in item['sizes'][:2]:  # Show first 2 sizes
                        stock_status = "✓" if size['inStock'] else "✗"
                        print(f"      [{stock_status}] {size['sizeName']}: ${size['price']:.2f}")
            
            conn.close()
            return True, items
        else:
            print(f"❌ Failed to get items: {response.status}")
            conn.close()
            return False, None
    except Exception as e:
        print(f"❌ Error: {e}")
        return False, None


def test_create_order(items):
    """Test order creation with payment"""
    print("\n" + "="*60)
    print("TEST 3: Order Creation (Simulated Payment)")
    print("="*60)
    
    if not items:
        print("❌ No items available for order")
        return False
    
    # Find first item with in-stock size
    test_item = None
    test_size = None
    
    for item in items:
        for size in item.get('sizes', []):
            if size.get('inStock'):
                test_item = item
                test_size = size
                break
        if test_item:
            break
    
    if not test_item:
        print("❌ No in-stock items found")
        return False
    
    print(f"✅ Selected: {test_item['name']} - {test_size['sizeName']} @ ${test_size['price']:.2f}")
    
    # Create order request
    order_request = {
        "customerId": 1,
        "items": [
            {
                "menuItemId": test_item['itemId'],
                "sizeId": test_size['sizeId'],
                "quantity": 1,
                "unitPrice": test_size['price']
            }
        ],
        "paymentAuthorizationNo": "COMMON.ACCEPT.INAPP.PAYMENT" + "_" + str(uuid.uuid4())[:8],
        "paymentBatchNo": "1",
        "paymentTypeId": 3,
        "tipAmount": 0
    }
    
    try:
        conn = http.client.HTTPConnection(API_BASE_URL, timeout=10)
        headers = {
            "Content-Type": "application/json",
            "X-Idempotency-Key": str(uuid.uuid4())
        }
        
        conn.request("POST", "/api/Orders", body=json.dumps(order_request), headers=headers)
        response = conn.getresponse()
        result = json.loads(response.read().decode())
        
        print(f"\n   Response Status: {response.status}")
        print(f"   Success: {result.get('success', False)}")
        
        if result.get('success'):
            print(f"   ✅ Order #{result.get('orderNumber')} created!")
            print(f"   Sales ID: {result.get('salesId')}")
            print(f"   Total: ${result.get('totalAmount', 0):.2f}")
        else:
            print(f"   Message: {result.get('message', 'Unknown')}")
            print(f"   (Note: Simulated tokens may fail - real Accept.js required)")
        
        conn.close()
        return result.get('success', False)
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def print_payment_architecture():
    """Print the payment flow architecture"""
    print("\n" + "="*70)
    print(" AUTHORIZE.NET PAYMENT ARCHITECTURE (SSOT Compliant)")
    print("="*70)
    
    arch = """
┌─────────────────────────────────────────────────────────────────────┐
│ FRONTEND (Next.js) - Web Browser                                      │
│  ├─ Customer enters card in checkout form                             │
│  ├─ Authorize.net Accept.js tokenizes (NO raw card data)              │
│  └─ Sends opaqueData token to backend                                 │
└─────────────────────────┬───────────────────────────────────────────┘
                          │ POST /api/Orders
                          │ { items[], paymentAuthorizationNo: token }
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│ BACKEND (.NET 8) - IntegrationService.API                            │
│  ├─ Validates request + idempotency key                            │
│  ├─ Creates open order: tblSales (TransType=2)                       │
│  ├─ Calls PaymentService.ChargeCardAsync()                           │
│  └─ If success: completes order (TransType=1)                        │
└─────────────────────────┬───────────────────────────────────────────┘
                          │ Authorize.net SDK
                          │ createTransactionController
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│ AUTHORIZE.NET SANDBOX                                                 │
│  ├─ Receives tokenized payment data                                  │
│  ├─ Processes card (test: 4111111111111111)                           │
│  └─ Returns TransactionId + AuthCode                                   │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│ POS DATABASE (INI_Restaurant) - Ground Truth                          │
│  ├─ IF payment success:                                              │
│  │  ├─ tblPayment: Record transaction                                 │
│  │  ├─ tblSales: Update TransType=1                                  │
│  │  └─ tblSalesDetail: Move from tblPendingOrders                    │
│  └─ IF payment fails:                                                │
│     └─ Rollback: Void Authorize.net charge                           │
└─────────────────────────────────────────────────────────────────────┘

SSOT Principles Applied:
✅ Read from POS anytime (menu items, prices, stock)
✅ Write to POS only via backend service (atomic transactions)
✅ Never modify POS schema (works with existing tables)
✅ Never modify POS code (external integration layer)
✅ Overlay data in IntegrationService (scheduled orders, etc.)
    """
    print(arch)


def print_test_cards():
    """Print test card information"""
    print("\n" + "="*70)
    print(" AUTHORIZE.NET SANDBOX TEST CARDS")
    print("="*70)
    
    cards = """
For full browser testing at http://localhost:3000:

✅ SUCCESS (Visa):     4111111111111111  |  MM/YY: 12/25  |  CVV: 123
✅ SUCCESS (MasterCard): 5555555555554444  |  MM/YY: 12/25  |  CVV: 123
✅ SUCCESS (Amex):     378282246310005   |  MM/YY: 12/25  |  CVV: 1234
❌ DECLINE (Visa):    4000000000000002  |  MM/YY: 12/25  |  CVV: 123

Test Flow:
1. Open http://localhost:3000
2. Go to Menu → Select items → Add to Cart
3. Click Cart → Go to Checkout
4. Enter customer information
5. Enter test card details above
6. Complete payment
7. Verify order confirmation page shows order number
    """
    print(cards)


def main():
    print("\n" + "="*70)
    print(" AUTHORIZE.NET END-TO-END PAYMENT TEST SUITE")
    print(" INI_Restaurant POS Integration Service")
    print("="*70)
    print(f"\nAPI Endpoint: http://{API_BASE_URL}/api")
    print(f"Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    results = {}
    
    # Test 1: Health Check
    results['health'], categories = test_health_check()
    
    # Test 2: Menu Items
    if results['health']:
        results['menu'], items = test_get_menu_items(categories)
    else:
        results['menu'] = False
        items = None
    
    # Test 3: Create Order
    if results['menu']:
        results['order'] = test_create_order(items)
    else:
        results['order'] = False
    
    # Print architecture
    print_payment_architecture()
    print_test_cards()
    
    # Summary
    print("\n" + "="*70)
    print(" TEST SUMMARY")
    print("="*70)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"   {test_name.upper():20} {status}")
    
    passed = sum(1 for r in results.values() if r)
    total = len(results)
    
    print(f"\n   Total: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n✅ All backend tests passed!")
        print("\n🌐 Next: Test with real browser at http://localhost:3000")
        print("   Use test card: 4111111111111111")
    else:
        print("\n⚠️ Some tests failed. Check:")
        print("   - Backend running on port 5004: ps aux | grep IntegrationService")
        print("   - SQL Server running: docker ps | grep sqlserver")
    
    return 0 if passed == total else 1


if __name__ == "__main__":
    sys.exit(main())
