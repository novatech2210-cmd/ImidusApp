"use client";

import { OrderAPI, AuthAPI } from "@/lib/api";
import {
  CheckCircleIcon,
  ChevronRightIcon,
  ClipboardDocumentCheckIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  PrinterIcon,
  ReceiptRefundIcon,
  ShoppingBagIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Order {
  id: number;
  salesId: number;
  dailyOrderNumber: number;
  saleDateTime: string;
  subTotal: number;
  gstAmt: number;
  pstAmt: number;
  psT2Amt: number;
  dscAmt: number;
  totalAmount: number;
  status: string;
  details?: Array<{
    itemId: number;
    iName: string;
    sizeName: string;
    itemQty: number;
    unitPrice: number;
  }>;
}

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [customerId, setCustomerId] = useState<number>(1);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    loadOrderHistory();
  }, [customerId]);

  const loadOrderHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch from API - SSOT: Reads from POS database
      const data = await OrderAPI.getOrderHistory(customerId);
      setOrders(data);
      
      // Auto-select first order if available
      if (data.length > 0 && !selectedOrder) {
        setSelectedOrder(data[0]);
      }
    } catch (err) {
      console.error("Failed to load order history:", err);
      setError("Failed to load order history. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
      case "ready":
        return "text-green-400 bg-green-400/10 border-green-400/20";
      case "preparing":
        return "text-amber-400 bg-amber-400/10 border-amber-400/20";
      case "pending":
        return "text-blue-400 bg-blue-400/10 border-blue-400/20";
      default:
        return "text-gray-400 bg-gray-400/10 border-gray-400/20";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
      case "ready":
        return <CheckCircleIcon className="w-4 h-4" />;
      case "preparing":
        return <ClockIcon className="w-4 h-4 animate-pulse" />;
      default:
        return <ClipboardDocumentCheckIcon className="w-4 h-4" />;
    }
  };

  const filteredOrders = filterStatus === "all" 
    ? orders 
    : orders.filter(o => o.status.toLowerCase() === filterStatus);

  const calculateStats = () => {
    const total = orders.length;
    const completed = orders.filter(o => o.status.toLowerCase() === "completed").length;
    const totalSpent = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    return { total, completed, totalSpent };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <ClipboardDocumentCheckIcon className="w-6 h-6 text-[#D4AF37]" />
          </div>
        </div>
        <p className="mt-4 text-lg font-semibold text-gray-300">Loading order history...</p>
        <p className="text-sm text-gray-500">Fetching from POS database</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8">
        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
          <span className="text-4xl">⚠️</span>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Error Loading Orders</h2>
        <p className="text-gray-400 mb-6 text-center max-w-md">{error}</p>
        <button 
          onClick={loadOrderHistory}
          className="px-6 py-3 bg-[#1E5AA8] text-white font-bold rounded-xl hover:bg-[#174785] transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full gap-6 animate-in fade-in duration-500 overflow-hidden">
      {/* Left Column - Order List */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter">
              Order History
            </h1>
            <p className="text-sm text-text-dim mt-1">
              {stats.total} orders • ${stats.totalSpent.toFixed(2)} total spent
            </p>
          </div>
          <Link
            href="/menu"
            className="flex items-center gap-2 px-4 py-2 bg-[#1E5AA8] text-white font-bold rounded-lg hover:bg-[#174785] transition-colors text-sm"
          >
            <ShoppingBagIcon className="w-4 h-4" />
            New Order
          </Link>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-4">
          {["all", "completed", "pending", "preparing"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${
                filterStatus === status
                  ? "bg-[#1E5AA8] text-white"
                  : "bg-bg-surface text-text-dim hover:text-white border border-divider"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Orders List */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
          {filteredOrders.length === 0 ? (
            <div className="bg-bg-panel border border-divider p-12 rounded-2xl text-center">
              <ClipboardDocumentCheckIcon className="w-16 h-16 text-divider mx-auto mb-4" />
              <p className="text-text-secondary font-bold uppercase tracking-tight text-lg mb-2">
                No orders found
              </p>
              <p className="text-sm text-text-dim mb-6">
                {filterStatus !== "all" 
                  ? `No ${filterStatus} orders found. Try a different filter.`
                  : "You haven't placed any orders yet."}
              </p>
              <Link
                href="/menu"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#D4AF37] text-white font-bold rounded-xl hover:bg-[#B8960C] transition-colors"
              >
                <ShoppingBagIcon className="w-5 h-5" />
                Browse Menu
              </Link>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <button
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className={`w-full text-left bg-bg-panel border rounded-2xl p-5 transition-all hover:border-gold group ${
                  selectedOrder?.id === order.id
                    ? "border-gold ring-2 ring-gold/50 shadow-lg shadow-gold/10"
                    : "border-divider hover:shadow-lg"
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-xs font-black uppercase text-gold tracking-widest mb-1">
                      Order #{order.dailyOrderNumber}
                    </p>
                    <p className="text-lg font-bold text-white">
                      {new Date(order.saleDateTime).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                    <p className="text-xs text-text-dim mt-1">
                      {new Date(order.saleDateTime).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </p>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-black uppercase ${getStatusColor(order.status)}`}
                  >
                    {getStatusIcon(order.status)}
                    {order.status}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-divider">
                  <p className="text-xl font-mono font-black text-gold-vibrant">
                    ${order.totalAmount.toFixed(2)}
                  </p>
                  {order.dscAmt > 0 && (
                    <span className="text-xs text-green-400 font-bold">
                      Saved ${order.dscAmt.toFixed(2)}
                    </span>
                  )}
                  <ChevronRightIcon className="w-5 h-5 text-text-dim group-hover:text-gold transition-colors" />
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right Column - Order Details */}
      <div className="w-[420px] flex flex-col bg-bg-panel border border-divider rounded-2xl overflow-hidden shadow-2xl flex-shrink-0">
        {selectedOrder ? (
          <>
            {/* Order Header */}
            <div className="p-6 border-b border-divider bg-gradient-to-r from-bg-surface to-bg-panel">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs font-black uppercase text-gold tracking-widest mb-1">
                    Transaction Details
                  </p>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
                    Order #{selectedOrder.dailyOrderNumber}
                  </h2>
                  <p className="text-xs text-text-dim font-bold uppercase mt-1">
                    {new Date(selectedOrder.saleDateTime).toLocaleString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </p>
                </div>
                <div
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-black uppercase ${getStatusColor(selectedOrder.status)}`}
                >
                  {getStatusIcon(selectedOrder.status)}
                  {selectedOrder.status}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-3 py-2 bg-bg-active border border-divider rounded-lg text-xs font-bold text-text-secondary hover:text-white hover:border-gold transition-all"
                >
                  <PrinterIcon className="w-4 h-4" />
                  Print
                </button>
                <button
                  onClick={() => alert("Receipt emailed!")}
                  className="flex items-center gap-2 px-3 py-2 bg-bg-active border border-divider rounded-lg text-xs font-bold text-text-secondary hover:text-white hover:border-gold transition-all"
                >
                  <ReceiptRefundIcon className="w-4 h-4" />
                  Email
                </button>
              </div>
            </div>

            {/* Items List */}
            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
              {selectedOrder.details && selectedOrder.details.length > 0 ? (
                <div className="space-y-4">
                  {selectedOrder.details.map((detail, idx) => (
                    <div key={idx} className="flex justify-between items-start py-3 border-b border-divider/50 last:border-0">
                      <div className="flex gap-3">
                        <span className="bg-bg-surface text-gold font-black px-2.5 py-1 rounded border border-divider text-sm min-w-[28px] text-center">
                          {detail.itemQty}
                        </span>
                        <div>
                          <p className="font-bold text-base text-white leading-tight uppercase">
                            {detail.iName}
                          </p>
                          <p className="text-xs text-text-dim font-bold uppercase mt-0.5">
                            {detail.sizeName}
                          </p>
                        </div>
                      </div>
                      <p className="font-mono font-bold text-base text-white">
                        ${(detail.unitPrice * detail.itemQty).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-text-dim text-sm">
                    Order items details not available
                  </p>
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="p-6 bg-bg-surface border-t border-divider space-y-3">
              <div className="flex justify-between text-sm font-bold text-text-secondary uppercase">
                <span>Subtotal</span>
                <span className="font-mono">
                  ${selectedOrder.subTotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-text-secondary uppercase">
                <span>GST (6%)</span>
                <span className="font-mono">
                  ${selectedOrder.gstAmt.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-text-secondary uppercase">
                <span>PST (0%)</span>
                <span className="font-mono">
                  $0.00
                </span>
              </div>
              {selectedOrder.dscAmt > 0 && (
                <div className="flex justify-between text-sm font-bold text-green-400 uppercase">
                  <span>Loyalty Discount</span>
                  <span className="font-mono">
                    -${selectedOrder.dscAmt.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center pt-3 mt-3 border-t-2 border-divider">
                <span className="text-base font-black text-white uppercase">
                  Total Paid
                </span>
                <span className="text-2xl font-mono font-black text-gold-vibrant">
                  ${selectedOrder.totalAmount.toFixed(2)}
                </span>
              </div>

              {/* Reorder Button */}
              <Link
                href="/menu"
                className="w-full mt-4 py-4 bg-[#D4AF37] text-white rounded-xl font-black uppercase tracking-wider hover:bg-[#B8960C] transition-all flex items-center justify-center gap-2 shadow-lg shadow-gold/20"
              >
                <ShoppingBagIcon className="w-5 h-5" />
                Order Again
              </Link>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 p-8 text-center bg-bg-surface/50">
            <ClipboardDocumentCheckIcon className="w-20 h-20 text-divider mb-4" />
            <p className="text-text-secondary font-bold uppercase tracking-tight text-lg mb-2">
              Select an order
            </p>
            <p className="text-sm text-text-dim max-w-xs">
              Click on any order from the list to view complete details
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
