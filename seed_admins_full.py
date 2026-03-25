
import hashlib
import pymssql

def hash_password(password):
    m = hashlib.sha256()
    m.update(password.encode('utf-8'))
    return m.hexdigest().lower()

server = 'localhost'
user = 'sa'
password = 'YourStrong@Passw0rd'
database = 'IntegrationService'

try:
    conn = pymssql.connect(server, user, password, database)
    conn.autocommit(True)
    cursor = conn.cursor()
    
    print("Seeding AdminRoles...")
    roles = [
        ('SuperAdmin', 'Full access', '["*"]'),
        ('Manager', 'Management', '["orders.read", "orders.write"]'),
        ('Cashier', 'Processing', '["orders.read"]')
    ]
    for name, desc, perms in roles:
        cursor.execute("IF NOT EXISTS (SELECT 1 FROM AdminRoles WHERE Name = %s) "
                       "INSERT INTO AdminRoles (Name, Description, Permissions) VALUES (%s, %s, %s)",
                       (name, name, desc, perms))
                       
    print("Fetching SuperAdmin RoleId...")
    cursor.execute("SELECT Id FROM AdminRoles WHERE Name = 'SuperAdmin'")
    role_id = cursor.fetchone()[0]
    
    users = [
        ('admin@example.com', 'Admin', 'User'),
        ('e2e_3@example.com', 'E2E', 'Tester'),
        ('admin@imidus.com', 'Super', 'Admin')
    ]
    
    test_password = 'Password123!'
    hashed_pw = hash_password(test_password)
    
    for email, first, last in users:
        print(f"Seeding admin {email}...")
        cursor.execute("IF NOT EXISTS (SELECT 1 FROM AdminUsers WHERE Email = %s) "
                       "INSERT INTO AdminUsers (Email, PasswordHash, FirstName, LastName, RoleId, IsActive, CreatedAt, UpdatedAt) "
                       "VALUES (%s, %s, %s, %s, %d, 1, GETDATE(), GETDATE())",
                       (email, email, hashed_pw, first, last, role_id))
        
    conn.close()
    print("Finished seeding!")
except Exception as e:
    print(f"Error seeding: {e}")
