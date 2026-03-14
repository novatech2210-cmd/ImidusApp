'use client';

import React from 'react';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import { SkeletonChart } from '@/components/Loading/Skeleton';

interface SegmentData {
  name: string;
  value: number;
  color: string;
}

interface SegmentationChartProps {
  data: SegmentData[];
  loading?: boolean;
}

const COLORS = ['var(--brand-gold)', 'var(--brand-blue)', 'var(--segment-recent)', 'var(--segment-at-risk)', 'var(--segment-new)', 'var(--segment-default)'];

export default function SegmentationChart({ data, loading = false }: SegmentationChartProps) {
  if (loading) {
    return <SkeletonChart />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200 h-80 flex items-center justify-center text-gray-500">
        No segmentation data available
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Segments</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value }) => `${name}: ${value}`}
            outerRadius={100}
            fill="var(--brand-blue)"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => value.toLocaleString()} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
