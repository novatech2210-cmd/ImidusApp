import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {Colors, Shadow, ShadowLevel, Spacing} from '../theme';

type RootStackParamList = {
  Menu: undefined;
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

type OrderConfirmationScreenRouteProp = RouteProp<
  RootStackParamList,
  'OrderConfirmation'
>;
type NavigationProp = StackNavigationProp<RootStackParamList>;

/**
 * Order confirmation screen with receipt-style layout
 * Shows complete order details after successful payment
 */
export default function OrderConfirmationScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<OrderConfirmationScreenRouteProp>();

  const {
    transactionId,
    ticketId,
    dailyOrderNumber,
    orderItems,
    subtotal,
    gstTotal,
    pstTotal,
    orderTotal,
    paymentMethod,
    last4Digits,
  } = route.params;

  /**
   * Navigate back to menu/home screen
   */
  const handleDone = () => {
    navigation.reset({
      index: 0,
      routes: [{name: 'Menu'}],
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Success Header */}
        <View style={styles.header}>
          <View style={styles.checkmarkCircle}>
            <Text style={styles.checkmark}>✓</Text>
          </View>
          <Text style={styles.headerTitle}>Order Confirmed</Text>
          <Text style={styles.headerSubtitle}>
            Your order has been placed successfully
          </Text>
        </View>

        {/* Receipt Card */}
        <View style={styles.receiptCard}>
          {/* Order Number */}
          <View style={styles.orderNumberSection}>
            <Text style={styles.orderNumberLabel}>Order Number</Text>
            <Text style={styles.orderNumberValue}>#{dailyOrderNumber}</Text>
          </View>

          <View style={styles.divider} />

          {/* Order Items */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Items</Text>
            {orderItems.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemSize}>
                    Size: {item.size} | Qty: {item.quantity}
                  </Text>
                </View>
                <Text style={styles.itemPrice}>
                  ${(item.price * item.quantity).toFixed(2)}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.divider} />

          {/* Totals */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order Summary</Text>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>${subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>GST</Text>
              <Text style={styles.totalValue}>${gstTotal.toFixed(2)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>PST</Text>
              <Text style={styles.totalValue}>${pstTotal.toFixed(2)}</Text>
            </View>
            <View style={[styles.totalRow, styles.grandTotalRow]}>
              <Text style={styles.grandTotalLabel}>Total</Text>
              <Text style={styles.grandTotalValue}>
                ${orderTotal.toFixed(2)}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Payment Method */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment</Text>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Payment Method</Text>
              <Text style={styles.paymentValue}>
                {paymentMethod} •••• {last4Digits}
              </Text>
            </View>
          </View>

          {/* Transaction ID (for support reference) */}
          <View style={styles.transactionIdSection}>
            <Text style={styles.transactionIdLabel}>Transaction ID</Text>
            <Text style={styles.transactionIdValue}>{transactionId}</Text>
          </View>
        </View>

        {/* Information Notice */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>What's Next?</Text>
          <Text style={styles.infoText}>
            Your order is being prepared. You'll receive a notification when
            it's ready for pickup.
          </Text>
        </View>

        {/* Done Button */}
        <TouchableOpacity onPress={handleDone}>
          <LinearGradient
            colors={[Colors.brandBlue, Colors.brandBlueDark]}
            style={styles.doneButton}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}>
            <Text style={styles.doneButtonText}>Done</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.elevation0,
  },
  scrollContent: {
    padding: Spacing.base,
    paddingBottom: Spacing.xl,
  },
  header: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  checkmarkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  checkmark: {
    fontSize: 48,
    color: Colors.white,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.brandBlue,
    marginBottom: Spacing.sm,
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  receiptCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.base,
    ...ShadowLevel.level1,
  },
  orderNumberSection: {
    alignItems: 'center',
    paddingVertical: Spacing.base,
  },
  orderNumberLabel: {
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  orderNumberValue: {
    fontSize: 40,
    fontWeight: '800',
    color: Colors.brandGold,
    textShadowColor: 'rgba(212, 175, 55, 0.2)',
    textShadowOffset: {width: 0, height: 2},
    textShadowRadius: 4,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.midGray,
    marginVertical: Spacing.base,
  },
  section: {
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: Spacing.xs,
  },
  itemDetails: {
    flex: 1,
    marginRight: Spacing.md,
  },
  itemName: {
    fontSize: 15,
    color: Colors.textPrimary,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemSize: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  itemPrice: {
    fontSize: 15,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  totalLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  totalValue: {
    fontSize: 14,
    color: Colors.textPrimary,
  },
  grandTotalRow: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.midGray,
  },
  grandTotalLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.brandBlue,
  },
  grandTotalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.brandBlue,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  paymentValue: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  transactionIdSection: {
    marginTop: Spacing.base,
    paddingTop: Spacing.base,
    borderTopWidth: 1,
    borderTopColor: Colors.midGray,
  },
  transactionIdLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  transactionIdValue: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  infoCard: {
    backgroundColor: Colors.infoLight,
    borderRadius: 12,
    padding: Spacing.base,
    marginBottom: Spacing.base,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.info,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
    color: Colors.info,
    lineHeight: 20,
  },
  doneButton: {
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    ...ShadowLevel.level2,
  },
  doneButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
