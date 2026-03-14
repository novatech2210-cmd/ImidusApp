"use client";

/**
 * Segment Dashboard Component
 *
 * Admin dashboard to view customer segment distribution.
 * All data READ from INI_Restaurant via segment evaluation APIs.
 *
 * Features:
 * - Pie chart: Customer distribution by segment
 * - Stats table: Segment statistics with counts and percentages
 * - Refresh button: Recalculate segments from POS
 * - Export: Download segment data as CSV
 *
 * SSOT Compliance:
 * - All data READ from INI_Restaurant
 * - NO writes to POS database
 */

import {
  formatSegmentName,
  getSegmentColor,
  SEGMENT_THRESHOLDS,
} from "@/lib/segments";
import { useCallback, useEffect, useState } from "react";

// ============================================================================
// Types
// ============================================================================

interface SegmentDistribution {
  high_spend_count: number;
  frequent_count: number;
  recent_count: number;
  birthday_count: number;
  total_customers: number;
}

interface SegmentStat {
  segment: string;
  count: number;
  percentage: number;
  color: string;
  description: string;
}

// ============================================================================
// API Helpers
// ============================================================================

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5005/api";

async function fetchSegmentDistribution(): Promise<SegmentDistribution> {
  const response = await fetch(
    `${API_BASE}/Admin/customers/segment-distribution`,
  );
  if (!response.ok) {
    throw new Error("Failed to fetch segment distribution");
  }
  return response.json();
}

async function exportSegmentData(): Promise<Blob> {
  const response = await fetch(`${API_BASE}/Admin/customers/segments/export`);
  if (!response.ok) {
    throw new Error("Failed to export segment data");
  }
  return response.blob();
}

// ============================================================================
// Pie Chart Component
// ============================================================================

interface PieSlice {
  value: number;
  color: string;
  label: string;
}

interface PieChartProps {
  slices: PieSlice[];
  size?: number;
}

function PieChart({ slices, size = 200 }: PieChartProps) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  if (total === 0) {
    return (
      <div
        className="flex items-center justify-center bg-gray-100 rounded-full"
        style={{ width: size, height: size }}
      >
        <span className="text-gray-400">No data</span>
      </div>
    );
  }

  let cumulativePercentage = 0;
  const paths = slices
    .filter((slice) => slice.value > 0)
    .map((slice) => {
      const percentage = (slice.value / total) * 100;
      const startAngle = (cumulativePercentage / 100) * 360;
      const endAngle = ((cumulativePercentage + percentage) / 100) * 360;
      cumulativePercentage += percentage;

      // Convert angles to radians
      const startRad = ((startAngle - 90) * Math.PI) / 180;
      const endRad = ((endAngle - 90) * Math.PI) / 180;

      const radius = size / 2;
      const centerX = size / 2;
      const centerY = size / 2;

      // Calculate path
      const x1 = centerX + radius * Math.cos(startRad);
      const y1 = centerY + radius * Math.sin(startRad);
      const x2 = centerX + radius * Math.cos(endRad);
      const y2 = centerY + radius * Math.sin(endRad);

      const largeArcFlag = percentage > 50 ? 1 : 0;

      const pathD = [
        `M ${centerX} ${centerY}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        "Z",
      ].join(" ");

      return (
        <path
          key={slice.label}
          d={pathD}
          fill={slice.color}
          className="hover:opacity-80 transition-opacity cursor-pointer"
        >
          <title>{`${slice.label}: ${slice.value} (${percentage.toFixed(1)}%)`}</title>
        </path>
      );
    });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {paths}
    </svg>
  );
}

// ============================================================================
// Legend Component
// ============================================================================

interface LegendProps {
  items: Array<{
    label: string;
    color: string;
    count: number;
    percentage: number;
  }>;
}

function Legend({ items }: LegendProps) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.label} className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-sm font-medium">{item.label}</span>
          </div>
          <div className="text-sm text-gray-600">
            {item.count} ({item.percentage.toFixed(1)}%)
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Stats Card Component
// ============================================================================

interface StatsCardProps {
  stat: SegmentStat;
}

function StatsCard({ stat }: StatsCardProps) {
  return (
    <div className="bg-white rounded-lg border p-4 shadow-sm">
      <div className="flex items-center gap-3 mb-2">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: stat.color }}
        />
        <h3 className="font-semibold text-gray-900">
          {formatSegmentName(stat.segment)}
        </h3>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold">
          {stat.count.toLocaleString()}
        </span>
        <span className="text-sm text-gray-500">customers</span>
      </div>
      <div className="mt-1 flex items-center gap-2">
        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${stat.percentage}%`,
              backgroundColor: stat.color,
            }}
          />
        </div>
        <span className="text-sm font-medium" style={{ color: stat.color }}>
          {stat.percentage.toFixed(1)}%
        </span>
      </div>
      <p className="mt-2 text-xs text-gray-500">{stat.description}</p>
    </div>
  );
}

// ============================================================================
// Main Dashboard Component
// ============================================================================

