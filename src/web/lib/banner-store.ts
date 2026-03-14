/**
 * Shared Banner Store
 *
 * Provides a unified in-memory store for banners used by both:
 * - /api/admin/banners (CRUD operations)
 * - /api/banners/active (public display)
 *
 * SSOT Compliance:
 * - Banners stored in OVERLAY (this module simulates overlay DB)
 * - NO writes to INI_Restaurant
 * - Customer data READ from POS for segment evaluation
 *
 * In production, replace this with actual PostgreSQL overlay DB queries.
 */

import { isBannerActive, type Banner } from './banners';

// ============================================================================
// Shared In-Memory Store
// ============================================================================

/**
 * In-memory banner store
 * This simulates the overlay PostgreSQL database
 * In production, replace with actual DB queries
 */
const bannerStore: Map<string, Banner> = new Map();

// Initialize with seed data
const seedBanners: Banner[] = [
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    title: 'Welcome to IMIDUSAPP',
    subtitle: 'Your First Order Awaits',
    description: 'Experience seamless ordering with real-time POS integration. Join thousands of satisfied customers.',
    image_url: '/images/banners/welcome.jpg',
    bg_gradient: 'linear-gradient(135deg, #1E5AA8 0%, #174785 100%)',
    cta_text: 'Start Ordering',
    cta_link: '/menu',
    targeting_rules: { segments: ['all', 'new'] },
    priority: 100,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    title: 'Gold Member Exclusive',
    subtitle: 'Premium Experience',
    description: 'Enjoy 10% bonus points on every order and exclusive access to new menu items before anyone else!',
    image_url: '/images/banners/gold.jpg',
    bg_gradient: 'linear-gradient(135deg, #D4AF37 0%, #B8960C 100%)',
    cta_text: 'Explore Menu',
    cta_link: '/menu',
    targeting_rules: {
      segments: ['high-spend'],
      conditions: { 'high-spend': { lifetime_value: { gt: 500 } } },
    },
    priority: 95,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
    title: 'Weekend Special',
    subtitle: '20% Off Family Meals',
    description: 'This weekend only! Order any family combo and save 20%. Perfect for sharing with loved ones.',
    image_url: '/images/banners/weekend.jpg',
    bg_gradient: 'linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%)',
    cta_text: 'View Family Meals',
    cta_link: '/menu',
    targeting_rules: { segments: ['all'] },
    start_date: '2026-03-14T00:00:00Z',
    end_date: '2026-03-16T23:59:59Z',
    priority: 80,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'd4e5f6a7-b8c9-0123-defa-234567890123',
    title: 'Birthday Celebration',
    subtitle: 'Your Special Day Reward',
    description: 'Happy Birthday! Enjoy a complimentary dessert with any order this week.',
    image_url: '/images/banners/birthday.jpg',
    bg_gradient: 'linear-gradient(135deg, #E91E63 0%, #C2185B 100%)',
    cta_text: 'Claim Reward',
    cta_link: '/menu',
    targeting_rules: {
      segments: ['birthday'],
      conditions: { birthday: { days_range: 7 } },
    },
    priority: 99,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'e5f6a7b8-c9d0-1234-efab-345678901234',
    title: 'Frequent Diner Rewards',
    subtitle: 'Earn Points Faster',
    description: 'As one of our most frequent customers, earn 2x points on your next order!',
    image_url: '/images/banners/frequent.jpg',
    bg_gradient: 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)',
    cta_text: 'Order Now',
    cta_link: '/menu',
    targeting_rules: {
      segments: ['frequent'],
      conditions: { frequent: { visit_count: { gt: 10 } } },
    },
    priority: 90,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'f6a7b8c9-d0e1-2345-fabc-456789012345',
    title: 'Welcome Back!',
    subtitle: 'We Missed You',
    description: 'Great to see you again! Check out our new menu items.',
    image_url: '/images/banners/welcome-back.jpg',
    bg_gradient: 'linear-gradient(135deg, #2196F3 0%, #1565C0 100%)',
    cta_text: 'Explore Menu',
    cta_link: '/menu',
    targeting_rules: {
      segments: ['recent'],
      conditions: { recent: { last_order_days: { lt: 14 } } },
    },
    priority: 85,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Initialize store with seed data
