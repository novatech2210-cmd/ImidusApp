"use client";

import React from "react";
import Modal from "@/components/Dialogs/Modal";
import Spinner from "@/components/Loading/Spinner";

interface OrderItem {
  id: number;
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: number;
  orderNumber: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  items: OrderItem[];
  subtotal: number;
  gstAmt: number;
  pstAmt: number;
  total: number;
  status: "pending" | "completed" | "cancelled" | "refunded";
  paymentMethod: string;
  paymentStatus: "paid" | "pending" | "failed" | "refunded";
  notes?: string;
  createdAt: string;
}

interface OrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  order?: Order;
  loading?: boolean;
}

export default function OrderDetailModal({
  isOpen,
  onClose,
  order,
  loading = false,
}: OrderDetailModalProps) {
  if (!order) return null;

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
      refunded: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Order #${order.orderNumber}`}
      size="lg"
    >
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Spinner size="md" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Order Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase">Customer</p>
              <p className="text-sm font-medium text-gray-900">
                {order.customerName}
              </p>
              {order.customerEmail && (
                <p className="text-xs text-gray-600">{order.customerEmail}</p>
              )}
              {order.customerPhone && (
                <p className="text-xs text-gray-600">{order.customerPhone}</p>
              )}
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Status</p>
              <div className="flex gap-2 mt-1">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(order.status)}`}
                >
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(order.paymentStatus)}`}
                >
                  {order.paymentStatus.charAt(0).toUpperCase() +
                    order.paymentStatus.slice(1)}
                </span>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Payment Method</p>
              <p className="text-sm font-medium text-gray-900">
                {order.paymentMethod}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Time</p>
              <p className="text-sm font-medium text-gray-900">
                {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Items */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Items</h4>
            <div className="space-y-1 bg-gray-50 p-4 rounded">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-gray-700">
                    {item.name} x{item.quantity}
                  </span>
                  <span className="font-medium text-gray-900">
                    $
                    {(item.price / 100).toLocaleString("en-US", {
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="space-y-2 border-t border-gray-200 pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="text-gray-900">
                $
                {(order.subtotal / 100).toLocaleString("en-US", {
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">GST (6%)</span>
              <span className="text-gray-900">
                $
                {(order.gstAmt / 100).toLocaleString("en-US", {
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">PST (0%)</span>
              <span className="text-gray-900">
                $
                {(order.pstAmt / 100).toLocaleString("en-US", {
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex justify-between font-semibold text-lg border-t border-gray-200 pt-2 mt-2">
              <span>Total</span>
              <span className="text-orange-600">
                $
                {(order.total / 100).toLocaleString("en-US", {
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">
                Notes
              </h4>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                {order.notes}
              </p>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
