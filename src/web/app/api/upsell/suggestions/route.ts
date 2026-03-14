import { NextRequest, NextResponse } from 'next/server';
import { evaluateUpsellRules } from '@/lib/rule-engine';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    const { cart } = await request.json();
    
    // Validate cart structure
    if (!cart || !cart.items || !Array.isArray(cart.items)) {
      return NextResponse.json(
        { error: 'Invalid cart data' },
        { status: 400 }
      );
    }
    
    // Get session ID
    const sessionId = session?.sessionId || crypto.randomUUID();
    const customerId = session?.user?.posCustomerId;
    
    // Evaluate rules and get suggestions
    const suggestions = await evaluateUpsellRules(
      cart,
      sessionId,
      customerId
    );
    
    return NextResponse.json({
      suggestions,
      _meta: {
        session_id: sessionId,
        evaluated_at: new Date().toISOString(),
        total_rules_evaluated: suggestions.length
      }
    });
    
  } catch (error) {
    console.error('Upsell suggestions error:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}

// Helper to get server session (mock implementation for now)
async function getServerSession(): Promise<any> {
  // In a real implementation, this would use NextAuth or similar
  // For now, return undefined to use session ID generation
  return undefined;
}
