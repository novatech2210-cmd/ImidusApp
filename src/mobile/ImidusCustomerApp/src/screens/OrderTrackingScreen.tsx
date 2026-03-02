import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import apiClient from '../api/apiClient';
import { Colors } from '../theme/colors';
import { Spacing } from '../theme/spacing';

interface OrderStatus {
  salesId: number;
  dailyOrderNumber: number;
  transType: number;
  orderTotal: number;
}

const OrderTrackingScreen = ({ route, navigation }: any) => {
  const { salesId, dailyOrderNumber } = route.params;
  const [status, setStatus] = useState<'pending' | 'completed' | 'error'>('pending');
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
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.statusText}>Your order is being prepared...</Text>
            <Text style={styles.subText}>We'll notify you when it's ready!</Text>
          </View>
        )}

        {status === 'completed' && (
          <View style={[styles.statusCard, styles.completedCard]}>
            <Text style={styles.completedIcon}>✓</Text>
            <Text style={styles.statusText}>Order Ready for Pickup!</Text>
            <Text style={styles.subText}>Please collect your order at the counter.</Text>
          </View>
        )}

        {status === 'error' && (
          <View style={styles.statusCard}>
            <Text style={styles.errorText}>Unable to load order status.</Text>
            <TouchableOpacity onPress={fetchOrderStatus} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={styles.doneButton}
          onPress={() => navigation.navigate('Menu')}
        >
          <Text style={styles.doneButtonText}>Back to Menu</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.secondary,
    marginBottom: Spacing.xl,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  statusCard: {
    backgroundColor: Colors.white,
    padding: Spacing.xl,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
    marginBottom: Spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  completedCard: {
    borderColor: Colors.success,
    borderWidth: 2,
  },
  statusText: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  subText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  completedIcon: {
    fontSize: 48,
    color: Colors.success,
  },
  errorText: {
    fontSize: 16,
    color: Colors.error,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  doneButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: 8,
    width: '100%',
  },
  doneButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default OrderTrackingScreen;
