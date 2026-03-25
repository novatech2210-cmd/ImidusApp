
import pymssql

server = 'localhost'
user = 'sa'
password = 'YourStrong@Passw0rd'
database = 'IntegrationService'

try:
    conn = pymssql.connect(server, user, password, database)
    cursor = conn.cursor(as_dict=True)
    
    print("--- Users Table ---")
    cursor.execute("SELECT ID, Email, CustomerID FROM Users")
    for row in cursor.fetchall():
        print(row)
        
    print("\n--- AdminUsers Table ---")
    try:
        cursor.execute("SELECT Id, Email, RoleId FROM AdminUsers")
        for row in cursor.fetchall():
            print(row)
    except Exception as e:
        print(f"Error querying AdminUsers: {e}")
        
    conn.close()
except Exception as e:
    print(f"Error connecting to DB: {e}")
