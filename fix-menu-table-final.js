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

async function fixMenuTable() {
  try {
    console.log('Connecting to IntegrationService database...');
    const pool = await sql.connect(config);

    // Drop both old tables if they exist
    console.log('\nDropping existing tables...');
    await pool.request().query(`
      IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'MenuOverlay')
      DROP TABLE MenuOverlay;

      IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'MenuOverlays')
      DROP TABLE MenuOverlays;
    `);

    console.log('✓ Old tables dropped');

    // Create the correct table structure matching the repository query
    console.log('\nCreating MenuOverlays table with correct structure...');
    await pool.request().query(`
      CREATE TABLE MenuOverlays (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        ItemID INT NOT NULL,
        IsEnabled BIT NOT NULL DEFAULT 1,
        DisplayName NVARCHAR(200) NULL,
        DisplayDescription NVARCHAR(500) NULL,
        DisplayOrder INT NULL,
        CategoryOverride INT NULL,
        UpdatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        CONSTRAINT UQ_MenuOverlays_ItemID UNIQUE (ItemID)
      );

      CREATE INDEX IX_MenuOverlays_ItemID ON MenuOverlays(ItemID);
      CREATE INDEX IX_MenuOverlays_IsEnabled ON MenuOverlays(IsEnabled);
    `);

    console.log('✓ MenuOverlays table created successfully!');

    // Verify
    const verify = await pool.request().query(`
      SELECT COUNT(*) as TableExists
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_NAME = 'MenuOverlays'
    `);

    if (verify.recordset[0].TableExists > 0) {
      console.log('✓ Table verified: MenuOverlays exists');

      // Show structure
      const columns = await pool.request().query(`
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'MenuOverlays'
        ORDER BY ORDINAL_POSITION
      `);

      console.log('\n📊 Table structure:');
      columns.recordset.forEach(col => {
        console.log(`  - ${col.COLUMN_NAME.padEnd(25)} ${col.DATA_TYPE.padEnd(15)} ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });
    }

    await pool.close();
    console.log('\n✅ Fix complete! Menu overrides should now work.');

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error('\nDetails:', err);
    process.exit(1);
  }
}

// Run the script
fixMenuTable().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
