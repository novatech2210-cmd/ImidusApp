const mssql = require("mssql");
require("dotenv").config();

const config = {
  user: process.env.POS_DB_USER || "sa",
  password: process.env.POS_DB_PASSWORD || "YourStrong@Passw0rd",
  server: process.env.POS_DB_HOST || "localhost",
  database: process.env.POS_DB_NAME || "INI_Restaurant",
  options: {
    encrypt: false, // for local dev
    trustServerCertificate: true,
    port: parseInt(process.env.POS_DB_PORT || "1433"),
  },
};

async function verifyConnection() {
  console.log("--- POS Database Connectivity Verification ---");
  console.log(
    `Connecting to: ${config.server}:${config.options.port}/${config.database}`,
  );

  let pool;
  try {
    pool = await mssql.connect(config);
    console.log("✅ Connection established successfully.");

    // Required tables to check
    const requiredTables = [
      "tblSales",
      "tblItem",
      "tblCategory",
      "tblTable",
      "tblCustomer",
      "tblUser",
      "tblAvailableSize",
      "tblSize",
      "tblPayment",
    ];

    console.log("\nChecking required tables:");
    const results = [];
    for (const table of requiredTables) {
      try {
        const result = await pool
          .request()
          .query(`SELECT TOP 0 * FROM ${table}`);
        console.log(`✅ Table '${table}' exists.`);
        results.push({ table, status: "EXISTS" });
      } catch (err) {
        console.log(`❌ Table '${table}' missing or inaccessible.`);
        results.push({ table, status: "MISSING" });
      }
    }

    const missing = results.filter((r) => r.status === "MISSING");
    if (missing.length === 0) {
      console.log("\n✅ All required tables are present.");
    } else {
      console.warn(
        `\n⚠️ Missing ${missing.length} tables: ${missing.map((m) => m.table).join(", ")}`,
      );
    }
  } catch (err) {
    console.error("❌ Connection failed:", err.message);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

verifyConnection();
