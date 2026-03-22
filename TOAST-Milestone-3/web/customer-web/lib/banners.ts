/**
 * Banner Scheduling and Filtering Utilities
 *
 * Provides helper functions for:
 * - Checking if a banner is currently active
 * - Filtering banners by date range
 * - Sorting banners by priority
 * - Customer segment matching
 *
 * SSOT Compliance:
 * - Banners data from OVERLAY database
 * - Customer data READ from INI_Restaurant (for segment evaluation)
 * - NO writes to POS database
 */

// ============================================================================
// Types
// ============================================================================

export interface TargetingRules {
  segments?: string[];
  conditions?: {
    "high-spend"?: { lifetime_value: { gt: number } };
    frequent?: { visit_count: { gt: number } };
    recent?: { last_order_days: { lt: number } };
    birthday?: { days_range: number };
  };
}

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  image_url: string;
  bg_gradient?: string;
  cta_text?: string;
  cta_link?: string;
  targeting_rules: TargetingRules;
  start_date?: string | null;
  end_date?: string | null;
  priority: number;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CustomerData {
  id: string;
  lifetime_value: number;
  visit_count: number;
  last_order_date?: string;
  birthday?: string;
}

export interface BannerSlide {
  id: string;
  title: string;
  subtitle: string;
  description?: string;
  ctaText: string;
  ctaLink: string;
  bgGradient: string;
  imageUrl?: string;
  segments: string[];
  priority: number;
  active: boolean;
}

// ============================================================================
// Constants
// ============================================================================

/** Maximum number of banners to display in the carousel */
export const MAX_CAROUSEL_BANNERS = 5;

/** Default targeting thresholds */
export const DEFAULT_THRESHOLDS = {
  HIGH_SPEND_VALUE: 500, // $500 lifetime value
  FREQUENT_VISITS: 10, // 10+ visits
  RECENT_DAYS: 14, // Within 14 days
  BIRTHDAY_RANGE: 7, // Within 7 days
};

// ============================================================================
// Banner Status Functions
// ============================================================================

/**
 * Check if a banner is currently active based on its active flag and date range
 *
 * @param banner - The banner to check
 * @param now - Current date (defaults to now, allows for testing)
 * @returns true if the banner should be displayed
 */
export function isBannerActive(
  banner: Banner,
  now: Date = new Date()
): boolean {
  // Check active flag first
  if (!banner.active) {
    return false;
  }

  // Check start date
  if (banner.start_date) {
    const startDate = new Date(banner.start_date);
    if (startDate > now) {
      return false;
    }
  }

  // Check end date
  if (banner.end_date) {
    const endDate = new Date(banner.end_date);
    if (endDate < now) {
      return false;
    }
  }

  return true;
}

/**
 * Check if a banner is scheduled for the future
 *
 * @param banner - The banner to check
 * @param now - Current date
 * @returns true if the banner has a start_date in the future
 */
export function isBannerScheduled(
  banner: Banner,
  now: Date = new Date()
): boolean {
  if (!banner.start_date) {
    return false;
  }

  const startDate = new Date(banner.start_date);
  return startDate > now;
}

/**
 * Check if a banner has expired
 *
 * @param banner - The banner to check
 * @param now - Current date
 * @returns true if the banner's end_date has passed
 */
export function isBannerExpired(
  banner: Banner,
  now: Date = new Date()
): boolean {
  if (!banner.end_date) {
    return false;
  }

  const endDate = new Date(banner.end_date);
  return endDate < now;
}

/**
 * Get the display status of a banner
 *
 * @param banner - The banner to check
 * @param now - Current date
 * @returns Status string: "active", "scheduled", "expired", or "disabled"
 */
export function getBannerStatus(
  banner: Banner,
  now: Date = new Date()
): "active" | "scheduled" | "expired" | "disabled" {
  if (!banner.active) {
    return "disabled";
  }

  if (isBannerScheduled(banner, now)) {
    return "scheduled";
  }

  if (isBannerExpired(banner, now)) {
    return "expired";
  }

  return "active";
}

// ============================================================================
// Targeting Functions
// ============================================================================

/**
 * Check if a customer matches the banner's targeting rules
 *
 * @param banner - The banner with targeting rules
 * @param customer - Customer data for evaluation
 * @param now - Current date for birthday calculation
 * @returns true if the customer matches the targeting rules
 */
