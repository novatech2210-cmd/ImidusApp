'use client';

import { useState, useEffect } from 'react';
import { overlayDb } from '@/lib/db';

interface AnalyticsData {
  ruleId: string;
  ruleName: string;
  impressions: number;
  accepts: number;
  declines: number;
  acceptanceRate: number;
  totalRevenue: number;
  avgUpsellValue: number;
}

interface OverviewStats {
  totalImpressions: number;
  overallAcceptanceRate: number;
  totalRevenue: number;
  topPerformingRule: string | null;
}

export default function UpsellAnalytics() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([]);
  const [overviewStats, setOverviewStats] = useState<OverviewStats>({
    totalImpressions: 0,
    overallAcceptanceRate: 0,
    totalRevenue: 0,
    topPerformingRule: null
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');
  const [selectedRule, setSelectedRule] = useState<string>('all');
  const [rules, setRules] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    fetchAnalyticsData();
    fetchRules();
  }, [dateRange, selectedRule]);

  async function fetchRules() {
    try {
      const result = await overlayDb.query(`
        SELECT id, name FROM upselling_rules WHERE active = 1 ORDER BY name
      `);
      setRules(result.rows);
    } catch (error) {
      console.error('Failed to fetch rules:', error);
    }
  }

  async function fetchAnalyticsData() {
    setLoading(true);
    try {
      // Build dynamic WHERE clause
      let whereClause = `i.shown_at >= NOW() - INTERVAL '${dateRange} days'`;
      if (selectedRule !== 'all') {
        whereClause += ` AND r.id = '${selectedRule}'`;
      }

      const query = `
        SELECT 
          r.id as ruleId,
          r.name as ruleName,
          COUNT(i.id) as impressions,
          COUNT(i.id) FILTER (WHERE i.result = 'accepted') as accepts,
          COUNT(i.id) FILTER (WHERE i.result = 'declined') as declines,
          ROUND(
            COUNT(i.id) FILTER (WHERE i.result = 'accepted')::NUMERIC / 
            NULLIF(COUNT(i.id), 0)::NUMERIC * 100,
            2
          ) as acceptance_rate,
          COALESCE(SUM(i.revenue_attributed), 0) as total_revenue,
          ROUND(AVG(i.revenue_attributed) FILTER (WHERE i.result = 'accepted'), 2) as avg_upsell_value
        FROM upselling_rules r
        LEFT JOIN upsell_impressions i ON i.rule_id = r.id
        WHERE ${whereClause}
        GROUP BY r.id, r.name
        ORDER BY acceptance_rate DESC
      `;

      const result = await overlayDb.query(query);
      const data = result.rows;

      // Calculate overview stats
      const totalImpressions = data.reduce((sum, row) => sum + (row.impressions || 0), 0);
      const totalAccepts = data.reduce((sum, row) => sum + (row.accepts || 0), 0);
      const totalRevenue = data.reduce((sum, row) => sum + (row.total_revenue || 0), 0);
      const overallAcceptanceRate = totalImpressions > 0 ? (totalAccepts / totalImpressions) * 100 : 0;
      const topPerformingRule = data.length > 0 ? data[0].ruleName : null;

      setAnalyticsData(data);
      setOverviewStats({
        totalImpressions,
        overallAcceptanceRate,
        totalRevenue,
        topPerformingRule
      });
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      setAnalyticsData([]);
    } finally {
      setLoading(false);
    }
  }

  const exportCSV = () => {
    const headers = ['Rule Name', 'Impressions', 'Accepts', 'Declines', 'Acceptance Rate', 'Total Revenue', 'Avg Upsell Value'];
    const csvContent = [
      headers.join(','),
      ...analyticsData.map(row => [
        `"${row.ruleName}"`,
        row.impressions,
        row.accepts,
        row.declines,
        row.acceptanceRate,
        row.totalRevenue,
        row.avgUpsellValue
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `upsell-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-[#1A1A2E]">Upsell Analytics</h2>
          <p className="text-[#71717A] mt-1">Track upsell performance and effectiveness</p>
        </div>
        <button
          onClick={exportCSV}
          className="px-4 py-2 bg-[#1E5AA8] text-white rounded-lg hover:bg-[#164a8c] transition-colors"
        >
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="card card-body">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-[#4A4A5A] mb-1">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="input"
            >
              <option value="7">Last 7 days</option>
              <option value="14">Last 14 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#4A4A5A] mb-1">Rule</label>
            <select
              value={selectedRule}
              onChange={(e) => setSelectedRule(e.target.value)}
              className="input"
            >
              <option value="all">All Rules</option>
              {rules.map(rule => (
                <option key={rule.id} value={rule.id}>{rule.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card card-body text-center">
          <p className="text-sm text-[#71717A] mb-1">Total Impressions</p>
          <p className="text-2xl font-bold text-[#1A1A2E]">{overviewStats.totalImpressions.toLocaleString()}</p>
        </div>
        <div className="card card-body text-center">
          <p className="text-sm text-[#71717A] mb-1">Overall Acceptance Rate</p>
          <p className="text-2xl font-bold text-[#1E5AA8]">{overviewStats.overallAcceptanceRate.toFixed(1)}%</p>
        </div>
        <div className="card card-body text-center">
          <p className="text-sm text-[#71717A] mb-1">Total Revenue</p>
          <p className="text-2xl font-bold text-[#10B981]">${overviewStats.totalRevenue.toFixed(2)}</p>
        </div>
        <div className="card card-body text-center">
          <p className="text-sm text-[#71717A] mb-1">Top Performing Rule</p>
          <p className="text-lg font-bold text-[#1A1A2E] truncate">
            {overviewStats.topPerformingRule || 'N/A'}
          </p>
        </div>
      </div>

      {/* Performance Table */}
      <div className="card card-body">
        <h3 className="text-lg font-bold text-[#1A1A2E] mb-4">Rule Performance</h3>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : analyticsData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-[#4A4A5A]">Rule Name</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-[#4A4A5A]">Impressions</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-[#4A4A5A]">Accepts</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-[#4A4A5A]">Declines</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-[#4A4A5A]">Acceptance Rate</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-[#4A4A5A]">Revenue</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-[#4A4A5A]">Avg Upsell</th>
                </tr>
              </thead>
              <tbody>
                {analyticsData.map((row, index) => (
                  <tr key={row.ruleId} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                    <td className="py-3 px-4 text-[#1A1A2E]">{row.ruleName}</td>
                    <td className="py-3 px-4 text-right text-[#4A4A5A]">{row.impressions.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-[#4A4A5A]">{row.accepts.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-[#4A4A5A]">{row.declines.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        row.acceptanceRate >= 30 ? 'bg-green-100 text-green-800' :
                        row.acceptanceRate >= 15 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {row.acceptanceRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-[#10B981] font-medium">
                      ${row.totalRevenue.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right text-[#4A4A5A]">
                      {row.avgUpsellValue ? `$${row.avgUpsellValue.toFixed(2)}` : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-[#71717A] py-8">No analytics data available for the selected period.</p>
        )}
      </div>

      {/* Charts Section - Simplified */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Result Distribution */}
        <div className="card card-body">
          <h3 className="text-lg font-bold text-[#1A1A2E] mb-4">Result Distribution</h3>
          {analyticsData.length > 0 ? (
            <div className="space-y-3">
              {analyticsData.slice(0, 5).map(row => (
                <div key={row.ruleId} className="flex items-center justify-between">
                  <span className="text-sm text-[#4A4A5A] truncate flex-1 mr-4">{row.ruleName}</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="flex gap-1 w-32">
                      <div
                        className="bg-green-500 h-4 rounded-l"
                        style={{ width: `${(row.accepts / Math.max(row.impressions, 1)) * 100}%` }}
                        title={`Accepts: ${row.accepts}`}
                      ></div>
                      <div
                        className="bg-red-500 h-4"
                        style={{ width: `${(row.declines / Math.max(row.impressions, 1)) * 100}%` }}
                        title={`Declines: ${row.declines}`}
                      ></div>
                      <div
                        className="bg-gray-300 h-4 rounded-r"
                        style={{ width: `${((row.impressions - row.accepts - row.declines) / Math.max(row.impressions, 1)) * 100}%` }}
                        title={`Ignored: ${row.impressions - row.accepts - row.declines}`}
                      ></div>
                    </div>
                    <span className="text-xs text-[#71717A] w-16 text-right">
                      {row.acceptanceRate.toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-[#71717A] py-4">No data available</p>
          )}
        </div>

        {/* Revenue by Rule */}
        <div className="card card-body">
          <h3 className="text-lg font-bold text-[#1A1A2E] mb-4">Revenue by Rule</h3>
          {analyticsData.length > 0 ? (
            <div className="space-y-3">
              {analyticsData.slice(0, 5).map(row => (
                <div key={row.ruleId} className="flex items-center justify-between">
                  <span className="text-sm text-[#4A4A5A] truncate flex-1 mr-4">{row.ruleName}</span>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="w-32 bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-[#1E5AA8] h-3 rounded-full"
                        style={{
                          width: `${(row.totalRevenue / Math.max(analyticsData[0]?.totalRevenue || 1, 1)) * 100}%`
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-[#10B981] w-20 text-right">
                      ${row.totalRevenue.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-[#71717A] py-4">No data available</p>
          )}
        </div>
      </div>
    </div>
  );
}
