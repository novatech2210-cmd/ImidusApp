"use client";

import { AdminAPI, DashboardSummary, OrderQueueItem } from "@/lib/api";
import {
  ArrowPathIcon,
  BanknotesIcon,
  ChartBarIcon,
  MegaphoneIcon,
  ShoppingCartIcon,
  StarIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recentOrders, setRecentOrders] = useState<OrderQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchDashboardData();

    if (autoRefresh) {
      const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30s
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const [summaryRes, ordersRes] = await Promise.all([
        AdminAPI.getDashboardSummary(),
        AdminAPI.getOrderQueue({ limit: 10 }),
      ]);

      if (summaryRes) setSummary(summaryRes);
      if (ordersRes.success) setRecentOrders(ordersRes.data);

      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (transType: number) => {
    switch (transType) {
      case 0:
        return (
          <span className="inline-flex items-center px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.15rem] bg-red-900/10 text-red-500">
            Refunded
          </span>
        );
      case 1:
        return (
          <span className="inline-flex items-center px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.15rem] bg-green-900/10 text-green-500">
            Completed
          </span>
        );
      case 2:
        return (
          <span className="inline-flex items-center px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.15rem] bg-yellow-900/10 text-yellow-500">
            Open
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.15rem] bg-gray-900/10 text-gray-400">
            Unknown
          </span>
        );
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-10 space-y-12 imperial-onyx">
      {/* Title & Controls */}
      <div className="flex items-end justify-between">
        <div>
          <span className="text-micro text-[#D4AF37] mb-2 block">
            Executive Insights
          </span>
          <h1 className="text-display leading-none text-white tracking-[-0.05em]">
            Merchant{" "}
            <span className="font-light italic text-[#D4AF37]">Presence</span>
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2rem] block">
              Last Sync
            </span>
            <span className="text-[11px] font-bold text-white/80">
              {lastUpdated.toLocaleTimeString()}
            </span>
          </div>
          <button
            onClick={fetchDashboardData}
            className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
          >
            <ArrowPathIcon
              className={`w-5 h-5 text-[#D4AF37] ${loading ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* KPI Cards - Sovereignty Blocks */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Total Sales */}
        <div className="bg-white rounded-[1rem] p-8 shadow-studio transition-all hover:translate-y-[-4px]">
          <div className="flex flex-col h-full">
            <span className="text-micro text-[#0A1F3D]">Revenue Today</span>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-[1.5rem] font-bold text-[#0A1F3D]">$</span>
              <span className="text-[2.5rem] font-black text-[#0A1F3D] leading-none tracking-[-0.05em]">
                {summary?.totalRevenue.toFixed(2).split(".")[0] || "0"}
              </span>
              <span className="text-[1.25rem] font-bold text-[#0A1F3D]">
                .{summary?.totalRevenue.toFixed(2).split(".")[1] || "00"}
              </span>
            </div>
            <div className="mt-auto pt-6 flex items-center justify-between border-t border-[#0A1F3D]/5">
              <span className="text-[10px] font-bold text-[#0A1F3D]/40 uppercase tracking-widest">
                Live from POS
              </span>
              <BanknotesIcon className="w-5 h-5 text-[#D4AF37]" />
            </div>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white rounded-[1rem] p-8 shadow-studio transition-all hover:translate-y-[-4px]">
          <div className="flex flex-col h-full">
            <span className="text-micro text-[#0A1F3D]">Order Count</span>
            <div className="mt-4">
              <span className="text-[2.5rem] font-black text-[#0A1F3D] leading-none tracking-[-0.05em]">
                {summary?.totalOrders || 0}
              </span>
            </div>
            <div className="mt-auto pt-6 flex items-center justify-between border-t border-[#0A1F3D]/5">
              <span className="text-[10px] font-bold text-[#0A1F3D]/40 uppercase tracking-widest">
                Volume Monitor
              </span>
              <ShoppingCartIcon className="w-5 h-5 text-[#D4AF37]" />
            </div>
          </div>
        </div>

        {/* Avg Ticket */}
        <div className="bg-[#0A1F3D] rounded-[1rem] p-8 border border-white/10 shadow-studio transition-all hover:translate-y-[-4px] group">
          <div className="flex flex-col h-full">
            <span className="text-micro text-[#D4AF37]">Avg Ticket</span>
            <div className="mt-4 text-white">
              <span className="text-[1.5rem] font-bold">$</span>
              <span className="text-[2.5rem] font-black leading-none tracking-[-0.05em]">
                {Math.floor(summary?.averageOrderValue || 0)}
              </span>
              <span className="text-[1.25rem] font-bold">
                .
                {Math.round(((summary?.averageOrderValue || 0) % 1) * 100)
                  .toString()
                  .padStart(2, "0")}
              </span>
            </div>
            <div className="mt-auto pt-6 flex items-center justify-between border-t border-white/5">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest group-hover:text-[#D4AF37] transition-colors">
                Per Order
              </span>
              <ChartBarIcon className="w-5 h-5 text-[#D4AF37]" />
            </div>
          </div>
        </div>

        {/* Total Customers */}
        <div className="bg-white rounded-[1rem] p-8 shadow-studio transition-all hover:translate-y-[-4px]">
          <div className="flex flex-col h-full">
            <span className="text-micro text-[#0A1F3D]">CRM Profiles</span>
            <div className="mt-4">
              <span className="text-[2.5rem] font-black text-[#0A1F3D] leading-none tracking-[-0.05em]">
                {summary?.totalCustomers || 0}
              </span>
            </div>
            <div className="mt-auto pt-6 flex items-center justify-between border-t border-[#0A1F3D]/5">
              <span className="text-[10px] font-bold text-[#0A1F3D]/40 uppercase tracking-widest">
                Loyalty Base
              </span>
              <UsersIcon className="w-5 h-5 text-[#D4AF37]" />
            </div>
          </div>
        </div>
      </div>

      {/* Tables and Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Recent Orders Table */}
        <div className="lg:col-span-2 bg-white rounded-[1rem] shadow-studio overflow-hidden">
          <div className="px-8 py-6 border-b border-[#0A1F3D]/5 flex items-center justify-between bg-[#F8F9FA]">
            <div>
              <h2 className="text-[14px] font-black text-[#0A1F3D] uppercase tracking-[0.25rem]">
                Recent Transactions
              </h2>
              <p className="text-[11px] font-bold text-[#0A1F3D]/40 mt-1 uppercase tracking-widest">
                Ground Truth from POS
              </p>
            </div>
            <Link
              href="/merchant/orders"
              className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.25rem] hover:opacity-80 transition-opacity underline-offset-4 underline"
            >
              View Ledger
            </Link>
          </div>

          <table className="w-full text-[#0A1F3D]">
            <thead>
              <tr className="bg-[#0A1F3D]/5">
                <th className="px-8 py-4 text-left text-micro font-black opacity-40">
                  Ticket
                </th>
                <th className="px-8 py-4 text-left text-micro font-black opacity-40">
                  Identity
                </th>
                <th className="px-8 py-4 text-left text-micro font-black opacity-40">
                  Monetary
                </th>
                <th className="px-8 py-4 text-left text-micro font-black opacity-40">
                  State
                </th>
                <th className="px-8 py-4 text-right text-micro font-black opacity-40">
                  Temporal
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0A1F3D]/5">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <span className="text-micro opacity-40">
                      No entries in current session
                    </span>
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-[#F8F9FA] transition-colors group"
                  >
                    <td className="px-8 py-5">
                      <span className="text-[11px] font-black uppercase tracking-widest">
                        #{order.orderNumber}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-[12px] font-bold">
                        {order.customerName || "Sovereign Guest"}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-[12px] font-black text-[#D4AF37]">
                        ${(order.total / 100).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      {getStatusBadge(order.transType)}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <span className="text-[10px] font-bold opacity-40">
                        {formatTime(order.createdAt)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Marketing Shortcuts */}
        <div className="space-y-8">
          <div className="bg-[#0A1F3D] rounded-[1rem] p-8 border border-white/10 shadow-studio relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-2 h-full bg-[#D4AF37] transition-all group-hover:w-4" />
            <MegaphoneIcon className="w-12 h-12 text-[#D4AF37]/20 absolute top-[-1rem] right-[-1rem]" />

            <span className="text-micro text-[#D4AF37] mb-2 block">
              Campaigns
            </span>
            <h3 className="text-headline text-white mb-4">
              Push <span className="text-[#D4AF37]">Presence</span>
            </h3>
            <p className="text-[12px] text-white/50 leading-relaxed mb-6">
              Dispatch targeted mobile notifications to specific customer
              segments with executive precision.
            </p>
            <Link
              href="/merchant/marketing/campaigns"
              className="btn-gold-shimmer w-full"
            >
              Invoke Campaign
            </Link>
          </div>

          <div className="bg-white rounded-[1rem] p-8 shadow-studio border border-[#0A1F3D]/5 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-2 h-full bg-[#0A1F3D] transition-all group-hover:w-4" />
            <StarIcon className="w-12 h-12 text-[#0A1F3D]/5 absolute top-[-1rem] right-[-1rem]" />

            <span className="text-micro text-[#0A1F3D]/40 mb-2 block">
              Automations
            </span>
            <h3 className="text-headline text-[#0A1F3D] mb-4">
              Birthday <span className="text-[#D4AF37]">Rewards</span>
            </h3>
            <p className="text-[12px] text-[#0A1F3D]/60 leading-relaxed mb-6">
              Automated gifting logic triggered by customer profile milestones
              observed in the ground truth database.
            </p>
            <Link
              href="/merchant/marketing/rewards"
              className="btn-primary-onyx w-full"
            >
              Manage Rewards
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
