'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

export interface Order {
  id: number;
  customerName: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  items?: Array<{
    name: string;
    quantity: number;
  }>;
}

interface UseOrderPollOptions {
  pollInterval?: number;
  enabled?: boolean;
  onError?: (error: Error) => void;
  onSuccess?: (orders: Order[]) => void;
}

/**
 * Custom hook for polling recent orders from the admin API
 * Updates every 10 seconds (default) when enabled
 *
 * @example
 * const { orders, loading, error } = useOrderPoll({
 *   pollInterval: 10000,
 *   enabled: true
 * });
 */
export function useOrderPoll({
  pollInterval = 10000,
  enabled = true,
  onError,
  onSuccess,
}: UseOrderPollOptions = {}) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  const fetchOrders = useCallback(async () => {
    if (!enabled || !isMountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/orders/queue?limit=50', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.statusText}`);
      }

      const data = await response.json();

      if (isMountedRef.current) {
        const newOrders = data.data || [];
        setOrders(newOrders);
        onSuccess?.(newOrders);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');

      if (isMountedRef.current) {
        setError(error);
        onError?.(error);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [enabled, onError, onSuccess]);

  useEffect(() => {
    isMountedRef.current = true;

    if (!enabled) {
      return;
    }

    // Fetch immediately on mount or when enabled changes
    fetchOrders();

    // Set up polling interval
    pollTimeoutRef.current = setInterval(fetchOrders, pollInterval);

    return () => {
      if (pollTimeoutRef.current) {
        clearInterval(pollTimeoutRef.current);
      }
    };
  }, [enabled, pollInterval, fetchOrders]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (pollTimeoutRef.current) {
        clearInterval(pollTimeoutRef.current);
      }
    };
  }, []);

  const refetch = useCallback(() => {
    fetchOrders();
  }, [fetchOrders]);

  return {
    orders,
    loading,
    error,
    refetch,
  };
}
