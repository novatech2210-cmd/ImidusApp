// Cart item
// UPDATED: Now includes size information
export interface CartItem {
  id: string; // Unique cart item ID (itemId + sizeId + timestamp)
  menuItemId: number;
  sizeId: number; // ← NEW: REQUIRED
  name: string;
  sizeName: string; // ← NEW: Display name for size
  price: number; // Unit price for this size
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
  sizeId: number; // ← NEW: REQUIRED
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
