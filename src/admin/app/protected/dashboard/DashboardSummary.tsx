"use client";

import Skeleton from "@/components/Loading/Skeleton";
import {
  DollarSign,
  Percent,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import React from "react";

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  iconBg: string;
  loading?: boolean;
}

function KPICard({
  title,
  value,
  change,
  icon,
  iconBg,
  loading = false,
}: KPICardProps) {
  if (loading) {
    return (
      <div className="bg-onyx-bg-secondary p-6 rounded-2xl border border-onyx-border">
        <div className="flex items-start justify-between mb-4">
          <Skeleton width="w-24" height="h-4" />
          <div className={`p-3 rounded-xl ${iconBg}`}>{icon}</div>
        </div>
        <Skeleton width="w-32" height="h-8" />
        <Skeleton width="w-20" height="h-4" className="mt-3" />
      </div>
    );
  }

  const isPositive = change !== undefined && change >= 0;

  return (
    <div className="bg-onyx-bg-secondary p-6 rounded-2xl border border-onyx-border hover:border-onyx-border-hover transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-onyx-text-muted uppercase tracking-wider">
            {title}
          </h3>
        </div>
        <div
          className={`p-3 rounded-xl ${iconBg} transition-transform group-hover:scale-110`}
        >
          {icon}
        </div>
      </div>

      <p className="text-3xl font-bold text-onyx-text-primary mb-2">{value}</p>

      {change !== undefined && (
        <div
          className={`flex items-center gap-1 text-sm font-medium ${
            isPositive ? "text-onyx-green" : "text-onyx-red"
          }`}
        >
          {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          <span>{Math.abs(change).toFixed(1)}%</span>
          <span className="text-onyx-text-muted font-normal">vs last period</span>
        </div>
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

export default function DashboardSummary({
  data,
  loading = false,
}: DashboardSummaryProps) {
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
        icon={<ShoppingCart size={20} className="text-[#5BA0FF]" />}
        iconBg="bg-[#5BA0FF]/10"
        loading={loading}
      />
      <KPICard
        title="Revenue"
        value={`$${(summary.totalRevenue / 100).toLocaleString("en-US", { maximumFractionDigits: 2 })}`}
        change={
          typeof summary.revenueGrowth === "number" ? summary.revenueGrowth : 0
        }
        icon={<DollarSign size={20} className="text-[#FFD666]" />}
        iconBg="bg-[#FFD666]/10"
        loading={loading}
      />
      <KPICard
        title="Total Customers"
        value={summary.totalCustomers.toLocaleString()}
        icon={<Users size={20} className="text-[#4ADE80]" />}
        iconBg="bg-[#4ADE80]/10"
        loading={loading}
      />
      <KPICard
        title="Growth Rate"
        value={`${(typeof summary.revenueGrowth === "number" ? summary.revenueGrowth : 0).toFixed(1)}%`}
        icon={<Percent size={20} className="text-[#FF6B6B]" />}
        iconBg="bg-[#FF6B6B]/10"
        loading={loading}
      />
    </div>
  );
}
