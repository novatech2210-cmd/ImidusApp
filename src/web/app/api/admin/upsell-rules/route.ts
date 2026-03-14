import { NextRequest, NextResponse } from 'next/server';
import { overlayDb } from '@/lib/db';
import { validatePOSItems } from '@/overlay/api/pos-validation';

// GET /api/admin/upsell-rules - List all rules with pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Get total count
    const countResult = await overlayDb.query(
      "SELECT COUNT(*) as total FROM upselling_rules"
    );
    const total = countResult.rows[0].total;

    // Get rules with pagination
    const result = await overlayDb.query(
      "SELECT id, name, description, priority, active, conditions, suggestions, constraints, created_by, created_at, updated_at FROM upselling_rules ORDER BY priority DESC, created_at DESC OFFSET $1 ROWS FETCH NEXT $2 ROWS ONLY",
      [offset, limit]);

    return NextResponse.json({
      success: true,
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching upsell rules:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch rules' },
      { status: 500 }
    );
  }
}

// POST /api/admin/upsell-rules - Create new rule
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, priority, active, conditions, suggestions, constraints, createdBy } = body;

    // Validate required fields
    if (!name || !suggestions || !Array.isArray(suggestions) || suggestions.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Name and at least one suggestion are required' },
        { status: 400 }
      );
    }

    // Validate priority range
    if (priority !== undefined && (priority < 0 || priority > 100)) {
      return NextResponse.json(
        { success: false, error: 'Priority must be between 0 and 100' },
        { status: 400 }
      );
    }

    // Validate suggested items exist in POS
    const itemIds = suggestions.map((s: any) => s.pos_item_id);
    const validation = await validatePOSItems(itemIds);
    
    const invalidItems = itemIds.filter((id: string) => !validation.get(id));
    if (invalidItems.length > 0) {
      return NextResponse.json(
        { success: false, error: `Invalid item IDs: ${invalidItems.join(', ')}` },
        { status: 400 }
      );
    }

    // Insert new rule
    const result = await overlayDb.query(
      "INSERT INTO upselling_rules (name, description, priority, active, conditions, suggestions, constraints, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, name, description, priority, active, conditions, suggestions, constraints, created_by, created_at, updated_at",
      [
        name,
        description || null,
        priority || 0,
        active !== undefined ? active : true,
        JSON.stringify(conditions || {}),
        JSON.stringify(suggestions),
        JSON.stringify(constraints || {}),
        createdBy || null
      ]);

    return NextResponse.json({
      success: true,
      data: result.rows[0]
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating upsell rule:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create rule' },
      { status: 500 }
    );
  }
}
