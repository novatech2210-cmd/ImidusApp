'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { SkeletonChart } from '@/components/Loading/Skeleton';
import { Users } from 'lucide-react';

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

// RFM Segment Colors - Imperial Onyx Design System
const SEGMENT_CONFIG = [
  { key: 'highSpend', name: 'Champions', color: '#D4AF37', description: 'Top spenders' },
  { key: 'frequent', name: 'Loyal', color: '#0A1F3D', description: 'Regular customers' },
  { key: 'recent', name: 'Potential', color: '#2E7D32', description: 'Recent activity' },
  { key: 'atRisk', name: 'At-Risk', color: '#C62828', description: 'Dormant, high-value' },
  { key: 'newCustomers', name: 'Lost', color: '#6E6E78', description: 'No recent activity' },
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
      color: string;
    };
  }>;
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-onyx-bg-tertiary px-4 py-3 shadow-lg rounded-xl border border-onyx-border">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.color }} />
          <p className="font-semibold text-onyx-text-primary">{data.name}</p>
        </div>
        <p className="text-sm text-onyx-text-secondary">{data.value.toLocaleString()} customers</p>
        <p className="text-sm font-medium text-onyx-blue">{data.percent.toFixed(1)}%</p>
        <p className="text-xs text-onyx-text-muted mt-1">{data.description}</p>
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
    <div className="flex flex-wrap justify-center gap-2 mt-4">
      {payload.map((entry, index) => {
        const config = SEGMENT_CONFIG.find(s => s.name === entry.value);
        return (
          <button
            key={index}
            onClick={() => onSegmentClick?.(config?.key || '')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl bg-onyx-bg-tertiary border border-onyx-border hover:border-onyx-border-hover transition-colors ${
              onSegmentClick ? 'cursor-pointer' : 'cursor-default'
            }`}
          >
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-onyx-text-secondary">{entry.value}</span>
            <span className="text-sm font-semibold text-onyx-text-primary">
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
      <div className="bg-onyx-bg-secondary p-6 rounded-xl border border-onyx-border">
        <h3 className="text-lg font-semibold text-onyx-text-primary mb-4">Customer Segments</h3>
        <div className="h-64 flex flex-col items-center justify-center">
          <Users size={48} className="text-onyx-text-muted mb-4" />
          <p className="text-onyx-text-secondary">No customer segment data available</p>
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
    <div className="bg-onyx-bg-secondary p-6 rounded-xl border border-onyx-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-onyx-text-primary">Customer Segments</h3>
        <span className="text-sm text-onyx-text-muted">
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
                  stroke="rgb(26, 26, 31)"
                  strokeWidth={2}
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
            <p className="text-3xl font-bold text-onyx-text-primary">{segments.total.toLocaleString()}</p>
            <p className="text-sm text-onyx-text-muted">Total</p>
          </div>
        </div>
      </div>

      {/* Click hint */}
      {onSegmentClick && (
        <p className="text-xs text-onyx-text-muted text-center mt-2">
          Click a segment to filter the customer list
        </p>
      )}
    </div>
  );
}
