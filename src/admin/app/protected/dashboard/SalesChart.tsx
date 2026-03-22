'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { SkeletonChart } from '@/components/Loading/Skeleton';
import { BarChart3 } from 'lucide-react';

interface SalesChartProps {
  data: Array<{
    date: string;
    orderCount: number;
    revenue: number;
  }>;
  loading?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-onyx-bg-tertiary border border-onyx-border rounded-xl p-4 shadow-lg">
        <p className="text-sm font-semibold text-onyx-text-primary mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-onyx-text-secondary">{entry.name}:</span>
            <span className="font-semibold text-onyx-text-primary">
              {entry.name === 'Revenue ($)'
                ? `$${entry.value.toLocaleString()}`
                : entry.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function SalesChart({ data, loading = false }: SalesChartProps) {
  if (loading) {
    return <SkeletonChart />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-[#1A1A1F] p-6 rounded-2xl border border-[#2A2A30] h-[400px] flex flex-col items-center justify-center">
        <BarChart3 size={48} className="text-[#6E6E78] mb-4" />
        <p className="text-[#9A9AA3] text-lg font-medium">No sales data available</p>
        <p className="text-[#6E6E78] text-sm">Data will appear once orders are recorded</p>
      </div>
    );
  }

  return (
    <div className="bg-[#1A1A1F] p-6 rounded-2xl border border-[#2A2A30]">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#5BA0FF]/10 rounded-xl">
            <BarChart3 size={20} className="text-[#5BA0FF]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[#F5F5F7]">Sales Trend</h3>
            <p className="text-xs text-[#6E6E78]">Revenue and order volume over time</p>
          </div>
        </div>

        {/* Legend Pills */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#5BA0FF]" />
            <span className="text-xs text-[#9A9AA3]">Revenue</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#FFD666]" />
            <span className="text-xs text-[#9A9AA3]">Orders</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#5BA0FF" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#5BA0FF" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FFD666" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#FFD666" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#2A2A30" />
          <XAxis
            dataKey="date"
            fontSize={12}
            tick={{ fill: '#6E6E78' }}
            axisLine={{ stroke: '#2A2A30' }}
            tickLine={{ stroke: '#2A2A30' }}
          />
          <YAxis
            fontSize={12}
            tick={{ fill: '#6E6E78' }}
            axisLine={{ stroke: '#2A2A30' }}
            tickLine={{ stroke: '#2A2A30' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#5BA0FF"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorRevenue)"
            name="Revenue ($)"
          />
          <Area
            type="monotone"
            dataKey="orderCount"
            stroke="#FFD666"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorOrders)"
            name="Orders"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
