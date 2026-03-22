'use client';

import React, { useMemo } from 'react';
import MainLayout from '@/components/Navigation/MainLayout';
import DashboardSummary from './DashboardSummary';
import SalesChart from './SalesChart';
import PopularItems from './PopularItems';
import Spinner from '@/components/Loading/Spinner';
import { useDashboardSummary, useSalesChart, usePopularItems } from '@/lib/hooks';
import { Activity, TrendingUp, Calendar } from 'lucide-react';

export default function DashboardPage() {
  // Get date range (last 30 days)
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Fetch data from INI_Restaurant (read-only)
  const summaryQuery = useDashboardSummary(startDate, endDate);
  const chartQuery = useSalesChart(startDate, endDate, 'day');
  const itemsQuery = usePopularItems(10);

  const isLoading = summaryQuery.isPending || chartQuery.isPending || itemsQuery.isPending;
  const isError = summaryQuery.isError || chartQuery.isError || itemsQuery.isError;

  // Format chart data
  const chartData = useMemo(() => {
    if (!chartQuery.data) return [];
    return Array.isArray(chartQuery.data) ? chartQuery.data : [];
  }, [chartQuery.data]);

  // Format items data
  const itemsData = useMemo(() => {
    if (!itemsQuery.data) return [];
    return Array.isArray(itemsQuery.data)
      ? itemsQuery.data.map((item, idx) => ({
          ...item,
          id: item.id || idx,
        }))
      : [];
  }, [itemsQuery.data]);

  if (isLoading && !summaryQuery.data) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-full">
          <Spinner text="Loading dashboard..." />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-onyx-blue-gradient rounded-xl">
                <Activity size={24} className="text-white" />
              </div>
              <h1 className="text-3xl font-bold text-onyx-text-primary">Dashboard</h1>
            </div>
            <p className="text-onyx-text-muted flex items-center gap-2">
              <Calendar size={14} />
              {startDate} to {endDate}
            </p>
          </div>

          {/* Data Source Badge */}
          <div className="flex items-center gap-2 bg-onyx-bg-secondary border border-onyx-green/30 rounded-xl px-4 py-2">
            <div className="w-2 h-2 bg-onyx-green rounded-full animate-pulse" />
            <span className="text-sm font-medium text-onyx-green">
              Live from INI_Restaurant
            </span>
          </div>
        </div>

        {/* KPI Cards */}
        <DashboardSummary
          data={summaryQuery.data}
          loading={summaryQuery.isPending}
        />

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sales Chart - Takes 2 columns */}
          <div className="lg:col-span-2">
            <SalesChart data={chartData} loading={chartQuery.isPending} />
          </div>

          {/* Quick Stats */}
          <div className="bg-onyx-bg-secondary rounded-2xl border border-onyx-border p-6">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp size={20} className="text-onyx-gold" />
              <h3 className="text-lg font-semibold text-onyx-text-primary">Quick Stats</h3>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-onyx-bg-tertiary rounded-xl">
                <p className="text-xs text-[#6E6E78] uppercase tracking-wider mb-1">Avg Order Value</p>
                <p className="text-2xl font-bold text-[#FFD666]">
                  ${summaryQuery.data ? ((summaryQuery.data.totalRevenue / 100) / Math.max(summaryQuery.data.totalOrders, 1)).toFixed(2) : '0.00'}
                </p>
              </div>

              <div className="p-4 bg-[#222228] rounded-xl">
                <p className="text-xs text-[#6E6E78] uppercase tracking-wider mb-1">Orders per Day</p>
                <p className="text-2xl font-bold text-[#5BA0FF]">
                  {summaryQuery.data ? (summaryQuery.data.totalOrders / 30).toFixed(1) : '0.0'}
                </p>
              </div>

              <div className="p-4 bg-[#222228] rounded-xl">
                <p className="text-xs text-[#6E6E78] uppercase tracking-wider mb-1">Daily Revenue</p>
                <p className="text-2xl font-bold text-[#4ADE80]">
                  ${summaryQuery.data ? ((summaryQuery.data.totalRevenue / 100) / 30).toFixed(2) : '0.00'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Popular Items Table */}
        <PopularItems data={itemsData} loading={itemsQuery.isPending} />

        {/* Error Message */}
        {isError && (
          <div className="bg-[#2D1F1F] border border-[#FF6B6B]/30 text-[#FF6B6B] px-6 py-4 rounded-xl flex items-center gap-3">
            <div className="w-2 h-2 bg-[#FF6B6B] rounded-full" />
            Failed to load dashboard data. Please try again.
          </div>
        )}

        {/* Footer Note */}
        <div className="text-center py-4">
          <p className="text-xs text-[#6E6E78]">
            Data sourced from INI_Restaurant database (read-only) • Updates in real-time
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
