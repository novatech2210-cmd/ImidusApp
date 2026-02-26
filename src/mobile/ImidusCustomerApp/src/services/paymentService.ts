import AuthorizeNetAccept from 'react-native-authorize-net-accept';
import { CardData, PaymentToken } from '../types/payment.types';

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
 */
export async function tokenizeCard(
  cardData: CardData,
  publicClientKey: string
): Promise<PaymentToken> {
  try {
    // Strip spaces from card number (users may enter with spaces for readability)
    const cleanCardNumber = cardData.cardNumber.replace(/\s/g, '');

    // Call Authorize.net Accept.js native module
    const token = await AuthorizeNetAccept.getTokenWithRequest({
      publicClientKey,
      cardData: {
        cardNumber: cleanCardNumber,
        expirationMonth: cardData.expirationMonth,
        expirationYear: cardData.expirationYear,
        cardCode: cardData.cvv,
      },
    });

    // Return standardized token format
    return {
      dataDescriptor: token.dataDescriptor,
      dataValue: token.dataValue,
    };
  } catch (error: any) {
    // Tokenization failed - card data invalid or network error
    throw new Error('Tokenization failed: ' + (error.message || 'Unknown error'));
  }
}
