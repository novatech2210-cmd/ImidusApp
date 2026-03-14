import sql from 'mssql';

// Overlay database connection configuration
const overlayConfig = {
  server: process.env.OVERLAY_DB_SERVER || 'localhost',
  port: parseInt(process.env.OVERLAY_DB_PORT || '1433'),
  database: process.env.OVERLAY_DB_NAME || 'IntegrationService',
  user: process.env.OVERLAY_DB_USER || 'sa',
  password: process.env.OVERLAY_DB_PASSWORD || 'YourStrong@Passw0rd',
  options: {
    encrypt: process.env.OVERLAY_DB_ENCRYPT === 'true' || false,
    trustServerCertificate: process.env.OVERLAY_DB_TRUST_CERT === 'true' || true,
    enableArithAbort: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

// POS database connection configuration (read-only)
const posConfig = {
  server: process.env.POS_DB_SERVER || 'localhost',
  port: parseInt(process.env.POS_DB_PORT || '1433'),
  database: process.env.POS_DB_NAME || 'INI_Restaurant',
  user: process.env.POS_DB_USER || 'sa',
  password: process.env.POS_DB_PASSWORD || 'YourStrong@Passw0rd',
  options: {
    encrypt: process.env.POS_DB_ENCRYPT === 'true' || false,
    trustServerCertificate: process.env.POS_DB_TRUST_CERT === 'true' || true,
    enableArithAbort: true
  },
  pool: {
    max: 5,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

let overlayPool: sql.ConnectionPool | null = null;
let posPool: sql.ConnectionPool | null = null;

/**
 * Get overlay database connection pool
 */
export async function getOverlayConnection(): Promise<sql.ConnectionPool> {
  if (!overlayPool) {
    overlayPool = new sql.ConnectionPool(overlayConfig);
    await overlayPool.connect();
  }
  return overlayPool;
}

/**
 * Get POS database connection pool (read-only)
 */
export async function getPOSConnection(): Promise<sql.ConnectionPool> {
  if (!posPool) {
    posPool = new sql.ConnectionPool(posConfig);
    await posPool.connect();
  }
  return posPool;
}

/**
 * Close all database connections
 */
export async function closeConnections(): Promise<void> {
  if (overlayPool) {
    await overlayPool.close();
    overlayPool = null;
  }
  if (posPool) {
    await posPool.close();
    posPool = null;
  }
}

// Query helper type
interface QueryHelper {
  query(text: string, params?: any[]): Promise<{ rows: any[] }>;
}

// Overlay database query helper
export const overlayDb: QueryHelper = {
  query: async (text: string, params?: any[]): Promise<{ rows: any[] }> => {
    const pool = await getOverlayConnection();
    const result = await pool.request();
    
    if (params) {
      params.forEach((param, index) => {
        result.input(`param${index}`, param);
      });
    }
    
    const queryResult = await (result as any).query(text);
    return { rows: (queryResult as any).recordset };
  }
};

// POS database query helper (read-only)
export const posDb: QueryHelper = {
  query: async (text: string, params?: any[]): Promise<{ rows: any[] }> => {
    const pool = await getPOSConnection();
    const result = await pool.request();
    
    if (params) {
      params.forEach((param, index) => {
        result.input(`param${index}`, param);
      });
    }
    
    const queryResult = await (result as any).query(text);
    return { rows: (queryResult as any).recordset };
  }
};

// Handle process termination
process.on('SIGTERM', closeConnections);
process.on('SIGINT', closeConnections);
