/**
 * Authorize.net Accept.js WebView Component
 *
 * Uses a WebView to load Accept.js and perform card tokenization.
 * Card data is sent directly to Authorize.net - never touches our backend.
 *
 * This approach is required because there's no native React Native SDK
 * for Authorize.net Accept.js.
 */

import React, { useRef, useCallback, useState } from 'react';
import {
  Modal,
  StyleSheet,
  View,
  ActivityIndicator,
  Text,
  TouchableOpacity,
} from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { Colors, Spacing, BorderRadius, Elevation, TextStyles } from '../theme';
import { CardData, PaymentToken } from '../types/payment.types';
import { ENV } from '../config/environment';

interface AuthorizeNetWebViewProps {
  visible: boolean;
  cardData: CardData;
  onTokenReceived: (token: PaymentToken) => void;
  onError: (error: string) => void;
  onCancel: () => void;
}

/**
 * Generate the HTML content for the Accept.js WebView
 */
function generateAcceptJsHtml(
  cardData: CardData,
  publicClientKey: string,
  apiLoginId: string,
  isSandbox: boolean
): string {
  const acceptJsUrl = isSandbox
    ? 'https://jstest.authorize.net/v1/Accept.js'
    : 'https://js.authorize.net/v1/Accept.js';

  // Clean card number (remove spaces/dashes)
  const cleanCardNumber = cardData.cardNumber.replace(/[\s-]/g, '');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script type="text/javascript" src="${acceptJsUrl}"></script>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: ${Colors.background};
      color: ${Colors.textPrimary};
      padding: 20px;
      margin: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      box-sizing: border-box;
    }
    .status {
      text-align: center;
      padding: 20px;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid ${Colors.lightGray};
      border-top-color: ${Colors.brandGold};
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 16px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .message {
      color: ${Colors.textSecondary};
      font-size: 14px;
      margin-top: 8px;
    }
    .error {
      color: ${Colors.error};
      font-size: 14px;
      margin-top: 16px;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="status">
    <div class="spinner"></div>
    <div class="message">Securely processing your card...</div>
    <div id="error-message" class="error" style="display: none;"></div>
  </div>

  <script type="text/javascript">
    // Authorize.net Accept.js tokenization
    function tokenizeCard() {
      var authData = {};
      authData.clientKey = "${publicClientKey}";
      authData.apiLoginID = "${apiLoginId}";

      var cardData = {};
      cardData.cardNumber = "${cleanCardNumber}";
      cardData.month = "${cardData.expirationMonth}";
      cardData.year = "${cardData.expirationYear}";
      cardData.cardCode = "${cardData.cvv}";

      var secureData = {};
      secureData.authData = authData;
      secureData.cardData = cardData;

      Accept.dispatchData(secureData, responseHandler);
    }

    function responseHandler(response) {
      if (response.messages.resultCode === "Error") {
        var errorMessages = [];
        for (var i = 0; i < response.messages.message.length; i++) {
          errorMessages.push(response.messages.message[i].text);
        }

        // Show error in WebView
        var errorDiv = document.getElementById('error-message');
        errorDiv.textContent = errorMessages.join(', ');
        errorDiv.style.display = 'block';
        document.querySelector('.spinner').style.display = 'none';
        document.querySelector('.message').textContent = 'Tokenization failed';

        // Send error to React Native
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'error',
          message: errorMessages.join(', ')
        }));
      } else {
        // Success - send token to React Native
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'success',
          dataDescriptor: response.opaqueData.dataDescriptor,
          dataValue: response.opaqueData.dataValue
        }));
      }
    }

    // Start tokenization when Accept.js is loaded
    if (typeof Accept !== 'undefined') {
      tokenizeCard();
    } else {
      // Wait for Accept.js to load
      window.onload = function() {
        setTimeout(function() {
          if (typeof Accept !== 'undefined') {
            tokenizeCard();
          } else {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'error',
              message: 'Failed to load Authorize.net Accept.js'
            }));
          }
        }, 500);
      };
    }
  </script>
</body>
</html>
  `.trim();
}

export default function AuthorizeNetWebView({
  visible,
  cardData,
  onTokenReceived,
  onError,
  onCancel,
}: AuthorizeNetWebViewProps): JSX.Element | null {
  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);

  // API Login ID (from environment or hardcoded for now)
  const apiLoginId = '9JQVwben66U7';
  const isSandbox = ENV.AUTHORIZE_NET.ENVIRONMENT === 'sandbox';

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);

        if (data.type === 'success') {
          onTokenReceived({
            dataDescriptor: data.dataDescriptor,
            dataValue: data.dataValue,
          });
        } else if (data.type === 'error') {
          onError(data.message || 'Tokenization failed');
        }
      } catch (error) {
        onError('Failed to process payment response');
      }
    },
    [onTokenReceived, onError]
  );

  const handleLoadEnd = useCallback(() => {
    setLoading(false);
  }, []);

  const handleError = useCallback(() => {
    onError('Failed to load payment processor');
  }, [onError]);

  if (!visible) return null;

  const html = generateAcceptJsHtml(
    cardData,
    ENV.AUTHORIZE_NET.PUBLIC_CLIENT_KEY,
    apiLoginId,
    isSandbox
  );

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Secure Payment</Text>
            <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.webViewContainer}>
            {loading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={Colors.brandGold} />
                <Text style={styles.loadingText}>Initializing secure payment...</Text>
              </View>
            )}
            <WebView
              ref={webViewRef}
              source={{ html }}
              style={styles.webView}
              onMessage={handleMessage}
              onLoadEnd={handleLoadEnd}
              onError={handleError}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              originWhitelist={['*']}
              mixedContentMode="compatibility"
              cacheEnabled={false}
              incognito={true}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.securityNote}>
              Your card details are securely transmitted directly to Authorize.net
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  container: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    ...Elevation.level3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    ...TextStyles.title,
    color: Colors.brandBlue,
  },
  cancelButton: {
    padding: Spacing.sm,
  },
  cancelText: {
    ...TextStyles.label,
    color: Colors.error,
  },
  webViewContainer: {
    height: 200,
    position: 'relative',
  },
  webView: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    ...TextStyles.body,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  footer: {
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  securityNote: {
    ...TextStyles.microLabel,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
