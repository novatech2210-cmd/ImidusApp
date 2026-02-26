import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import PaymentForm from '../components/PaymentForm';
import { tokenizeCard } from '../services/paymentService';
import { completePayment } from '../services/orderService';
import { CardData } from '../types/payment.types';

type RootStackParamList = {
  Checkout: {
    salesId: number;
    orderTotal: number;
    gstTotal: number;
    pstTotal: number;
    orderItems: Array<{
      name: string;
      quantity: number;
      size: string;
      price: number;
    }>;
    dailyOrderNumber: number;
  };
  OrderConfirmation: {
    transactionId: string;
    ticketId: number;
    dailyOrderNumber: number;
    orderItems: Array<{
      name: string;
      quantity: number;
      size: string;
      price: number;
    }>;
    subtotal: number;
    gstTotal: number;
    pstTotal: number;
    orderTotal: number;
    paymentMethod: string;
    last4Digits: string;
  };
};

type CheckoutScreenRouteProp = RouteProp<RootStackParamList, 'Checkout'>;
type NavigationProp = StackNavigationProp<RootStackParamList>;

const AUTHORIZE_NET_PUBLIC_KEY = 'YOUR_PUBLIC_CLIENT_KEY'; // TODO: Move to env config

/**
 * Checkout screen with payment form and full-screen loading states
 * Implements payment flow: tokenize card -> submit to backend -> navigate to confirmation
 */
export default function CheckoutScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<CheckoutScreenRouteProp>();

  const {
    salesId,
    orderTotal,
    gstTotal,
    pstTotal,
    orderItems,
    dailyOrderNumber,
  } = route.params;

  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState<string | undefined>();

  const subtotal = orderTotal - gstTotal - pstTotal;

  /**
   * Handle payment form submission
   * Flow: Tokenize card -> Complete payment via API -> Navigate to confirmation
   */
  const handlePaymentSubmit = async (cardData: CardData) => {
    setError(undefined);
    setLoading(true);
    setLoadingStep('Processing payment...');

    try {
      // Step 1: Tokenize card with Authorize.net
      const token = await tokenizeCard(cardData, AUTHORIZE_NET_PUBLIC_KEY);

      // Step 2: Submit payment to backend
      setLoadingStep('Creating order...');
      const result = await completePayment(salesId, token, orderTotal, dailyOrderNumber);

      if (result.success) {
        // Step 3: Navigate to confirmation screen
        setLoadingStep('Done!');
        navigation.replace('OrderConfirmation', {
          transactionId: result.transactionId,
          ticketId: result.ticketId,
          dailyOrderNumber: result.dailyOrderNumber,
          orderItems,
          subtotal,
          gstTotal,
          pstTotal,
          orderTotal,
          paymentMethod: getCardType(cardData.cardNumber),
          last4Digits: cardData.cardNumber.slice(-4),
        });
      } else {
        // Payment failed - show error and allow retry
        setLoading(false);
        setError(getUserFriendlyError(result.errorMessage));
      }
    } catch (err: any) {
      // Network error or tokenization failure
      setLoading(false);
      setError(getUserFriendlyError(err.message));
    }
  };

  /**
   * Convert error messages to user-friendly format per user decision
   */
  const getUserFriendlyError = (message?: string): string => {
    if (!message) return 'Payment processing failed. Please try again.';

    const lower = message.toLowerCase();

    if (lower.includes('declined') || lower.includes('insufficient')) {
      return 'Card declined. Please check your card details or use a different card.';
    }

    if (lower.includes('network') || lower.includes('timeout')) {
      return 'Network error. Please check your connection and try again.';
    }

    if (lower.includes('tokenization')) {
      return 'Card validation failed. Please check your card details.';
    }

    // Generic message for system errors
    return 'Payment processing failed. Please try again.';
  };

  /**
   * Detect card type from card number
   */
  const getCardType = (cardNumber: string): string => {
    const cleaned = cardNumber.replace(/\s/g, '');
    const firstDigit = cleaned[0];
    const firstTwo = cleaned.substring(0, 2);

    if (firstDigit === '4') return 'Visa';
    if (firstTwo >= '51' && firstTwo <= '55') return 'MasterCard';
    if (firstTwo === '34' || firstTwo === '37') return 'Amex';
    if (firstTwo === '60' || firstTwo === '65') return 'Discover';

    return 'Credit Card';
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Order Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Order Summary</Text>
          <Text style={styles.orderNumber}>Order #{dailyOrderNumber}</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>GST</Text>
            <Text style={styles.summaryValue}>${gstTotal.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>PST</Text>
            <Text style={styles.summaryValue}>${pstTotal.toFixed(2)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${orderTotal.toFixed(2)}</Text>
          </View>
        </View>

        {/* Payment Form */}
        <PaymentForm onSubmit={handlePaymentSubmit} loading={loading} error={error} />
      </ScrollView>

      {/* Full-screen Loading Overlay */}
      <Modal visible={loading} transparent animationType="fade">
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#10b981" />
            <Text style={styles.loadingText}>{loadingStep}</Text>
            <Text style={styles.loadingSubtext}>Please do not close this screen</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  orderNumber: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  summaryValue: {
    fontSize: 14,
    color: '#111827',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#10b981',
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    minWidth: 250,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
});
