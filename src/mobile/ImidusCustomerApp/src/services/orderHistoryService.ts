/**
 * Order History Service
 * API calls for fetching order history and order details
 */

import apiClient from '../api/apiClient';
import {
  OrderHistoryItem,
  OrderDetail,
  OrderHistoryResponse,
  ReorderItem,
} from '../types/orderHistory.types';

/**
 * Fetch order history for a customer
 * GET /api/orders/history/{customerId}
 */
export const fetchOrderHistory = async (
  customerId: number,
  page: number = 1,
  pageSize: number = 20
): Promise<OrderHistoryResponse> => {
  try {
    const response = await apiClient.get<OrderHistoryResponse>(
      `/Orders/history/${customerId}`,
      {
        params: { page, pageSize },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error('Fetch order history error:', error);
    throw new Error(
      error.response?.data?.error || 'Failed to load order history. Please try again.'
    );
  }
};

/**
 * Fetch detailed information for a specific order
 * GET /api/orders/{orderId}
 */
export const fetchOrderDetails = async (orderId: number): Promise<OrderDetail> => {
  try {
    const response = await apiClient.get<OrderDetail>(`/Orders/${orderId}`);
    return response.data;
  } catch (error: any) {
    console.error('Fetch order details error:', error);
    throw new Error(
      error.response?.data?.error || 'Failed to load order details. Please try again.'
    );
  }
};

/**
 * Get items from a past order formatted for adding to cart
 */
export const getReorderItems = (orderDetail: OrderDetail): ReorderItem[] => {
  return orderDetail.items.map((item) => ({
    menuItemId: item.menuItemId,
    sizeId: item.sizeId,
    name: item.name,
    sizeName: item.sizeName,
    price: item.unitPrice,
    quantity: item.quantity,
  }));
};

/**
 * Map POS TransType to readable status
 * TransType: 0=Refund, 1=Sale (completed), 2=Open
 */
export const mapTransTypeToStatus = (transType: number): string => {
  switch (transType) {
    case 0:
      return 'refunded';
    case 1:
      return 'completed';
    case 2:
      return 'open';
    default:
      return 'unknown';
  }
};

/**
 * Format order date for display
 */
export const formatOrderDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format currency amount
 */
export const formatCurrency = (amount: number): string => {
  return `$${(amount || 0).toFixed(2)}`;
};
