"use client";

import React from "react";
import DataTable, { Column } from "@/components/Tables/DataTable";
import { SkeletonTable } from "@/components/Loading/Skeleton";

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
  customerPhone?: string;
  items: OrderItem[];
  total: number;
  status: "pending" | "completed" | "cancelled" | "refunded";
  paymentStatus: "paid" | "pending" | "failed" | "refunded";
  createdAt: string;
}

interface OrderQueueProps {
  orders: Order[];
  loading?: boolean;
  onOrderClick?: (order: Order) => void;
}

export default function OrderQueue({
  orders,
  loading = false,
  onOrderClick,
}: OrderQueueProps) {
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
      refunded: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const columns: Column<Order>[] = [
    {
      key: "orderNumber",
      label: "Order #",
      sortable: true,
    },
    {
      key: "customerName",
      label: "Customer",
      sortable: true,
    },
    {
      key: "total",
      label: "Total",
      sortable: true,
      render: (value) =>
        `$${(value / 100).toLocaleString("en-US", { maximumFractionDigits: 2 })}`,
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (value) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(value)}`}
        >
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
      ),
    },
    {
      key: "paymentStatus",
      label: "Payment",
      sortable: true,
      render: (value) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(value)}`}
        >
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Time",
      render: (value) => new Date(value).toLocaleTimeString(),
    },
  ];

  if (loading) {
    return <SkeletonTable rows={10} cols={6} />;
  }

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Queue</h3>
      <DataTable<Order>
        columns={columns}
        data={orders}
        pageSize={15}
        onRowClick={onOrderClick}
        emptyMessage="No orders"
      />
    </div>
  );
}
