import { NextRequest, NextResponse } from 'next/server';

/**
 * READ-ONLY Order Status Endpoint
 * 
 * SSOT Compliance:
 * - Polls INI_Restaurant for real-time order status
 * - NO writes to POS database
 * - Status updates come from POS kitchen display system
 * 
 * @param orderId - POS order ID
 * @returns Current order status from SSOT
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;

  if (!orderId || orderId.trim() === '') {
    return NextResponse.json(
      { error: 'Order ID is required' },
      { status: 400 }
    );
  }

  try {
    const posBackendUrl = process.env.POS_BACKEND_URL;
    const posApiKey = process.env.POS_API_KEY;

    if (!posBackendUrl || !posApiKey) {
      return NextResponse.json(
        { error: 'POS system configuration error' },
        { status: 500 }
      );
    }

    // Query POS for order status (READ-ONLY)
    const posStatus = await fetch(
      `${posBackendUrl}/api/orders/${orderId}/status`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${posApiKey}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store', // Real-time status
      }
    );

    if (!posStatus.ok) {
      if (posStatus.status === 404) {
        return NextResponse.json(
          { error: 'Order status not found in POS' },
          { status: 404 }
        );
      }
      
      throw new Error(`POS returned status ${posStatus.status}`);
    }

    const statusData = await posStatus.json();

    return NextResponse.json({
      orderId,
      status: statusData.status, // From POS (SSOT)
      estimatedReadyTime: statusData.estimatedReadyTime,
      currentStep: statusData.currentStep,
      // SSOT markers
      _meta: {
        source: 'INI_Restaurant',
        readonly: true,
        timestamp: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('Failed to fetch status from POS:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch order status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Prevent status updates from display layer
export async function POST() {
  return NextResponse.json(
    { error: 'SSOT Violation: Status updates must come from POS kitchen system' },
    { status: 403 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'SSOT Violation: Status updates must come from POS kitchen system' },
    { status: 403 }
  );
}
