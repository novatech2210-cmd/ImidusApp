
import pyodbc

conn_str = "Driver={ODBC Driver 18 for SQL Server};Server=localhost,1433;Database=IntegrationService;Uid=sa;Pwd=YourStrong@Passw0rd;Encrypt=no;TrustServerCertificate=yes"

try:
    conn = pyodbc.connect(conn_str)
    cursor = conn.cursor()
    
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
