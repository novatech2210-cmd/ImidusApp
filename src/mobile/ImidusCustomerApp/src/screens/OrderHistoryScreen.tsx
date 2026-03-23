/**
 * Order History Screen
 * Displays list of past orders with ability to view details and reorder
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { fetchOrderHistory, fetchOrderDetails, clearSelectedOrder } from '../store/orderHistorySlice';
import { addToCart } from '../store/cartSlice';
import { OrderHistoryItem, OrderDetail } from '../types/orderHistory.types';
import { getReorderItems, formatOrderDate, formatCurrency } from '../services/orderHistoryService';
import { Colors, TextStyles, Spacing, BorderRadius, Elevation, TouchTarget } from '@/theme';

interface OrderHistoryScreenProps {
  navigation: any;
}

const OrderHistoryScreen: React.FC<OrderHistoryScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { orders, selectedOrder, loading, detailLoading, error } = useSelector(
    (state: RootState) => state.orderHistory
  );
  const { customerId } = useSelector((state: RootState) => state.loyalty);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (customerId) {
      dispatch(fetchOrderHistory({ customerId }));
    }
  }, [dispatch, customerId]);

  const onRefresh = useCallback(() => {
    if (customerId) {
      setRefreshing(true);
      dispatch(fetchOrderHistory({ customerId })).finally(() => {
        setRefreshing(false);
      });
    }
  }, [dispatch, customerId]);

  const handleOrderPress = (order: OrderHistoryItem) => {
    if (expandedOrderId === order.id) {
      setExpandedOrderId(null);
      dispatch(clearSelectedOrder());
    } else {
      setExpandedOrderId(order.id);
      dispatch(fetchOrderDetails(order.id));
    }
  };

  const handleReorder = (orderDetail: OrderDetail) => {
    const reorderItems = getReorderItems(orderDetail);
    reorderItems.forEach((item) => {
      dispatch(
        addToCart({
          menuItemId: item.menuItemId,
          sizeId: item.sizeId,
          name: item.name,
          sizeName: item.sizeName,
          price: item.price,
          quantity: item.quantity,
        })
      );
    });
    navigation.navigate('Cart');
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completed':
        return styles.statusCompleted;
      case 'open':
        return styles.statusOpen;
      case 'refunded':
        return styles.statusRefunded;
      default:
        return styles.statusDefault;
    }
  };

  const renderOrderItem = ({ item }: { item: OrderHistoryItem }) => {
    const isExpanded = expandedOrderId === item.id;
    const showDetails = isExpanded && selectedOrder && selectedOrder.id === item.id;

    return (
      <TouchableOpacity
        style={[styles.orderCard, isExpanded && styles.orderCardExpanded]}
        onPress={() => handleOrderPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.orderHeader}>
          <View style={styles.orderInfo}>
            <Text style={styles.orderNumber}>Order #{item.dailyOrderNumber}</Text>
            <Text style={styles.orderDate}>{formatOrderDate(item.orderDate)}</Text>
          </View>
          <View style={styles.orderRight}>
            <Text style={styles.orderTotal}>{formatCurrency(item.total)}</Text>
            <View style={[styles.statusBadge, getStatusStyle(item.status)]}>
              <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        <View style={styles.orderMeta}>
          <Text style={styles.itemCount}>{item.itemCount} item{item.itemCount !== 1 ? 's' : ''}</Text>
          <Text style={styles.expandHint}>{isExpanded ? 'Tap to collapse' : 'Tap for details'}</Text>
        </View>

        {showDetails && (
          <View style={styles.detailsContainer}>
            {detailLoading ? (
              <ActivityIndicator size="small" color={Colors.brandGold} style={styles.detailLoader} />
            ) : (
              <>
                <View style={styles.divider} />
                <Text style={styles.detailsTitle}>ORDER ITEMS</Text>
                {selectedOrder.items.map((orderItem, index) => (
                  <View key={index} style={styles.detailItem}>
                    <View style={styles.detailItemLeft}>
                      <Text style={styles.detailItemName}>
                        {orderItem.quantity}x {orderItem.name}
                      </Text>
                      {orderItem.sizeName && (
                        <Text style={styles.detailItemSize}>{orderItem.sizeName}</Text>
                      )}
                    </View>
                    <Text style={styles.detailItemPrice}>
                      {formatCurrency(orderItem.lineTotal)}
                    </Text>
                  </View>
                ))}

                <View style={styles.totalsContainer}>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Subtotal</Text>
                    <Text style={styles.totalValue}>{formatCurrency(selectedOrder.subtotal)}</Text>
                  </View>
                  {selectedOrder.taxAmount > 0 && (
                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel}>Tax</Text>
                      <Text style={styles.totalValue}>{formatCurrency(selectedOrder.taxAmount)}</Text>
                    </View>
                  )}
                  {selectedOrder.discountAmount > 0 && (
                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel}>Discount</Text>
                      <Text style={[styles.totalValue, styles.discountValue]}>
                        -{formatCurrency(selectedOrder.discountAmount)}
                      </Text>
                    </View>
                  )}
                  <View style={[styles.totalRow, styles.grandTotalRow]}>
                    <Text style={styles.grandTotalLabel}>Total</Text>
                    <Text style={styles.grandTotalValue}>{formatCurrency(selectedOrder.total)}</Text>
                  </View>
                </View>

                {item.status === 'completed' && (
                  <TouchableOpacity
                    style={styles.reorderButton}
                    onPress={() => handleReorder(selectedOrder)}
                  >
                    <Text style={styles.reorderButtonText}>Reorder These Items</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No Orders Yet</Text>
      <Text style={styles.emptySubtitle}>
        Your order history will appear here once you place your first order.
      </Text>
      <TouchableOpacity
        style={styles.browseButton}
        onPress={() => navigation.navigate('Menu')}
      >
        <Text style={styles.browseButtonText}>Browse Menu</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order History</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading && orders.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.brandGold} />
          <Text style={styles.loadingText}>Loading your orders...</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderOrderItem}
          contentContainerStyle={[
            styles.listContent,
            orders.length === 0 && styles.listContentEmpty,
          ]}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.brandGold}
              colors={[Colors.brandGold]}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: Spacing.md,
    backgroundColor: Colors.brandGold,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Elevation.level3,
  },
  headerTitle: {
    ...TextStyles.headline,
    color: Colors.textOnGold,
  },
  backButton: {
    minHeight: TouchTarget.minimum,
    minWidth: TouchTarget.minimum,
    justifyContent: 'center',
  },
  backButtonText: {
    ...TextStyles.label,
    color: Colors.textOnGold,
  },
  headerSpacer: {
    width: 50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...TextStyles.body,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  listContent: {
    padding: Spacing.md,
  },
  listContentEmpty: {
    flex: 1,
  },
  orderCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Elevation.level1,
  },
  orderCardExpanded: {
    ...Elevation.level2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    ...TextStyles.title,
    color: Colors.slate900,
  },
  orderDate: {
    ...TextStyles.body,
    color: Colors.slate600,
    marginTop: Spacing.xs,
  },
  orderRight: {
    alignItems: 'flex-end',
  },
  orderTotal: {
    ...TextStyles.price,
    fontSize: 20,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.xs,
  },
  statusCompleted: {
    backgroundColor: Colors.successLight,
  },
  statusOpen: {
    backgroundColor: Colors.warningLight,
  },
  statusRefunded: {
    backgroundColor: Colors.errorLight,
  },
  statusDefault: {
    backgroundColor: Colors.lightGray,
  },
  statusText: {
    ...TextStyles.microLabel,
    fontSize: 10,
  },
  orderMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  itemCount: {
    ...TextStyles.body,
    color: Colors.slate600,
  },
  expandHint: {
    ...TextStyles.microLabel,
    color: Colors.brandBlue,
    fontSize: 10,
  },
  detailsContainer: {
    marginTop: Spacing.sm,
  },
  detailLoader: {
    marginVertical: Spacing.lg,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  detailsTitle: {
    ...TextStyles.label,
    color: Colors.brandBlue,
    marginBottom: Spacing.sm,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceContainer,
  },
  detailItemLeft: {
    flex: 1,
  },
  detailItemName: {
    ...TextStyles.body,
    color: Colors.slate900,
  },
  detailItemSize: {
    ...TextStyles.microLabel,
    color: Colors.slate600,
    marginTop: 2,
  },
  detailItemPrice: {
    ...TextStyles.body,
    color: Colors.brandGold,
    fontWeight: '600',
  },
  totalsContainer: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  totalLabel: {
    ...TextStyles.body,
    color: Colors.slate600,
  },
  totalValue: {
    ...TextStyles.body,
    color: Colors.slate900,
  },
  discountValue: {
    color: Colors.success,
  },
  grandTotalRow: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  grandTotalLabel: {
    ...TextStyles.title,
    color: Colors.slate900,
  },
  grandTotalValue: {
    ...TextStyles.price,
  },
  reorderButton: {
    backgroundColor: Colors.brandGold,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.lg,
    minHeight: TouchTarget.comfortable,
    justifyContent: 'center',
    ...Elevation.level2,
  },
  reorderButtonText: {
    ...TextStyles.label,
    color: Colors.textOnGold,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyTitle: {
    ...TextStyles.headline,
    color: Colors.slate900,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    ...TextStyles.body,
    color: Colors.slate600,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  browseButton: {
    backgroundColor: Colors.brandBlue,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    minHeight: TouchTarget.comfortable,
    justifyContent: 'center',
    ...Elevation.level2,
  },
  browseButtonText: {
    ...TextStyles.label,
    color: Colors.white,
    fontSize: 14,
  },
});

export default OrderHistoryScreen;
