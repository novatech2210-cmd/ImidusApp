"use client";

import React, { useMemo } from "react";
import MainLayout from "@/components/Navigation/MainLayout";
import DashboardSummary from "./DashboardSummary";
import SalesChart from "./SalesChart";
import PopularItems from "./PopularItems";
import Spinner from "@/components/Loading/Spinner";
import {
  useDashboardSummary,
  useSalesChart,
  usePopularItems,
} from "@/lib/hooks";

export default function DashboardPage() {
  // Get date range (last 30 days)
  const endDate = new Date().toISOString().split("T")[0];
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  // Fetch data
  const summaryQuery = useDashboardSummary(startDate, endDate);
  const chartQuery = useSalesChart(startDate, endDate, "day");
  const itemsQuery = usePopularItems(10);

  const isLoading =
    summaryQuery.isPending || chartQuery.isPending || itemsQuery.isPending;
  const isError =
    summaryQuery.isError || chartQuery.isError || itemsQuery.isError;

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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">
            {startDate} to {endDate}
          </p>
        </div>

        {/* KPI Cards */}
        <DashboardSummary
          data={summaryQuery.data}
          loading={summaryQuery.isPending}
        />

        {/* Charts */}
        <div className="grid grid-cols-1 gap-6">
          <SalesChart data={chartData} loading={chartQuery.isPending} />
          <PopularItems data={itemsData} loading={itemsQuery.isPending} />
        </div>

        {/* Error Message */}
        {isError && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            Failed to load dashboard data. Please try again.
          </div>
        )}
      </div>
    </MainLayout>
  );
}
