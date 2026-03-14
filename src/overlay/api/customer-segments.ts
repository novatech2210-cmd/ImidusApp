/**
 * Customer Segments API - POS Data Fetcher
 *
 * SSOT Compliance - CRITICAL:
 * - This module ONLY READS from INI_Restaurant database
 * - NO INSERT, UPDATE, or DELETE operations
 * - NO schema modifications
 * - All data is queried on-demand for segment evaluation
 *
 * Data Source: INI_Restaurant (tblCustomer, tblSales, tblSalesDetails)
 */

// ============================================================================
// Types
// ============================================================================

export interface CustomerRFMData {
  customerId: string;
  lifetime_value: number;
  visit_count: number;
  last_order_date: string | null;
  birthdate: string | null;
  days_since_last_order: number | null;
  days_until_birthday: number | null;
}

export interface SegmentDistribution {
  high_spend_count: number;
  frequent_count: number;
  recent_count: number;
  birthday_count: number;
  total_customers: number;
}

export interface CustomerSegmentData {
  customerId: number;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  lifetimeValue: number;
  visitCount: number;
  lastOrderDate: string | null;
  birthdate: string | null;
  daysSinceLastOrder: number | null;
  daysUntilBirthday: number | null;
  segments: string[];
}

// ============================================================================
// Database Connection Helper
// ============================================================================

/**
 * Gets a READ-ONLY connection to INI_Restaurant
 *
 * SSOT Compliance: This connection should be configured for READ-ONLY access
 * in production to prevent accidental writes.
 */
async function getPOSConnection(): Promise<POSConnection> {
  // In production, this would use the actual SQL Server connection
  // For now, return a mock that demonstrates the READ-ONLY pattern
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5004/api';

  return {
    query: async <T>(endpoint: string, params?: Record<string, string>): Promise<T> => {
      const queryString = params
        ? '?' + new URLSearchParams(params).toString()
        : '';
      const response = await fetch(`${API_BASE}${endpoint}${queryString}`);
      if (!response.ok) {
        throw new Error(`POS API error: ${response.status}`);
      }
      return response.json();
    },
  };
}

interface POSConnection {
  query: <T>(endpoint: string, params?: Record<string, string>) => Promise<T>;
}

// ============================================================================
// RFM Data Fetcher - READ-ONLY
// ============================================================================

/**
 * Fetches customer RFM data from INI_Restaurant (READ-ONLY)
 *
 * SSOT Compliance:
 * - This function ONLY executes SELECT queries
 * - NO mutations to POS database
 * - Data returned is a snapshot at query time
 *
 * SQL Server 2005 Compatible:
 * - Uses DATEADD/DATEDIFF instead of EXTRACT
 * - No window functions or CTEs
 * - Compatible with legacy SQL Server syntax
 *
 * @param customerId - Customer ID to fetch data for
 * @returns CustomerRFMData with RFM metrics
 */
export async function fetchCustomerDataFromPOS(
  customerId: string
): Promise<CustomerRFMData> {
  const posDb = await getPOSConnection();

  // Fetch customer RFM data via backend API
  // The backend executes this READ-ONLY query:
  /*
    -- SQL Server 2005 Compatible RFM Query (READ-ONLY)
    SELECT
      c.CustomerID,
      c.BirthDate,
      COALESCE(SUM(s.Total), 0) as lifetime_value,
      COUNT(s.SalesID) as visit_count,
      MAX(s.SalesDate) as last_order_date,
      DATEDIFF(DAY, MAX(s.SalesDate), GETDATE()) as days_since_last_order,
      CASE
        WHEN c.BirthDate IS NOT NULL THEN
          DATEDIFF(DAY, GETDATE(),
            DATEADD(YEAR, DATEDIFF(YEAR, c.BirthDate, GETDATE()) +
              CASE
                WHEN DATEADD(YEAR, DATEDIFF(YEAR, c.BirthDate, GETDATE()), c.BirthDate) < GETDATE()
                THEN 1 ELSE 0
              END,
            c.BirthDate)
          )
        ELSE NULL
      END as days_until_birthday
    FROM tblCustomer c
    LEFT JOIN tblSales s ON s.CustomerID = c.CustomerID
      AND s.TransType IN (1, 2) -- Completed orders only
    WHERE c.CustomerID = @customerId
    GROUP BY c.CustomerID, c.BirthDate
  */

  try {
    const data = await posDb.query<{
      customerId: number;
      birthdate: string | null;
      lifetimeValue: number;
      visitCount: number;
      lastOrderDate: string | null;
      daysSinceLastOrder: number | null;
      daysUntilBirthday: number | null;
    }>(`/Admin/customers/${customerId}/rfm`);

    return {
      customerId: String(data.customerId),
      lifetime_value: data.lifetimeValue ?? 0,
      visit_count: data.visitCount ?? 0,
      last_order_date: data.lastOrderDate,
      birthdate: data.birthdate,
      days_since_last_order: data.daysSinceLastOrder,
      days_until_birthday: data.daysUntilBirthday,
    };
  } catch (error) {
    console.error('Failed to fetch customer RFM data:', error);

    // Return empty data for non-existent customers
    return {
      customerId,
      lifetime_value: 0,
      visit_count: 0,
      last_order_date: null,
      birthdate: null,
      days_since_last_order: null,
      days_until_birthday: null,
    };
  }
}