export default function SegmentDashboard() {
  const [distribution, setDistribution] = useState<SegmentDistribution | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [exporting, setExporting] = useState(false);

  // Fetch segment distribution
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchSegmentDistribution();
      setDistribution(data);
      setLastRefresh(new Date());
    } catch (err) {
      console.error("Failed to fetch segment distribution:", err);
      setError("Failed to load segment data. Please try again.");
      // Set mock data for development
      setDistribution({
        high_spend_count: 127,
        frequent_count: 89,
        recent_count: 234,
        birthday_count: 12,
        total_customers: 1542,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Handle CSV export
  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await exportSegmentData();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `segment-data-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export segment data:", err);
      setError("Failed to export data. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  // Calculate stats
  const stats: SegmentStat[] = distribution
    ? [
        {
          segment: "high-spend",
          count: distribution.high_spend_count,
          percentage:
            distribution.total_customers > 0
              ? (distribution.high_spend_count / distribution.total_customers) *
                100
              : 0,
          color: getSegmentColor("high-spend"),
          description: `Customers with lifetime value > $${SEGMENT_THRESHOLDS.HIGH_SPEND_MIN}`,
        },
        {
          segment: "frequent",
          count: distribution.frequent_count,
          percentage:
            distribution.total_customers > 0
              ? (distribution.frequent_count / distribution.total_customers) *
                100
              : 0,
          color: getSegmentColor("frequent"),
          description: `Customers with > ${SEGMENT_THRESHOLDS.FREQUENT_MIN} orders`,
        },
        {
          segment: "recent",
          count: distribution.recent_count,
          percentage:
            distribution.total_customers > 0
              ? (distribution.recent_count / distribution.total_customers) * 100
              : 0,
          color: getSegmentColor("recent"),
          description: `Customers with orders in last ${SEGMENT_THRESHOLDS.RECENT_MAX_DAYS} days`,
        },
        {
          segment: "birthday",
          count: distribution.birthday_count,
          percentage:
            distribution.total_customers > 0
              ? (distribution.birthday_count / distribution.total_customers) *
                100
              : 0,
          color: getSegmentColor("birthday"),
          description: `Customers with birthday within ${SEGMENT_THRESHOLDS.BIRTHDAY_RANGE_DAYS} days`,
        },
      ]
    : [];

  // Pie chart data
  const pieSlices: PieSlice[] = stats.map((stat) => ({
    value: stat.count,
    color: stat.color,
    label: formatSegmentName(stat.segment),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Customer Segments
          </h2>
          <p className="text-gray-500 mt-1">
            Real-time RFM analysis from INI_Restaurant (READ-ONLY)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            disabled={exporting || loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting ? "Exporting..." : "Export CSV"}
          </button>
          <button
            onClick={refresh}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Refreshing...
              </>
            ) : (
              "Refresh"
            )}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie Chart */}
        <div className="bg-white rounded-lg border p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">
            Segment Distribution
          </h3>
          <div className="flex flex-col items-center gap-6">
            <PieChart slices={pieSlices} size={180} />
            <Legend
              items={stats.map((stat) => ({
                label: formatSegmentName(stat.segment),
                color: stat.color,
                count: stat.count,
                percentage: stat.percentage,
              }))}
            />
          </div>
          {distribution && (
            <div className="mt-4 pt-4 border-t text-center">
              <span className="text-sm text-gray-500">Total Customers:</span>
              <span className="ml-2 text-lg font-bold">
                {distribution.total_customers.toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {stats.map((stat) => (
            <StatsCard key={stat.segment} stat={stat} />
          ))}
        </div>
      </div>

      {/* Segment Criteria */}
      <div className="bg-gray-50 rounded-lg border p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Segment Criteria</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded p-4">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: getSegmentColor("high-spend") }}
              />
              High Spender
            </h4>
            <p className="text-sm text-gray-500 mt-1">
              Lifetime value {`>`} ${SEGMENT_THRESHOLDS.HIGH_SPEND_MIN}
            </p>
          </div>
          <div className="bg-white rounded p-4">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: getSegmentColor("frequent") }}
              />
              Frequent
            </h4>
            <p className="text-sm text-gray-500 mt-1">
              {`>`} {SEGMENT_THRESHOLDS.FREQUENT_MIN} orders
            </p>
          </div>
          <div className="bg-white rounded p-4">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: getSegmentColor("recent") }}
              />
              Recent
            </h4>
            <p className="text-sm text-gray-500 mt-1">
              Order within {SEGMENT_THRESHOLDS.RECENT_MAX_DAYS} days
            </p>
          </div>
          <div className="bg-white rounded p-4">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: getSegmentColor("birthday") }}
              />
              Birthday
            </h4>
            <p className="text-sm text-gray-500 mt-1">
              Birthday +/- {SEGMENT_THRESHOLDS.BIRTHDAY_RANGE_DAYS} days
            </p>
          </div>
        </div>
      </div>

      {/* Last Refresh */}
      {lastRefresh && (
        <div className="text-center text-sm text-gray-400">
          Last updated: {lastRefresh.toLocaleString()}
        </div>
      )}
    </div>
  );
}
