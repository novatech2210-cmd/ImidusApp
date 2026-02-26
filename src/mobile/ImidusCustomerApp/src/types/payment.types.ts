/**
 * Payment-related TypeScript types for credit card tokenization
 */

/**
 * Credit card data for tokenization
 * Note: This data is sent directly to Authorize.net - never to our backend
 */
export interface CardData {
  cardNumber: string;
  expirationMonth: string;
  expirationYear: string;
  cvv: string;
}

/**
 * Opaque payment token from Authorize.net Accept.js
 * Single-use token with 15-minute expiration
 * This is what gets sent to the backend for charging
 */
export interface PaymentToken {
  dataDescriptor: string;
  dataValue: string;
}

/**
 * Payment error structure
 */
export interface PaymentError {
  message: string;
  code?: string;
}
