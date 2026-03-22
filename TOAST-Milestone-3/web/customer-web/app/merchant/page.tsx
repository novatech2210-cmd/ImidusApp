"use client";

import { AdminAPI, DashboardSummary, OrderQueueItem } from "@/lib/api";
import {
    ArrowPathIcon,
    BanknotesIcon,
    BuildingStorefrontIcon,
    ChartBarIcon,
    CheckCircleIcon,
    ClockIcon,
    CreditCardIcon,
    ExclamationCircleIcon,
    EyeIcon,
    MegaphoneIcon,
    ReceiptRefundIcon,
    ShoppingBagIcon,
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

      // Fetch summary and recent orders in parallel
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
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-900/50 text-red-400 border border-red-800">
            <ReceiptRefundIcon className="w-3 h-3 mr-1" />
            Refunded
          </span>
        );
      case 1:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-900/50 text-green-400 border border-green-800">
            <CheckCircleIcon className="w-3 h-3 mr-1" />
            Completed
          </span>
        );
      case 2:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-yellow-900/50 text-yellow-400 border border-yellow-800">
            <ClockIcon className="w-3 h-3 mr-1" />
            Open
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-900/50 text-gray-400 border border-gray-800">
            <ExclamationCircleIcon className="w-3 h-3 mr-1" />
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
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <BuildingStorefrontIcon className="w-8 h-8 text-blue-500" />
              <h1 className="text-xl font-bold">Merchant Portal</h1>
              <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
                POS Integration
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                POS Connected
              </div>
              <div className="text-sm text-gray-500">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </div>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  autoRefresh
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-gray-300"
                }`}
              >
                Auto-refresh {autoRefresh ? "ON" : "OFF"}
              </button>
              <button
                onClick={fetchDashboardData}
                className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                title="Refresh data"
              >
                <ArrowPathIcon
                  className={`w-5 h-5 ${loading ? "animate-spin" : ""}`}
                />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Sales */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-900/30 rounded-lg">
                <BanknotesIcon className="w-6 h-6 text-green-400" />
              </div>
              <span className="text-xs text-gray-500">Today's Sales</span>
            </div>
            <div className="text-2xl font-bold text-white">
              ${summary?.totalRevenue.toFixed(2) || "0.00"}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Revenue from POS database
            </div>
          </div>

          {/* Order Count */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-900/30 rounded-lg">
                <ShoppingCartIcon className="w-6 h-6 text-blue-400" />
              </div>
              <span className="text-xs text-gray-500">Total Orders</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {summary?.totalOrders || 0}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Orders from INI_Restaurant
            </div>
          </div>

          {/* Average Order */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-900/30 rounded-lg">
                <ChartBarIcon className="w-6 h-6 text-purple-400" />
              </div>
              <span className="text-xs text-gray-500">Avg Ticket</span>
            </div>
            <div className="text-2xl font-bold text-white">
              ${summary?.averageOrderValue.toFixed(2) || "0.00"}
            </div>
            <div className="text-sm text-gray-500 mt-1">Per order average</div>
          </div>

          {/* Customers */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-indigo-900/30 rounded-lg">
                <UsersIcon className="w-6 h-6 text-indigo-400" />
              </div>
              <span className="text-xs text-gray-500">Total Customers</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {summary?.totalCustomers || 0}
            </div>
            <div className="text-sm text-gray-500 mt-1">CRM Profiles</div>
          </div>
        </div>

        {/* Recent Orders Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-gray-800 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ShoppingBagIcon className="w-5 h-5 text-blue-400" />
                Recent Orders
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Live data from INI_Restaurant POS database
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/merchant/orders"
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                View All Orders
              </Link>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-950">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Order #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-gray-400"
                    >
                      <ShoppingBagIcon className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                      <p>No orders found</p>
                      <p className="text-sm mt-1">
                        Orders from POS will appear here
                      </p>
                    </td>
                  </tr>
                ) : (
                  recentOrders.slice(0, 10).map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-mono font-bold text-white">
                          #{order.orderNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-white">
                          {order.customerName || "Guest"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-white">
                          ${(order.total / 100).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(order.transType)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-400">
                          {formatTime(order.createdAt)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Link
                          href={`/merchant/orders?id=${order.id}`}
                          className="text-blue-400 hover:text-blue-300 text-sm font-bold inline-flex items-center gap-1"
                        >
                          <EyeIcon className="w-4 h-4" />
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          <Link
            href="/merchant/menu"
            className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-900/30 rounded-lg group-hover:bg-blue-900/50 transition-colors">
                <ShoppingBagIcon className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <div className="font-bold text-white">Menu Management</div>
                <div className="text-sm text-gray-500">View online items</div>
              </div>
            </div>
          </Link>

          <Link
            href="/merchant/customers"
            className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-900/30 rounded-lg group-hover:bg-purple-900/50 transition-colors">
                <UsersIcon className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <div className="font-bold text-white">Customers</div>
                <div className="text-sm text-gray-500">Loyalty & profiles</div>
              </div>
            </div>
          </Link>

          <Link
            href="/merchant/dashboard"
            className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-900/30 rounded-lg group-hover:bg-green-900/50 transition-colors">
                <ChartBarIcon className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <div className="font-bold text-white">Intelligence</div>
                <div className="text-sm text-gray-500">Sales analytics</div>
              </div>
            </div>
          </Link>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-900/30 rounded-lg">
                <CreditCardIcon className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <div className="font-bold text-white">POS Status</div>
                <div className="text-sm text-green-400 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Connected
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Marketing Actions */}
        <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest mt-12 mb-6">
          Marketing & Growth
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/merchant/marketing/campaigns"
            className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-900/30 rounded-lg group-hover:bg-blue-900/50 transition-colors">
                <MegaphoneIcon className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <div className="font-bold text-white">Push Campaigns</div>
                <div className="text-sm text-gray-500">
                  Targeted mobile notifications
                </div>
              </div>
            </div>
          </Link>

          <Link
            href="/merchant/marketing/rewards"
            className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-pink-900/30 rounded-lg group-hover:bg-pink-900/50 transition-colors">
                <StarIcon className="w-6 h-6 text-pink-400" />
              </div>
              <div>
                <div className="font-bold text-white">Birthday Rewards</div>
                <div className="text-sm text-gray-500">
                  Automated loyalty gifts
                </div>
              </div>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
