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
      <div className="bg-[bg-onyx-bg-secondary] p-6 rounded-2xl border border-[border-onyx-border]">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-[onyx-gold]/10 rounded-xl">
            <Trophy size={20} className="text-[onyx-gold]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[text-onyx-text-primary]">
              Top Selling Items
            </h3>
            <p className="text-xs text-[text-onyx-text-muted]">
              From INI_Restaurant tblSalesDetail
            </p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-12">
          <Package size={48} className="text-[text-onyx-text-muted] mb-4" />
          <p className="text-[text-onyx-text-secondary]">No popular items data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[bg-onyx-bg-secondary] p-6 rounded-2xl border border-[border-onyx-border]">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[onyx-gold]/10 rounded-xl">
            <Trophy size={20} className="text-[onyx-gold]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[text-onyx-text-primary]">
              Top Selling Items
            </h3>
            <p className="text-xs text-[text-onyx-text-muted]">
              Based on order quantity from POS
            </p>
          </div>
        </div>

        <span className="text-xs font-medium text-[text-onyx-text-muted] bg-[bg-onyx-bg-tertiary] px-3 py-1 rounded-full">
          Top {data.length} items
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[border-onyx-border]">
              <th className="text-left py-3 px-4 text-xs font-semibold text-[text-onyx-text-muted] uppercase tracking-wider">
                Rank
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-[text-onyx-text-muted] uppercase tracking-wider">
                Item Name
              </th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-[text-onyx-text-muted] uppercase tracking-wider">
                Orders
              </th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-[text-onyx-text-muted] uppercase tracking-wider">
                Revenue
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr
                key={item.id || index}
                className="border-b border-[border-onyx-border]/50 hover:bg-[bg-onyx-bg-tertiary] transition-colors"
              >
                <td className="py-4 px-4">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                      index === 0
                        ? "bg-[onyx-gold]/20 text-[onyx-gold]"
                        : index === 1
                          ? "bg-[text-onyx-text-secondary]/20 text-[text-onyx-text-secondary]"
                          : index === 2
                            ? "bg-[#CD7F32]/20 text-[#CD7F32]"
                            : "bg-[bg-onyx-bg-tertiary] text-[text-onyx-text-muted]"
                    }`}
                  >
                    {index + 1}
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[bg-onyx-bg-tertiary] rounded-lg flex items-center justify-center">
                      <Package size={18} className="text-[text-onyx-text-muted]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[text-onyx-text-primary]">
                        {item.itemName}
                      </p>
                      <p className="text-xs text-[text-onyx-text-muted]">
                        ID: {item.itemId}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-sm font-semibold text-[onyx-blue]">
                      {(item.quantity || 0).toLocaleString()}
                    </span>
                    {index < 3 && (
                      <TrendingUp size={14} className="text-[#4ADE80]" />
                    )}
                  </div>
                </td>
                <td className="py-4 px-4 text-right">
                  <span className="text-sm font-semibold text-[onyx-gold]">
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
