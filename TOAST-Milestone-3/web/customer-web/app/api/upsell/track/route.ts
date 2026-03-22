import { NextRequest, NextResponse } from 'next/server';
import { overlayDb } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { ruleId, itemId, result, revenue } = await request.json();
    
    // Validate inputs
    if (!ruleId || !itemId || !result) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    if (!['accepted', 'declined'].includes(result)) {
      return NextResponse.json(
        { error: 'Invalid result value' },
        { status: 400 }
      );
    }
    
    // Update impression with result
    await overlayDb.query(`
      UPDATE upsell_impressions
      SET 
        result = $1,
        result_timestamp = GETDATE(),
        revenue_attributed = $2
      WHERE rule_id = $3 
        AND suggested_item_id = $4
        AND result IS NULL
      ORDER BY shown_at DESC
      LIMIT 1
    `, [result, revenue || 0, ruleId, itemId]);
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to track result' },
      { status: 500 }
    );
  }
}
