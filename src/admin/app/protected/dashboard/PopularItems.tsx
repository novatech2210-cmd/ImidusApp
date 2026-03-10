"use client";

import React from "react";
import DataTable, { Column } from "@/components/Tables/DataTable";
import { SkeletonTable } from "@/components/Loading/Skeleton";

interface PopularItem {
  id?: number;
  itemId: number;
  itemName: string;
  quantity: number;
  revenue: number;
  imageUrl?: string;
}

interface PopularItemsProps {
  data: PopularItem[];
  loading?: boolean;
}

export default function PopularItems({
  data,
  loading = false,
}: PopularItemsProps) {
  const columns: Column<PopularItem>[] = [
    {
      key: "itemName",
      label: "Item Name",
      sortable: true,
    },
    {
      key: "quantity",
      label: "Orders",
      sortable: true,
      render: (value) => value.toLocaleString(),
    },
    {
      key: "revenue",
      label: "Revenue",
      sortable: true,
      render: (value) =>
        `$${(value / 100).toLocaleString("en-US", { maximumFractionDigits: 2 })}`,
    },
  ];

  if (loading) {
    return <SkeletonTable rows={5} cols={3} />;
  }

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Popular Items
      </h3>
      <DataTable<PopularItem>
        columns={columns}
        data={data}
        pageSize={10}
        emptyMessage="No popular items data"
      />
    </div>
  );
}
