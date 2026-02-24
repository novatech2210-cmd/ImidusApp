# Step 5: Mobile App Updates

## 🎯 Goal
Update React Native mobile app to support size selection for menu items and pass `sizeId` to backend API.

**Files to update:**
- `mobile/src/types/menu.types.ts`
- `mobile/src/types/cart.types.ts`
- `mobile/src/features/menu/MenuItemCard.tsx`
- `mobile/src/features/menu/ProductDetailScreen.tsx`
- `mobile/src/features/cart/cartSlice.ts`
- `mobile/src/api/orderApi.ts`

**Estimated time:** 3-4 hours

---

## 🔴 CRITICAL CHANGES

1. **Menu items now have multiple sizes** with different prices
2. **Cart items must store `sizeId` and `sizeName`**
3. **Product detail screen needs size selector UI**
4. **Checkout API call must include `sizeId`**

---

## 📝 Updated Type Definitions

### File: `src/types/menu.types.ts`

```typescript
// Menu item size option
// NEW TYPE - represents one size/price combination
export interface MenuItemSize {
  sizeId: number;
  sizeName: string;  // "Small", "Medium", "Large", "Regular"
  shortName?: string;  // "S", "M", "L"
  price: number;
  inStock: boolean;
  stockQuantity?: number | null;  // null = unlimited
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
```

---

### File: `src/types/cart.types.ts`

```typescript
// Cart item
// UPDATED: Now includes size information
export interface CartItem {
  id: string;  // Unique cart item ID (itemId + sizeId + timestamp)
  menuItemId: number;
  sizeId: number;  // ← NEW: REQUIRED
  name: string;
  sizeName: string;  // ← NEW: Display name for size
  price: number;  // Unit price for this size
  quantity: number;
  imageUrl?: string;

  // Optional customizations (for future)
  specialInstructions?: string;
  modifiers?: number[];
}

// Cart state
export interface CartState {
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
}

// Create order request payload
// UPDATED: Now includes sizeId
export interface CreateOrderRequest {
  items: OrderItemRequest[];
  customerId?: number;
  customerPhone?: string;
  customerName?: string;
  paymentAuthorizationNo: string;
  paymentBatchNo?: string;
  paymentTypeId: number;
  tipAmount: number;
  discountAmount: number;
}

export interface OrderItemRequest {
  menuItemId: number;
  sizeId: number;  // ← NEW: REQUIRED
  quantity: number;
  unitPrice: number;
  specialInstructions?: string;
}

// Order response from API
export interface CreateOrderResponse {
  success: boolean;
  message: string;
  salesId: number;
  orderNumber: string;
  totalAmount: number;
  createdAt: string;
}
```

---

## 📝 Updated Redux Store

### File: `src/features/cart/cartSlice.ts`

```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CartState, CartItem } from '../../types/cart.types';

const initialState: CartState = {
  items: [],
  subtotal: 0,
  tax: 0,
  total: 0,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    // Add item to cart
    // UPDATED: Now requires sizeId and sizeName
    addToCart: (state, action: PayloadAction<{
      menuItemId: number;
      sizeId: number;  // ← NEW
      name: string;
      sizeName: string;  // ← NEW
      price: number;
      quantity: number;
      imageUrl?: string;
    }>) => {
      const { menuItemId, sizeId, name, sizeName, price, quantity, imageUrl } = action.payload;

      // Check if this exact item+size combination exists
      const existingItem = state.items.find(
        item => item.menuItemId === menuItemId && item.sizeId === sizeId
      );

      if (existingItem) {
        // Increment quantity
        existingItem.quantity += quantity;
      } else {
        // Add new item
        const newItem: CartItem = {
          id: `${menuItemId}-${sizeId}-${Date.now()}`,
          menuItemId,
          sizeId,
          name,
          sizeName,
          price,
          quantity,
          imageUrl,
        };
        state.items.push(newItem);
      }

      // Recalculate totals
      calculateTotals(state);
    },

    // Update item quantity
    updateQuantity: (state, action: PayloadAction<{ id: string; quantity: number }>) => {
      const item = state.items.find(i => i.id === action.payload.id);
      if (item) {
        item.quantity = action.payload.quantity;
        if (item.quantity <= 0) {
          state.items = state.items.filter(i => i.id !== action.payload.id);
        }
        calculateTotals(state);
      }
    },

    // Remove item
    removeFromCart: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item.id !== action.payload);
      calculateTotals(state);
    },

    // Clear cart
    clearCart: (state) => {
      state.items = [];
      state.subtotal = 0;
      state.tax = 0;
      state.total = 0;
    },
  },
});

// Helper function to calculate totals
function calculateTotals(state: CartState) {
  state.subtotal = state.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Tax calculation (example: 12% total tax)
  state.tax = state.subtotal * 0.12;
  state.total = state.subtotal + state.tax;

  // Round to 2 decimals
  state.subtotal = Math.round(state.subtotal * 100) / 100;
  state.tax = Math.round(state.tax * 100) / 100;
  state.total = Math.round(state.total * 100) / 100;
}

export const { addToCart, updateQuantity, removeFromCart, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
```

