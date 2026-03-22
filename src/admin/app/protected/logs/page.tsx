'use client';

import { useState } from 'react';
import { useActivityLogs } from '@/lib/hooks';
import MainLayout from '@/components/Navigation/MainLayout';
import Spinner from '@/components/Loading/Spinner';
import { formatDateTime } from '@/lib/utils';
import { AlertCircle, CheckCircle, Trash2, RotateCcw, FileText, Filter } from 'lucide-react';

export default function LogsPage() {
  const { data: logs, isLoading } = useActivityLogs();
  const [filterAction, setFilterAction] = useState('');

  const filteredLogs = logs?.filter((log: any) =>
    filterAction ? log.action === filterAction : true
  ) || [];

  const actions = ['RefundProcessed', 'CampaignSent', 'MenuOverride', 'CustomerEdited', 'BirthdayReward'];

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      RefundProcessed: 'bg-[onyx-gold]/20 text-[onyx-gold]',
      CampaignSent: 'bg-[onyx-blue]/20 text-[onyx-blue]',
      MenuOverride: 'bg-[#A855F7]/20 text-[#A855F7]',
      CustomerEdited: 'bg-[#4ADE80]/20 text-[#4ADE80]',
      BirthdayReward: 'bg-[#FF6B6B]/20 text-[#FF6B6B]',
    };
    return colors[action] || 'bg-[bg-onyx-bg-tertiary] text-[text-onyx-text-secondary]';
  };

  if (isLoading) return <Spinner fullScreen />;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[#A855F7]/10 rounded-xl">
            <FileText size={24} className="text-[#A855F7]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[text-onyx-text-primary]">Activity Logs</h1>
            <p className="text-sm text-[text-onyx-text-muted]">Track all admin actions and system events</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-[bg-onyx-bg-secondary] p-4 rounded-xl border border-[border-onyx-border]">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-xs font-medium text-[text-onyx-text-muted] uppercase tracking-wider mb-2">
                <div className="flex items-center gap-2">
                  <Filter size={14} />
                  Filter by Action
                </div>
              </label>
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="w-full px-4 py-2.5 bg-[bg-onyx-bg-tertiary] border border-[border-onyx-border] rounded-xl text-[text-onyx-text-primary] focus:outline-none focus:border-[onyx-blue] transition-colors"
              >
                <option value="">All Actions</option>
                {actions.map((action) => (
                  <option key={action} value={action}>
                    {action}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button className="flex items-center gap-2 px-4 py-2.5 border border-[border-onyx-border] text-[text-onyx-text-secondary] rounded-xl hover:bg-[bg-onyx-bg-tertiary] hover:text-[text-onyx-text-primary] transition-colors">
                <RotateCcw size={16} />
                Refresh
              </button>
              <button className="flex items-center gap-2 px-4 py-2.5 bg-[#FF6B6B]/10 text-[#FF6B6B] border border-[#FF6B6B]/30 rounded-xl hover:bg-[#FF6B6B]/20 transition-colors">
                <Trash2 size={16} />
                Clear Old
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[bg-onyx-bg-secondary] p-6 rounded-xl border border-[border-onyx-border]">
            <p className="text-xs text-[text-onyx-text-muted] uppercase tracking-wider mb-2">Total Logs</p>
            <p className="text-3xl font-bold text-[text-onyx-text-primary]">{logs?.length || 0}</p>
          </div>
          <div className="bg-[bg-onyx-bg-secondary] p-6 rounded-xl border border-[border-onyx-border]">
            <p className="text-xs text-[text-onyx-text-muted] uppercase tracking-wider mb-2">Today</p>
            <p className="text-3xl font-bold text-[onyx-blue]">
              {logs?.filter((log: any) => {
                const logDate = new Date(log.timestamp);
                const today = new Date();
                return logDate.toDateString() === today.toDateString();
              }).length || 0}
            </p>
          </div>
          <div className="bg-[bg-onyx-bg-secondary] p-6 rounded-xl border border-[border-onyx-border]">
            <p className="text-xs text-[text-onyx-text-muted] uppercase tracking-wider mb-2">Last 7 Days</p>
            <p className="text-3xl font-bold text-[#4ADE80]">
              {logs?.filter((log: any) => {
                const logDate = new Date(log.timestamp);
                const now = new Date();
                const diff = now.getTime() - logDate.getTime();
                return diff < 7 * 24 * 60 * 60 * 1000;
              }).length || 0}
            </p>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-[bg-onyx-bg-secondary] rounded-xl border border-[border-onyx-border] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[bg-onyx-bg-tertiary] border-b border-[border-onyx-border]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[text-onyx-text-muted] uppercase tracking-wider">Timestamp</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[text-onyx-text-muted] uppercase tracking-wider">Admin</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[text-onyx-text-muted] uppercase tracking-wider">Action</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[text-onyx-text-muted] uppercase tracking-wider">Description</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[text-onyx-text-muted] uppercase tracking-wider">IP Address</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log: any) => (
                    <tr key={log.id} className="border-b border-[border-onyx-border]/50 hover:bg-[bg-onyx-bg-tertiary] transition-colors">
                      <td className="px-6 py-4 text-sm text-[text-onyx-text-secondary]">{formatDateTime(log.timestamp)}</td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-[text-onyx-text-primary]">{log.adminUser}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-[text-onyx-text-secondary]">{log.description}</td>
                      <td className="px-6 py-4 text-xs text-[text-onyx-text-muted] font-mono">{log.ipAddress}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-[text-onyx-text-muted]">
                      <FileText size={40} className="mx-auto mb-4 opacity-50" />
                      <p>No logs found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Retention Notice */}
        <div className="p-4 bg-[onyx-blue]/10 border border-[onyx-blue]/30 rounded-xl">
          <p className="text-sm text-[onyx-blue]">
            Logs are retained for 90 days. For long-term audit requirements, please export logs regularly.
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
