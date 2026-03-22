import { NextRequest, NextResponse } from 'next/server';

/**
 * READ-ONLY Order History Endpoint
 * 
 * SSOT Compliance:
 * - Queries INI_Restaurant for order history
 * - NO writes to POS database
 * 
 * @returns List of orders from SSOT
 */
export async function GET(request: NextRequest) {
  try {
    const posBackendUrl = process.env.POS_BACKEND_URL;
    const posApiKey = process.env.POS_API_KEY;

    if (!posBackendUrl || !posApiKey) {
      return NextResponse.json(
        { error: 'POS system configuration error' },
        { status: 500 }
      );
    }

    // Optional: Get customer ID from query params
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');

    let url = `${posBackendUrl}/api/orders`;
    if (customerId) {
      url += `?customerId=${customerId}`;
    }

    const posOrders = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${posApiKey}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!posOrders.ok) {
      throw new Error(`POS returned status ${posOrders.status}`);
    }

    const ordersData = await posOrders.json();

    return NextResponse.json({
      orders: ordersData,
      _meta: {
        source: 'INI_Restaurant',
        readonly: true,
        fetchedAt: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('Failed to fetch order history from POS:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch order history',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
