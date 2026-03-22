'use client';

import React from 'react';
import DataTable, { Column } from '@/components/Tables/DataTable';
import { SkeletonTable } from '@/components/Loading/Skeleton';
import { Users, Star } from 'lucide-react';

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  segment: string;
  totalSpent: number;
  orderCount: number;
  lastOrder: string;
  earnedPoints?: number;
}

interface CustomerListProps {
  customers: Customer[];
  loading?: boolean;
  onCustomerClick?: (customer: Customer) => void;
}

export default function CustomerList({
  customers,
  loading = false,
  onCustomerClick,
}: CustomerListProps) {
  const getSegmentColor = (segment: string) => {
    const colors: Record<string, string> = {
      // RFM segment colors - dark theme
      'high-spend': 'bg-[#FFD666]/20 text-[#FFD666]',
      'frequent': 'bg-[#5BA0FF]/20 text-[#5BA0FF]',
      'recent': 'bg-[#4ADE80]/20 text-[#4ADE80]',
      'at-risk': 'bg-[#FF6B6B]/20 text-[#FF6B6B]',
      'new': 'bg-[#A855F7]/20 text-[#A855F7]',
      // Legacy segment colors
      vip: 'bg-[#FFD666]/20 text-[#FFD666]',
      regular: 'bg-[#5BA0FF]/20 text-[#5BA0FF]',
      at_risk: 'bg-[#FF6B6B]/20 text-[#FF6B6B]',
    };
    return colors[segment.toLowerCase()] || 'bg-[#222228] text-[#9A9AA3]';
  };

  const columns: Column<Customer>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (value) => (
        <span className="font-medium text-[#F5F5F7]">{value}</span>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      render: (value) => (
        <span className="text-[#9A9AA3]">{value}</span>
      ),
    },
    {
      key: 'phone',
      label: 'Phone',
      render: (value) => (
        <span className="text-[#9A9AA3] font-mono">{value}</span>
      ),
    },
    {
      key: 'segment',
      label: 'Segment',
      sortable: true,
      render: (value) => (
        <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${getSegmentColor(value)}`}>
          {value.replace('-', ' ').replace('_', ' ').toUpperCase()}
        </span>
      ),
    },
    {
      key: 'totalSpent',
      label: 'Total Spent',
      sortable: true,
      render: (value) => (
        <span className="font-semibold text-[#FFD666]">
          ${(value / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: 'orderCount',
      label: 'Orders',
      sortable: true,
      render: (value) => (
        <span className="text-[#F5F5F7]">{value.toLocaleString()}</span>
      ),
    },
    {
      key: 'lastOrder',
      label: 'Last Order',
      render: (value) => (
        <span className="text-[#9A9AA3]">
          {value ? new Date(value).toLocaleDateString() : 'Never'}
        </span>
      ),
    },
    {
      key: 'earnedPoints',
      label: 'Points',
      sortable: true,
      render: (value) => (
        <span className="flex items-center gap-1 text-[#FFD666] font-medium">
          <Star size={14} />
          {(value || 0).toLocaleString()}
        </span>
      ),
    },
  ];

  if (loading) {
    return <SkeletonTable rows={10} cols={8} />;
  }

  if (customers.length === 0) {
    return (
      <div className="bg-[#1A1A1F] p-12 rounded-xl border border-[#2A2A30] flex flex-col items-center justify-center">
        <Users size={48} className="text-[#6E6E78] mb-4" />
        <p className="text-[#9A9AA3] font-medium">No customers found</p>
        <p className="text-sm text-[#6E6E78]">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div className="bg-[#1A1A1F] p-6 rounded-xl border border-[#2A2A30]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[#F5F5F7]">Customers</h3>
        <span className="text-xs font-medium text-[#6E6E78] bg-[#222228] px-3 py-1 rounded-full">
          {customers.length} customers
        </span>
      </div>
      <DataTable<Customer>
        columns={columns}
        data={customers}
        pageSize={15}
        onRowClick={onCustomerClick}
        emptyMessage="No customers found"
      />
    </div>
  );
}
