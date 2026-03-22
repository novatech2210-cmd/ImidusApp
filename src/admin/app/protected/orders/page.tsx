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
import { RefreshCw, ShoppingCart, Database } from 'lucide-react';

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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[onyx-blue]/10 rounded-xl">
              <ShoppingCart size={24} className="text-[onyx-blue]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[text-onyx-text-primary]">Orders</h1>
              <p className="text-sm text-[text-onyx-text-muted]">Manage and track customer orders</p>
            </div>
          </div>

          {/* Live from POS badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#4ADE80]/10 rounded-full border border-[#4ADE80]/30">
            <Database size={14} className="text-[#4ADE80]" />
            <span className="text-xs font-medium text-[#4ADE80]">Live from INI_Restaurant</span>
          </div>
        </div>

        {/* Filters */}
        <OrderFilters
          filters={filters}
          onFilterChange={setFilters}
          onReset={() => setFilters(initialFilters)}
        />

        {/* Filter Summary and Refresh */}
        <div className="flex items-center justify-between bg-[bg-onyx-bg-secondary] p-4 rounded-xl border border-[border-onyx-border]">
          <div className="text-sm text-[text-onyx-text-secondary]">
            {hasActiveFilters ? (
              <span>Showing <span className="text-[text-onyx-text-primary] font-semibold">{ordersData.length}</span> orders matching filters</span>
            ) : (
              <span>Showing <span className="text-[text-onyx-text-primary] font-semibold">{ordersData.length}</span> recent orders</span>
            )}
          </div>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[onyx-blue] to-[#3D82E0] text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {/* Order Queue */}
        {isLoadingQueue && !ordersData.length ? (
          <div className="flex items-center justify-center h-64 bg-[bg-onyx-bg-secondary] rounded-xl border border-[border-onyx-border]">
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
        <div className="fixed bottom-0 right-0 left-0 bg-[bg-onyx-bg-secondary] border-t border-[border-onyx-border] p-4 z-40">
          <div className="max-w-7xl mx-auto flex justify-end gap-3">
            <button
              onClick={() => setShowDetail(false)}
              className="px-4 py-2 border border-[border-onyx-border] text-[text-onyx-text-secondary] rounded-xl hover:bg-[bg-onyx-bg-tertiary] hover:text-[text-onyx-text-primary] transition-colors"
            >
              Close
            </button>
            {orderDetail.status !== 'completed' && orderDetail.status !== 'cancelled' && (
              <>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-[#FF6B6B]/10 text-[#FF6B6B] border border-[#FF6B6B]/30 rounded-xl hover:bg-[#FF6B6B]/20 transition-colors"
                >
                  Cancel Order
                </button>
                {orderDetail.paymentStatus === 'paid' && (
                  <button
                    onClick={handleRefund}
                    className="px-4 py-2 bg-gradient-to-r from-[onyx-gold] to-[#E5B84D] text-[bg-onyx-bg-secondary] font-semibold rounded-xl hover:opacity-90 transition-opacity"
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
