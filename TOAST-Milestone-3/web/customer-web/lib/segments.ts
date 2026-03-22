/**
 * Customer Segment Evaluation Library
 *
 * Purpose: Evaluate customer segments based on RFM (Recency, Frequency, Monetary) data
 * from INI_Restaurant database (READ-ONLY).
 *
 * SSOT Compliance:
 * - All customer data READ from INI_Restaurant
 * - NO writes to POS database
 * - Segment cache stored in overlay DB only (optional)
 *
 * Segment Definitions:
 * - high-spend: lifetime_value > $500
 * - frequent: visit_count > 10
 * - recent: last_order_date < 14 days ago
 * - birthday: birthdate matches CURRENT_DATE +/- 7 days
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

export interface CustomerSegment {
  customerId: string;
  segments: string[]; // ['high-spend', 'frequent', 'recent', 'birthday']
  metadata: {
    lifetime_value: number;
    visit_count: number;
    last_order_date: string | null;
    birthdate: string | null;
    days_since_last_order: number | null;
    days_until_birthday: number | null;
  };
  evaluatedAt: string;
}

export interface BannerTargetingRules {
  segments?: string[];
  minLifetimeValue?: number;
  minVisitCount?: number;
  maxDaysSinceLastOrder?: number;
  includesBirthday?: boolean;
}

export interface TargetedBanner {
  id: string;
  title: string;
  subtitle: string;
  description?: string;
  ctaText: string;
  ctaLink: string;
  bgGradient: string;
  imageUrl?: string;
  priority: number;
  active: boolean;
  targeting_rules?: BannerTargetingRules;
}

// ============================================================================
// Constants - Segment Thresholds
// ============================================================================

export const SEGMENT_THRESHOLDS = {
  HIGH_SPEND_MIN: 500,       // $500 lifetime value
  FREQUENT_MIN: 10,          // 10+ visits
  RECENT_MAX_DAYS: 14,       // Within 14 days
  BIRTHDAY_RANGE_DAYS: 7,    // +/- 7 days from birthday
} as const;

// ============================================================================
// Segment Evaluation Functions
// ============================================================================

/**
 * Evaluates whether a customer qualifies for the "high-spend" segment
 * Threshold: lifetime_value > $500
 */
export function isHighSpendCustomer(lifetimeValue: number): boolean {
  return lifetimeValue > SEGMENT_THRESHOLDS.HIGH_SPEND_MIN;
}

/**
 * Evaluates whether a customer qualifies for the "frequent" segment
 * Threshold: visit_count > 10
 */
export function isFrequentCustomer(visitCount: number): boolean {
  return visitCount > SEGMENT_THRESHOLDS.FREQUENT_MIN;
}

/**
 * Evaluates whether a customer qualifies for the "recent" segment
 * Threshold: last_order_date < 14 days ago
 */
export function isRecentCustomer(daysSinceLastOrder: number | null): boolean {
  if (daysSinceLastOrder === null) {
    return false;
  }
  return daysSinceLastOrder < SEGMENT_THRESHOLDS.RECENT_MAX_DAYS;
}

/**
 * Evaluates whether a customer qualifies for the "birthday" segment
 * Threshold: birthdate matches CURRENT_DATE +/- 7 days
 */
export function isBirthdayCustomer(daysUntilBirthday: number | null): boolean {
  if (daysUntilBirthday === null) {
    return false;
  }
  return Math.abs(daysUntilBirthday) <= SEGMENT_THRESHOLDS.BIRTHDAY_RANGE_DAYS;
}

/**
 * Calculates days until next birthday from a birthdate
 * Returns null if birthdate is null or invalid
 */
