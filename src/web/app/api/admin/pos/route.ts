import { NextRequest, NextResponse } from 'next/server';
import { MenuAPI } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const categoryId = searchParams.get('categoryId');
    const search = searchParams.get('search');

    if (search) {
      // Search menu items via backend API
      // Note: Backend doesn't have search endpoint, so return empty for now
      return NextResponse.json([]);
    }

    if (categoryId) {
      // Get items by category
      const items = await MenuAPI.getItemsByCategory(parseInt(categoryId));
      return NextResponse.json(items);
    }

    // Get all categories
    const categories = await MenuAPI.getCategories();
    return NextResponse.json(categories);

  } catch (error) {
    console.error('POS proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch from POS' },
      { status: 500 }
    );
  }
}
