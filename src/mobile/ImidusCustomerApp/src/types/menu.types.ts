// Menu item size option
// NEW TYPE - represents one size/price combination
export interface MenuItemSize {
  sizeId: number;
  sizeName: string; // "Small", "Medium", "Large", "Regular"
  shortName?: string; // "S", "M", "L"
  price: number;
  inStock: boolean;
  stockQuantity?: number | null; // null = unlimited
  displayOrder: number;
}

// Menu item
// UPDATED: Now has sizes array instead of single price
export interface MenuItem {
  itemId: number;
  name: string;
  description?: string;
  imageUrl?: string;
  categoryId: number;
  categoryName?: string;
  isAlcohol: boolean;
  isAvailable: boolean;

  // CRITICAL: Now array of sizes
  sizes: MenuItemSize[];

  // Deprecated: For backward compatibility
  /** @deprecated Use sizes[0].price instead */
  price?: number;
}

// Menu response from API
export interface MenuResponse {
  items: MenuItem[];
  categories?: Category[];
}

export interface Category {
  categoryId: number;
  name: string;
  displayOrder: number;
}
