import {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import apiClient from '../api/apiClient';
import {Colors, Shadow, Spacing} from '../theme';

interface OrderStatus {
  salesId: number;
  dailyOrderNumber: number;
  transType: number;
  orderTotal: number;
}

const OrderTrackingScreen = ({route, navigation}: any) => {
  const {salesId, dailyOrderNumber} = route.params;
  const [status, setStatus] = useState<'pending' | 'completed' | 'error'>(
    'pending',
  );
  const [orderData, setOrderData] = useState<OrderStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial fetch
    fetchOrderStatus();

    // Poll every 10 seconds
    const pollInterval = setInterval(() => {
      fetchOrderStatus();
    }, 10000); // 10 seconds

    return () => clearInterval(pollInterval); // Cleanup on unmount
  }, [salesId]);

  const fetchOrderStatus = async () => {
    try {
      const response = await apiClient.get(`/Orders/${salesId}`);
      const data: OrderStatus = response.data;

      setOrderData(data);
      setLoading(false);

      if (data.transType === 1) {
        setStatus('completed');
        // Stop polling when complete (optional - can continue for real-time updates)
      } else if (data.transType === 2) {
        setStatus('pending');
      }
    } catch (error) {
      console.error('Polling error:', error);
      setStatus('error');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading order status...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Order #{dailyOrderNumber}</Text>

        {status === 'pending' && (
          <View style={styles.statusCard}>
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>PREPARING</Text>
            </View>
            <ActivityIndicator
              size="large"
              color={Colors.brandBlue}
              style={{marginVertical: Spacing.lg}}
            />
            <Text style={styles.statusText}>
              IMIDUS | Preparing your order...
            </Text>
            <Text style={styles.subText}>
              We'll notify you when it's ready!
            </Text>
          </View>
        )}

        {status === 'completed' && (
          <View style={styles.statusCard}>
            <View style={styles.completedBadge}>
              <Text style={styles.completedBadgeText}>
                ✓ READY FOR COLLECTION
              </Text>
            </View>
            <Text style={styles.completedIcon}>🛍️</Text>
            <Text style={styles.statusText}>Ready for pickup!</Text>
            <Text style={styles.subText}>
              Please collect your order at the counter.
            </Text>
          </View>
        )}

        {status === 'error' && (
          <View style={styles.statusCard}>
            <Text style={styles.errorText}>Unable to load order status.</Text>
            <TouchableOpacity
              onPress={fetchOrderStatus}
              style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          onPress={() => navigation.navigate('Menu')}
          style={{width: '100%'}}>
          <View style={styles.doneButton}>
            <Text style={styles.doneButtonText}>Back to Menu</Text>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.elevation0,
  },
  content: {
    flex: 1,
    padding: Spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.brandBlue,
    marginBottom: Spacing.xl,
    letterSpacing: 0.5,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  statusCard: {
    backgroundColor: Colors.white,
    padding: Spacing.xl,
    borderRadius: 16,
    alignItems: 'center',
    width: '100%',
    marginBottom: Spacing.xl,
    ...Shadow.level1,
  },
  pendingBadge: {
    backgroundColor: Colors.warningLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: 100,
    marginBottom: Spacing.md,
  },
  pendingBadgeText: {
    color: Colors.warning,
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 1,
  },
  completedBadge: {
    backgroundColor: Colors.successLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: 100,
    marginBottom: Spacing.md,
  },
  completedBadgeText: {
    color: Colors.success,
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  statusText: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.brandBlue,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  subText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  completedIcon: {
    fontSize: 64,
    marginVertical: Spacing.md,
  },
  errorText: {
    fontSize: 16,
    color: Colors.error,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: Spacing.lg,
    paddingVertical: 12,
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.brandBlue,
    borderRadius: 12,
  },
  retryButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  doneButton: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.brandBlue,
    paddingVertical: 14,
    paddingHorizontal: Spacing.xl,
    borderRadius: 12,
    width: '100%',
  },
  doneButtonText: {
    color: Colors.brandBlue,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});

export default OrderTrackingScreen;
