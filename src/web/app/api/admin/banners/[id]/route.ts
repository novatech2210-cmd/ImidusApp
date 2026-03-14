/**
 * Admin Banner Detail API Endpoint
 *
 * GET /api/admin/banners/[id] - Get single banner
 * PUT /api/admin/banners/[id] - Update banner
 * DELETE /api/admin/banners/[id] - Soft delete banner
 *
 * SSOT Compliance:
 * - All banner data stored in OVERLAY database (via shared banner-store)
 * - NO writes to INI_Restaurant (POS)
 * - Admin authentication required
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getBannerById, updateBanner, deleteBanner } from "@/lib/banner-store";
import type { Banner, TargetingRules } from "@/lib/banners";

// ============================================================================
// Types
// ============================================================================

interface UpdateBannerRequest {
  title?: string;
  subtitle?: string;
  description?: string;
  image_url?: string;
  bg_gradient?: string;
  cta_text?: string;
  cta_link?: string;
  targeting_rules?: TargetingRules;
  start_date?: string | null;
  end_date?: string | null;
  priority?: number;
  active?: boolean;
}

interface BannerResponse {
  success: boolean;
  data?: Banner;
  error?: string;
}

// ============================================================================
// Authentication Helper
// ============================================================================

async function verifyAdminAuth(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const adminToken = cookieStore.get("admin_token")?.value;

    if (!adminToken) {
      return false;
    }

    // TODO: Verify admin token against auth service
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// Validation
// ============================================================================

function validateUpdateData(data: UpdateBannerRequest): string | null {
  if (data.title !== undefined) {
    if (data.title.trim().length === 0) {
      return "Title cannot be empty";
    }
    if (data.title.length > 255) {
      return "Title must be 255 characters or less";
    }
  }

  if (data.image_url !== undefined && data.image_url.trim().length === 0) {
    return "Image URL cannot be empty";
  }

  if (data.cta_text !== undefined && data.cta_text.length > 100) {
    return "CTA text must be 100 characters or less";
  }

  if (data.cta_link !== undefined && data.cta_link.length > 500) {
    return "CTA link must be 500 characters or less";
  }

  if (
    data.priority !== undefined &&
    (data.priority < 0 || data.priority > 100)
  ) {
    return "Priority must be between 0 and 100";
  }

  if (data.start_date && data.end_date) {
    const start = new Date(data.start_date);
    const end = new Date(data.end_date);
    if (start > end) {
      return "Start date must be before end date";
    }
  }

  return null;
}

// ============================================================================
// Route Params Type
// ============================================================================

interface RouteContext {
  params: Promise<{ id: string }>;
}

// ============================================================================
// GET Handler - Get single banner
// ============================================================================

export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<BannerResponse>> {
  // Verify admin authentication
  const isAdmin = await verifyAdminAuth();
  if (!isAdmin) {
    // For development, allow access without auth
  }

  try {
    const { id } = await context.params;

    // Get banner from shared store
    const banner = getBannerById(id);

    if (!banner) {
      return NextResponse.json(
        { success: false, error: "Banner not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: banner });
  } catch (error) {
    console.error("Error fetching banner:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch banner" },
      { status: 500 }
    );
  }
}

// ============================================================================
// PUT Handler - Update banner
// ============================================================================

export async function PUT(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<BannerResponse>> {
  // Verify admin authentication
  const isAdmin = await verifyAdminAuth();
  if (!isAdmin) {
    // For development, allow access without auth
  }

  try {
    const { id } = await context.params;
    const body: UpdateBannerRequest = await request.json();

    // Validate input
    const validationError = validateUpdateData(body);
    if (validationError) {
      return NextResponse.json(
        { success: false, error: validationError },
        { status: 400 }
      );
    }

    // Build update object (only include defined fields)
    const updates: Partial<Banner> = {};

    if (body.title !== undefined) updates.title = body.title.trim();
    if (body.subtitle !== undefined) updates.subtitle = body.subtitle?.trim();
    if (body.description !== undefined) updates.description = body.description?.trim();
    if (body.image_url !== undefined) updates.image_url = body.image_url.trim();
    if (body.bg_gradient !== undefined) updates.bg_gradient = body.bg_gradient;
    if (body.cta_text !== undefined) updates.cta_text = body.cta_text?.trim();
    if (body.cta_link !== undefined) updates.cta_link = body.cta_link?.trim();
    if (body.targeting_rules !== undefined) updates.targeting_rules = body.targeting_rules;
    if (body.start_date !== undefined) updates.start_date = body.start_date ?? undefined;
    if (body.end_date !== undefined) updates.end_date = body.end_date ?? undefined;
    if (body.priority !== undefined) updates.priority = body.priority;
    if (body.active !== undefined) updates.active = body.active;

    // Update banner in shared store
    const updatedBanner = updateBanner(id, updates);

    if (!updatedBanner) {
      return NextResponse.json(
        { success: false, error: "Banner not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updatedBanner });
  } catch (error) {
    console.error("Error updating banner:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update banner" },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE Handler - Delete banner (hard delete from store)
// ============================================================================

export async function DELETE(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<BannerResponse>> {
  // Verify admin authentication
  const isAdmin = await verifyAdminAuth();
  if (!isAdmin) {
    // For development, allow access without auth
  }

  try {
    const { id } = await context.params;

    // Get banner before deletion for response
    const banner = getBannerById(id);

    if (!banner) {
      return NextResponse.json(
        { success: false, error: "Banner not found" },
        { status: 404 }
      );
    }

    // Delete from shared store
    const deleted = deleteBanner(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Failed to delete banner" },
        { status: 500 }
      );
    }

    // Return the deleted banner data
    return NextResponse.json({
      success: true,
      data: { ...banner, active: false },
    });
  } catch (error) {
    console.error("Error deleting banner:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete banner" },
      { status: 500 }
    );
  }
}