---

## 📝 Updated UI Components

### File: `src/features/menu/ProductDetailScreen.tsx`

```typescript
import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useDispatch } from 'react-redux';
import { addToCart } from '../cart/cartSlice';
import { MenuItem, MenuItemSize } from '../../types/menu.types';

interface Props {
  item: MenuItem;
  onClose: () => void;
}

export const ProductDetailScreen: React.FC<Props> = ({ item, onClose }) => {
  const dispatch = useDispatch();

  // CRITICAL: State for selected size
  const [selectedSize, setSelectedSize] = useState<MenuItemSize | null>(
    item.sizes.length > 0 ? item.sizes[0] : null
  );
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = () => {
    if (!selectedSize) {
      alert('Please select a size');
      return;
    }

    dispatch(
      addToCart({
        menuItemId: item.itemId,
        sizeId: selectedSize.sizeId,  // ← REQUIRED
        name: item.name,
        sizeName: selected Size.sizeName,  // ← REQUIRED
        price: selectedSize.price,
        quantity,
        imageUrl: item.imageUrl,
      })
    );

    onClose();
  };

  return (
    <ScrollView style={styles.container}>
      {/* Product Image */}
      {item.imageUrl && (
        <Image source={{ uri: item.imageUrl }} style={styles.image} />
      )}

      {/* Product Name */}
      <Text style={styles.name}>{item.name}</Text>

      {/* Description */}
      {item.description && (
        <Text style={styles.description}>{item.description}</Text>
      )}

      {/* SIZE SELECTOR - CRITICAL NEW UI */}
      <View style={styles.sizeSelectorContainer}>
        <Text style={styles.sectionTitle}>Select Size</Text>
        <View style={styles.sizeOptions}>
          {item.sizes.map((size) => (
            <TouchableOpacity
              key={size.sizeId}
              style={[
                styles.sizeOption,
                selectedSize?.sizeId === size.sizeId && styles.sizeOptionSelected,
                !size.inStock && styles.sizeOptionDisabled,
              ]}
              onPress={() => size.inStock && setSelectedSize(size)}
              disabled={!size.inStock}
            >
              <Text
                style={[
                  styles.sizeName,
                  selectedSize?.sizeId === size.sizeId && styles.sizeNameSelected,
                ]}
              >
                {size.sizeName}
              </Text>
              <Text
                style={[
                  styles.sizePrice,
                  selectedSize?.sizeId === size.sizeId && styles.sizePriceSelected,
                ]}
              >
                ${size.price.toFixed(2)}
              </Text>
              {!size.inStock && (
                <Text style={styles.outOfStock}>Out of Stock</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Quantity Selector */}
      <View style={styles.quantityContainer}>
        <Text style={styles.sectionTitle}>Quantity</Text>
        <View style={styles.quantityControls}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => setQuantity(Math.max(1, quantity - 1))}
          >
            <Text style={styles.quantityButtonText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.quantityText}>{quantity}</Text>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => setQuantity(quantity + 1)}
          >
            <Text style={styles.quantityButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Add to Cart Button */}
      <TouchableOpacity
        style={[styles.addButton, !selectedSize && styles.addButtonDisabled]}
        onPress={handleAddToCart}
        disabled={!selectedSize}
      >
        <Text style={styles.addButtonText}>
          Add to Cart - ${selectedSize ? (selectedSize.price * quantity).toFixed(2) : '0.00'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  image: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: 16,
  },
  description: {
    fontSize: 16,
    color: '#666',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  // SIZE SELECTOR STYLES
  sizeSelectorContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 16,
  },
  sizeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  sizeOption: {
    flex: 1,
    minWidth: 100,
    padding: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    alignItems: 'center',
  },
  sizeOptionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#E5F1FF',
  },
  sizeOptionDisabled: {
    opacity: 0.5,
    backgroundColor: '#f5f5f5',
  },
  sizeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  sizeNameSelected: {
    color: '#007AFF',
  },
  sizePrice: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  sizePriceSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  outOfStock: {
    fontSize: 12,
    color: '#f44336',
    marginTop: 4,
  },
  // Quantity Controls
  quantityContainer: {
    padding: 16,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  quantityText: {
    fontSize: 20,
    fontWeight: '600',
    marginHorizontal: 24,
  },
  // Add to Cart Button
  addButton: {
    margin: 16,
    padding: 16,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#ccc',
  },
  addButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
});
```

