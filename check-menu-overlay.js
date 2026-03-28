#!/usr/bin/env node

const sql = require('mssql');

const config = {
  user: 'sa',
  password: 'YourStrong@Passw0rd',
  server: 'localhost',
  database: 'IntegrationService',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true
  },
  port: 1433
};

async function checkMenuOverlay() {
  try {
    console.log('Connecting to IntegrationService database...');
    const pool = await sql.connect(config);

    // Check if MenuOverlay table exists
    console.log('\nChecking if MenuOverlay table exists...');
    const tableCheck = await pool.request().query(`
      SELECT COUNT(*) as TableExists
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_NAME = 'MenuOverlay'
    `);

    const exists = tableCheck.recordset[0].TableExists > 0;

    if (exists) {
      console.log('✓ MenuOverlay table exists');

      // Check table structure
      const columns = await pool.request().query(`
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'MenuOverlay'
        ORDER BY ORDINAL_POSITION
      `);

      console.log('\nTable structure:');
      columns.recordset.forEach(col => {
        console.log(`  - ${col.COLUMN_NAME.padEnd(25)} ${col.DATA_TYPE.padEnd(15)} ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });

      // Check data
      const data = await pool.request().query(`
        SELECT TOP 10 * FROM MenuOverlay
      `);

      console.log(`\nTotal rows: ${data.recordset.length}`);
      if (data.recordset.length > 0) {
        console.log('\nSample data:');
        data.recordset.forEach(row => {
          console.log(`  ItemID: ${row.ItemID}, IsAvailable: ${row.IsAvailable}, HiddenFromOnline: ${row.HiddenFromOnline}`);
        });
      } else {
        console.log('ℹ️  Table exists but is empty');
      }
    } else {
      console.log('❌ MenuOverlay table does NOT exist');
      console.log('\nCreating MenuOverlay table...');

      await pool.request().query(`
        CREATE TABLE MenuOverlay (
          Id INT IDENTITY(1,1) PRIMARY KEY,
          ItemId INT NOT NULL,
          IsAvailable BIT NOT NULL DEFAULT 1,
          HiddenFromOnline BIT NOT NULL DEFAULT 0,
          OverridePrice DECIMAL(10,2) NULL,
          Reason NVARCHAR(500) NULL,
          CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
          UpdatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
          CONSTRAINT UQ_MenuOverlay_ItemId UNIQUE (ItemId)
        );

        CREATE INDEX IX_MenuOverlay_ItemId ON MenuOverlay(ItemId);
      `);

      console.log('✓ MenuOverlay table created successfully!');
    }

    await pool.close();

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error('\nDetails:', err);
    process.exit(1);
  }
}

// Run the script
checkMenuOverlay().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
