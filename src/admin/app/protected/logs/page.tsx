'use client';

import { useState } from 'react';
import { useActivityLogs } from '@/lib/hooks';
import MainLayout from '@/components/Navigation/MainLayout';
import Spinner from '@/components/Loading/Spinner';
import { formatDateTime } from '@/lib/utils';
import { AlertCircle, CheckCircle, Trash2, RotateCcw } from 'lucide-react';

export default function LogsPage() {
  const { data: logs, isLoading } = useActivityLogs();
  const [filterAction, setFilterAction] = useState('');

  const filteredLogs = logs?.filter((log: any) =>
    filterAction ? log.action === filterAction : true
  ) || [];

  const actions = ['RefundProcessed', 'CampaignSent', 'MenuOverride', 'CustomerEdited', 'BirthdayReward'];

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      RefundProcessed: 'bg-orange-100 text-orange-800',
      CampaignSent: 'bg-blue-100 text-blue-800',
      MenuOverride: 'bg-purple-100 text-purple-800',
      CustomerEdited: 'bg-green-100 text-green-800',
      BirthdayReward: 'bg-pink-100 text-pink-800',
    };
    return colors[action] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) return <Spinner fullScreen />;

  return (
    <MainLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Activity Logs</h1>
          <p className="text-gray-600">Track all admin actions and system events</p>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Action
              </label>
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="w-full"
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
              <button className="btn btn-secondary flex items-center gap-2">
                <RotateCcw className="w-4 h-4" />
                Refresh
              </button>
              <button className="btn btn-danger flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                Clear Old
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="card">
            <p className="text-sm text-gray-600 mb-1">Total Logs</p>
            <p className="text-3xl font-bold text-gray-900">{logs?.length || 0}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600 mb-1">Today</p>
            <p className="text-3xl font-bold text-blue-600">
              {logs?.filter((log: any) => {
                const logDate = new Date(log.timestamp);
                const today = new Date();
                return logDate.toDateString() === today.toDateString();
              }).length || 0}
            </p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600 mb-1">Last 7 Days</p>
            <p className="text-3xl font-bold text-green-600">
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
        <div className="card">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Admin</th>
                  <th>Action</th>
                  <th>Description</th>
                  <th>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log: any) => (
                    <tr key={log.id}>
                      <td className="text-sm">{formatDateTime(log.timestamp)}</td>
                      <td>
                        <span className="font-medium">{log.adminUser}</span>
                      </td>
                      <td>
                        <span className={`badge ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="text-sm text-gray-600">{log.description}</td>
                      <td className="text-xs text-gray-500 font-mono">{log.ipAddress}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-500">
                      No logs found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Retention Notice */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            Logs are retained for 90 days. For long-term audit requirements, please export logs regularly.
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
