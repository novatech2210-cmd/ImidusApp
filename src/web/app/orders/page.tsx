"use client";

import { OrderAPI } from "@/lib/api";
import {
    CheckCircleIcon,
    ChevronRightIcon,
    ClipboardDocumentCheckIcon,
    ClockIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  useEffect(() => {
    // Hardcoded customer ID 1 for now, in a real app this would come from AuthContext
    OrderAPI.getOrderHistory(1)
      .then(setOrders)
      .finally(() => setLoading(false));
  }, []);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "ready":
        return "text-green-500 bg-green-500/10 border-green-500/20";
      case "preparing":
        return "text-gold-vibrant bg-gold-vibrant/10 border-gold-vibrant/20";
      default:
        return "text-blue-vibrant bg-blue-vibrant/10 border-blue-vibrant/20";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "ready":
        return <CheckCircleIcon className="w-4 h-4" />;
      case "preparing":
        return <ClockIcon className="w-4 h-4 animate-pulse" />;
      default:
        return <ClipboardDocumentCheckIcon className="w-4 h-4" />;
    }
  };

  if (loading)
    return (
      <div className="p-8">
        <div className="skeleton h-64" />
      </div>
    );

  return (
    <div className="flex h-full gap-6 animate-in fade-in duration-500 overflow-hidden">
      {/* List Column */}
      <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
        <h1 className="text-2xl font-black text-white uppercase tracking-tighter mb-6">
          Order History
        </h1>

        {orders.length === 0 ? (
          <div className="bg-bg-panel border border-divider p-8 rounded-2xl text-center">
            <ClipboardDocumentCheckIcon className="w-12 h-12 text-text-dim mx-auto mb-4" />
            <p className="text-text-secondary font-bold uppercase tracking-tight">
              No orders found yet.
            </p>
            <p className="text-[10px] text-text-dim uppercase mt-1 italic">
              Start your first order at the menu!
            </p>
          </div>
        ) : (
          orders.map((order) => (
            <button
              key={order.id}
              onClick={() => setSelectedOrder(order)}
              className={`w-full text-left bg-bg-panel border rounded-2xl p-4 transition-all hover:border-gold group ${
                selectedOrder?.id === order.id
                  ? "border-gold ring-1 ring-gold"
                  : "border-divider"
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-black uppercase text-text-dim tracking-widest mb-1">
                    Order #{order.dailyOrderNumber}
                  </p>
                  <p className="text-sm font-bold text-white uppercase">
                    {new Date(order.saleDateTime).toLocaleDateString()}
                  </p>
                </div>
                <div
                  className={`flex items-center gap-1.5 px-2 py-1 rounded border text-[9px] font-black uppercase ${getStatusColor(order.status || "Pending")}`}
                >
                  {getStatusIcon(order.status || "Pending")}
                  {order.status || "Pending"}
                </div>
              </div>

              <div className="mt-4 flex justify-between items-end">
                <p className="text-lg font-mono font-black text-gold-vibrant">
                  ${order.totalAmount.toFixed(2)}
                </p>
                <ChevronRightIcon className="w-5 h-5 text-text-dim group-hover:text-gold transition-colors" />
              </div>
            </button>
          ))
        )}
      </div>

      {/* Detail Column (OrderView inspired) */}
      <div className="w-[400px] flex flex-col bg-bg-panel border border-divider rounded-2xl overflow-hidden shadow-2xl">
        {selectedOrder ? (
          <>
            <div className="p-6 border-b border-divider bg-bg-surface">
              <p className="text-[10px] font-black uppercase text-gold tracking-widest mb-1">
                Transaction Details
              </p>
              <h2 className="text-xl font-black text-white uppercase tracking-tighter">
                Order #{selectedOrder.dailyOrderNumber}
              </h2>
              <p className="text-[10px] text-text-dim font-bold uppercase mt-1">
                {new Date(selectedOrder.saleDateTime).toLocaleString()}
              </p>
            </div>

            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-4">
              {selectedOrder.details?.map((detail: any, idx: number) => (
                <div key={idx} className="flex justify-between items-start">
                  <div className="flex gap-3">
                    <span className="bg-bg-surface text-gold font-black px-2 py-0.5 rounded border border-divider text-xs">
                      {detail.itemQty}
                    </span>
                    <div>
                      <p className="font-bold text-sm text-white leading-tight uppercase">
                        {detail.iname}
                      </p>
                      <p className="text-[9px] text-text-dim font-bold uppercase">
                        {detail.sizeName}
                      </p>
                    </div>
                  </div>
                  <p className="font-mono font-bold text-sm text-white">
                    ${(detail.unitPrice * detail.itemQty).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            <div className="p-6 bg-bg-surface border-t border-divider space-y-2">
              <div className="flex justify-between text-[10px] font-bold text-text-secondary uppercase">
                <span>Subtotal</span>
                <span className="font-mono">
                  ${selectedOrder.subTotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-[10px] font-bold text-text-secondary uppercase">
                <span>Taxes</span>
                <span className="font-mono">
                  $
                  {(
                    selectedOrder.gstAmt +
                    selectedOrder.pstAmt +
                    selectedOrder.psT2Amt
                  ).toFixed(2)}
                </span>
              </div>
              {selectedOrder.dscAmt > 0 && (
                <div className="flex justify-between text-[10px] font-bold text-gold uppercase">
                  <span>Loyalty Discount</span>
                  <span className="font-mono">
                    -${selectedOrder.dscAmt.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 mt-2 border-t border-divider">
                <span className="text-xs font-black text-white uppercase">
                  Total Paid
                </span>
                <span className="text-xl font-mono font-black text-gold-vibrant">
                  ${selectedOrder.totalAmount.toFixed(2)}
                </span>
              </div>

              <button
                onClick={() => window.print()}
                className="w-full mt-4 py-3 bg-bg-active border border-divider rounded-xl text-[10px] font-black text-white uppercase tracking-widest hover:bg-divider transition-all"
              >
                Print Receipt
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 p-8 text-center bg-bg-surface/50">
            <ClipboardDocumentCheckIcon className="w-16 h-16 text-divider mb-4" />
            <p className="text-text-dim font-bold uppercase tracking-tight">
              Select an order to view full details
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
