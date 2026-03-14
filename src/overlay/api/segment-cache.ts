/**
 * Customer Segment Cache
 *
 * Optional caching layer for segment evaluation results.
 * Cache is stored in OVERLAY database, NOT INI_Restaurant (POS).
 *
 * SSOT Compliance - CRITICAL:
 * - Cache writes go to OVERLAY database only
 * - NO writes to INI_Restaurant
 * - Cache invalidation on customer data changes (via TTL)
 * - 1-hour TTL keeps data fresh
 *
 * Schema (OVERLAY database):
 * CREATE TABLE customer_segment_cache (
 *   customer_id VARCHAR(255) PRIMARY KEY,
 *   segments JSONB NOT NULL,
 *   metadata JSONB NOT NULL,
 *   cached_at TIMESTAMP DEFAULT NOW(),
 *   expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '1 hour')
 * );
 *
 * CREATE INDEX idx_segment_cache_expiry ON customer_segment_cache(expires_at);
 */

// ============================================================================
// Types
// ============================================================================

export interface CustomerSegment {
  customerId: string;
  segments: string[];
  metadata: {
    lifetime_value: number;
    visit_count: number;
    last_order_date: string | null;
    birthdate: string | null;
    days_since_last_order: number | null;
    days_until_birthday: number | null;
  };
  evaluatedAt?: string;
}

export interface CachedSegment extends CustomerSegment {
  cachedAt: string;
  expiresAt: string;
}

export interface CacheStats {
  totalEntries: number;
  expiredEntries: number;
  hitRate: number;
  lastCleanup: string | null;
}

// ============================================================================
// Cache Configuration
// ============================================================================

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour in milliseconds
const CACHE_TTL_SQL = "INTERVAL '1 hour'"; // PostgreSQL interval

// In-memory cache for development (replace with overlay DB in production)
const memoryCache = new Map<string, CachedSegment>();
let cacheHits = 0;
let cacheMisses = 0;
let lastCleanup: string | null = null;

// ============================================================================
// Overlay Database Connection
// ============================================================================

/**
 * Gets connection to OVERLAY database (NOT INI_Restaurant)
 *
 * SSOT Compliance: This is the OVERLAY database, separate from POS.
 * Cache writes are allowed here, but NOT in INI_Restaurant.
 */
async function getOverlayConnection(): Promise<OverlayConnection> {
  // In production, this would use actual PostgreSQL connection
  // For now, return a mock that demonstrates the pattern
  return {
    query: async <T>(sql: string, params?: unknown[]): Promise<T> => {
      // Mock implementation - replace with actual DB call
      console.log('[OverlayDB] Query:', sql.substring(0, 50), '...', 'Params:', params?.length || 0);
      return {} as T;
    },
  };
}

interface OverlayConnection {
  query: <T>(sql: string, params?: unknown[]) => Promise<T>;
}

// ============================================================================
// Cache Operations
// ============================================================================

/**
 * Gets cached segment data for a customer
 *
 * SSOT Compliance: Reads from OVERLAY database cache only
 *
 * @param customerId - Customer ID to look up
 * @returns CachedSegment if found and not expired, null otherwise
 */
export async function getCachedSegments(
  customerId: string
): Promise<CustomerSegment | null> {
  // Check in-memory cache first (development)
  const cached = memoryCache.get(customerId);
  if (cached) {
    const now = new Date();
    const expiresAt = new Date(cached.expiresAt);

    if (now < expiresAt) {
      cacheHits++;
      return {
        customerId: cached.customerId,
        segments: cached.segments,
        metadata: cached.metadata,
        evaluatedAt: cached.cachedAt,
      };
    } else {
      // Expired - remove from cache
      memoryCache.delete(customerId);
    }
  }

  cacheMisses++;

  // In production, query overlay DB
  try {
    const overlayDb = await getOverlayConnection();

    // Query for non-expired cache entry
    const result = await overlayDb.query<{ rows: CachedSegment[] }>(
      `
      SELECT customer_id, segments, metadata, cached_at, expires_at
      FROM customer_segment_cache
      WHERE customer_id = $1 AND expires_at > NOW()
      `,
      [customerId]
    );

    if (result.rows && result.rows.length > 0) {
      const row = result.rows[0];
      cacheHits++;
      return {
        customerId: row.customerId,
        segments: row.segments,
        metadata: row.metadata,
        evaluatedAt: row.cachedAt,
      };
    }
  } catch (error) {
    console.error('Failed to get cached segments:', error);
  }

  return null;
}

/**
 * Stores segment data in cache
 *
 * SSOT Compliance: Writes to OVERLAY database cache only, NOT INI_Restaurant
 *
 * @param segment - Customer segment data to cache
 */
export async function setCachedSegments(
  segment: CustomerSegment
): Promise<void> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + CACHE_TTL_MS);

  const cachedSegment: CachedSegment = {
    ...segment,
    cachedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  // Store in memory cache (development)
  memoryCache.set(segment.customerId, cachedSegment);

  // In production, store in overlay DB
  try {
    const overlayDb = await getOverlayConnection();

    // Upsert cache entry (insert or update on conflict)
    await overlayDb.query(
      `
      INSERT INTO customer_segment_cache (customer_id, segments, metadata, cached_at, expires_at)
      VALUES ($1, $2, $3, NOW(), NOW() + ${CACHE_TTL_SQL})
      ON CONFLICT (customer_id)
      DO UPDATE SET
        segments = $2,
        metadata = $3,
        cached_at = NOW(),
        expires_at = NOW() + ${CACHE_TTL_SQL}
      `,
      [
        segment.customerId,
        JSON.stringify(segment.segments),
        JSON.stringify(segment.metadata),
      ]
    );
  } catch (error) {
    console.error('Failed to cache segments:', error);
    // Cache failure is not critical - continue without caching
  }
}

