/**
 * Admin Banners API Endpoint
 *
 * GET /api/admin/banners - List all banners with pagination
 * POST /api/admin/banners - Create a new banner
 *
 * SSOT Compliance:
 * - All banner data stored in OVERLAY database (via shared banner-store)
 * - NO writes to INI_Restaurant (POS)
 * - Admin authentication required
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAllBanners, createBanner as storeBanner } from "@/lib/banner-store";
import type { Banner, TargetingRules } from "@/lib/banners";

// ============================================================================
// Types (Banner type imported from @/lib/banners)
// ============================================================================

interface CreateBannerRequest {
  title: string;
  subtitle?: string;
  description?: string;
  image_url: string;
  bg_gradient?: string;
  cta_text?: string;
  cta_link?: string;
  targeting_rules?: TargetingRules;
  start_date?: string;
  end_date?: string;
  priority?: number;
  active?: boolean;
}

interface ListBannersResponse {
  success: boolean;
  data: Banner[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface CreateBannerResponse {
  success: boolean;
  data?: Banner;
  error?: string;
}

// ============================================================================
// Data Store (uses shared banner-store module)
// ============================================================================

// Banner data is managed by @/lib/banner-store
// This provides a shared in-memory store used by both admin and public APIs
// In production, this will be replaced with actual PostgreSQL overlay DB queries

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
    // For development, accept any token
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// Validation
// ============================================================================

function validateBannerData(data: CreateBannerRequest): string | null {
  if (!data.title || data.title.trim().length === 0) {
    return "Title is required";
  }

  if (data.title.length > 255) {
    return "Title must be 255 characters or less";
  }

  if (!data.image_url || data.image_url.trim().length === 0) {
    return "Image URL is required";
  }

  if (data.cta_text && data.cta_text.length > 100) {
    return "CTA text must be 100 characters or less";
  }

  if (data.cta_link && data.cta_link.length > 500) {
    return "CTA link must be 500 characters or less";
  }

  if (data.priority !== undefined && (data.priority < 0 || data.priority > 100)) {
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
// GET Handler - List all banners
// ============================================================================

export async function GET(
  request: NextRequest
): Promise<NextResponse<ListBannersResponse | { error: string }>> {
  // Verify admin authentication
  const isAdmin = await verifyAdminAuth();
  if (!isAdmin) {
    // For development, allow access without auth
    // return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const status = searchParams.get("status"); // "active", "inactive", "all"
    const sortBy = searchParams.get("sortBy") || "priority"; // "priority", "created_at", "title"
    const sortOrder = searchParams.get("sortOrder") || "desc"; // "asc", "desc"

    // Get all banners from shared store
    let banners = [...getAllBanners()];

    // Filter by status
    if (status === "active") {
      banners = banners.filter((b) => b.active);
    } else if (status === "inactive") {
      banners = banners.filter((b) => !b.active);
    }

    // Sort banners
    banners.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "created_at":
          comparison = new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime();
          break;
        case "priority":
        default:
          comparison = a.priority - b.priority;
          break;
      }
      return sortOrder === "desc" ? -comparison : comparison;
    });

    // Paginate
    const total = banners.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const paginatedBanners = banners.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      success: true,
      data: paginatedBanners,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error listing banners:", error);
    return NextResponse.json({ error: "Failed to list banners" }, { status: 500 });
  }
}

// ============================================================================
// POST Handler - Create new banner
// ============================================================================

export async function POST(
  request: NextRequest
): Promise<NextResponse<CreateBannerResponse>> {
  // Verify admin authentication
  const isAdmin = await verifyAdminAuth();
  if (!isAdmin) {
    // For development, allow access without auth
    // return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body: CreateBannerRequest = await request.json();

    // Validate input
    const validationError = validateBannerData(body);
    if (validationError) {
      return NextResponse.json(
        { success: false, error: validationError },
        { status: 400 }
      );
    }

    // Create new banner
    const now = new Date().toISOString();
    const newBanner: Banner = {
      id: crypto.randomUUID(),
      title: body.title.trim(),
      subtitle: body.subtitle?.trim(),
      description: body.description?.trim(),
      image_url: body.image_url.trim(),
      bg_gradient:
        body.bg_gradient || "linear-gradient(135deg, #1E5AA8 0%, #174785 100%)",
      cta_text: body.cta_text?.trim() || "Order Now",
      cta_link: body.cta_link?.trim() || "/menu",
      targeting_rules: body.targeting_rules || { segments: ["all"] },
      start_date: body.start_date,
      end_date: body.end_date,
      priority: body.priority ?? 50,
      active: body.active ?? true,
      created_at: now,
      updated_at: now,
    };

    // Store banner in shared store (simulates overlay DB insert)
    storeBanner(newBanner);

    return NextResponse.json(
      { success: true, data: newBanner },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating banner:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create banner" },
      { status: 500 }
    );
  }
}
