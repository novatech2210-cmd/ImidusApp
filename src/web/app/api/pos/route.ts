import { NextRequest, NextResponse } from 'next/server';
import { getPOSItemsByCategory, getPOSCategories, searchPOSItems, validatePOSItem, validatePOSItems } from '@/overlay/api/pos-validation';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const itemId = searchParams.get('itemId');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (action === 'categories') {
      const categories = await getPOSCategories();
      return NextResponse.json(categories);
    }

    if (action === 'search' && search) {
      const items = await searchPOSItems(search, limit);
      return NextResponse.json(items);
    }

    if (action === 'byCategory' && category) {
      const items = await getPOSItemsByCategory(category);
      return NextResponse.json(items);
    }

    if (action === 'validate' && itemId) {
      const result = await validatePOSItem(itemId);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('POS API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, itemIds } = body;

    if (action === 'validateMultiple' && itemIds && Array.isArray(itemIds)) {
      const result = await validatePOSItems(itemIds);
      // Convert Map to object for JSON serialization
      const obj: Record<string, boolean> = {};
      result.forEach((valid, id) => {
        obj[id] = valid;
      });
      return NextResponse.json(obj);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('POS API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
