import {Colors, Elevation, Spacing} from '@/theme';
import Slider from '@react-native-community/slider';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {ArrowLeft} from 'lucide-react-native';
import {useState} from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useSelector} from 'react-redux';
import AuthorizeNetWebView from '../components/AuthorizeNetWebView';
import PaymentForm from '../components/PaymentForm';
import useAuthorizeNetTokenization from '../hooks/useAuthorizeNetTokenization';
import {completePayment} from '../services/orderService';
import {detectCardType, validateCardData} from '../services/paymentService';
import {RootState} from '../store';
import {CardData} from '../types/payment.types';

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
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [pendingCardData, setPendingCardData] = useState<CardData | null>(null);

  const {
    showWebView,
    cardData: tokenizingCardData,
    tokenize,
    handleTokenReceived,
    handleError: handleTokenError,
    handleCancel,
  } = useAuthorizeNetTokenization();

  const {customerId, balance} = useSelector(
    (state: RootState) => state.loyalty,
  );

  const subtotal = (orderTotal || 0) - (gstTotal || 0) - (pstTotal || 0);
  const maxRedeemablePoints = Math.min(
    balance || 0,
    Math.floor((orderTotal || 0) * 100),
  );
  const discountAmount = (pointsToRedeem || 0) / 100;
  const finalTotal = Math.max(0, (orderTotal || 0) - discountAmount);

  const handlePaymentSubmit = async (cardData: CardData) => {
    setError(undefined);

    const validation = validateCardData(cardData);
    if (!validation.isValid) {
      setError(validation.errors.join(', '));
      return;
    }

    setPendingCardData(cardData);
    setLoadingStep('Securely processing card...');
    const result = await tokenize(cardData);

    if (!result.success || !result.token) {
      setError(getUserFriendlyError(result.error));
      setPendingCardData(null);
      return;
    }

    setLoading(true);
    setLoadingStep('Creating order...');

    try {
      const paymentResult = await completePayment(
        salesId,
        result.token,
        finalTotal,
        dailyOrderNumber,
        customerId,
        pointsToRedeem,
      );

      if (paymentResult.success) {
        setLoadingStep('Done!');
        navigation.replace('OrderConfirmation', {
          transactionId: paymentResult.transactionId,
          ticketId: paymentResult.ticketId,
          dailyOrderNumber: paymentResult.dailyOrderNumber,
          orderItems,
          subtotal,
          gstTotal,
          pstTotal,
          orderTotal,
          paymentMethod: detectCardType(cardData.cardNumber),
          last4Digits: cardData.cardNumber.replace(/\D/g, '').slice(-4),
        });
      } else {
        setLoading(false);
        setError(getUserFriendlyError(paymentResult.errorMessage));
      }
    } catch (err: any) {
      setLoading(false);
      setError(getUserFriendlyError(err.message));
    } finally {
      setPendingCardData(null);
    }
  };

  const onTokenReceived = (token: {
    dataDescriptor: string;
    dataValue: string;
  }) => {
    handleTokenReceived(token);
  };

  const onWebViewError = (errorMessage: string) => {
    handleTokenError(errorMessage);
    setError(getUserFriendlyError(errorMessage));
  };

  const onWebViewCancel = () => {
    handleCancel();
    setPendingCardData(null);
  };

  const getUserFriendlyError = (message?: string): string => {
    if (!message) return 'Payment processing failed. Please try again.';

    const lower = message.toLowerCase();

    if (lower.includes('declined') || lower.includes('insufficient')) {
      return 'Card declined. Please check your card details or use a different card.';
    }
    if (lower.includes('network') || lower.includes('timeout')) {
      return 'Network error. Please check your connection and try again.';
    }
    if (lower.includes('tokenization') || lower.includes('accept.js')) {
      return 'Card validation failed. Please check your card details.';
    }
    if (lower.includes('cancelled') || lower.includes('canceled')) {
      return 'Payment was cancelled. Please try again when ready.';
    }
    if (lower.includes('invalid card') || lower.includes('card number')) {
      return 'Invalid card number. Please check and try again.';
    }
    if (lower.includes('expired')) {
      return 'Card has expired. Please use a different card.';
    }
    if (lower.includes('cvv') || lower.includes('security code')) {
      return 'Invalid security code. Please check the CVV on your card.';
    }

    return 'Payment processing failed. Please try again.';
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <ArrowLeft size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout</Text>
          <View style={{width: 44}} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Loyalty Points Redemption */}
        {customerId && balance > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Use Loyalty Points</Text>
              <Text style={styles.pointsBadge}>{balance} pts</Text>
            </View>
            <Text style={styles.balanceText}>
              Available: ${((balance || 0) / 100).toFixed(2)} USD
            </Text>

            <Slider
              value={pointsToRedeem}
              onValueChange={setPointsToRedeem}
              minimumValue={0}
              maximumValue={maxRedeemablePoints}
              step={100}
              minimumTrackTintColor={Colors.brandGold}
              maximumTrackTintColor={Colors.surfaceContainerHigh}
              thumbTintColor={Colors.brandGold}
              style={styles.slider}
            />

            <View style={styles.redemptionInfo}>
              <Text style={styles.redemptionText}>
                Redeeming: {pointsToRedeem} pts
              </Text>
              <Text style={styles.discountText}>
                -${(discountAmount || 0).toFixed(2)}
              </Text>
            </View>

            <Text style={styles.conversionNote}>100 points = $1.00 off</Text>
          </View>
        )}

        {/* Order Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order Summary</Text>
          <View style={styles.orderNumberRow}>
            <Text style={styles.orderNumberLabel}>Order</Text>
            <Text style={styles.orderNumber}>#{dailyOrderNumber}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>
              ${(subtotal || 0).toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>GST (6%)</Text>
            <Text style={styles.summaryValue}>
              ${(gstTotal || 0).toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>PST</Text>
            <Text style={styles.summaryValue}>
              ${(pstTotal || 0).toFixed(2)}
            </Text>
          </View>
          {pointsToRedeem > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Points Discount</Text>
              <Text style={styles.discountValue}>
                -${(discountAmount || 0).toFixed(2)}
              </Text>
            </View>
          )}

          <View style={styles.totalDivider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>
              ${(finalTotal || 0).toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Payment Form */}
        <PaymentForm
          onSubmit={handlePaymentSubmit}
          loading={loading || showWebView}
          error={error}
        />
      </ScrollView>

      {/* Authorize.net WebView for tokenization */}
      {tokenizingCardData && (
        <AuthorizeNetWebView
          visible={showWebView}
          cardData={tokenizingCardData}
          onTokenReceived={onTokenReceived}
          onError={onWebViewError}
          onCancel={onWebViewCancel}
        />
      )}

      {/* Full-screen Loading Overlay */}
      <Modal visible={loading} transparent animationType="fade">
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <View style={styles.loadingSpinner}>
              <ActivityIndicator size="large" color={Colors.brandGold} />
            </View>
            <Text style={styles.loadingText}>{loadingStep}</Text>
            <Text style={styles.loadingSubtext}>
              Please do not close this screen
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerSafe: {
    backgroundColor: Colors.surface,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: Colors.textPrimary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Elevation.level1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  pointsBadge: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.brandGold,
    backgroundColor: Colors.surfaceContainer,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  orderNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  orderNumberLabel: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  orderNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.brandGold,
    marginLeft: Spacing.xs,
  },
  balanceText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  redemptionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  redemptionText: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  discountText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.success,
  },
  conversionNote: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  discountValue: {
    fontSize: 14,
    color: Colors.success,
    fontWeight: '600',
  },
  totalDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.brandGold,
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: Spacing.xl,
    alignItems: 'center',
    minWidth: 280,
    ...Elevation.level3,
  },
  loadingSpinner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.surfaceContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
});
