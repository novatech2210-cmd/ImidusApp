'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, YAxis as YAxisType } from 'recharts';
import { SkeletonChart } from '@/components/Loading/Skeleton';

interface SalesChartProps {
  data: Array<{
    date: string;
    orderCount: number;
    revenue: number;
  }>;
  loading?: boolean;
}

export default function SalesChart({ data, loading = false }: SalesChartProps) {
  if (loading) {
    return <SkeletonChart />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200 h-80 flex items-center justify-center text-gray-500">
        No sales data available
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Trend</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" fontSize={12} />
          <YAxisType fontSize={12} />
          <Tooltip
            formatter={(value) => {
              if (typeof value === 'number') {
                return value.toLocaleString();
              }
              return value;
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#f97316"
            dot={{ fill: '#f97316', r: 4 }}
            activeDot={{ r: 6 }}
            name="Revenue ($)"
          />
          <Line
            type="monotone"
            dataKey="orderCount"
            stroke="#3b82f6"
            dot={{ fill: '#3b82f6', r: 4 }}
            activeDot={{ r: 6 }}
            name="Orders"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
