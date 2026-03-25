
import pymssql
import re

server = 'localhost'
user = 'sa'
password = 'YourStrong@Passw0rd'
database = 'IntegrationService'

with open('src/backend/IntegrationService.Infrastructure/Data/Migrations/CreateAdminPortalTables.sql', 'r') as f:
    sql_content = f.read()

# Split by GO (case insensitive, with optional whitespace)
parts = re.split(r'(?i)\n\s*GO\s*\n', sql_content)

try:
    conn = pymssql.connect(server, user, password, database)
    conn.autocommit(True)
    cursor = conn.cursor()
    
    for i, part in enumerate(parts):
        part = part.strip()
        if not part:
            continue
            
        print(f"Executing part {i+1}...")
        try:
            cursor.execute(part)
            # Fetch any messages/results if needed
        except Exception as e:
            print(f"Error in part {i+1}: {e}")
            
    conn.close()
    print("Migration finished!")
except Exception as e:
    print(f"Error connecting to DB: {e}")
