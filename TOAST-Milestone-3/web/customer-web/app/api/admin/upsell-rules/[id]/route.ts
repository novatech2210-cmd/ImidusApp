import { NextRequest, NextResponse } from 'next/server';
import { overlayDb } from '@/lib/db';
import { validatePOSItems } from '@/overlay/api/pos-validation';

// GET /api/admin/upsell-rules/[id] - Get single rule
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const result = await overlayDb.query(
      "SELECT id, name, description, priority, active, conditions, suggestions, constraints, created_by, created_at, updated_at FROM upselling_rules WHERE id = $1",
      [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Rule not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching upsell rule:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch rule' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/upsell-rules/[id] - Update rule
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, priority, active, conditions, suggestions, constraints } = body;

    // Validate priority range
    if (priority !== undefined && (priority < 0 || priority > 100)) {
      return NextResponse.json(
        { success: false, error: 'Priority must be between 0 and 100' },
        { status: 400 }
      );
    }

    // Validate suggested items exist in POS if provided
    if (suggestions && Array.isArray(suggestions) && suggestions.length > 0) {
      const itemIds = suggestions.map((s: any) => s.pos_item_id);
      const validation = await validatePOSItems(itemIds);
      
      const invalidItems = itemIds.filter((id: string) => !validation.get(id));
      if (invalidItems.length > 0) {
        return NextResponse.json(
          { success: false, error: `Invalid item IDs: ${invalidItems.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Check if rule exists
    const checkResult = await overlayDb.query(
      'SELECT id FROM upselling_rules WHERE id = $1',
      [id]
    );
    
    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Rule not found' },
        { status: 404 }
      );
    }

    // Update rule
    const result = await overlayDb.query(
      "UPDATE upselling_rules SET name = COALESCE($1, name), description = COALESCE($2, description), priority = COALESCE($3, priority), active = COALESCE($4, active), conditions = COALESCE($5, conditions), suggestions = COALESCE($6, suggestions), constraints = COALESCE($7, constraints), updated_at = GETDATE() WHERE id = $8 RETURNING id, name, description, priority, active, conditions, suggestions, constraints, created_by, created_at, updated_at",
      [
        name,
        description,
        priority,
        active,
        conditions ? JSON.stringify(conditions) : null,
        suggestions ? JSON.stringify(suggestions) : null,
        constraints ? JSON.stringify(constraints) : null,
        id
      ]);

    return NextResponse.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating upsell rule:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update rule' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/upsell-rules/[id] - Soft delete rule (set active=false)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Soft delete by setting active to false
    const result = await overlayDb.query(
      "UPDATE upselling_rules SET active = 0, updated_at = GETDATE() WHERE id = $1 RETURNING id, name, active",
      [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Rule not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'Rule soft-deleted (set to inactive)'
    });
  } catch (error) {
    console.error('Error deleting upsell rule:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete rule' },
      { status: 500 }
    );
  }
}
