import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CartItem, CartState } from '../types/cart.types';

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
    addToCart: (
      state,
      action: PayloadAction<{
        menuItemId: number;
        sizeId: number;
        name: string;
        sizeName: string;
        price: number;
        quantity: number;
        imageUrl?: string;
      }>,
    ) => {
      const {menuItemId, sizeId, name, sizeName, price, quantity, imageUrl} =
        action.payload;

      // Check if this exact item+size combination exists
      const existingItem = state.items.find(
        item => item.menuItemId === menuItemId && item.sizeId === sizeId,
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
    updateQuantity: (
      state,
      action: PayloadAction<{id: string; quantity: number}>,
    ) => {
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
    clearCart: state => {
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
    0,
  );

  // Tax calculation (example: 12% total tax)
  state.tax = state.subtotal * 0.12;
  state.total = state.subtotal + state.tax;

  // Round to 2 decimals
  state.subtotal = Math.round(state.subtotal * 100) / 100;
  state.tax = Math.round(state.tax * 100) / 100;
  state.total = Math.round(state.total * 100) / 100;
}

export const {addToCart, updateQuantity, removeFromCart, clearCart} =
  cartSlice.actions;
export default cartSlice.reducer;
