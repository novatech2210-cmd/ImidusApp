/**
 * Type declarations for react-native-authorize-net-accept
 * Native module for Authorize.net Accept.js tokenization
 */

declare module 'react-native-authorize-net-accept' {
  export interface TokenRequest {
    publicClientKey: string;
    cardData: {
      cardNumber: string;
      expirationMonth: string;
      expirationYear: string;
      cardCode: string;
    };
  }

  export interface TokenResponse {
    dataDescriptor: string;
    dataValue: string;
  }

  export default class AuthorizeNetAccept {
    static getTokenWithRequest(request: TokenRequest): Promise<TokenResponse>;
  }
}