export function calculateDaysUntilBirthday(birthdate: string | null): number | null {
  if (!birthdate) {
    return null;
  }

  try {
    const birth = new Date(birthdate);
    const today = new Date();

    // Get this year's birthday
    const thisYearBirthday = new Date(
      today.getFullYear(),
      birth.getMonth(),
      birth.getDate()
    );

    // Calculate days difference
    const diffTime = thisYearBirthday.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // If birthday has passed this year, calculate days until next year's
    if (diffDays < -SEGMENT_THRESHOLDS.BIRTHDAY_RANGE_DAYS) {
      const nextYearBirthday = new Date(
        today.getFullYear() + 1,
        birth.getMonth(),
        birth.getDate()
      );
      const nextDiffTime = nextYearBirthday.getTime() - today.getTime();
      return Math.ceil(nextDiffTime / (1000 * 60 * 60 * 24));
    }

    return diffDays;
  } catch {
    return null;
  }
}

/**
 * Calculates days since last order
 * Returns null if last_order_date is null or invalid
 */
export function calculateDaysSinceLastOrder(lastOrderDate: string | null): number | null {
  if (!lastOrderDate) {
    return null;
  }

  try {
    const orderDate = new Date(lastOrderDate);
    const today = new Date();
    const diffTime = today.getTime() - orderDate.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  } catch {
    return null;
  }
}

// ============================================================================
// Main Evaluation Function
// ============================================================================

/**
 * Evaluates all customer segments based on RFM data
 *
 * SSOT Compliance: This function expects data READ from INI_Restaurant.
 * It does NOT perform any database operations itself.
 *
 * @param customerData - Customer RFM data from POS (READ-ONLY)
 * @returns CustomerSegment with all applicable segments
 */
export function evaluateSegmentsFromData(customerData: CustomerRFMData): CustomerSegment {
  const segments: string[] = [];

  // High-spend check: lifetime_value > $500
  if (isHighSpendCustomer(customerData.lifetime_value)) {
    segments.push('high-spend');
  }

  // Frequent check: visit_count > 10
  if (isFrequentCustomer(customerData.visit_count)) {
    segments.push('frequent');
  }

  // Recent check: last_order_date < 14 days ago
  if (isRecentCustomer(customerData.days_since_last_order)) {
    segments.push('recent');
  }

  // Birthday check: +/- 7 days
  if (isBirthdayCustomer(customerData.days_until_birthday)) {
    segments.push('birthday');
  }

  return {
    customerId: customerData.customerId,
    segments,
    metadata: {
      lifetime_value: customerData.lifetime_value,
      visit_count: customerData.visit_count,
      last_order_date: customerData.last_order_date,
      birthdate: customerData.birthdate,
      days_since_last_order: customerData.days_since_last_order,
      days_until_birthday: customerData.days_until_birthday,
    },
    evaluatedAt: new Date().toISOString(),
  };
}

/**
 * Async wrapper that fetches customer data from POS and evaluates segments
 *
 * SSOT Compliance: This function READ from INI_Restaurant via fetchCustomerDataFromPOS
 * NO writes to POS database
 *
 * @param customerId - Customer ID to evaluate
 * @param fetchFn - Function to fetch customer data from POS (dependency injection for testing)
 * @returns CustomerSegment with all applicable segments
 */
export async function evaluateCustomerSegments(
  customerId: string,
  fetchFn?: (id: string) => Promise<CustomerRFMData | null>
): Promise<CustomerSegment> {
  // Use provided fetch function or dynamic import for POS data fetcher
  let customerData: CustomerRFMData | null;

  if (fetchFn) {
    customerData = await fetchFn(customerId);
  } else {
    // Dynamic import to avoid circular dependency
    const module = await import('@/overlay/api/customer-segments');
    customerData = await module.fetchCustomerDataFromPOS(customerId);
  }

  return customerData ? evaluateSegmentsFromData(customerData) : createGuestSegment();
}

// ============================================================================
// Banner Targeting Functions
// ============================================================================

/**
 * Checks if a customer matches a banner's targeting rules
 *
 * Matching logic:
 * - If no targeting rules, show to everyone (return true)
 * - If targeting has segments, customer must match ANY segment
 * - Additional rules (minLifetimeValue, etc.) are AND conditions
 *
 * @param customerSegments - Customer's evaluated segments
 * @param bannerTargeting - Banner's targeting rules
 * @param customerMetadata - Optional customer metadata for advanced rules
 * @returns boolean - true if customer matches targeting
 */
