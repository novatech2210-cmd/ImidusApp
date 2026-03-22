import React from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useDispatch, useSelector} from 'react-redux';
import {createOrder} from '../services/orderService';
import {RootState} from '../store';
import {removeFromCart, updateQuantity} from '../store/cartSlice';
import {Colors} from '../theme/colors';
import {Spacing, Elevation} from '../theme/spacing';

const CartScreen = ({navigation}: any) => {
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch();
  const [loading, setLoading] = React.useState(false);

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      Alert.alert(
        'Empty Cart',
        'Please add items to your cart before checkout.',
      );
      return;
    }

    try {
      setLoading(true);

      const orderResponse = await createOrder(
        user?.customerId || null,
        cartItems,
        0,
      );

      const {salesId, dailyOrderNumber, orderTotal, gstTotal, pstTotal} =
        orderResponse;

      navigation.navigate('Checkout', {
        salesId,
        dailyOrderNumber,
        orderTotal,
        gstTotal,
        pstTotal,
        orderItems: cartItems,
      });
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.message || 'Failed to create order. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({item}: {item: any}) => (
    <View style={styles.itemCard}>
      <View style={styles.itemContent}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.itemName}</Text>
          <Text style={styles.itemSize}>{item.sizeName}</Text>
          <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
        </View>

        <View style={styles.rightSection}>
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
              <Text style={styles.qtyBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.quantityText}>{item.quantity}</Text>
            <TouchableOpacity
              style={[styles.qtyBtn, styles.qtyBtnAdd]}
              onPress={() =>
                dispatch(
                  updateQuantity({
                    id: item.id,
                    quantity: item.quantity + 1,
                  }),
                )
              }>
              <Text style={[styles.qtyBtnText, styles.qtyBtnAddText]}>+</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.itemTotal}>
            ${(item.price * item.quantity).toFixed(2)}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.title}>Your Cart</Text>
            <Text style={styles.itemCountText}>{itemCount} items</Text>
          </View>
          <View style={{width: 44}} />
        </View>
      </SafeAreaView>

      {cartItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🛒</Text>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>
            Add items from the menu to get started
          </Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => navigation.navigate('Menu')}>
            <LinearGradient
              colors={[Colors.brandBlue, Colors.brandBlueDark]}
              style={styles.browseGradient}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}>
              <Text style={styles.browseButtonText}>Browse Menu</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={cartItems}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.itemList}
            showsVerticalScrollIndicator={false}
          />

          <View style={styles.footer}>
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
              </View>
              <Text style={styles.footerNote}>
                Taxes calculated at checkout
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleCheckout}
              disabled={cartItems.length === 0 || loading}
              activeOpacity={0.8}>
              <LinearGradient
                colors={
                  loading
                    ? [Colors.surfaceContainer, Colors.surfaceContainer]
                    : [Colors.brandGold, Colors.goldDark]
                }
                style={styles.checkoutButton}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}>
                <Text style={styles.checkoutButtonText}>
                  {loading ? 'Creating Order...' : 'Proceed to Checkout'}
                </Text>
                <Text style={styles.checkoutTotal}>${subtotal.toFixed(2)}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

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
  headerCenter: {
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  itemCountText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  itemList: {
    padding: Spacing.md,
    paddingBottom: 200,
  },
  itemCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    marginBottom: Spacing.sm,
    ...Elevation.level1,
  },
  itemContent: {
    flexDirection: 'row',
    padding: Spacing.md,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  itemSize: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  rightSection: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainer,
    borderRadius: 20,
    padding: 4,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  qtyBtnAdd: {
    backgroundColor: Colors.brandBlue,
  },
  qtyBtnText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  qtyBtnAddText: {
    color: Colors.white,
  },
  quantityText: {
    marginHorizontal: Spacing.md,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    minWidth: 24,
    textAlign: 'center',
  },
  itemTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.brandGold,
    marginTop: Spacing.sm,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  summaryCard: {
    marginBottom: Spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  footerNote: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  checkoutButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 16,
  },
  checkoutButtonText: {
    color: Colors.textOnGold,
    fontSize: 16,
    fontWeight: '700',
  },
  checkoutTotal: {
    color: Colors.textOnGold,
    fontSize: 18,
    fontWeight: '800',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  browseButton: {
    overflow: 'hidden',
    borderRadius: 12,
  },
  browseGradient: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  browseButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default CartScreen;