/**
 * Invalidates cached segment data for a customer
 *
 * Use when customer data changes (order placed, profile updated, etc.)
 *
 * @param customerId - Customer ID to invalidate
 */
export async function invalidateCache(customerId: string): Promise<void> {
  // Remove from memory cache
  memoryCache.delete(customerId);

  // Remove from overlay DB
  try {
    const overlayDb = await getOverlayConnection();

    await overlayDb.query(
      `
      DELETE FROM customer_segment_cache
      WHERE customer_id = $1
      `,
      [customerId]
    );
  } catch (error) {
    console.error('Failed to invalidate cache:', error);
  }
}

/**
 * Cleans up expired cache entries
 *
 * Should be run periodically (e.g., every hour)
 */
export async function cleanupExpiredCache(): Promise<number> {
  // Clean memory cache
  const now = new Date();
  let expiredCount = 0;

  for (const [customerId, cached] of memoryCache.entries()) {
    const expiresAt = new Date(cached.expiresAt);
    if (now >= expiresAt) {
      memoryCache.delete(customerId);
      expiredCount++;
    }
  }

  // Clean overlay DB
  try {
    const overlayDb = await getOverlayConnection();

    const result = await overlayDb.query<{ rowCount: number }>(
      `
      DELETE FROM customer_segment_cache
      WHERE expires_at < NOW()
      `
    );

    expiredCount += result.rowCount || 0;
  } catch (error) {
    console.error('Failed to cleanup expired cache:', error);
  }

  lastCleanup = now.toISOString();
  return expiredCount;
}

// ============================================================================
// Cache Statistics
// ============================================================================

/**
 * Gets cache statistics
 */
export function getCacheStats(): CacheStats {
  const total = cacheHits + cacheMisses;
  return {
    totalEntries: memoryCache.size,
    expiredEntries: 0, // Would need to count in production
    hitRate: total > 0 ? cacheHits / total : 0,
    lastCleanup,
  };
}

/**
 * Resets cache statistics
 */
export function resetCacheStats(): void {
  cacheHits = 0;
  cacheMisses = 0;
}

// ============================================================================
// Cache-Through Segment Evaluation
// ============================================================================

/**
 * Gets customer segments with caching
 *
 * This is the recommended way to get segments - it:
 * 1. Checks cache first
 * 2. If miss, evaluates from POS (READ-ONLY)
 * 3. Stores result in cache (OVERLAY DB only)
 *
 * @param customerId - Customer ID to evaluate
 * @param fetchFn - Function to fetch customer data from POS
 * @returns CustomerSegment
 */
export async function getSegmentsWithCache(
  customerId: string,
  fetchFn: () => Promise<CustomerSegment>
): Promise<CustomerSegment> {
  // Check cache first
  const cached = await getCachedSegments(customerId);
  if (cached) {
    return cached;
  }

  // Cache miss - fetch fresh data
  const segment = await fetchFn();

  // Store in cache (async, don't await)
  setCachedSegments(segment).catch((error) => {
    console.error('Failed to cache segment:', error);
  });

  return segment;
}

// ============================================================================
// Database Schema Migration
// ============================================================================

/**
 * Creates the customer_segment_cache table in OVERLAY database
 *
 * Run once during deployment
 */
export const CACHE_TABLE_SCHEMA = `
-- Customer Segment Cache Table (OVERLAY database only)
-- SSOT Compliance: This table is in OVERLAY, NOT INI_Restaurant

CREATE TABLE IF NOT EXISTS customer_segment_cache (
  customer_id VARCHAR(255) PRIMARY KEY,
  segments JSONB NOT NULL,
  metadata JSONB NOT NULL,
  cached_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '1 hour')
);

-- Index for efficient expiry cleanup
CREATE INDEX IF NOT EXISTS idx_segment_cache_expiry
ON customer_segment_cache(expires_at);

-- Index for segment-based queries (optional)
CREATE INDEX IF NOT EXISTS idx_segment_cache_segments
ON customer_segment_cache USING GIN (segments);

COMMENT ON TABLE customer_segment_cache IS
  'Cache for customer segment evaluation results. TTL: 1 hour. OVERLAY DB only, not POS.';
`;

// ============================================================================
// SSOT Compliance Notes
// ============================================================================

/*
 * CRITICAL: This cache follows SSOT compliance rules:
 *
 * 1. OVERLAY Database Only:
 *    - All cache operations write to OVERLAY database
 *    - NEVER to INI_Restaurant (POS)
 *
 * 2. TTL-Based Invalidation:
 *    - 1-hour TTL ensures data freshness
 *    - Customer orders/updates naturally reflected after TTL
 *
 * 3. Safe Failure Mode:
 *    - Cache failures don't block segment evaluation
 *    - Falls back to direct POS read on cache miss
 *
 * 4. Explicit Invalidation:
 *    - invalidateCache() can be called after order completion
 *    - Ensures immediate segment update for critical actions
 */
