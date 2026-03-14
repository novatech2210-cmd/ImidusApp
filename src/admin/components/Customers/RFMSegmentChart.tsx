'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { SkeletonChart } from '@/components/Loading/Skeleton';

export interface CustomerSegments {
  highSpend: number;
  frequent: number;
  recent: number;
  atRisk: number;
  newCustomers: number;
  total: number;
}

interface RFMSegmentChartProps {
  segments: CustomerSegments;
  loading?: boolean;
  onSegmentClick?: (segment: string) => void;
}

// RFM Segment Colors (per plan specification)
const SEGMENT_CONFIG = [
  { key: 'highSpend', name: 'High-Spend', color: 'var(--brand-gold)', description: 'LTV > $500' },
  { key: 'frequent', name: 'Frequent', color: 'var(--brand-blue)', description: '10+ visits' },
  { key: 'recent', name: 'Recent', color: 'var(--segment-recent)', description: 'Last 14 days' },
  { key: 'atRisk', name: 'At-Risk', color: 'var(--segment-at-risk)', description: '30+ days, LTV > $100' },
  { key: 'newCustomers', name: 'New', color: 'var(--segment-new)', description: 'Last 30 days' },
] as const;

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: {
      name: string;
      value: number;
      percent: number;
      description: string;
    };
  }>;
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white px-3 py-2 shadow-lg rounded-lg border border-gray-200">
        <p className="font-medium text-gray-900">{data.name}</p>
        <p className="text-sm text-gray-600">{data.value.toLocaleString()} customers</p>
        <p className="text-sm text-gray-500">{data.percent.toFixed(1)}%</p>
        <p className="text-xs text-gray-400 mt-1">{data.description}</p>
      </div>
    );
  }
  return null;
};

interface LegendPayloadItem {
  value: string;
  color: string;
  payload: {
    name: string;
    value: number;
    fill: string;
  };
}

const CustomLegend = ({
  payload,
  onSegmentClick,
}: {
  payload?: LegendPayloadItem[];
  onSegmentClick?: (segment: string) => void;
}) => {
  if (!payload) return null;

  return (
    <div className="flex flex-wrap justify-center gap-3 mt-4">
      {payload.map((entry, index) => {
        const config = SEGMENT_CONFIG.find(s => s.name === entry.value);
        return (
          <button
            key={index}
            onClick={() => onSegmentClick?.(config?.key || '')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors ${
              onSegmentClick ? 'cursor-pointer' : 'cursor-default'
            }`}
          >
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-gray-700">{entry.value}</span>
            <span className="text-sm font-medium text-gray-900">
              {entry.payload.value.toLocaleString()}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default function RFMSegmentChart({
  segments,
  loading = false,
  onSegmentClick,
}: RFMSegmentChartProps) {
  if (loading) {
    return <SkeletonChart />;
  }

  // Transform segments data for the chart
  const chartData = SEGMENT_CONFIG.map(config => ({
    name: config.name,
    value: segments[config.key as keyof CustomerSegments] as number || 0,
    color: config.color,
    description: config.description,
    key: config.key,
    percent: segments.total > 0
      ? ((segments[config.key as keyof CustomerSegments] as number || 0) / segments.total) * 100
      : 0,
  })).filter(item => item.value > 0);

  // Handle empty state
  if (segments.total === 0 || chartData.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Segments</h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          No customer segment data available
        </div>
      </div>
    );
  }

  const handlePieClick = (data: { key?: string }) => {
    if (onSegmentClick && data.key) {
      // Map segment keys to filter values
      const filterMap: Record<string, string> = {
        highSpend: 'high-spend',
        frequent: 'frequent',
        recent: 'recent',
        atRisk: 'at-risk',
        newCustomers: 'new',
      };
      onSegmentClick(filterMap[data.key] || data.key);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Customer Segments</h3>
        <span className="text-sm text-gray-500">
          {segments.total.toLocaleString()} total customers
        </span>
      </div>

      <div className="relative">
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              onClick={handlePieClick}
              style={{ cursor: onSegmentClick ? 'pointer' : 'default' }}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  stroke={entry.color}
                  strokeWidth={1}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              content={<CustomLegend onSegmentClick={onSegmentClick ? (key) => {
                const filterMap: Record<string, string> = {
                  highSpend: 'high-spend',
                  frequent: 'frequent',
                  recent: 'recent',
                  atRisk: 'at-risk',
                  newCustomers: 'new',
                };
                onSegmentClick(filterMap[key] || key);
              } : undefined} />}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center text showing total */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ paddingBottom: '60px' }}>
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900">{segments.total.toLocaleString()}</p>
            <p className="text-sm text-gray-500">Total</p>
          </div>
        </div>
      </div>

      {/* Click hint */}
      {onSegmentClick && (
        <p className="text-xs text-gray-400 text-center mt-2">
          Click a segment to filter the customer list
        </p>
      )}
    </div>
  );
}
