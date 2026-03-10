import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';

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
          <Text style={styles.headerTitle}>Order Confirmed!</Text>
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
        <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </ScrollView>
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
  header: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  checkmarkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkmark: {
    fontSize: 48,
    color: '#fff',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  receiptCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderNumberSection: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  orderNumberLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  orderNumberValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 16,
  },
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  itemDetails: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
    marginBottom: 4,
  },
  itemSize: {
    fontSize: 13,
    color: '#6b7280',
  },
  itemPrice: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  totalValue: {
    fontSize: 14,
    color: '#111827',
  },
  grandTotalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  grandTotalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10b981',
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  paymentValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  transactionIdSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  transactionIdLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  transactionIdValue: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'monospace',
  },
  infoCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
  doneButton: {
    backgroundColor: '#10b981',
    height: 52,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
