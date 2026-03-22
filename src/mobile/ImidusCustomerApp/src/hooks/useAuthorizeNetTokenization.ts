/**
 * Hook for Authorize.net Accept.js tokenization
 *
 * Manages the tokenization state and provides a promise-based API
 * for tokenizing card data using the WebView component.
 */

import { useState, useCallback, useRef } from 'react';
import { CardData, PaymentToken } from '../types/payment.types';

interface TokenizationState {
  isTokenizing: boolean;
  error: string | null;
  showWebView: boolean;
  cardData: CardData | null;
}

interface TokenizationResult {
  success: boolean;
  token?: PaymentToken;
  error?: string;
}

type ResolveFunction = (result: TokenizationResult) => void;

export function useAuthorizeNetTokenization() {
  const [state, setState] = useState<TokenizationState>({
    isTokenizing: false,
    error: null,
    showWebView: false,
    cardData: null,
  });

  // Store the promise resolver to call when tokenization completes
  const resolverRef = useRef<ResolveFunction | null>(null);

  /**
   * Start the tokenization process
   * Returns a promise that resolves when tokenization completes or fails
   */
  const tokenize = useCallback((cardData: CardData): Promise<TokenizationResult> => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;

      setState({
        isTokenizing: true,
        error: null,
        showWebView: true,
        cardData,
      });
    });
  }, []);

  /**
   * Handle successful tokenization from WebView
   */
  const handleTokenReceived = useCallback((token: PaymentToken) => {
    setState({
      isTokenizing: false,
      error: null,
      showWebView: false,
      cardData: null,
    });

    if (resolverRef.current) {
      resolverRef.current({ success: true, token });
      resolverRef.current = null;
    }
  }, []);

  /**
   * Handle tokenization error from WebView
   */
  const handleError = useCallback((error: string) => {
    setState((prev) => ({
      ...prev,
      isTokenizing: false,
      error,
      showWebView: false,
    }));

    if (resolverRef.current) {
      resolverRef.current({ success: false, error });
      resolverRef.current = null;
    }
  }, []);

  /**
   * Handle user cancellation
   */
  const handleCancel = useCallback(() => {
    setState({
      isTokenizing: false,
      error: null,
      showWebView: false,
      cardData: null,
    });

    if (resolverRef.current) {
      resolverRef.current({ success: false, error: 'Payment cancelled by user' });
      resolverRef.current = null;
    }
  }, []);

  /**
   * Reset the tokenization state
   */
  const reset = useCallback(() => {
    setState({
      isTokenizing: false,
      error: null,
      showWebView: false,
      cardData: null,
    });
    resolverRef.current = null;
  }, []);

  return {
    // State
    isTokenizing: state.isTokenizing,
    error: state.error,
    showWebView: state.showWebView,
    cardData: state.cardData,

    // Actions
    tokenize,
    handleTokenReceived,
    handleError,
    handleCancel,
    reset,
  };
}

export default useAuthorizeNetTokenization;
