'use client';

import { useState } from 'react';
import { useBirthdayRewardConfig } from '@/lib/hooks';
import MainLayout from '@/components/Navigation/MainLayout';
import Modal from '@/components/Dialogs/Modal';
import Spinner from '@/components/Loading/Spinner';
import { Gift, AlertCircle, Plus } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function RewardsPage() {
  const [config, setConfig] = useState({
    rewardType: 'points',
    value: 100,
    isActive: true,
    name: 'Birthday Gift',
  });
  const [modal, setModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      // API call would go here
      setModal(false);
    } catch (error) {
      console.error('Failed to save rewards config');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Birthday Rewards</h1>
            <p className="text-gray-600">Automated birthday reward system for customers</p>
          </div>
          <button
            onClick={() => setModal(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Configure Rewards
          </button>
        </div>

        {/* Current Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Reward Type */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Reward Type</h3>
              <Gift className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-purple-600">
              {config.rewardType === 'points' ? `${config.value} Points` :
               config.rewardType === 'discount' ? `${config.value}% Off` :
               'Free Item'}
            </p>
            <p className="text-xs text-gray-600 mt-2">
              Reward value given on customer's birthday
            </p>
          </div>

          {/* Status */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Status</h3>
            </div>
            <p className={`text-2xl font-bold ${config.isActive ? 'text-green-600' : 'text-red-600'}`}>
              {config.isActive ? 'Active' : 'Inactive'}
            </p>
            <button
              onClick={() => setConfig({ ...config, isActive: !config.isActive })}
              className={`mt-4 btn ${config.isActive ? 'btn-danger' : 'btn-success'}`}
            >
              {config.isActive ? 'Disable' : 'Enable'}
            </button>
          </div>
        </div>

        {/* How It Works */}
        <div className="card mb-6">
          <div className="card-header">
            <h2 className="card-title">How It Works</h2>
          </div>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold">1</div>
              <div>
                <p className="font-medium text-gray-900">System Scans Birthdays</p>
                <p className="text-sm text-gray-600">Background job runs daily to find customers with birthdays today</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold">2</div>
              <div>
                <p className="font-medium text-gray-900">Award Reward</p>
                <p className="text-sm text-gray-600">Automatically credits configured reward (points, discount, or item)</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold">3</div>
              <div>
                <p className="font-medium text-gray-900">Send Notification</p>
                <p className="text-sm text-gray-600">Firebase FCM notification sent with birthday greeting</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activations */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Recent Birthday Rewards Sent</h2>
          </div>
          <div className="text-center py-8 text-gray-500">
            <p>No birthday rewards sent yet this month</p>
          </div>
        </div>

        {/* Edit Modal */}
        {modal && (
          <Modal isOpen={modal} title="Configure Birthday Rewards" size="md" onClose={() => setModal(false)}>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Configure Birthday Rewards
              </h3>

              <div className="space-y-4">
                {/* Reward Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reward Name
                  </label>
                  <input
                    type="text"
                    value={config.name}
                    onChange={(e) => setConfig({ ...config, name: e.target.value })}
                    className="w-full"
                    placeholder="e.g., Birthday Gift"
                  />
                </div>

                {/* Reward Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reward Type
                  </label>
                  <select
                    value={config.rewardType}
                    onChange={(e) => setConfig({ ...config, rewardType: e.target.value })}
                    className="w-full"
                  >
                    <option value="points">Points</option>
                    <option value="discount">Discount %</option>
                    <option value="freeItem">Free Item</option>
                  </select>
                </div>

                {/* Value */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reward Value
                  </label>
                  <input
                    type="number"
                    value={config.value}
                    onChange={(e) => setConfig({ ...config, value: parseInt(e.target.value) })}
                    className="w-full"
                    min="0"
                  />
                </div>

                {/* Active Toggle */}
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <label className="text-sm font-medium text-gray-700">
                    Enable Birthday Rewards
                  </label>
                  <input
                    type="checkbox"
                    checked={config.isActive}
                    onChange={(e) => setConfig({ ...config, isActive: e.target.checked })}
                    className="w-4 h-4"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6 pt-6 border-t">
                <button onClick={() => setModal(false)} className="btn btn-secondary flex-1">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={loading} className="btn btn-primary flex-1">
                  {loading ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </MainLayout>
  );
}
