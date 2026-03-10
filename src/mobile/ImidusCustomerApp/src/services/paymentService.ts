// TODO: Install react-native-authorize-net-accept package for Phase 8 (CI/CD)
// import AuthorizeNetAccept from 'react-native-authorize-net-accept';
import {CardData, PaymentToken} from '../types/payment.types';

/**
 * Tokenize credit card data using Authorize.net Accept.js
 * Card data is sent directly to Authorize.net - never touches our backend
 *
 * @param cardData Credit card information to tokenize
 * @param publicClientKey Authorize.net public client key
 * @returns Opaque payment token with 15-minute expiration
 * @throws Error if tokenization fails
 *
 * IMPORTANT: Token must be submitted to backend within 15 minutes
 * Tokens are single-use nonces - do not cache or reuse
 *
 * NOTE: Currently using mock implementation for development
 */
export async function tokenizeCard(
  cardData: CardData,
  publicClientKey: string,
): Promise<PaymentToken> {
  try {
    // Strip spaces from card number (users may enter with spaces for readability)
    const cleanCardNumber = cardData.cardNumber.replace(/\s/g, '');

    // TODO: Replace with actual Authorize.net Accept.js call
    // const token = await AuthorizeNetAccept.getTokenWithRequest({
    //   publicClientKey,
    //   cardData: {
    //     cardNumber: cleanCardNumber,
    //     expirationMonth: cardData.expirationMonth,
    //     expirationYear: cardData.expirationYear,
    //     cardCode: cardData.cvv,
    //   },
    // });

    // Mock implementation for development
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

    // Return mock token format
    return {
      dataDescriptor: 'COMMON.ACCEPT.INAPP.PAYMENT',
      dataValue:
        'mock_token_' +
        Date.now() +
        '_' +
        Math.random().toString(36).substr(2, 9),
    };
  } catch (error: any) {
    // Tokenization failed - card data invalid or network error
    throw new Error(
      'Tokenization failed: ' + (error.message || 'Unknown error'),
    );
  }
}