---

### File: `src/features/menu/MenuItemCard.tsx`

```typescript
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { MenuItem } from '../../types/menu.types';

interface Props {
  item: MenuItem;
  onPress: () => void;
}

export const MenuItemCard: React.FC<Props> = ({ item, onPress }) => {
  // Get price range for display
  const prices = item.sizes.map(s => s.price).sort((a, b) => a - b);
  const priceDisplay =
    prices.length === 1
      ? `$${prices[0].toFixed(2)}`
      : `$${prices[0].toFixed(2)} - $${prices[prices.length - 1].toFixed(2)}`;

  // Check if any size is in stock
  const anyInStock = item.sizes.some(s => s.inStock);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} disabled={!anyInStock}>
      {item.imageUrl && (
        <Image source={{ uri: item.imageUrl }} style={styles.image} />
      )}
      <View style={styles.content}>
        <Text style={styles.name}>{item.name}</Text>
        {item.description && (
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        <View style={styles.footer}>
          <Text style={styles.price}>{priceDisplay}</Text>
          {!anyInStock && <Text style={styles.outOfStock}>Out of Stock</Text>}
          {item.sizes.length > 1 && (
            <Text style={styles.sizesAvailable}>
              {item.sizes.length} sizes available
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  image: {
    width: 100,
    height: 100,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  content: {
    flex: 1,
    padding: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  sizesAvailable: {
    fontSize: 12,
    color: '#999',
  },
  outOfStock: {
    fontSize: 12,
    color: '#f44336',
    fontWeight: '600',
  },
});
```

---

## 📝 Updated API Client

### File: `src/api/orderApi.ts`

```typescript
import { CreateOrderRequest, CreateOrderResponse } from '../types/cart.types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://localhost:5001/api';

export const orderApi = {
  /**
   * Create a new order
   * UPDATED: Now sends sizeId for each item
   */
  async createOrder(request: CreateOrderRequest): Promise<CreateOrderResponse> {
    // Generate idempotency key
    const idempotencyKey = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({
        items: request.items.map(item => ({
          menuItemId: item.menuItemId,
          sizeId: item.sizeId,  // ← NOW INCLUDED
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          specialInstructions: item.specialInstructions,
        })),
        customerId: request.customerId,
        customerPhone: request.customerPhone,
        customerName: request.customerName,
        paymentAuthorizationNo: request.paymentAuthorizationNo,
        paymentBatchNo: request.paymentBatchNo,
        paymentTypeId: request.paymentTypeId,
        tipAmount: request.tipAmount,
        discountAmount: request.discountAmount,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create order');
    }

    return response.json();
  },
};
```

---

## 🧪 Testing

### Manual Testing Checklist

- [ ] **Menu Screen**: Items display with "X sizes available" badge
- [ ] **Product Detail**: Size selector appears with all sizes
- [ ] **Product Detail**: Clicking a size updates price display
- [ ] **Product Detail**: Out-of-stock sizes are disabled
- [ ] **Add to Cart**: Item added with correct size and price
- [ ] **Cart Screen**: Shows "Item Name (Size Name)" for each item
- [ ] **Cart Screen**: Different sizes of same item are separate cart items
- [ ] **Checkout**: API call includes `sizeId` for all items
- [ ] **Order Confirmation**: Displays correct totals

---

## 📝 Migration Checklist

- [ ] Update type definitions (`menu.types.ts`, `cart.types.ts`)
- [ ] Update Redux cart slice
- [ ] Update ProductDetailScreen with size selector
- [ ] Update MenuItemCard to show price range
- [ ] Update API client to include sizeId
- [ ] Test on iOS simulator
- [ ] Test on Android emulator
- [ ] Commit: `git add . && git commit -m "Add size selection to mobile app"`

---

## 🚀 Next Step

Once mobile app is updated and tested, proceed to:

**[Step 6: Testing & Verification →](./06_TESTING.md)**

---

**Generated by Novatech** 🚀
