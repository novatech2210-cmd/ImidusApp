import {Colors, Elevation, Spacing} from '@/theme';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {CheckCircle} from 'lucide-react-native';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {SafeAreaView} from 'react-native-safe-area-context';

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

  const handleDone = () => {
    navigation.reset({
      index: 0,
      routes: [{name: 'Menu'}],
    });
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Order Complete</Text>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Success Header */}
        <View style={styles.successSection}>
          <View style={styles.checkmarkCircle}>
            <CheckCircle size={40} color={Colors.white} strokeWidth={3} />
          </View>
          <Text style={styles.successTitle}>Thank You!</Text>
          <Text style={styles.successSubtitle}>
            Your order has been placed successfully
          </Text>
        </View>

        {/* Order Number Card */}
        <View style={styles.orderNumberCard}>
          <Text style={styles.orderNumberLabel}>ORDER NUMBER</Text>
          <Text style={styles.orderNumberValue}>#{dailyOrderNumber}</Text>
        </View>

        {/* Receipt Card */}
        <View style={styles.card}>
          {/* Order Items */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ITEMS</Text>
            {orderItems.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemSize}>
                    {item.size} × {item.quantity}
                  </Text>
                </View>
                <Text style={styles.itemPrice}>
                  ${((item.price || 0) * (item.quantity || 0)).toFixed(2)}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.divider} />

          {/* Totals */}
          <View style={styles.section}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>
                ${(subtotal || 0).toFixed(2)}
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>GST (6%)</Text>
              <Text style={styles.totalValue}>
                ${(gstTotal || 0).toFixed(2)}
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>PST</Text>
              <Text style={styles.totalValue}>
                ${(pstTotal || 0).toFixed(2)}
              </Text>
            </View>

            <View style={styles.grandTotalDivider} />

            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>Total Paid</Text>
              <Text style={styles.grandTotalValue}>
                ${(orderTotal || 0).toFixed(2)}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Payment Method */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PAYMENT</Text>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Method</Text>
              <Text style={styles.paymentValue}>
                {paymentMethod} •••• {last4Digits}
              </Text>
            </View>
          </View>

          {/* Transaction ID */}
          <View style={styles.transactionSection}>
            <Text style={styles.transactionLabel}>Transaction ID</Text>
            <Text style={styles.transactionValue}>{transactionId}</Text>
          </View>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>What's Next?</Text>
          <Text style={styles.infoText}>
            Your order is being prepared. You'll receive a notification when
            it's ready for pickup.
          </Text>
        </View>

        {/* Done Button */}
        <TouchableOpacity onPress={handleDone} activeOpacity={0.8}>
          <LinearGradient
            colors={[Colors.brandBlue, Colors.brandBlueDark]}
            style={styles.doneButton}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}>
            <Text style={styles.doneButtonText}>Back to Menu</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
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
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
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
  successSection: {
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
    marginBottom: Spacing.md,
  },
  checkmark: {
    fontSize: 40,
    color: Colors.white,
    fontWeight: 'bold',
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  successSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  orderNumberCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.brandGold,
    ...Elevation.level2,
  },
  orderNumberLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 2,
    marginBottom: Spacing.xs,
  },
  orderNumberValue: {
    fontSize: 48,
    fontWeight: '800',
    color: Colors.brandGold,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Elevation.level1,
  },
  section: {
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 1,
    marginBottom: Spacing.sm,
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
  },
  itemSize: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 15,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  totalLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  totalValue: {
    fontSize: 14,
    color: Colors.textPrimary,
  },
  grandTotalDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  grandTotalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  grandTotalValue: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.brandGold,
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
  transactionSection: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  transactionLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 1,
    marginBottom: 4,
  },
  transactionValue: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  infoCard: {
    backgroundColor: Colors.infoLight,
    borderRadius: 16,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.info,
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
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    ...Elevation.level2,
  },
  doneButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