seedBanners.forEach((banner) => {
  bannerStore.set(banner.id, banner);
});

// ============================================================================
// CRUD Operations (used by admin routes)
// ============================================================================

/**
 * Get all banners (unfiltered)
 * Used by admin UI for full banner list
 */
export function getAllBanners(): Banner[] {
  return Array.from(bannerStore.values());
}

/**
 * Get a banner by ID
 */
export function getBannerById(id: string): Banner | undefined {
  return bannerStore.get(id);
}

/**
 * Create a new banner
 * Returns the created banner
 */
export function createBanner(banner: Banner): Banner {
  bannerStore.set(banner.id, banner);
  return banner;
}

/**
 * Update an existing banner
 * Returns the updated banner or undefined if not found
 */
export function updateBanner(id: string, updates: Partial<Banner>): Banner | undefined {
  const existing = bannerStore.get(id);
  if (!existing) {
    return undefined;
  }

  const updated: Banner = {
    ...existing,
    ...updates,
    id, // Ensure ID doesn't change
    updated_at: new Date().toISOString(),
  };

  bannerStore.set(id, updated);
  return updated;
}

/**
 * Delete a banner by ID
 * Returns true if deleted, false if not found
 */
export function deleteBanner(id: string): boolean {
  return bannerStore.delete(id);
}

// ============================================================================
// Public Query Operations (used by active banners route)
// ============================================================================

/**
 * Get active banners for public display
 * Applies date scheduling filter using isBannerActive()
 *
 * @param now - Current date (defaults to now, allows testing)
 * @returns Array of currently active banners sorted by priority
 */
export function getActiveBanners(now: Date = new Date()): Banner[] {
  const allBanners = getAllBanners();

  // Apply scheduling filter: active flag + date range check
  return allBanners
    .filter((banner) => isBannerActive(banner, now))
    .sort((a, b) => b.priority - a.priority);
}

/**
 * Get active banners with a maximum count
 * Used for carousel display
 *
 * @param maxCount - Maximum number of banners to return
 * @param now - Current date
 * @returns Array of active banners limited to maxCount
 */
export function getActiveBannersLimited(maxCount: number = 5, now: Date = new Date()): Banner[] {
  return getActiveBanners(now).slice(0, maxCount);
}

// ============================================================================
// Store Statistics (for debugging/admin)
// ============================================================================

/**
 * Get store statistics
 */
export function getStoreStats(): {
  total: number;
  active: number;
  scheduled: number;
  expired: number;
} {
  const now = new Date();
  const banners = getAllBanners();

  let active = 0;
  let scheduled = 0;
  let expired = 0;

  for (const banner of banners) {
    if (!banner.active) {
      continue;
    }

    if (banner.start_date && new Date(banner.start_date) > now) {
      scheduled++;
    } else if (banner.end_date && new Date(banner.end_date) < now) {
      expired++;
    } else {
      active++;
    }
  }

  return {
    total: banners.length,
    active,
    scheduled,
    expired,
  };
}

// ============================================================================
// SSOT Compliance Notes
// ============================================================================

/*
 * This module maintains SSOT compliance:
 *
 * 1. Banner data is OVERLAY only:
 *    - Stored in this module (simulating PostgreSQL overlay DB)
 *    - NO writes to INI_Restaurant
 *
 * 2. Date scheduling uses isBannerActive():
 *    - Checks active flag
 *    - Checks start_date (not before now)
 *    - Checks end_date (not after now)
 *
 * 3. In production, replace Map operations with:
 *    - SELECT * FROM banners WHERE active = true AND ...
 *    - INSERT INTO banners ...
 *    - UPDATE banners SET ... WHERE id = ...
 *    - DELETE FROM banners WHERE id = ...
 */
