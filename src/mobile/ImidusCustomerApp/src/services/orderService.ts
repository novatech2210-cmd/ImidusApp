import apiClient from '../api/apiClient';
import { PaymentToken } from '../types/payment.types';

import { ENV } from '../config/environment';

const API_BASE_URL = ENV.API_BASE_URL;

/**
 * Request body for creating an order
 */
export interface CreateOrderRequest {
  customerId: number | null;
  items: {
    menuItemId: number;
    sizeId: number;
    quantity: number;
    unitPrice: number;
  }[];
  tipAmount: number;
}

/**
 * Response from creating an order
 */
export interface CreateOrderResponse {
  salesId: number;
  dailyOrderNumber: number;
  orderTotal: number;
  gstTotal: number;
  pstTotal: number;
}

/**
 * Order completion result from backend
 */
interface OrderCompletionResult {
  success: boolean;
  transactionId: string;
  ticketId: number;
  dailyOrderNumber: number;
  errorMessage?: string;
}

/**
 * Create a new order in the POS system
 * Calls backend POST /api/Orders to create tblSales + tblPendingOrders entries
 *
 * @param customerId Customer ID for logged-in users, null for guest orders
 * @param cartItems Array of cart items with menuItemId, sizeId, quantity, price
 * @param tipAmount Optional tip amount (defaults to 0)
 * @returns CreateOrderResponse with salesId and server-validated totals
 */
export const createOrder = async (
  customerId: number | null,
  cartItems: Array<{
    menuItemId: number;
    sizeId: number;
    quantity: number;
    price: number;
  }>,
  tipAmount: number = 0
): Promise<CreateOrderResponse> => {
  try {
    // Generate idempotency key to prevent duplicate orders on retry
    const idempotencyKey = `cart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const orderRequest: CreateOrderRequest = {
      customerId,
      items: cartItems.map(item => ({
        menuItemId: item.menuItemId,
        sizeId: item.sizeId,
        quantity: item.quantity,
        unitPrice: item.price, // Server will re-validate from tblAvailableSize
      })),
      tipAmount,
    };

    const response = await apiClient.post<CreateOrderResponse>('/Orders', orderRequest, {
      headers: {
        'Idempotency-Key': idempotencyKey,
      },
    });

    return response.data;
  } catch (error: any) {
    console.error('Create order error:', error);
    throw new Error(
      error.response?.data?.error || 'Failed to create order. Please try again.'
    );
  }
};

/**
 * Complete payment for an open order
 * Sends payment token to backend which processes payment via Authorize.net
 * and posts to POS database
 *
 * @param salesId POS sales ID of the open order
 * @param paymentToken Opaque payment token from Authorize.net tokenization
 * @param amount Total order amount to charge
 * @param dailyOrderNumber Order number for invoice reference
 * @param customerId Optional customer ID for loyalty points redemption
 * @param pointsToRedeem Optional points to redeem for discount
 * @returns OrderCompletionResult with transaction details or error
 */
export async function completePayment(
  salesId: number,
  paymentToken: PaymentToken,
  amount: number,
  dailyOrderNumber: number,
  customerId?: number | null,
  pointsToRedeem?: number
): Promise<OrderCompletionResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/orders/${salesId}/complete-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: paymentToken,
        amount,
        salesId,
        dailyOrderNumber,
        customerId: customerId || undefined,
        pointsToRedeem: pointsToRedeem || 0,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      // HTTP error (400, 500, etc.)
      return {
        success: false,
        transactionId: '',
        ticketId: 0,
        dailyOrderNumber: 0,
        errorMessage: result.errorMessage || 'Payment processing failed',
      };
    }

    // Success
    return {
      success: result.success,
      transactionId: result.transactionId || '',
      ticketId: result.ticketId || salesId,
      dailyOrderNumber: result.dailyOrderNumber || dailyOrderNumber,
      errorMessage: result.errorMessage,
    };
  } catch (error: any) {
    // Network error or JSON parse error
    return {
      success: false,
      transactionId: '',
      ticketId: 0,
      dailyOrderNumber: 0,
      errorMessage: 'Network error: ' + (error.message || 'Please try again'),
    };
  }
}