// ============================================================================
// Segment Distribution Query - READ-ONLY
// ============================================================================

/**
 * Fetches segment distribution across all customers (READ-ONLY)
 *
 * SSOT Compliance:
 * - This function ONLY executes SELECT queries
 * - NO mutations to POS database
 *
 * Used by admin dashboard to show pie chart of customer segments.
 *
 * SQL Server 2005 Compatible:
 * - Uses subquery instead of CTE
 * - No window functions
 *
 * @returns SegmentDistribution with counts for each segment
 */
export async function getSegmentDistribution(): Promise<SegmentDistribution> {
  const posDb = await getPOSConnection();

  // Fetch segment distribution via backend API
  // The backend executes this READ-ONLY query:
  /*
    -- SQL Server 2005 Compatible Segment Distribution Query (READ-ONLY)
    SELECT
      COUNT(CASE WHEN segments.lifetime_value > 500 THEN 1 END) as high_spend_count,
      COUNT(CASE WHEN segments.visit_count > 10 THEN 1 END) as frequent_count,
      COUNT(CASE WHEN segments.days_since_last < 14 THEN 1 END) as recent_count,
      COUNT(CASE WHEN ABS(segments.days_to_birthday) <= 7 THEN 1 END) as birthday_count,
      COUNT(*) as total_customers
    FROM (
      SELECT
        c.CustomerID,
        COALESCE(SUM(s.Total), 0) as lifetime_value,
        COUNT(s.SalesID) as visit_count,
        DATEDIFF(DAY, MAX(s.SalesDate), GETDATE()) as days_since_last,
        CASE
          WHEN c.BirthDate IS NOT NULL THEN
            DATEDIFF(DAY, GETDATE(),
              DATEADD(YEAR, DATEDIFF(YEAR, c.BirthDate, GETDATE()) +
                CASE
                  WHEN DATEADD(YEAR, DATEDIFF(YEAR, c.BirthDate, GETDATE()), c.BirthDate) < GETDATE()
                  THEN 1 ELSE 0
                END,
              c.BirthDate)
            )
          ELSE NULL
        END as days_to_birthday
      FROM tblCustomer c
      LEFT JOIN tblSales s ON s.CustomerID = c.CustomerID
        AND s.TransType IN (1, 2)
      GROUP BY c.CustomerID, c.BirthDate
    ) segments
  */

  try {
    const data = await posDb.query<SegmentDistribution>('/Admin/customers/segment-distribution');
    return data;
  } catch (error) {
    console.error('Failed to fetch segment distribution:', error);

    return {
      high_spend_count: 0,
      frequent_count: 0,
      recent_count: 0,
      birthday_count: 0,
      total_customers: 0,
    };
  }
}

// ============================================================================
// Customer List with Segments - READ-ONLY
// ============================================================================

/**
 * Fetches list of customers with their segment data (READ-ONLY)
 *
 * SSOT Compliance:
 * - This function ONLY executes SELECT queries
 * - NO mutations to POS database
 *
 * Used by admin to view and filter customers by segment.
 *
 * @param segment - Optional segment filter ('high-spend', 'frequent', 'recent', 'birthday')
 * @param limit - Maximum number of customers to return (default 100)
 * @returns Array of CustomerSegmentData
 */
export async function getCustomersWithSegments(
  segment?: string,
  limit: number = 100
): Promise<CustomerSegmentData[]> {
  const posDb = await getPOSConnection();

  try {
    const params: Record<string, string> = { limit: String(limit) };
    if (segment) {
      params.segment = segment;
    }

    const data = await posDb.query<CustomerSegmentData[]>('/Admin/customers/with-segments', params);
    return data;
  } catch (error) {
    console.error('Failed to fetch customers with segments:', error);
    return [];
  }
}

