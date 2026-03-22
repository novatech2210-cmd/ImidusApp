/**
 * Order History Types
 * Types for order history feature - past orders, details, and reorder functionality
 */

/**
 * Summary item shown in order history list
 */
export interface OrderHistoryItem {
  id: number;
  dailyOrderNumber: number;
  orderDate: string;
  itemCount: number;
  total: number;
  status: OrderStatus;
  customerName?: string;
}

/**
 * Order status enum matching POS TransType values
 * TransType: 0=Refund, 1=Sale (completed), 2=Open
 */
export type OrderStatus = 'open' | 'completed' | 'refunded' | 'cancelled';

/**
 * Detailed order information including line items
 */
export interface OrderDetail {
  id: number;
  dailyOrderNumber: number;
  orderDate: string;
  status: OrderStatus;
  customerName?: string;
  customerPhone?: string;
  subtotal: number;
  taxAmount: number;
  tipAmount: number;
  discountAmount: number;
  total: number;
  items: OrderDetailItem[];
  payments: OrderPayment[];
}

/**
 * Individual line item in an order
 */
export interface OrderDetailItem {
  id: number;
  menuItemId: number;
  sizeId: number;
  name: string;
  sizeName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  specialInstructions?: string;
}

/**
 * Payment record for an order
 */
export interface OrderPayment {
  id: number;
  paymentTypeId: number;
  paymentTypeName: string;
  amount: number;
  authorizationNumber?: string;
  paidAt: string;
}

/**
 * Order history state for Redux store
 */
export interface OrderHistoryState {
  orders: OrderHistoryItem[];
  selectedOrder: OrderDetail | null;
  loading: boolean;
  detailLoading: boolean;
  error: string | null;
}

/**
 * API response for order history list
 */
export interface OrderHistoryResponse {
  orders: OrderHistoryItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

/**
 * Item to add to cart when reordering
 */
export interface ReorderItem {
  menuItemId: number;
  sizeId: number;
  name: string;
  sizeName: string;
  price: number;
  quantity: number;
}
