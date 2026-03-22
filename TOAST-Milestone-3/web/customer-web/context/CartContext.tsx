"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export interface CartItem {
  id: string; // Unique ID combining menuItemId and sizeId
  menuItemId: number;
  sizeId: number;
  name: string;
  sizeName: string;
  price: number;
  quantity: number;
  image?: string;
  categoryName?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity" | "id">) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clearCart: () => void;
  total: number;
  subtotal: number;
  tax: number;
  count: number;
  isHydrated: boolean;
}

const CartContext = createContext<CartContextType | null>(null);

// Tax rates matching POS system (Maryland: 6% GST, 0% PST)
const GST_RATE = 0.06;
const PST_RATE = 0.00;

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load cart from localStorage on mount (client-side only)
  useEffect(() => {
    try {
      const saved = localStorage.getItem("cart");
      if (saved) {
        const parsed = JSON.parse(saved);
        // Validate parsed data is an array
        if (Array.isArray(parsed)) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setItems(parsed);
        }
      }
    } catch (error) {
      // If parsing fails, start with empty cart
      console.error("Failed to parse cart from localStorage:", error);
    }
     
    setIsHydrated(true);
  }, []);

  // Save cart to localStorage whenever items change (after hydration)
  useEffect(() => {
    if (isHydrated) {
      try {
        localStorage.setItem("cart", JSON.stringify(items));
      } catch (error) {
        console.error("Failed to save cart to localStorage:", error);
      }
    }
  }, [items, isHydrated]);

  /**
   * Add item to cart (increments quantity if already exists)
   */
  const addItem = (item: Omit<CartItem, "quantity" | "id">) => {
    const id = `${item.menuItemId}-${item.sizeId}`;
    setItems((prev) => {
      const existing = prev.find((i) => i.id === id);
      if (existing) {
        return prev.map((i) =>
          i.id === id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, id, quantity: 1 }];
    });
  };

  /**
   * Remove item from cart by ID
   */
  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  /**
   * Update item quantity (removes if qty <= 0)
   */
  const updateQty = (id: string, qty: number) => {
    if (qty <= 0) {
      return removeItem(id);
    }
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity: qty } : i))
    );
  };

  /**
   * Clear all items from cart
   */
  const clearCart = () => {
    setItems([]);
  };

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * (GST_RATE + PST_RATE);
  const total = subtotal + tax;
  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQty,
        clearCart,
        total,
        subtotal,
        tax,
        count,
        isHydrated,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return ctx;
};
