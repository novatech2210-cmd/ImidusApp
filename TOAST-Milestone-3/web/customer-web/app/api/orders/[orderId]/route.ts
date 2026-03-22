import { NextRequest, NextResponse } from 'next/server';

/**
 * READ-ONLY Order Details Endpoint
 * 
 * SSOT Compliance:
 * - Queries INI_Restaurant (single source of truth)
 * - NO writes to POS database
 * - Display layer only
 * 
 * @param orderId - POS order ID from INI_Restaurant
 * @returns Order details from SSOT
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;

  // Validate order ID
  if (!orderId || orderId.trim() === '') {
    return NextResponse.json(
      { error: 'Order ID is required' },
      { status: 400 }
    );
  }

  try {
    // Query POS backend (READ-ONLY)
    // This assumes your backend has a connector to INI_Restaurant
    const posBackendUrl = process.env.POS_BACKEND_URL;
    const posApiKey = process.env.POS_API_KEY;

    if (!posBackendUrl || !posApiKey) {
      console.error('POS configuration missing in environment');
      return NextResponse.json(
        { error: 'POS system configuration error' },
        { status: 500 }
      );
    }

    const posOrder = await fetch(
      `${posBackendUrl}/api/orders/${orderId}`,
      {
        method: 'GET', // EXPLICIT READ-ONLY
        headers: {
          'Authorization': `Bearer ${posApiKey}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store', // Always fetch fresh data from SSOT
      }
    );

    if (!posOrder.ok) {
      if (posOrder.status === 404) {
        return NextResponse.json(
          { error: 'Order not found in POS system' },
          { status: 404 }
        );
      }
      
      throw new Error(`POS returned status ${posOrder.status}`);
    }

    const orderData = await posOrder.json();

    // Return data AS-IS from POS with SSOT markers
    return NextResponse.json({
      ...orderData,
      // SSOT markers (for verification)
      _meta: {
        source: 'INI_Restaurant',
        readonly: true,
        fetchedAt: new Date().toISOString(),
        orderId: orderId,
      }
    });

  } catch (error) {
    console.error('Failed to fetch order from POS:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to connect to POS system',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST/PUT/DELETE are NOT allowed
 * POS data is read-only from this layer
 */
export async function POST() {
  return NextResponse.json(
    { error: 'SSOT Violation: Cannot modify POS data from display layer' },
    { status: 403 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'SSOT Violation: Cannot modify POS data from display layer' },
    { status: 403 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'SSOT Violation: Cannot modify POS data from display layer' },
    { status: 403 }
  );
}