export function matchesBannerTargeting(
  customerSegments: string[],
  bannerTargeting: BannerTargetingRules | null | undefined,
  customerMetadata?: CustomerSegment['metadata']
): boolean {
  // If no targeting rules, show to everyone
  if (!bannerTargeting) {
    return true;
  }

  // If targeting has segments, check if customer matches ANY
  if (bannerTargeting.segments && bannerTargeting.segments.length > 0) {
    const matchesSegment = bannerTargeting.segments.some((segment: string) =>
      customerSegments.includes(segment)
    );

    // If segments specified but none match, return false
    if (!matchesSegment) {
      return false;
    }
  }

  // Check additional rules (AND conditions)
  if (customerMetadata) {
    // Minimum lifetime value check
    if (
      bannerTargeting.minLifetimeValue !== undefined &&
      customerMetadata.lifetime_value < bannerTargeting.minLifetimeValue
    ) {
      return false;
    }

    // Minimum visit count check
    if (
      bannerTargeting.minVisitCount !== undefined &&
      customerMetadata.visit_count < bannerTargeting.minVisitCount
    ) {
      return false;
    }

    // Maximum days since last order check
    if (
      bannerTargeting.maxDaysSinceLastOrder !== undefined &&
      customerMetadata.days_since_last_order !== null &&
      customerMetadata.days_since_last_order > bannerTargeting.maxDaysSinceLastOrder
    ) {
      return false;
    }

    // Birthday requirement check
    if (
      bannerTargeting.includesBirthday === true &&
      !isBirthdayCustomer(customerMetadata.days_until_birthday)
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Filters banners based on customer segment matching
 *
 * @param banners - Array of banners with targeting rules
 * @param customerSegment - Customer's evaluated segment data
 * @returns Filtered array of banners that match customer
 */
export function filterBannersBySegment(
  banners: TargetedBanner[],
  customerSegment: CustomerSegment
): TargetedBanner[] {
  return banners.filter((banner) =>
    matchesBannerTargeting(
      customerSegment.segments,
      banner.targeting_rules,
      customerSegment.metadata
    )
  );
}

/**
 * Gets targeted banners for a customer
 * - Filters by active status
 * - Filters by targeting rules
 * - Sorts by priority (descending)
 * - Limits to maxBanners (default 5)
 *
 * @param banners - All available banners
 * @param customerSegment - Customer's segment data
 * @param maxBanners - Maximum number of banners to return (default 5)
 * @returns Sorted, filtered array of banners
 */
export function getTargetedBanners(
  banners: TargetedBanner[],
  customerSegment: CustomerSegment,
  maxBanners: number = 5
): TargetedBanner[] {
  return banners
    .filter((banner) => banner.active)
    .filter((banner) =>
      matchesBannerTargeting(
        customerSegment.segments,
        banner.targeting_rules,
        customerSegment.metadata
      )
    )
    .sort((a, b) => b.priority - a.priority)
    .slice(0, maxBanners);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Creates a guest customer segment (no POS data)
 * Used for unauthenticated users
 */
export function createGuestSegment(): CustomerSegment {
  return {
    customerId: 'guest',
    segments: [],
    metadata: {
      lifetime_value: 0,
      visit_count: 0,
      last_order_date: null,
      birthdate: null,
      days_since_last_order: null,
      days_until_birthday: null,
    },
    evaluatedAt: new Date().toISOString(),
  };
}

/**
 * Formats segment names for display
 */
export function formatSegmentName(segment: string): string {
  const displayNames: Record<string, string> = {
    'high-spend': 'High Spender',
    'frequent': 'Frequent Customer',
    'recent': 'Recent Customer',
    'birthday': 'Birthday',
  };
  return displayNames[segment] || segment;
}

/**
 * Gets segment badge color for UI
 */
export function getSegmentColor(segment: string): string {
  const colors: Record<string, string> = {
    'high-spend': '#D4AF37',  // Gold
    'frequent': '#4CAF50',    // Green
    'recent': '#2196F3',      // Blue
    'birthday': '#E91E63',    // Pink
  };
  return colors[segment] || '#9E9E9E';
}
