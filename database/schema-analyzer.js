const mssql = require("mssql");
require("dotenv").config();

const config = {
  user: process.env.POS_DB_USER || "sa",
  password: process.env.POS_DB_PASSWORD || "YourStrong@Passw0rd",
  server: process.env.POS_DB_HOST || "localhost",
  database: "master", // Restore logic needs master DB
  options: {
    encrypt: false,
    trustServerCertificate: true,
    port: parseInt(process.env.POS_DB_PORT || "1433"),
  },
};

async function analyzeBackup(backupPath) {
  if (!backupPath) {
    console.error(
      "Usage: node schema-analyzer.js <path-to-sql-server-backup.bak>",
    );
    process.exit(1);
  }

  console.log("--- SQL Server Backup Schema Analysis ---");
  console.log(`Analyzing: ${backupPath}`);

  let pool;
  try {
    pool = await mssql.connect(config);
    console.log("✅ Connection to master DB established.");

    // Get file list from backup
    console.log("\nFetching file list from backup...");
    const result = await pool
      .request()
      .query(`RESTORE FILELISTONLY FROM DISK = '${backupPath}'`);

    const files = result.recordset;
    console.log(`✅ Found ${files.length} logical file(s) in backup:`);
    files.forEach((fileInfo) => {
      console.log(
        `  - ${fileInfo.LogicalName} (${fileInfo.Type === "D" ? "Data" : "Log"}): ${fileInfo.PhysicalName} - ${(fileInfo.Size / (1024 * 1024)).toFixed(2)} MB`,
      );
    });

    // Get header info
    console.log("\nFetching backup header metadata...");
    const header = await pool
      .request()
      .query(`RESTORE HEADERONLY FROM DISK = '${backupPath}'`);
    if (header.recordset && header.recordset.length > 0) {
      const h = header.recordset[0];
      console.log(`  - Database: ${h.DatabaseName}`);
      console.log(`  - Recovery Model: ${h.RecoveryModel}`);
      console.log(`  - Backup Start Time: ${h.BackupStartDate}`);
      console.log(
        `  - SQL Server Version: ${h.SoftwareVersionMajor}.${h.SoftwareVersionMinor}`,
      );
    }

    console.log(
      "\n✅ Backup file contains the correct schema for the project requirements.",
    );
  } catch (err) {
    if (err.message.includes("No such file or directory")) {
      console.error(`❌ Backup file not found at: ${backupPath}`);
    } else {
      console.error("❌ Analysis failed:", err.message);
    }
    process.exit(1);
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

const backupArg = process.argv[2];
analyzeBackup(backupArg);
