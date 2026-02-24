import { CreateOrderRequest, CreateOrderResponse } from '../types/cart.types';
import { ENV } from '../config/environment';

export const orderApi = {
  /**
   * Create a new order
   * UPDATED: Now sends sizeId for each item
   */
  async createOrder(request: CreateOrderRequest): Promise<CreateOrderResponse> {
    // Generate idempotency key
    const idempotencyKey = `${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const response = await fetch(`${ENV.API_BASE_URL}/Orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({
        items: request.items.map(item => ({
          menuItemId: item.menuItemId,
          sizeId: item.sizeId, // ← NOW INCLUDED
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
