'use client';

import React from 'react';
import { TrendingUp, ShoppingCart, Users, DollarSign } from 'lucide-react';
import Skeleton from '@/components/Loading/Skeleton';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  loading?: boolean;
}

function KPICard({ title, value, change, icon, loading = false }: KPICardProps) {
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-start justify-between mb-2">
          <Skeleton width="w-20" height="h-4" />
          <div className="text-gray-400">{icon}</div>
        </div>
        <Skeleton width="w-24" height="h-8" />
        <Skeleton width="w-16" height="h-4" className="mt-2" />
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-700">{title}</h3>
        <div className="text-orange-500">{icon}</div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {change !== undefined && (
        <p className={`text-xs mt-2 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {change >= 0 ? '↑' : '↓'} {Math.abs(change)}% vs last period
        </p>
      )}
    </div>
  );
}

interface DashboardSummaryProps {
  data?: {
    totalOrders: number;
    totalRevenue: number;
    totalCustomers: number;
    revenueGrowth: number;
  };
  loading?: boolean;
}

export default function DashboardSummary({ data, loading = false }: DashboardSummaryProps) {
  const defaultData = {
    totalOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    revenueGrowth: 0,
  };

  const summary = data || defaultData;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <KPICard
        title="Total Orders"
        value={summary.totalOrders.toLocaleString()}
        icon={<ShoppingCart size={20} />}
        loading={loading}
      />
      <KPICard
        title="Revenue"
        value={`$${(summary.totalRevenue / 100).toLocaleString('en-US', { maximumFractionDigits: 2 })}`}
        change={summary.revenueGrowth}
        icon={<DollarSign size={20} />}
        loading={loading}
      />
      <KPICard
        title="Total Customers"
        value={summary.totalCustomers.toLocaleString()}
        icon={<Users size={20} />}
        loading={loading}
      />
      <KPICard
        title="Growth"
        value={`${summary.revenueGrowth.toFixed(1)}%`}
        icon={<TrendingUp size={20} />}
        loading={loading}
      />
    </div>
  );
}