export function matchesTargeting(
  banner: Banner,
  customer: CustomerData | null,
  now: Date = new Date()
): boolean {
  const { targeting_rules } = banner;
  const segments = targeting_rules?.segments || [];

  // If no targeting rules or "all" segment, show to everyone
  if (segments.length === 0 || segments.includes("all")) {
    return true;
  }

  // No customer data - only show non-targeted banners
  if (!customer) {
    return segments.includes("new");
  }

  // Check each segment
  for (const segment of segments) {
    switch (segment) {
      case "high-spend": {
        const threshold =
          targeting_rules?.conditions?.["high-spend"]?.lifetime_value?.gt ??
          DEFAULT_THRESHOLDS.HIGH_SPEND_VALUE;
        if (customer.lifetime_value > threshold) {
          return true;
        }
        break;
      }

      case "frequent": {
        const threshold =
          targeting_rules?.conditions?.frequent?.visit_count?.gt ??
          DEFAULT_THRESHOLDS.FREQUENT_VISITS;
        if (customer.visit_count > threshold) {
          return true;
        }
        break;
      }

      case "recent": {
        if (customer.last_order_date) {
          const lastOrderDate = new Date(customer.last_order_date);
          const daysSinceLastOrder = Math.floor(
            (now.getTime() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          const threshold =
            targeting_rules?.conditions?.recent?.last_order_days?.lt ??
            DEFAULT_THRESHOLDS.RECENT_DAYS;
          if (daysSinceLastOrder < threshold) {
            return true;
          }
        }
        break;
      }

      case "birthday": {
        if (customer.birthday) {
          const birthday = new Date(customer.birthday);
          const range =
            targeting_rules?.conditions?.birthday?.days_range ??
            DEFAULT_THRESHOLDS.BIRTHDAY_RANGE;

          // Calculate if birthday is within range
          const thisYearBirthday = new Date(
            now.getFullYear(),
            birthday.getMonth(),
            birthday.getDate()
          );

          const diffDays = Math.abs(
            Math.floor(
              (thisYearBirthday.getTime() - now.getTime()) /
                (1000 * 60 * 60 * 24)
            )
          );

          if (diffDays <= range) {
            return true;
          }
        }
        break;
      }

      case "new": {
        // "new" customers have no orders or just registered
        if (customer.visit_count === 0) {
          return true;
        }
        break;
      }

      // Loyalty tier segments (bronze, silver, gold, vip)
      default: {
        // These would be evaluated separately based on customer tier
        // For now, skip tier-based segments
        break;
      }
    }
  }

  return false;
}

// ============================================================================
// Filtering Functions
// ============================================================================

/**
 * Filter banners to only include active ones
 *
 * @param banners - Array of banners to filter
 * @param now - Current date
 * @returns Array of active banners sorted by priority
 */
export function filterActiveBanners(
  banners: Banner[],
  now: Date = new Date()
): Banner[] {
  return banners
    .filter((banner) => isBannerActive(banner, now))
    .sort((a, b) => b.priority - a.priority)
    .slice(0, MAX_CAROUSEL_BANNERS);
}

/**
 * Filter banners by customer targeting
 *
 * @param banners - Array of banners to filter
 * @param customer - Customer data for targeting evaluation
 * @param now - Current date
 * @returns Array of matching banners sorted by priority
 */
export function filterBannersByTargeting(
  banners: Banner[],
  customer: CustomerData | null,
  now: Date = new Date()
): Banner[] {
  return banners
    .filter((banner) => isBannerActive(banner, now))
    .filter((banner) => matchesTargeting(banner, customer, now))
    .sort((a, b) => b.priority - a.priority)
    .slice(0, MAX_CAROUSEL_BANNERS);
}

// ============================================================================
// Transformation Functions
// ============================================================================

/**
 * Transform a Banner to BannerSlide format for the carousel component
 *
 * @param banner - The banner to transform
 * @returns BannerSlide object
 */
export function toBannerSlide(banner: Banner): BannerSlide {
  return {
    id: banner.id,
    title: banner.title,
    subtitle: banner.subtitle || "",
    description: banner.description,
    ctaText: banner.cta_text || "Order Now",
    ctaLink: banner.cta_link || "/menu",
    bgGradient:
      banner.bg_gradient ||
      "linear-gradient(135deg, #1E5AA8 0%, #174785 100%)",
    imageUrl: banner.image_url,
    segments: banner.targeting_rules?.segments || ["all"],
    priority: banner.priority,
    active: banner.active,
  };
}

/**
 * Transform an array of Banners to BannerSlides
 *
 * @param banners - Array of banners to transform
 * @returns Array of BannerSlide objects
 */
export function toBannerSlides(banners: Banner[]): BannerSlide[] {
  return banners.map(toBannerSlide);
}

// ============================================================================
// Date Formatting Utilities
// ============================================================================

/**
 * Format a date for display in the admin UI
 *
 * @param date - Date string or Date object
 * @returns Formatted date string
 */
export function formatBannerDate(date: string | Date | null | undefined): string {
  if (!date) {
    return "Not set";
  }

  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format a date range for display
 *
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Formatted date range string
 */
export function formatDateRange(
  startDate: string | null | undefined,
  endDate: string | null | undefined
): string {
  if (!startDate && !endDate) {
    return "Always active";
  }

  if (startDate && !endDate) {
    return `From ${formatBannerDate(startDate)}`;
  }

  if (!startDate && endDate) {
    return `Until ${formatBannerDate(endDate)}`;
  }

  return `${formatBannerDate(startDate)} - ${formatBannerDate(endDate)}`;
}

// ============================================================================
// Segment Display Utilities
// ============================================================================

/**
 * Get human-readable label for a segment
 *
 * @param segment - Segment ID
 * @returns Human-readable label
 */
export function getSegmentLabel(segment: string): string {
  const labels: Record<string, string> = {
    all: "All Customers",
    new: "New Customers",
    "high-spend": "High Spenders",
    frequent: "Frequent Diners",
    recent: "Recent Customers",
    birthday: "Birthday Week",
    bronze: "Bronze Members",
    silver: "Silver Members",
    gold: "Gold Members",
    vip: "VIP Members",
  };

  return labels[segment] || segment;
}

/**
 * Get color class for a segment badge
 *
 * @param segment - Segment ID
 * @returns Tailwind CSS classes for the badge
 */
export function getSegmentColor(segment: string): string {
  const colors: Record<string, string> = {
    all: "bg-gray-100 text-gray-700",
    new: "bg-green-100 text-green-700",
    "high-spend": "bg-yellow-100 text-yellow-700",
    frequent: "bg-blue-100 text-blue-700",
    recent: "bg-purple-100 text-purple-700",
    birthday: "bg-pink-100 text-pink-700",
    bronze: "bg-orange-100 text-orange-700",
    silver: "bg-slate-100 text-slate-700",
    gold: "bg-amber-100 text-amber-700",
    vip: "bg-indigo-100 text-indigo-700",
  };

  return colors[segment] || "bg-gray-100 text-gray-700";
}
