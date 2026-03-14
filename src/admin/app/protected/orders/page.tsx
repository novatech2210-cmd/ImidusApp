'use client';

import React, { useState, useMemo } from 'react';
import MainLayout from '@/components/Navigation/MainLayout';
import OrderQueue from '@/components/Orders/OrderQueue';
import OrderDetailModal from '@/components/Orders/OrderDetailModal';
import RefundDialog from '@/components/Orders/RefundDialog';
import CancelOrderDialog from '@/components/Orders/CancelOrderDialog';
import OrderFilters, { OrderFilterState, initialFilters } from '@/components/Orders/OrderFilters';
import { useOrderQueue, useOrderDetail } from '@/lib/hooks';
import Spinner from '@/components/Loading/Spinner';
import { RefreshCw } from 'lucide-react';

interface Order {
  id: number;
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  items: any[];
  total: number;
  status: 'pending' | 'completed' | 'cancelled' | 'refunded' | 'ready';
  paymentStatus: 'paid' | 'pending' | 'failed' | 'refunded';
  createdAt: string;
  transType?: number;
}

export default function OrdersPage() {
  const [filters, setFilters] = useState<OrderFilterState>(initialFilters);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showRefund, setShowRefund] = useState(false);
  const [showCancel, setShowCancel] = useState(false);

  const { data: orders = [], isPending: isLoadingQueue, refetch } = useOrderQueue(filters);

  // Check if any filters are active
  const hasActiveFilters =
    filters.status ||
    filters.paymentStatus ||
    filters.startDate ||
    filters.endDate ||
    filters.searchTerm;

  const { data: orderDetail, isPending: isLoadingDetail } = useOrderDetail(
    selectedOrder?.id ?? 0
  );

  const ordersData = useMemo(() => {
    return Array.isArray(orders)
      ? orders.map((order, idx) => ({
          ...order,
          id: order.id || idx,
        }))
      : [];
  }, [orders]);

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
    setShowDetail(true);
  };

  const handleRefund = () => {
    setShowDetail(false);
    setShowRefund(true);
  };

  const handleCancel = () => {
    setShowDetail(false);
    setShowCancel(true);
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
            <p className="text-gray-600">Manage and track customer orders</p>
          </div>
        </div>

        {/* Filters */}
        <OrderFilters
          filters={filters}
          onFilterChange={setFilters}
          onReset={() => setFilters(initialFilters)}
        />

        {/* Filter Summary and Refresh */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {hasActiveFilters ? (
              <span>Showing {ordersData.length} orders matching filters</span>
            ) : (
              <span>Showing {ordersData.length} recent orders</span>
            )}
          </div>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {/* Order Queue */}
        {isLoadingQueue && !ordersData.length ? (
          <div className="flex items-center justify-center h-64">
            <Spinner text="Loading orders..." />
          </div>
        ) : (
          <OrderQueue
            orders={ordersData}
            loading={isLoadingQueue}
            onOrderClick={handleOrderClick}
          />
        )}
      </div>

      {/* Order Detail Modal */}
      <OrderDetailModal
        isOpen={showDetail}
        onClose={() => {
          setShowDetail(false);
          setSelectedOrder(null);
        }}
        order={orderDetail || selectedOrder || undefined}
        loading={isLoadingDetail}
      />

      {/* Footer Actions */}
      {showDetail && orderDetail && (
        <div className="fixed bottom-0 right-0 left-0 bg-white border-t border-gray-200 p-4 z-40">
          <div className="max-w-7xl mx-auto flex justify-end gap-2">
            <button
              onClick={() => setShowDetail(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Close
            </button>
            {orderDetail.status !== 'completed' && orderDetail.status !== 'cancelled' && (
              <>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Cancel Order
                </button>
                {orderDetail.paymentStatus === 'paid' && (
                  <button
                    onClick={handleRefund}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                  >
                    Refund
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Refund Dialog */}
      {selectedOrder && (
        <RefundDialog
          isOpen={showRefund}
          onClose={() => setShowRefund(false)}
          orderId={selectedOrder.id}
          orderTotal={selectedOrder.total}
          onSuccess={() => {
            setShowDetail(false);
            setSelectedOrder(null);
          }}
        />
      )}

      {/* Cancel Dialog */}
      {selectedOrder && (
        <CancelOrderDialog
          isOpen={showCancel}
          onClose={() => setShowCancel(false)}
          orderId={selectedOrder.id}
          onSuccess={() => {
            setShowDetail(false);
            setSelectedOrder(null);
          }}
        />
      )}
    </MainLayout>
  );
}
