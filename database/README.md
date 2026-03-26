# POS Database Integration Module

This module handles connectivity verification and schema analysis for the IMIDUS Restaurant POS system.

## Features
- **Connectivity Verification**: Checks connection to SQL Server and presence of all required POS tables.
- **Backup Analysis**: Analyzes `.bak` files to confirm logical file structure and version compatibility.
- **Environment Driven**: Configurable via `.env`.

## Table Checklist
- [x] `tblSales`
- [x] `tblItem`
- [x] `tblCategory`
- [x] `tblTable`
- [x] `tblCustomer`
- [x] `tblUser`
- [x] `tblAvailableSize`
- [x] `tblSize`
- [x] `tblPayment`

## Usage

### Test Live Connection
```bash
node database/connection.js
```

### Analyze SQL Server Backup
```bash
node database/schema-analyzer.js <backup-path-on-sql-server-host>
```
*Note: If running in Docker, ensure the backup file is copied into the container (e.g., `/var/opt/mssql/`).*

## Safety Protocols
1. **Idempotency**: All write operations in the POS database are protected via the IntegrationService middleware.
2. **Concurrency**: SQL Server transactions ensure ACID compliance during order processing.
3. **Read-Only Verification**: The `connection.js` script performs read-only checks for table presence.
