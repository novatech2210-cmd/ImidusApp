'use client';

import React from 'react';
import DataTable, { Column } from '@/components/Tables/DataTable';
import { SkeletonTable } from '@/components/Loading/Skeleton';
import { ShoppingBag, Clock } from 'lucide-react';

interface OrderItem {
  id: number;
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: number;
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'completed' | 'cancelled' | 'refunded';
  paymentStatus: 'paid' | 'pending' | 'failed' | 'refunded';
  createdAt: string;
}

interface OrderQueueProps {
  orders: Order[];
  loading?: boolean;
  onOrderClick?: (order: Order) => void;
}

export default function OrderQueue({ orders, loading = false, onOrderClick }: OrderQueueProps) {
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-[onyx-gold]/20 text-[onyx-gold]',
      ready: 'bg-[onyx-blue]/20 text-[onyx-blue]',
      completed: 'bg-[#4ADE80]/20 text-[#4ADE80]',
      cancelled: 'bg-[#FF6B6B]/20 text-[#FF6B6B]',
      refunded: 'bg-[text-onyx-text-secondary]/20 text-[text-onyx-text-secondary]',
    };
    return colors[status] || 'bg-[bg-onyx-bg-tertiary] text-[text-onyx-text-secondary]';
  };

  const getPaymentColor = (status: string) => {
    const colors: Record<string, string> = {
      paid: 'bg-[#4ADE80]/20 text-[#4ADE80]',
      pending: 'bg-[onyx-gold]/20 text-[onyx-gold]',
      failed: 'bg-[#FF6B6B]/20 text-[#FF6B6B]',
      refunded: 'bg-[text-onyx-text-secondary]/20 text-[text-onyx-text-secondary]',
    };
    return colors[status] || 'bg-[bg-onyx-bg-tertiary] text-[text-onyx-text-secondary]';
  };

  const columns: Column<Order>[] = [
    {
      key: 'orderNumber',
      label: 'Order #',
      sortable: true,
      render: (value) => (
        <span className="font-mono font-semibold text-[onyx-blue]">{value}</span>
      ),
    },
    {
      key: 'customerName',
      label: 'Customer',
      sortable: true,
      render: (value) => (
        <span className="text-[text-onyx-text-primary] font-medium">{value}</span>
      ),
    },
    {
      key: 'total',
      label: 'Total',
      sortable: true,
      render: (value) => (
        <span className="font-semibold text-[onyx-gold]">
          ${(value / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => (
        <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(value)}`}>
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
      ),
    },
    {
      key: 'paymentStatus',
      label: 'Payment',
      sortable: true,
      render: (value) => (
        <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${getPaymentColor(value)}`}>
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Time',
      render: (value) => (
        <span className="flex items-center gap-1.5 text-[text-onyx-text-secondary] text-sm">
          <Clock size={14} />
          {new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      ),
    },
  ];

  if (loading) {
    return <SkeletonTable rows={10} cols={6} />;
  }

  if (orders.length === 0) {
    return (
      <div className="bg-[bg-onyx-bg-secondary] p-12 rounded-xl border border-[border-onyx-border] flex flex-col items-center justify-center">
        <ShoppingBag size={48} className="text-[text-onyx-text-muted] mb-4" />
        <p className="text-[text-onyx-text-secondary] font-medium">No orders in queue</p>
        <p className="text-sm text-[text-onyx-text-muted]">Orders will appear here as they come in</p>
      </div>
    );
  }

  return (
    <div className="bg-[bg-onyx-bg-secondary] p-6 rounded-xl border border-[border-onyx-border]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[text-onyx-text-primary]">Order Queue</h3>
        <span className="text-xs font-medium text-[text-onyx-text-muted] bg-[bg-onyx-bg-tertiary] px-3 py-1 rounded-full">
          {orders.length} orders
        </span>
      </div>
      <DataTable<Order>
        columns={columns}
        data={orders}
        pageSize={15}
        onRowClick={onOrderClick}
        emptyMessage="No orders"
      />
    </div>
  );
}
