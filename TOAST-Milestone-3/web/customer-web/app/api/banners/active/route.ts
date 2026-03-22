/**
 * Active Banners API Endpoint
 *
 * GET /api/banners/active
 *
 * Returns active banners filtered by customer segment targeting.
 * Customer segments are evaluated in real-time from INI_Restaurant (READ-ONLY).
 *
 * SSOT Compliance:
 * - Customer data READ from INI_Restaurant via segment evaluation
 * - Banner data READ from overlay database (via banner-store)
 * - Date scheduling applied via isBannerActive()
 * - NO writes to POS database
 *
 * Response includes:
 * - banners: Array of targeted banners (max 5)
 * - _meta: Segment evaluation metadata
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  evaluateSegmentsFromData,
  matchesBannerTargeting,
  createGuestSegment,
  type CustomerSegment,
  type TargetedBanner,
} from '@/lib/segments';
import { fetchCustomerDataFromPOS } from '@/overlay/api/customer-segments';
import { getActiveBanners } from '@/lib/banner-store';
import { matchesTargeting, type Banner, MAX_CAROUSEL_BANNERS } from '@/lib/banners';

// ============================================================================
// Types
// ============================================================================

interface ActiveBannersResponse {
  banners: TargetedBanner[];
  _meta: {
    customer_segments: string[];
    source: string;
    readonly: boolean;
    evaluatedAt?: string;
    customerId?: string;
  };
}

// ============================================================================
// Banner Data from Overlay Store
// ============================================================================

/**
 * Gets active banners from overlay database (via shared banner-store)
 * Applies date scheduling filter via isBannerActive() in getActiveBanners()
 *
 * SSOT Compliance:
 * - Uses shared banner store (simulating overlay PostgreSQL)
 * - Date scheduling (start_date/end_date) applied automatically
 * - NO writes to INI_Restaurant
 */
async function getActiveBannersFromOverlay(): Promise<TargetedBanner[]> {
  // Get active banners from shared store (applies date scheduling)
  const banners: Banner[] = getActiveBanners();

  // Transform Banner to TargetedBanner format for segment evaluation
  return banners.map((banner) => ({
    id: banner.id,
    title: banner.title,
    subtitle: banner.subtitle || '',
    description: banner.description || '',
    ctaText: banner.cta_text || 'Order Now',
    ctaLink: banner.cta_link || '/menu',
    bgGradient: banner.bg_gradient || 'linear-gradient(135deg, #1E5AA8 0%, #174785 100%)',
    imageUrl: banner.image_url,
    priority: banner.priority,
    active: banner.active,
    targeting_rules: banner.targeting_rules ? {
      segments: banner.targeting_rules.segments,
      // Map conditions to targeting_rules format
      ...(banner.targeting_rules.conditions?.['high-spend']?.lifetime_value?.gt && {
        minLifetimeValue: banner.targeting_rules.conditions['high-spend'].lifetime_value.gt,
      }),
      ...(banner.targeting_rules.conditions?.frequent?.visit_count?.gt && {
        minVisitCount: banner.targeting_rules.conditions.frequent.visit_count.gt,
      }),
      ...(banner.targeting_rules.conditions?.recent?.last_order_days?.lt && {
        maxDaysSinceLastOrder: banner.targeting_rules.conditions.recent.last_order_days.lt,
      }),
      ...(banner.targeting_rules.conditions?.birthday?.days_range && {
        includesBirthday: true,
      }),
    } : undefined,
  }));
}

// ============================================================================
// Session Helper
// ============================================================================

interface UserSession {
  user?: {
    posCustomerId?: string;
    customerId?: number;
    email?: string;
  };
}

/**
 * Gets customer ID from session/auth
 */
