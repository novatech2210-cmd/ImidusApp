import { PaymentToken } from '../types/payment.types';

const API_BASE_URL = 'http://localhost:5000/api'; // TODO: Move to env config

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
