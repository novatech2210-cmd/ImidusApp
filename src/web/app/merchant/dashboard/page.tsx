"use client";

import {
  AdminAPI,
  DashboardSummary,
  PopularItem,
  SalesChartPoint,
} from "@/lib/api";
import {
  ArrowTrendingUpIcon,
  ChevronUpIcon,
  CurrencyDollarIcon,
  ShoppingCartIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";

export default function MerchantDashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [topProducts, setTopProducts] = useState<PopularItem[]>([]);
  const [trend, setTrend] = useState<SalesChartPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIntelligenceData();
  }, []);

  const fetchIntelligenceData = async () => {
    try {
      setLoading(true);
      const today = new Date();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(today.getDate() - 7);

      const startDate = sevenDaysAgo.toISOString().split("T")[0];
      const endDate = today.toISOString().split("T")[0];

      const [sRes, pRes, tRes] = await Promise.all([
        AdminAPI.getDashboardSummary(),
        AdminAPI.getPopularItems(startDate, endDate, 5),
        AdminAPI.getSalesChart(startDate, endDate, "day"),
      ]);

      setSummary(sRes);
      setTopProducts(pRes);
      setTrend(tRes);
    } catch (error) {
      console.error("Failed to fetch intelligence data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-gray-800 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-800 rounded-2xl"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="h-64 bg-gray-800 rounded-2xl"></div>
            <div className="h-64 bg-gray-800 rounded-2xl"></div>
          </div>
        </div>
      </div>
    );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 p-8">
      <h1 className="text-3xl font-black text-white uppercase tracking-tighter">
        Business Intelligence
      </h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1">
              Total Sales
            </p>
            <h2 className="text-3xl font-black text-yellow-500 font-mono">
              ${summary?.totalRevenue.toFixed(2) || "0.00"}
            </h2>
            <p className="text-[10px] text-green-500 font-bold mt-1 flex items-center">
              <ChevronUpIcon className="w-3 h-3 mr-1" /> Live from POS
            </p>
          </div>
          <CurrencyDollarIcon className="w-12 h-12 text-yellow-500 opacity-20" />
        </div>

        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1">
              Order Volume
            </p>
            <h2 className="text-3xl font-black text-white font-mono">
              {summary?.totalOrders || 0}
            </h2>
            <p className="text-[10px] text-green-500 font-bold mt-1 flex items-center">
              <ChevronUpIcon className="w-3 h-3 mr-1" /> Active
            </p>
          </div>
          <ShoppingCartIcon className="w-12 h-12 text-blue-500 opacity-20" />
        </div>

        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1">
              Avg Ticket Size
            </p>
            <h2 className="text-3xl font-black text-white font-mono">
              ${summary?.averageOrderValue.toFixed(2) || "0.00"}
            </h2>
            <p className="text-[10px] text-gray-500 font-bold mt-1 flex items-center">
              <ArrowTrendingUpIcon className="w-3 h-3 mr-1" /> Per Order
            </p>
          </div>
          <ArrowTrendingUpIcon className="w-12 h-12 text-white opacity-20" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sales Trend Bar Chart (SVG) */}
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl">
          <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-6 px-2">
            7-Day Revenue Trend
          </p>
          <div className="h-48 flex items-end justify-between px-2 gap-2">
            {trend.map((t, i) => {
              const maxSales = Math.max(...trend.map((p) => p.revenue), 1000);
              const height = (t.revenue / maxSales) * 100;
              return (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center gap-2 group"
                >
                  <div className="w-full h-full relative">
                    <div
                      className="w-full bg-blue-600/20 border-t-2 border-blue-600 rounded-t transition-all group-hover:bg-blue-600/40"
                      style={{ height: `${Math.max(height, 5)}%` }}
                    />
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] font-bold px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      ${t.revenue.toFixed(0)}
                    </div>
                  </div>
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter">
                    {new Date(t.label).toLocaleDateString("en-US", {
                      weekday: "short",
                    })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl">
          <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-6">
            Top Performing Items
          </p>
          <div className="space-y-4">
            {topProducts.map((p, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-gray-800 p-3 rounded-xl border border-gray-700 border-l-4 border-l-yellow-500"
              >
                <div>
                  <p className="text-sm font-black text-white uppercase leading-tight">
                    {p.name}
                  </p>
                  <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">
                    {p.quantity} Units Sold
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono font-bold text-yellow-500">
                    ${p.revenue.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
