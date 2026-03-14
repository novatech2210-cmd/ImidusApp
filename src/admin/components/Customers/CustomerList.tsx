'use client';

import React from 'react';
import DataTable, { Column } from '@/components/Tables/DataTable';
import { SkeletonTable } from '@/components/Loading/Skeleton';

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
      // RFM segment colors
      'high-spend': 'bg-amber-100 text-amber-800',
      'frequent': 'bg-blue-100 text-blue-800',
      'recent': 'bg-green-100 text-green-800',
      'at-risk': 'bg-orange-100 text-orange-800',
      'new': 'bg-purple-100 text-purple-800',
      // Legacy segment colors
      vip: 'bg-purple-100 text-purple-800',
      regular: 'bg-blue-100 text-blue-800',
      at_risk: 'bg-red-100 text-red-800',
    };
    return colors[segment.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  const columns: Column<Customer>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
    },
    {
      key: 'phone',
      label: 'Phone',
    },
    {
      key: 'segment',
      label: 'Segment',
      sortable: true,
      render: (value) => (
        <span className={`px-2 py-1 text-xs font-medium rounded ${getSegmentColor(value)}`}>
          {value.replace('-', ' ').replace('_', ' ').toUpperCase()}
        </span>
      ),
    },
    {
      key: 'totalSpent',
      label: 'Total Spent',
      sortable: true,
      render: (value) => `$${(value / 100).toLocaleString('en-US', { maximumFractionDigits: 2 })}`,
    },
    {
      key: 'orderCount',
      label: 'Orders',
      sortable: true,
      render: (value) => value.toLocaleString(),
    },
    {
      key: 'lastOrder',
      label: 'Last Order',
      render: (value) => value ? new Date(value).toLocaleDateString() : 'Never',
    },
    {
      key: 'earnedPoints',
      label: 'Points',
      sortable: true,
      render: (value) => (value || 0).toLocaleString(),
    },
  ];

  if (loading) {
    return <SkeletonTable rows={10} cols={7} />;
  }

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Customers</h3>
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
