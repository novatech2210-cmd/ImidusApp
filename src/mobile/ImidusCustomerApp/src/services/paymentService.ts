/**
 * Payment Service for IMIDUS Customer App
 *
 * Handles payment tokenization via Authorize.net Accept.js WebView
 * and payment submission to the backend API.
 *
 * IMPORTANT: Card data is sent directly to Authorize.net - never touches our backend.
 * Tokens are single-use nonces with 15-minute expiration.
 */

import apiClient from '../api/apiClient';
import { CardData, PaymentToken, PaymentRequest, PaymentResponse } from '../types/payment.types';

/**
 * Validate card data before tokenization
 * Performs client-side validation to catch obvious errors before hitting Authorize.net
 *
 * @param cardData Credit card information to validate
 * @returns Object with isValid flag and array of error messages
 */
export function validateCardData(cardData: CardData): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Clean card number for validation
  const cleanCardNumber = cardData.cardNumber.replace(/[\s-]/g, '');

  // Card number validation (basic Luhn check)
  if (!cleanCardNumber || cleanCardNumber.length < 13 || cleanCardNumber.length > 19) {
    errors.push('Card number must be between 13 and 19 digits');
  } else if (!/^\d+$/.test(cleanCardNumber)) {
    errors.push('Card number must contain only digits');
  } else if (!luhnCheck(cleanCardNumber)) {
    errors.push('Invalid card number');
  }

  // Expiration month validation
  const month = parseInt(cardData.expirationMonth, 10);
  if (isNaN(month) || month < 1 || month > 12) {
    errors.push('Expiration month must be between 01 and 12');
  }

  // Expiration year validation
  const currentYear = new Date().getFullYear() % 100; // Get last 2 digits
  const year = parseInt(cardData.expirationYear, 10);
  const fullYear = year < 100 ? year : year % 100;

  if (isNaN(year) || fullYear < currentYear) {
    errors.push('Card has expired');
  }

  // Combined expiration check
  const currentMonth = new Date().getMonth() + 1;
  if (fullYear === currentYear && month < currentMonth) {
    errors.push('Card has expired');
  }

  // CVV validation
  const cleanCVV = cardData.cvv.replace(/\D/g, '');
  if (!cleanCVV || cleanCVV.length < 3 || cleanCVV.length > 4) {
    errors.push('CVV must be 3 or 4 digits');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Luhn algorithm for card number validation
 */
function luhnCheck(cardNumber: string): boolean {
  let sum = 0;
  let isEven = false;

  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cardNumber[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

/**
 * Detect card type from card number
 */
export function detectCardType(cardNumber: string): string {
  const cleanNumber = cardNumber.replace(/[\s-]/g, '');

  if (/^4/.test(cleanNumber)) return 'Visa';
  if (/^5[1-5]/.test(cleanNumber) || /^2[2-7]/.test(cleanNumber)) return 'MasterCard';
  if (/^3[47]/.test(cleanNumber)) return 'Amex';
  if (/^6(?:011|5)/.test(cleanNumber)) return 'Discover';
  if (/^3(?:0[0-5]|[68])/.test(cleanNumber)) return 'Diners';
  if (/^(?:2131|1800|35)/.test(cleanNumber)) return 'JCB';

  return 'Unknown';
}

/**
 * Format card number for display (masked)
 */
export function maskCardNumber(cardNumber: string): string {
  const cleanNumber = cardNumber.replace(/[\s-]/g, '');
  if (cleanNumber.length < 4) return cleanNumber;

  const last4 = cleanNumber.slice(-4);
  return `•••• •••• •••• ${last4}`;
}

/**
 * Submit payment to backend with token from Authorize.net
 *
 * @param paymentRequest Payment request containing order details and token
 * @returns Payment response from backend
 * @throws Error if payment fails
 */
export async function submitPayment(
  paymentRequest: PaymentRequest
): Promise<PaymentResponse> {
  try {
    const response = await apiClient.post<PaymentResponse>(
      '/Payments/process',
      paymentRequest
    );

    return response.data;
  } catch (error: any) {
    // Extract error message from API response
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Payment failed';

    throw new Error(message);
  }
}

/**
 * Check payment status for an order
 *
 * @param salesId The sales ID to check
 * @returns Payment status
 */
export async function checkPaymentStatus(
  salesId: number
): Promise<{ status: string; transactionId?: string }> {
  try {
    const response = await apiClient.get(`/Payments/status/${salesId}`);
    return response.data;
  } catch (error: any) {
    throw new Error('Failed to check payment status');
  }
}

/**
 * Legacy tokenization function - now handled by WebView component
 *
 * @deprecated Use useAuthorizeNetTokenization hook with AuthorizeNetWebView component
 * @param cardData Credit card information
 * @param publicClientKey Authorize.net public client key
 * @returns Promise<PaymentToken> - This now throws an error, use WebView approach
 */
export async function tokenizeCard(
  cardData: CardData,
  publicClientKey: string
): Promise<PaymentToken> {
  // Validate card data first
  const validation = validateCardData(cardData);
  if (!validation.isValid) {
    throw new Error(validation.errors.join(', '));
  }

  // This function is deprecated - tokenization now happens via WebView
  // Keeping this for backwards compatibility but it should not be used
  throw new Error(
    'Direct tokenization is deprecated. Use useAuthorizeNetTokenization hook with AuthorizeNetWebView component.'
  );
}

export default {
  validateCardData,
  detectCardType,
  maskCardNumber,
  submitPayment,
  checkPaymentStatus,
  tokenizeCard,
};
