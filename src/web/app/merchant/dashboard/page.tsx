"use client";

import { MenuAPI } from "@/lib/api";
import {
  ArrowTrendingUpIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CurrencyDollarIcon,
  ShoppingCartIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";

export default function MerchantDashboard() {
  const [summary, setSummary] = useState<any>(null);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [trend, setTrend] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      MenuAPI.getAnalyticsSummary(),
      MenuAPI.getTopProducts(),
      MenuAPI.getSalesTrend(),
    ])
      .then(([s, p, t]) => {
        setSummary(s);
        setTopProducts(p);
        setTrend(t);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="p-8">
        <div className="skeleton h-64" />
      </div>
    );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <h1 className="text-3xl font-black text-white uppercase tracking-tighter">
        Business Intelligence
      </h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-bg-panel border border-divider p-6 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase text-text-dim tracking-widest mb-1">
              Total Sales (30D)
            </p>
            <h2 className="text-3xl font-black text-gold-vibrant font-mono">
              ${summary?.totalSales.toFixed(2)}
            </h2>
            <p className="text-[10px] text-green-500 font-bold mt-1 flex items-center">
              <ChevronUpIcon className="w-3 h-3 mr-1" /> +12.5% vs Prev
            </p>
          </div>
          <CurrencyDollarIcon className="w-12 h-12 text-gold opacity-20" />
        </div>

        <div className="bg-bg-panel border border-divider p-6 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase text-text-dim tracking-widest mb-1">
              Order Volume
            </p>
            <h2 className="text-3xl font-black text-white font-mono">
              {summary?.orderCount}
            </h2>
            <p className="text-[10px] text-green-500 font-bold mt-1 flex items-center">
              <ChevronUpIcon className="w-3 h-3 mr-1" /> +5.2% vs Prev
            </p>
          </div>
          <ShoppingCartIcon className="w-12 h-12 text-blue-vibrant opacity-20" />
        </div>

        <div className="bg-bg-panel border border-divider p-6 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase text-text-dim tracking-widest mb-1">
              Avg Ticket Size
            </p>
            <h2 className="text-3xl font-black text-white font-mono">
              ${summary?.averageOrderValue.toFixed(2)}
            </h2>
            <p className="text-[10px] text-red-500 font-bold mt-1 flex items-center">
              <ChevronDownIcon className="w-3 h-3 mr-1" /> -2.1% vs Prev
            </p>
          </div>
          <ArrowTrendingUpIcon className="w-12 h-12 text-white opacity-20" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sales Trend Bar Chart (SVG) */}
        <div className="bg-bg-panel border border-divider p-6 rounded-2xl">
          <p className="text-[10px] font-black uppercase text-text-dim tracking-widest mb-6 px-2">
            7-Day Revenue Trend
          </p>
          <div className="h-48 flex items-end justify-between px-2 gap-2">
            {trend.map((t, i) => {
              const height = (t.sales / 2000) * 100; // Scale relative to 2000
              return (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center gap-2 group"
                >
                  <div className="w-full h-full relative">
                    <div
                      className="w-full bg-blue-vibrant/20 border-t-2 border-blue-vibrant rounded-t transition-all group-hover:bg-blue-vibrant/40"
                      style={{ height: `${Math.max(height, 5)}%` }}
                    />
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] font-bold px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      ${t.sales.toFixed(0)}
                    </div>
                  </div>
                  <span className="text-[9px] font-bold text-text-dim uppercase tracking-tighter">
                    {new Date(t.date).toLocaleDateString("en-US", {
                      weekday: "short",
                    })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-bg-panel border border-divider p-6 rounded-2xl">
          <p className="text-[10px] font-black uppercase text-text-dim tracking-widest mb-6">
            Top Performing Items
          </p>
          <div className="space-y-4">
            {topProducts.map((p, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-bg-surface p-3 rounded-xl border border-divider border-l-4 border-l-gold"
              >
                <div>
                  <p className="text-sm font-black text-white uppercase leading-tight">
                    {p.name}
                  </p>
                  <p className="text-[10px] text-text-dim font-bold uppercase mt-1">
                    {p.quantity} Units Sold
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono font-bold text-gold-vibrant">
                    ${p.revenue.toFixed(2)}
                  </p>
                  <p className="text-[9px] text-text-dim font-bold uppercase">
                    Revenue Share
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
