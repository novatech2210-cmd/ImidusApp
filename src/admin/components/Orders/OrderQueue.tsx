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
      pending: 'bg-[#FFD666]/20 text-[#FFD666]',
      ready: 'bg-[#5BA0FF]/20 text-[#5BA0FF]',
      completed: 'bg-[#4ADE80]/20 text-[#4ADE80]',
      cancelled: 'bg-[#FF6B6B]/20 text-[#FF6B6B]',
      refunded: 'bg-[#9A9AA3]/20 text-[#9A9AA3]',
    };
    return colors[status] || 'bg-[#222228] text-[#9A9AA3]';
  };

  const getPaymentColor = (status: string) => {
    const colors: Record<string, string> = {
      paid: 'bg-[#4ADE80]/20 text-[#4ADE80]',
      pending: 'bg-[#FFD666]/20 text-[#FFD666]',
      failed: 'bg-[#FF6B6B]/20 text-[#FF6B6B]',
      refunded: 'bg-[#9A9AA3]/20 text-[#9A9AA3]',
    };
    return colors[status] || 'bg-[#222228] text-[#9A9AA3]';
  };

  const columns: Column<Order>[] = [
    {
      key: 'orderNumber',
      label: 'Order #',
      sortable: true,
      render: (value) => (
        <span className="font-mono font-semibold text-[#5BA0FF]">{value}</span>
      ),
    },
    {
      key: 'customerName',
      label: 'Customer',
      sortable: true,
      render: (value) => (
        <span className="text-[#F5F5F7] font-medium">{value}</span>
      ),
    },
    {
      key: 'total',
      label: 'Total',
      sortable: true,
      render: (value) => (
        <span className="font-semibold text-[#FFD666]">
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
        <span className="flex items-center gap-1.5 text-[#9A9AA3] text-sm">
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
      <div className="bg-[#1A1A1F] p-12 rounded-xl border border-[#2A2A30] flex flex-col items-center justify-center">
        <ShoppingBag size={48} className="text-[#6E6E78] mb-4" />
        <p className="text-[#9A9AA3] font-medium">No orders in queue</p>
        <p className="text-sm text-[#6E6E78]">Orders will appear here as they come in</p>
      </div>
    );
  }

  return (
    <div className="bg-[#1A1A1F] p-6 rounded-xl border border-[#2A2A30]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[#F5F5F7]">Order Queue</h3>
        <span className="text-xs font-medium text-[#6E6E78] bg-[#222228] px-3 py-1 rounded-full">
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