async function getSessionCustomerId(): Promise<string | null> {
  try {
    // Try to get customer ID from auth token
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth_token')?.value;

    if (!authToken) {
      return null;
    }

    // Decode token to get customer ID
    // In production, verify token and extract customerId
    // For now, try to extract from localStorage or session
    const sessionCookie = cookieStore.get('session')?.value;
    if (sessionCookie) {
      try {
        const session: UserSession = JSON.parse(sessionCookie);
        const customerId = session.user?.posCustomerId || session.user?.customerId;
        return customerId ? String(customerId) : null;
      } catch {
        return null;
      }
    }

    return null;
  } catch (error) {
    console.error('Failed to get session customer ID:', error);
    return null;
  }
}

// ============================================================================
// GET Handler
// ============================================================================

export async function GET(request: NextRequest): Promise<NextResponse<ActiveBannersResponse>> {
  try {
    // Get customer ID from session/auth
    const customerId = await getSessionCustomerId();

    // Also check for customerId in query params (for testing)
    const searchParams = request.nextUrl.searchParams;
    const queryCustomerId = searchParams.get('customerId');
    const effectiveCustomerId = queryCustomerId || customerId;

    // Fetch all active banners from overlay DB
    const allBanners = await getActiveBannersFromOverlay();

    // If no customer ID, return banners with no targeting
    if (!effectiveCustomerId) {
      const guestSegment = createGuestSegment();
      const untargetedBanners = allBanners.filter(
        (banner) =>
          !banner.targeting_rules ||
          !banner.targeting_rules.segments ||
          banner.targeting_rules.segments.length === 0
      );

      return NextResponse.json({
        banners: untargetedBanners
          .filter((b) => b.active)
          .sort((a, b) => b.priority - a.priority)
          .slice(0, 5),
        _meta: {
          customer_segments: guestSegment.segments,
          source: 'guest',
          readonly: true,
          evaluatedAt: new Date().toISOString(),
        },
      });
    }

    // Evaluate customer segments (READ from INI_Restaurant)
    let customerSegment: CustomerSegment;

    try {
      const customerData = await fetchCustomerDataFromPOS(effectiveCustomerId);
      if (customerData) {
        customerSegment = evaluateSegmentsFromData(customerData);
      } else {
        customerSegment = createGuestSegment();
      }
    } catch (error) {
      console.error('Failed to evaluate customer segments:', error);
      // Fall back to guest segment if evaluation fails
      customerSegment = createGuestSegment();
    }

    // Filter banners by targeting rules
    const targetedBanners = allBanners.filter((banner) =>
      matchesBannerTargeting(
        customerSegment.segments,
        banner.targeting_rules,
        customerSegment.metadata
      )
    );

    // Sort by priority and limit to 5
    const finalBanners = targetedBanners
      .filter((b) => b.active)
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 5);

    return NextResponse.json({
      banners: finalBanners,
      _meta: {
        customer_segments: customerSegment.segments,
        source: 'INI_Restaurant',
        readonly: true,
        evaluatedAt: customerSegment.evaluatedAt,
        customerId: effectiveCustomerId,
      },
    });
  } catch (error) {
    console.error('Failed to fetch targeted banners:', error);

    return NextResponse.json(
      {
        banners: [],
        _meta: {
          customer_segments: [],
          source: 'error',
          readonly: true,
        },
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST Handler (for testing segment evaluation)
// ============================================================================

interface EvaluateSegmentRequest {
  customerId: string;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<CustomerSegment | { error: string }>> {
  try {
    const body: EvaluateSegmentRequest = await request.json();
    const { customerId } = body;

    if (!customerId) {
      return NextResponse.json({ error: 'customerId is required' }, { status: 400 });
    }

    // Evaluate customer segments (READ from INI_Restaurant)
    const customerData = await fetchCustomerDataFromPOS(customerId);
    const customerSegment = customerData 
      ? evaluateSegmentsFromData(customerData)
      : createGuestSegment();

    return NextResponse.json(customerSegment);
  } catch (error) {
    console.error('Failed to evaluate segments:', error);
    return NextResponse.json({ error: 'Failed to evaluate segments' }, { status: 500 });
  }
}
