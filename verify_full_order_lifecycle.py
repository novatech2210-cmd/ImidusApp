import requests
import json
import uuid
import time
import pymssql
import sys

BASE_URL = "http://localhost:5004/api"
DB_CONFIG = {
    'server': '127.0.0.1',
    'user': 'sa',
    'password': 'ToastSQL@2025!',
    'database': 'INI_Restaurant',
    'port': 1433
}

def get_db_connection():
    return pymssql.connect(**DB_CONFIG)

def verify_order_in_db(sales_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check tblSales
    cursor.execute("SELECT TransType, SubTotal FROM tblSales WHERE ID = %d", (sales_id,))
    sale = cursor.fetchone()
    if not sale:
        print(f"❌ SalesID {sales_id} not found in tblSales")
        return False
    
    trans_type = sale[0]
    print(f"✅ Order found in tblSales. TransType: {trans_type}")
    
    # Check tblPendingOrders
    cursor.execute("SELECT ItemID, ItemName FROM tblPendingOrders WHERE SalesID = %d", (sales_id,))
    items = cursor.fetchall()
    print(f"✅ Found {len(items)} items in tblPendingOrders")
    for item in items:
        print(f"   - {item[1]} (ItemID: {item[0]})")
    
    conn.close()
    return trans_type == 2 # 2 = Open/Pending

def verify_completion_in_db(sales_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check tblSales TransType should be 1
    cursor.execute("SELECT TransType FROM tblSales WHERE ID = %d", (sales_id,))
    sale = cursor.fetchone()
    if sale[0] != 1:
        print(f"❌ Order {sales_id} TransType is {sale[0]}, expected 1 (Completed)")
        return False
    
    # Check tblPendingOrders should be empty
    cursor.execute("SELECT COUNT(*) FROM tblPendingOrders WHERE SalesID = %d", (sales_id,))
    pending_count = cursor.fetchone()[0]
    if pending_count != 0:
        print(f"❌ tblPendingOrders still has {pending_count} items for SalesID {sales_id}")
        return False
    
    # Check tblSalesDetail should have items
    cursor.execute("SELECT COUNT(*) FROM tblSalesDetail WHERE SalesID = %d", (sales_id,))
    detail_count = cursor.fetchone()[0]
    if detail_count == 0:
        print(f"❌ tblSalesDetail has 0 items for SalesID {sales_id}")
        return False
    
    # Check tblPayment
    cursor.execute("SELECT COUNT(*) FROM tblPayment WHERE SalesID = %d", (sales_id,))
    payment_count = cursor.fetchone()[0]
    if payment_count == 0:
        print(f"❌ tblPayment has 0 records for SalesID {sales_id}")
        return False
    
    print(f"✅ Lifecycle complete! Order {sales_id} fully processed and paid.")
    conn.close()
    return True

def run_e2e_test():
    print("--- Starting Full Order Lifecycle E2E Test ---")
    
    # 1. Create Order
    print("\n1. Creating Order...")
    idempotency_key = str(uuid.uuid4())
    payload = {
        "customerId": 1,
        "items": [
            {
                "menuItemId": 1,
                "sizeId": 1,
                "quantity": 2,
                "unitPrice": 3.99
            }
        ],
        "tipAmount": 1.0,
        "paymentTypeId": 3,
        "isTakeout": True
    }
    
    resp = requests.post(f"{BASE_URL}/orders", json=payload, headers={"X-Idempotency-Key": idempotency_key})
    if resp.status_code != 200:
        print(f"❌ Order creation failed: {resp.text}")
        return
    
    data = resp.json()
    sales_id = data['salesId']
    print(f"✅ Order created! SalesID: {sales_id}")
    
    # 2. Verify Initial DB State
    print("\n2. Verifying Initial DB State...")
    if not verify_order_in_db(sales_id):
        print("❌ DB verification failed")
        return
    
    # 3. Complete Payment
    print(f"\n3. Completing Payment for SalesID {sales_id}...")
    payment_payload = {
        "token": {
            "dataDescriptor": "COMMON.ACCEPT.INAPP.PAYMENT",
            "dataValue": "MOCK_TOKEN_SUCCESS"
        },
        "amount": 8.98,
        "salesId": sales_id,
        "customerId": 1
    }
    
    payment_idempotency_key = str(uuid.uuid4())
    resp = requests.post(
        f"{BASE_URL}/orders/{sales_id}/complete-payment", 
        json=payment_payload,
        headers={"X-Idempotency-Key": payment_idempotency_key}
    )
    if resp.status_code != 200:
        print(f"❌ Payment failed: {resp.text}")
        return
    
    print("✅ Payment API call succeeded")
    
    # 4. Verify Final DB State
    print("\n4. Verifying Final DB State...")
    if not verify_completion_in_db(sales_id):
        print("❌ Final DB verification failed")
        return

    print("\n🎉 E2E TEST PASSED!")

if __name__ == "__main__":
    run_e2e_test()
