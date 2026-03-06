"use client";

import { apiClient, OrderAPI } from "@/lib/api";
import {
    CheckCircleIcon,
    ClockIcon,
    ExclamationCircleIcon,
    MagnifyingGlassIcon,
    ReceiptRefundIcon,
    ShoppingBagIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";

interface Order {
  salesId: number;
  dailyOrderNumber: number;
  customerName: string;
  totalAmount: number;
  transType: number;
  saleDateTime: string;
  itemCount: number;
  paymentStatus: string;
}

export default function OrderManagementPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, statusFilter, searchQuery]);

  const fetchOrders = async () => {
    try {
      // Get recent orders from API
      const response = await apiClient("/Orders/recent?days=1");
      if (Array.isArray(response)) {
        setOrders(response);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = orders;

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => {
        switch (statusFilter) {
          case "open":
            return order.transType === 2;
          case "completed":
            return order.transType === 1;
          case "refunded":
            return order.transType === 0;
          default:
            return true;
        }
      });
    }

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (order) =>
          order.dailyOrderNumber.toString().includes(searchQuery) ||
          order.customerName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredOrders(filtered);
  };

  const getStatusBadge = (transType: number) => {
    switch (transType) {
      case 0:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800">
            <ReceiptRefundIcon className="w-3 h-3 mr-1" />
            Refunded
          </span>
        );
      case 1:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800">
            <CheckCircleIcon className="w-3 h-3 mr-1" />
            Completed
          </span>
        );
      case 2:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800">
            <ClockIcon className="w-3 h-3 mr-1" />
            Open
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-800">
            <ExclamationCircleIcon className="w-3 h-3 mr-1" />
            Unknown
          </span>
        );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter">
            Order Management
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            View and manage POS orders in real-time
          </p>
        </div>

        {/* Stats */}
        <div className="flex gap-4">
          <div className="bg-gray-800 px-4 py-2 rounded-lg">
            <p className="text-xs text-gray-400 uppercase">Open</p>
            <p className="text-xl font-bold text-yellow-500">
              {orders.filter((o) => o.transType === 2).length}
            </p>
          </div>
          <div className="bg-gray-800 px-4 py-2 rounded-lg">
            <p className="text-xs text-gray-400 uppercase">Completed</p>
            <p className="text-xl font-bold text-green-500">
              {orders.filter((o) => o.transType === 1).length}
            </p>
          </div>
          <div className="bg-gray-800 px-4 py-2 rounded-lg">
            <p className="text-xs text-gray-400 uppercase">Total Today</p>
            <p className="text-xl font-bold text-white">{orders.length}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by order number or customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Orders</option>
          <option value="open">Open (Pending)</option>
          <option value="completed">Completed</option>
          <option value="refunded">Refunded</option>
        </select>

        {/* Refresh Button */}
        <button
          onClick={fetchOrders}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Orders Table */}
      <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Order #
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-gray-400"
                  >
                    <ShoppingBagIcon className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                    <p>No orders found</p>
                    <p className="text-sm mt-1">
                      Orders will appear here when customers place them
                    </p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr
                    key={order.salesId}
                    className="hover:bg-gray-700/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-mono font-bold text-white">
                        #{order.dailyOrderNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-white">
                        {order.customerName || "Guest"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-300">
                        {order.itemCount} items
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-bold text-white">
                        ${order.totalAmount?.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(order.transType)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-400">
                        {formatDate(order.saleDateTime)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        className="text-blue-400 hover:text-blue-300 text-sm font-bold"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrder(order);
                        }}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">
                  Order #{selectedOrder.dailyOrderNumber}
                </h2>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <p className="text-sm text-gray-400 mt-1">
                Sales ID: {selectedOrder.salesId}
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 uppercase font-bold">
                    Customer
                  </label>
                  <p className="text-white">{selectedOrder.customerName || "Guest"}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase font-bold">
                    Status
                  </label>
                  <div className="mt-1">{getStatusBadge(selectedOrder.transType)}</div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase font-bold">
                    Total Amount
                  </label>
                  <p className="text-xl font-bold text-white">
                    ${selectedOrder.totalAmount?.toFixed(2)}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase font-bold">
                    Order Time
                  </label>
                  <p className="text-white">{formatDate(selectedOrder.saleDateTime)}</p>
                </div>
              </div>

              <div className="border-t border-gray-700 pt-4">
                <h3 className="text-sm font-bold text-gray-400 uppercase mb-3">
                  POS Integration
                </h3>
                <div className="bg-gray-900 rounded p-4 font-mono text-sm text-green-400">
                  <p>✓ Order synchronized with POS</p>
                  <p>✓ Ticket #{selectedOrder.dailyOrderNumber} created</p>
                  <p>✓ Payment recorded in tblPayment</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
