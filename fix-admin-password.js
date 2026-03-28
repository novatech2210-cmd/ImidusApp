#!/usr/bin/env node

const sql = require('mssql');
const crypto = require('crypto');

// Hash password using SHA256 (lowercase hex - matching backend)
function hashPassword(password) {
  const hash = crypto.createHash('sha256').update(password).digest('hex');
  return hash.toLowerCase();
}

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

async function fixAdminPasswords() {
  try {
    console.log('Connecting to database...');
    const pool = await sql.connect(config);

    // New password without special characters that cause JSON issues
    const newPassword = 'Admin123';
    const passwordHash = hashPassword(newPassword);

    console.log('\nPassword hash for "Admin123":', passwordHash);
    console.log('Hash length:', passwordHash.length);

    // Update all admin users to use the new password
    console.log('\nUpdating admin user passwords...');

    const emails = [
      'admin@imidus.com',
      'admin@example.com',
      'manager@imidus.com',
      'admin@test.imidus.com',
      'e2e_3@example.com'
    ];

    for (const email of emails) {
      const result = await pool.request()
        .input('email', sql.VarChar, email)
        .input('passwordHash', sql.VarChar, passwordHash)
        .query(`
          UPDATE AdminUsers
          SET PasswordHash = @passwordHash,
              UpdatedAt = GETDATE()
          WHERE Email = @email
        `);

      if (result.rowsAffected[0] > 0) {
        console.log(`✓ Updated password for: ${email}`);
      } else {
        console.log(`✗ User not found: ${email}`);
      }
    }

    // Verify the update
    console.log('\n📊 Verifying password hashes:');
    const users = await pool.request().query(`
      SELECT Email, PasswordHash,
             LEN(PasswordHash) as HashLength,
             UpdatedAt
      FROM AdminUsers
      ORDER BY Email
    `);

    users.recordset.forEach(user => {
      const isValidHash = user.HashLength === 64;
      const status = isValidHash ? '✓' : '✗';
      console.log(`${status} ${user.Email.padEnd(30)} | Hash length: ${user.HashLength} | Updated: ${user.UpdatedAt}`);
    });

    console.log('\n✅ Password fix complete!');
    console.log('\n🔐 New Login Credentials:');
    console.log('═'.repeat(50));
    console.log('Email:    admin@imidus.com');
    console.log('Password: Admin123');
    console.log('═'.repeat(50));
    console.log('\nYou can now log in at: http://localhost:3001');

    await pool.close();

  } catch (err) {
    console.error('❌ Error fixing passwords:', err.message);
    console.error('\nDetails:', err);
    process.exit(1);
  }
}

// Run the script
fixAdminPasswords().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
