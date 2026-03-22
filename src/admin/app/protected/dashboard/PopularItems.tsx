"use client";

import { SkeletonTable } from "@/components/Loading/Skeleton";
import { Package, TrendingUp, Trophy } from "lucide-react";

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
  if (loading) {
    return <SkeletonTable rows={5} cols={4} />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-[#1A1A1F] p-6 rounded-2xl border border-[#2A2A30]">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-[#FFD666]/10 rounded-xl">
            <Trophy size={20} className="text-[#FFD666]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[#F5F5F7]">
              Top Selling Items
            </h3>
            <p className="text-xs text-[#6E6E78]">
              From INI_Restaurant tblSalesDetail
            </p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-12">
          <Package size={48} className="text-[#6E6E78] mb-4" />
          <p className="text-[#9A9AA3]">No popular items data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1A1A1F] p-6 rounded-2xl border border-[#2A2A30]">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#FFD666]/10 rounded-xl">
            <Trophy size={20} className="text-[#FFD666]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[#F5F5F7]">
              Top Selling Items
            </h3>
            <p className="text-xs text-[#6E6E78]">
              Based on order quantity from POS
            </p>
          </div>
        </div>

        <span className="text-xs font-medium text-[#6E6E78] bg-[#222228] px-3 py-1 rounded-full">
          Top {data.length} items
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#2A2A30]">
              <th className="text-left py-3 px-4 text-xs font-semibold text-[#6E6E78] uppercase tracking-wider">
                Rank
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-[#6E6E78] uppercase tracking-wider">
                Item Name
              </th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-[#6E6E78] uppercase tracking-wider">
                Orders
              </th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-[#6E6E78] uppercase tracking-wider">
                Revenue
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr
                key={item.id || index}
                className="border-b border-[#2A2A30]/50 hover:bg-[#222228] transition-colors"
              >
                <td className="py-4 px-4">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                      index === 0
                        ? "bg-[#FFD666]/20 text-[#FFD666]"
                        : index === 1
                          ? "bg-[#9A9AA3]/20 text-[#9A9AA3]"
                          : index === 2
                            ? "bg-[#CD7F32]/20 text-[#CD7F32]"
                            : "bg-[#222228] text-[#6E6E78]"
                    }`}
                  >
                    {index + 1}
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#222228] rounded-lg flex items-center justify-center">
                      <Package size={18} className="text-[#6E6E78]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#F5F5F7]">
                        {item.itemName}
                      </p>
                      <p className="text-xs text-[#6E6E78]">
                        ID: {item.itemId}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-sm font-semibold text-[#5BA0FF]">
                      {(item.quantity || 0).toLocaleString()}
                    </span>
                    {index < 3 && (
                      <TrendingUp size={14} className="text-[#4ADE80]" />
                    )}
                  </div>
                </td>
                <td className="py-4 px-4 text-right">
                  <span className="text-sm font-semibold text-[#FFD666]">
                    $
                    {(item.revenue / 100).toLocaleString("en-US", {
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
