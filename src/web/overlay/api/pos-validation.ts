import { posDb } from '@/lib/db';

// POS MenuItem type definition
export interface POSMenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  image_url?: string;
  available: boolean;
  _source: string;
  _readonly: boolean;
}

/**
 * SSOT Exception: Direct POS Read Access
 * 
 * This module provides READ-ONLY access to INI_Restaurant for performance.
 * Per architecture rules:
 * - Read from POS anytime: ALLOWED ✓
 * - Write to POS: ONLY through backend API
 * 
 * This is intentional - menu validation requires real-time POS data
 * and does not modify any POS data.
 */
export async function validatePOSItem(
  itemId: string
): Promise<{ valid: boolean; item?: POSMenuItem }> {
  try {
    // READ from POS menu_items (SSOT)
    const result = await posDb.query(
      "SELECT id, name, price, category, image_url, available FROM menu_items WHERE id = $1",
      [itemId]);
    
    if (result.rows.length === 0) {
      return { valid: false };
    }
    
    const item = result.rows[0];
    
    return {
      valid: true,
      item: {
        id: item.id,
        name: item.name,
        price: item.price,
        category: item.category,
        image_url: item.image_url,
        available: item.available,
        _source: 'INI_Restaurant',
        _readonly: true
      }
    };
  } catch (error) {
    console.error('POS validation error:', error);
    return { valid: false };
  }
}

/**
 * Validate multiple items in batch
 */
export async function validatePOSItems(
  itemIds: string[]
): Promise<Map<string, boolean>> {
  const result = await posDb.query(
    "SELECT id FROM menu_items WHERE id = ANY($1)",
    [itemIds]);

  const validIds = new Set(result.rows.map((r: any) => r.id));
  const validationMap = new Map<string, boolean>();
  
  itemIds.forEach(id => {
    validationMap.set(id, validIds.has(id));
  });
  
  return validationMap;
}

/**
 * Get menu items by category (READ-ONLY)
 */
export async function getPOSItemsByCategory(
  category: string
): Promise<POSMenuItem[]> {
  const result = await posDb.query(
    "SELECT id, name, price, category, image_url, available FROM menu_items WHERE category = $1 AND available = true ORDER BY name",
    [category]);
  
  return result.rows.map((row: any) => ({
    ...row,
    _source: 'INI_Restaurant',
    _readonly: true
  }));
}

/**
 * Get all categories from POS (READ-ONLY)
 */
export async function getPOSCategories(): Promise<string[]> {
  const result = await posDb.query(
    "SELECT DISTINCT category FROM menu_items WHERE available = true ORDER BY category");
  
  return result.rows.map((row: any) => row.category);
}

/**
 * Search menu items by name (READ-ONLY)
 */
export async function searchPOSItems(
  searchTerm: string,
  limit: number = 20
): Promise<POSMenuItem[]> {
  const result = await posDb.query(
    "SELECT id, name, price, category, image_url, available FROM menu_items WHERE name LIKE $1 AND available = true ORDER BY name LIMIT $2",
    [`%${searchTerm}%`, limit]);
  
  return result.rows.map((row: any) => ({
    ...row,
    _source: 'INI_Restaurant',
    _readonly: true
  }));
}
