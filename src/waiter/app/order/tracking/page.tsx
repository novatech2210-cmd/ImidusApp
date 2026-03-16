'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { OrderAPI, type OrderStatus } from '@/lib/api';

interface ExtendedOrderStatus extends OrderStatus {
  orderNumber?: string;
  placedAt?: string;
  items?: Array<{
    name: string;
    quantity: number;
  }>;
  total?: number;
}

const statusSteps = [
  { key: 'received', label: 'Order Received', icon: '1', description: 'Your order has been received' },
  { key: 'preparing', label: 'Preparing', icon: '2', description: 'Kitchen is preparing your order' },
  { key: 'ready', label: 'Ready for Pickup', icon: '3', description: 'IMIDUS | Your order is ready for collection.' },
  { key: 'completed', label: 'Completed', icon: '4', description: 'Order picked up' },
];

function OrderTrackingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('orderId');

  const [orderStatus, setOrderStatus] = useState<ExtendedOrderStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [ssotVerified, setSsotVerified] = useState(false);

  /**
   * Fetch order status from POS (SSOT)
   * READ-ONLY operation
   */
  const fetchOrderStatus = async () => {
    if (!orderId) {
      setError('No order ID provided');
      setLoading(false);
      return;
    }

    try {
      // Fetch status from POS via READ-ONLY API
      const status = await OrderAPI.getOrderStatus(orderId);

      // Verify SSOT marker
      if (status._meta?.source === 'INI_Restaurant' && status._meta?.readonly) {
        setSsotVerified(true);
      } else {
        console.warn('SSOT verification failed for status data');
      }

      // Also fetch full order details for display
      const order = await OrderAPI.getOrderById(orderId);

      const extendedStatus: ExtendedOrderStatus = {
        ...status,
        orderNumber: order.orderNumber || order.id,
        placedAt: order.createdAt,
        items: order.items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
        })),
        total: order.total,
      };

      setOrderStatus(extendedStatus);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch order status from POS:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load order status from POS system'
      );
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchOrderStatus();
  }, [orderId]);

  // Auto-refresh every 30 seconds (polling POS for status updates)
  useEffect(() => {
    if (!autoRefresh || !orderId) return;

    const interval = setInterval(() => {
      fetchOrderStatus();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, orderId]);

  // Get current step index
  const getCurrentStepIndex = () => {
    if (!orderStatus) return 0;
    return statusSteps.findIndex((step) => step.key === orderStatus.status);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E5AA8] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading order status from POS...</p>
        </div>
      </div>
    );
  }

  if (error || !orderStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="mt-4 text-xl font-semibold text-gray-900">Order Not Found</h2>
            <p className="mt-2 text-gray-600">{error}</p>
            <button
              onClick={() => router.push('/menu')}
              className="mt-6 px-6 py-2 bg-[#1E5AA8] text-white rounded-lg hover:bg-[#164785] transition-colors"
            >
              Return to Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentStepIndex = getCurrentStepIndex();
  const currentStep = statusSteps[currentStepIndex];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* SSOT Verification Badge (dev only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${
            ssotVerified
              ? 'bg-green-100 text-green-800 border border-green-200'
              : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
          }`}>
            {ssotVerified ? 'Verified' : 'Warning'} SSOT Status: {
              ssotVerified
                ? 'Verified from INI_Restaurant'
                : 'Verification failed'
            }
          </div>
        )}

        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-[#1A1A2E]">Track Your Order</h1>
            <p className="mt-2 text-lg text-gray-600">
              Order #{orderStatus.orderNumber}
            </p>
            {orderStatus.placedAt && (
              <p className="mt-1 text-sm text-gray-500">
                Placed at {new Date(orderStatus.placedAt).toLocaleString()}
              </p>
            )}
          </div>

          {/* Current Status & Estimated Ready Time */}
          <div className="mt-6 bg-[rgba(30,90,168,0.08)] border-2 border-[rgba(30,90,168,0.2)] rounded-lg p-6 text-center">
            <div className="w-12 h-12 bg-[#1E5AA8] text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-2">
              {currentStep.icon}
            </div>
            <p className="text-sm text-gray-600 uppercase tracking-wide">Current Status</p>
            <p className="mt-1 text-2xl font-bold text-[#1A1A2E]">{currentStep.label}</p>
            <p className="mt-1 text-sm text-gray-600">{currentStep.description}</p>
            {orderStatus.estimatedReadyTime && (
              <>
                <p className="mt-4 text-sm text-gray-600 uppercase tracking-wide">Estimated Ready Time</p>
                <p className="mt-1 text-3xl font-bold text-[#D4AF37]">{orderStatus.estimatedReadyTime}</p>
              </>
            )}
          </div>
        </div>

        {/* Status Progress */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <h2 className="text-xl font-semibold text-[#1A1A2E] mb-6">Order Progress</h2>

          <div className="relative">
            {/* Progress Line */}
            <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-gray-200">
              <div
                className="bg-[#1E5AA8] transition-all duration-500 ease-in-out"
                style={{
                  height: `${(currentStepIndex / (statusSteps.length - 1)) * 100}%`,
                }}
              />
            </div>

            {/* Steps */}
            <div className="space-y-8 relative">
              {statusSteps.map((step, index) => {
                const isCompleted = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;

                return (
                  <div key={step.key} className="flex items-start">
                    <div
                      className={`flex items-center justify-center w-16 h-16 rounded-full border-4 text-2xl font-bold transition-all duration-300 ${
                        isCompleted
                          ? 'bg-[#1E5AA8] border-[#1E5AA8] text-white'
                          : 'bg-white border-gray-300 text-gray-400'
                      } ${isCurrent ? 'ring-4 ring-[rgba(30,90,168,0.2)]' : ''}`}
                    >
                      {step.icon}
                    </div>
                    <div className="ml-6 flex-1">
                      <h3
                        className={`text-lg font-semibold ${
                          isCompleted ? 'text-[#1A1A2E]' : 'text-gray-400'
                        }`}
                      >
                        {step.label}
                      </h3>
                      <p
                        className={`mt-1 text-sm ${
                          isCompleted ? 'text-gray-600' : 'text-gray-400'
                        }`}
                      >
                        {step.description}
                      </p>
                      {isCurrent && (
                        <p className="mt-1 text-sm text-[#D4AF37] font-medium animate-pulse">
                          In Progress...
                        </p>
                      )}
                      {isCompleted && !isCurrent && (
                        <p className="mt-1 text-sm text-green-600">Completed</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Order Items */}
        {orderStatus.items && orderStatus.items.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-8 mb-6">
            <h2 className="text-xl font-semibold text-[#1A1A2E] mb-4">Order Items</h2>
            <div className="space-y-2">
              {orderStatus.items.map((item, index) => (
                <div key={index} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                  <span className="text-gray-700">{item.name}</span>
                  <span className="text-gray-500">Qty: {item.quantity}</span>
                </div>
              ))}
            </div>
            {orderStatus.total !== undefined && (
              <div className="mt-4 pt-4 border-t flex justify-between items-center">
                <span className="text-lg font-semibold text-[#1A1A2E]">Total</span>
                <span className="text-2xl font-bold text-[#D4AF37]">
                  ${orderStatus.total.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Auto-refresh Toggle */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-[#1A1A2E]">Auto-refresh</h3>
              <p className="text-xs text-gray-500">Updates every 30 seconds from POS</p>
            </div>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                autoRefresh ? 'bg-[#1E5AA8]' : 'bg-gray-200'
              }`}
              aria-label="Toggle auto-refresh"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  autoRefresh ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={fetchOrderStatus}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Status
          </button>
          <Link
            href="/menu"
            className="px-6 py-3 bg-[#1E5AA8] text-white rounded-lg hover:bg-[#164785] transition-colors font-medium text-center flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Order More
          </Link>
        </div>

        {/* Back to Confirmation */}
        <div className="mt-4 text-center">
          <Link
            href={`/order/confirmation?orderId=${orderId}`}
            className="text-[#1E5AA8] hover:text-[#164785] font-medium"
          >
            View Receipt
          </Link>
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E5AA8] mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

export default function OrderTrackingPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <OrderTrackingContent />
    </Suspense>
  );
}