// ============================================================================
// Single Customer RFM Details - READ-ONLY
// ============================================================================

/**
 * Fetches detailed RFM breakdown for a single customer (READ-ONLY)
 *
 * SSOT Compliance:
 * - This function ONLY executes SELECT queries
 * - NO mutations to POS database
 *
 * Used by segment tester to preview which banners a customer would see.
 *
 * @param customerIdOrEmail - Customer ID or email to look up
 * @returns CustomerSegmentData with full details
 */
export async function getCustomerRFMDetails(
  customerIdOrEmail: string
): Promise<CustomerSegmentData | null> {
  const posDb = await getPOSConnection();

  try {
    // Determine if input is numeric (ID) or email
    const isNumeric = /^\d+$/.test(customerIdOrEmail);
    const endpoint = isNumeric
      ? `/Admin/customers/${customerIdOrEmail}/rfm-details`
      : `/Admin/customers/by-email/${encodeURIComponent(customerIdOrEmail)}/rfm-details`;

    const data = await posDb.query<CustomerSegmentData>(endpoint);
    return data;
  } catch (error) {
    console.error('Failed to fetch customer RFM details:', error);
    return null;
  }
}

// ============================================================================
// Segment Evaluation Helper - READ-ONLY
// ============================================================================

/**
 * Evaluates segments for a CustomerRFMData object
 *
 * This is a pure function - no database operations.
 * Segments are calculated based on the data provided.
 *
 * @param data - Customer RFM data
 * @returns Array of segment strings
 */
export function evaluateSegmentsFromRFM(data: CustomerRFMData): string[] {
  const segments: string[] = [];

  // High-spend: lifetime_value > $500
  if (data.lifetime_value > 500) {
    segments.push('high-spend');
  }

  // Frequent: visit_count > 10
  if (data.visit_count > 10) {
    segments.push('frequent');
  }

  // Recent: last_order_date < 14 days ago
  if (data.days_since_last_order !== null && data.days_since_last_order < 14) {
    segments.push('recent');
  }

  // Birthday: +/- 7 days
  if (data.days_until_birthday !== null && Math.abs(data.days_until_birthday) <= 7) {
    segments.push('birthday');
  }

  return segments;
}

// ============================================================================
// Export CSV Helper
// ============================================================================

/**
 * Formats customer segment data for CSV export
 *
 * @param customers - Array of customer segment data
 * @returns CSV string
 */
export function formatSegmentDataAsCSV(customers: CustomerSegmentData[]): string {
  const headers = [
    'Customer ID',
    'First Name',
    'Last Name',
    'Phone',
    'Email',
    'Lifetime Value',
    'Visit Count',
    'Last Order Date',
    'Days Since Last Order',
    'Birthday',
    'Days Until Birthday',
    'Segments',
  ];

  const rows = customers.map((c) => [
    c.customerId,
    c.firstName,
    c.lastName,
    c.phone,
    c.email,
    c.lifetimeValue.toFixed(2),
    c.visitCount,
    c.lastOrderDate || '',
    c.daysSinceLastOrder ?? '',
    c.birthdate || '',
    c.daysUntilBirthday ?? '',
    c.segments.join('; '),
  ]);

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}

// ============================================================================
// SSOT Compliance Notes
// ============================================================================

/*
 * CRITICAL: This module follows SSOT compliance rules:
 *
 * 1. READ-ONLY Operations:
 *    - All functions execute SELECT queries only
 *    - NO INSERT, UPDATE, DELETE statements
 *    - NO stored procedure calls that modify data
 *
 * 2. No Schema Changes:
 *    - NO CREATE TABLE, ALTER TABLE, DROP TABLE
 *    - NO index modifications
 *    - NO constraint changes
 *
 * 3. Data Source:
 *    - All data comes from INI_Restaurant (POS database)
 *    - tblCustomer for customer info and birthdate
 *    - tblSales for order history and totals
 *    - TransType IN (1, 2) filters for completed orders only
 *
 * 4. Caching:
 *    - Segment cache is stored in OVERLAY database
 *    - Never in INI_Restaurant
 *    - See segment-cache.ts for caching implementation
 *
 * 5. SQL Server 2005 Compatibility:
 *    - Uses DATEADD/DATEDIFF (not EXTRACT)
 *    - No CTEs or window functions
 *    - Subqueries instead of WITH clauses
 */
