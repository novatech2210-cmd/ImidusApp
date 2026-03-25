
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

users = [
    ('admin@example.com', 'Admin', 'User'),
    ('e2e_3@example.com', 'E2E', 'Tester'),
    ('admin@imidus.com', 'Super', 'Admin')
]

# Use a default test password
test_password = 'Password123!'
hashed_pw = hash_password(test_password)

try:
    conn = pymssql.connect(server, user, password, database)
    conn.autocommit(True)
    cursor = conn.cursor()
    
    # Get SuperAdmin RoleId
    cursor.execute("SELECT Id FROM AdminRoles WHERE Name = 'SuperAdmin'")
    role_id = cursor.fetchone()[0]
    
    for email, first, last in users:
        print(f"Seeding {email}...")
        cursor.execute("IF NOT EXISTS (SELECT 1 FROM AdminUsers WHERE Email = %s) "
                       "INSERT INTO AdminUsers (Email, PasswordHash, FirstName, LastName, RoleId, IsActive, CreatedAt, UpdatedAt) "
                       "VALUES (%s, %s, %s, %s, %d, 1, GETDATE(), GETDATE())",
                       (email, email, hashed_pw, first, last, role_id))
        
    conn.close()
    print("Seeding finished!")
except Exception as e:
    print(f"Error seeding: {e}")
