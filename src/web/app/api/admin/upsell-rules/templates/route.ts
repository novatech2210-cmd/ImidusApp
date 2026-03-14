import { NextResponse } from 'next/server';
import { overlayDb } from '@/lib/db';

// GET /api/admin/upsell-rules/templates - List available templates
export async function GET() {
  try {
    const result = await overlayDb.query(
      "SELECT id, name, description, template_json, category, created_at FROM upselling_rule_templates ORDER BY category, name"
    );

    return NextResponse.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching upsell rule templates:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}
