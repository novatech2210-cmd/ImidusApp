#!/usr/bin/env python3
"""
Execute overlay database schema for upselling rules
"""
import pymssql
import os
import sys

# Overlay database connection string
OVERLAY_DB_URL = os.environ.get('OVERLAY_DATABASE_URL', '')
if not OVERLAY_DB_URL:
    print("ERROR: OVERLAY_DATABASE_URL environment variable not set")
    sys.exit(1)

# Parse connection string (simplified parsing)
# Format: Server=localhost,1434;Database=IntegrationService;User Id=sa;Password=ToastSQL@2025!;Encrypt=false;TrustServerCertificate=true;Connection Timeout=30;
def parse_connection_string(conn_str):
    parts = {}
    for part in conn_str.split(';'):
        if '=' in part:
            key, value = part.split('=', 1)
            parts[key.strip().lower()] = value.strip()
    return parts

conn_parts = parse_connection_string(OVERLAY_DB_URL)

# Extract connection parameters
server = conn_parts.get('server', 'localhost,1434')
database = conn_parts.get('database', 'IntegrationService')
user = conn_parts.get('user id', 'sa')
password = conn_parts.get('password', '')

# Parse server string to get host and port
if ',' in server:
    host, port = server.split(',', 1)
else:
    host = server
    port = 1433  # default SQL Server port

print(f"Connecting to SQL Server at {host}:{port}, database: {database}")

try:
    # First connect to master database to check/create IntegrationService
    print("Connecting to master database...")
    conn_master = pymssql.connect(
        server=host,
        port=int(port),
        user=user,
        password=password,
        database='master'
    )
    
    # Check if IntegrationService database exists
    cursor = conn_master.cursor()
    cursor.execute(f"SELECT name FROM sys.databases WHERE name = '{database}'")
    rows = cursor.fetchall()
    
    conn_master.close()
    
    if not rows:
        print(f"Creating database '{database}'...")
        # CREATE DATABASE cannot be in a transaction, so we need a fresh connection with autocommit
        # or we need to use autocommit mode
        conn_master_create = pymssql.connect(
            server=host,
            port=int(port),
            user=user,
            password=password,
            database='master'
        )
        # Set autocommit
        conn_master_create.autocommit(True)
        cursor_create = conn_master_create.cursor()
        cursor_create.execute(f"CREATE DATABASE {database}")
        cursor_create.close()
        conn_master_create.close()
        print(f"Database '{database}' created successfully")
    else:
        print(f"Database '{database}' already exists")
    
    # Now connect to the IntegrationService database
    print(f"Connecting to {database} database...")
    conn = pymssql.connect(
        server=host,
        port=int(port),
        user=user,
        password=password,
        database=database
    )
    
    print("Connected successfully!")
    
    # Read the SQL schema file
    sql_file = 'src/overlay/schema/upselling.sql'
    with open(sql_file, 'r') as f:
        sql_content = f.read()
    
    print(f"Executing SQL from {sql_file}...")
    
    # Execute the SQL (pymssql doesn't support batch execution directly,
    # so we need to split by GO statements or execute as one batch)
    # For simplicity, we'll execute the entire content
    cursor = conn.cursor()
    
    # Split by GO statements (SQL Server batch separator)
    batches = [batch.strip() for batch in sql_content.split('GO') if batch.strip()]
    
    for i, batch in enumerate(batches):
        print(f"Executing batch {i+1}/{len(batches)}...")
        try:
            cursor.execute(batch)
            conn.commit()
            print(f"  Batch {i+1} completed successfully")
        except Exception as e:
            print(f"  ERROR in batch {i+1}: {e}")
            # Continue with next batch if possible
            conn.rollback()
    
    cursor.close()
    conn.close()
    
    print("Schema execution completed!")
    
except Exception as e:
    print(f"ERROR: {e}")
    sys.exit(1)
