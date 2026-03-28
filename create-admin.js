#!/usr/bin/env node

const sql = require('mssql');
const crypto = require('crypto');

// Hash password using SHA256 (matching Python script)
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex').toLowerCase();
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

async function createAdmin() {
  try {
    console.log('Connecting to database...');
    const pool = await sql.connect(config);

    // 1. Create AdminRoles if not exists
    console.log('\n1. Creating AdminRoles...');
    await pool.request().query(`
      IF NOT EXISTS (SELECT 1 FROM AdminRoles WHERE Name = 'SuperAdmin')
        INSERT INTO AdminRoles (Name, Description, Permissions) VALUES ('SuperAdmin', 'Full access to all features', '["*"]');

      IF NOT EXISTS (SELECT 1 FROM AdminRoles WHERE Name = 'Manager')
        INSERT INTO AdminRoles (Name, Description, Permissions) VALUES ('Manager', 'Management access', '["orders.read", "orders.write", "customers.read"]');

      IF NOT EXISTS (SELECT 1 FROM AdminRoles WHERE Name = 'Cashier')
        INSERT INTO AdminRoles (Name, Description, Permissions) VALUES ('Cashier', 'Order processing only', '["orders.read"]');
    `);
    console.log('✓ AdminRoles created/verified');

    // 2. Get SuperAdmin role ID
    console.log('\n2. Getting SuperAdmin role ID...');
    const roleResult = await pool.request().query(`
      SELECT Id FROM AdminRoles WHERE Name = 'SuperAdmin'
    `);
    const superAdminRoleId = roleResult.recordset[0].Id;
    console.log(`✓ SuperAdmin role ID: ${superAdminRoleId}`);

    // 3. Create admin users
    console.log('\n3. Creating admin users...');
    const users = [
      { email: 'admin@imidus.com', firstName: 'Super', lastName: 'Admin', password: 'Admin123!' },
      { email: 'admin@example.com', firstName: 'Test', lastName: 'Admin', password: 'Admin123!' },
      { email: 'manager@imidus.com', firstName: 'Manager', lastName: 'User', password: 'Manager123!' }
    ];

    for (const user of users) {
      const passwordHash = hashPassword(user.password);

      // Check if user exists
      const existingUser = await pool.request()
        .input('email', sql.VarChar, user.email)
        .query('SELECT Id FROM AdminUsers WHERE Email = @email');

      if (existingUser.recordset.length > 0) {
        // Update existing user
        await pool.request()
          .input('email', sql.VarChar, user.email)
          .input('passwordHash', sql.VarChar, passwordHash)
          .input('firstName', sql.VarChar, user.firstName)
          .input('lastName', sql.VarChar, user.lastName)
          .input('roleId', sql.Int, superAdminRoleId)
          .query(`
            UPDATE AdminUsers
            SET PasswordHash = @passwordHash,
                FirstName = @firstName,
                LastName = @lastName,
                RoleId = @roleId,
                IsActive = 1,
                UpdatedAt = GETDATE()
            WHERE Email = @email
          `);
        console.log(`✓ Updated existing user: ${user.email}`);
      } else {
        // Insert new user
        await pool.request()
          .input('email', sql.VarChar, user.email)
          .input('passwordHash', sql.VarChar, passwordHash)
          .input('firstName', sql.VarChar, user.firstName)
          .input('lastName', sql.VarChar, user.lastName)
          .input('roleId', sql.Int, superAdminRoleId)
          .query(`
            INSERT INTO AdminUsers (Email, PasswordHash, FirstName, LastName, RoleId, IsActive, CreatedAt, UpdatedAt)
            VALUES (@email, @passwordHash, @firstName, @lastName, @roleId, 1, GETDATE(), GETDATE())
          `);
        console.log(`✓ Created new user: ${user.email}`);
      }
    }

    // 4. Verify created users
    console.log('\n4. Verifying created users...');
    const allUsers = await pool.request().query(`
      SELECT
        au.Email,
        au.FirstName,
        au.LastName,
        au.IsActive,
        ar.Name as RoleName,
        au.CreatedAt
      FROM AdminUsers au
      LEFT JOIN AdminRoles ar ON au.RoleId = ar.Id
      ORDER BY au.CreatedAt DESC
    `);

    console.log('\n📊 Admin Users in Database:');
    console.log('═'.repeat(80));
    allUsers.recordset.forEach(user => {
      console.log(`Email: ${user.Email.padEnd(25)} | Name: ${user.FirstName} ${user.LastName.padEnd(15)} | Role: ${user.RoleName} | Active: ${user.IsActive ? 'Yes' : 'No'}`);
    });
    console.log('═'.repeat(80));

    console.log('\n✅ Admin users created successfully!');
    console.log('\n🔐 Login Credentials:');
    console.log('═'.repeat(50));
    users.forEach(user => {
      console.log(`Email:    ${user.email}`);
      console.log(`Password: ${user.password}`);
      console.log('─'.repeat(50));
    });

    console.log('\n🌐 Admin Portal: http://localhost:3001');
    console.log('\n💡 You can now log in to the admin portal!');

    await pool.close();

  } catch (err) {
    console.error('❌ Error creating admin users:', err.message);
    console.error('\nDetails:', err);
    process.exit(1);
  }
}

// Run the script
createAdmin().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
