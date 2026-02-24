import React from 'react';
import {
    Alert,
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import apiClient from '../api/apiClient';
import { RootState } from '../store';
import { clearCart, removeFromCart, updateQuantity } from '../store/cartSlice';
import { Colors } from '../theme/colors';
import { Spacing } from '../theme/spacing';

const CartScreen = ({navigation}: any) => {
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch();
  const [usePoints, setUsePoints] = React.useState(false);

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  // Tax logic (placeholder for simplicity, usually you'd verify with backend)
  const gst = subtotal * 0.05;
  const pst = subtotal * 0.07;

  let loyaltyDiscount = 0;
  let pointsUsed = 0;

  if (usePoints && user?.earnedPoints) {
    // 100 points = $1
    const potentialDiscount = user.earnedPoints / 100;
    loyaltyDiscount = Math.min(potentialDiscount, subtotal);
    pointsUsed = loyaltyDiscount * 100;
  }

  const total = subtotal + gst + pst - loyaltyDiscount;

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) return;

    try {
      // Generate idempotency key
      const idempotencyKey = `${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      const orderRequest = {
        customerId: user?.id || null,
        items: cartItems.map(item => ({
          menuItemId: item.menuItemId,
          sizeId: item.sizeId,
          quantity: item.quantity,
          unitPrice: item.price,
        })),
        paymentAuthorizationNo: 'AUTH_' + Date.now(), // Simulated auth for now
        paymentTypeId: 3, // Visa
        tipAmount: 0,
        discountAmount: loyaltyDiscount,
      };

      const response = await apiClient.post('/Orders', orderRequest, {
        headers: {
          'X-Idempotency-Key': idempotencyKey,
        },
      });

      if (response.status === 200) {
        Alert.alert('Success', 'Your order has been placed!', [
          {
            text: 'OK',
            onPress: () => {
              dispatch(clearCart());
              navigation.navigate('Menu');
            },
          },
        ]);
      }
    } catch (error) {
      console.error('Error placing order:', error);
      Alert.alert('Error', 'Failed to place order. Please try again.');
    }
  };

  const renderItem = ({item}: {item: any}) => (
    <View style={styles.itemRow}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.itemName}</Text>
        <Text style={styles.itemSize}>{item.sizeName}</Text>
      </View>
      <View style={styles.quantityControls}>
        <TouchableOpacity
          style={styles.qtyBtn}
          onPress={() => {
            if (item.quantity > 1) {
              dispatch(
                updateQuantity({
                  id: item.id,
                  quantity: item.quantity - 1,
                }),
              );
            } else {
              dispatch(removeFromCart(item.id));
            }
          }}>
          <Text style={styles.qtyBtnText}>-</Text>
        </TouchableOpacity>
        <Text style={styles.quantityText}>{item.quantity}</Text>
        <TouchableOpacity
          style={styles.qtyBtn}
          onPress={() =>
            dispatch(
              updateQuantity({
                id: item.id,
                quantity: item.quantity + 1,
              }),
            )
          }>
          <Text style={styles.qtyBtnText}>+</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.itemTotal}>
        ${(item.price * item.quantity).toFixed(2)}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Your Cart</Text>
        <View style={{width: 50}} />
      </View>

      {cartItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Your cart is empty</Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => navigation.navigate('Menu')}>
            <Text style={styles.browseButtonText}>Browse Menu</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={cartItems}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.itemList}
          />

          <View style={styles.footer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax (GST + PST)</Text>
              <Text style={styles.summaryValue}>${(gst + pst).toFixed(2)}</Text>
            </View>

            {user && user.loyaltyPoints > 0 && (
              <TouchableOpacity
                style={styles.pointsToggle}
                onPress={() => setUsePoints(!usePoints)}>
                <View
                  style={[styles.checkbox, usePoints && styles.checkboxActive]}>
                  {usePoints && <Text style={styles.checkboxCheck}>✓</Text>}
                </View>
                <Text style={styles.pointsToggleText}>
                  Use Loyalty Points ({user.earnedPoints} available)
                </Text>
              </TouchableOpacity>
            )}

            {loyaltyDiscount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Loyalty Discount</Text>
                <Text style={styles.discountValue}>
                  -${loyaltyDiscount.toFixed(2)}
                </Text>
              </View>
            )}

            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
            </View>

            <TouchableOpacity
              style={styles.placeOrderButton}
              onPress={handlePlaceOrder}>
              <Text style={styles.placeOrderText}>Place Order</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.secondary,
  },
  backButton: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  itemList: {
    padding: Spacing.md,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  itemInfo: {
    flex: 2,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  itemSize: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  qtyBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBtnText: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  quantityText: {
    marginHorizontal: Spacing.sm,
    fontSize: 16,
    fontWeight: '600',
  },
  itemTotal: {
    flex: 1,
    textAlign: 'right',
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  footer: {
    padding: Spacing.lg,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    color: Colors.text,
  },
  totalRow: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.secondary,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  placeOrderButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  placeOrderText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyText: {
    fontSize: 18,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  browseButton: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: 8,
  },
  browseButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  pointsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.md,
    backgroundColor: Colors.white,
    padding: Spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pointsToggleText: {
    fontSize: 14,
    color: Colors.text,
    marginLeft: Spacing.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: Colors.primary,
  },
  checkboxCheck: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  discountValue: {
    fontSize: 14,
    color: Colors.success,
    fontWeight: '600',
  },
});

export default CartScreen;
