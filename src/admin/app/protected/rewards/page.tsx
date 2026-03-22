'use client';

import { useState } from 'react';
import { useBirthdayRewardConfig } from '@/lib/hooks';
import MainLayout from '@/components/Navigation/MainLayout';
import Modal from '@/components/Dialogs/Modal';
import Spinner from '@/components/Loading/Spinner';
import { Gift, AlertCircle, Plus, Sparkles, Bell, Award, X } from 'lucide-react';
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-[#FFD666]/20 to-[#FF6B6B]/20 rounded-xl">
              <Gift size={24} className="text-[#FFD666]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#F5F5F7]">Birthday Rewards</h1>
              <p className="text-sm text-[#6E6E78]">Automated birthday reward system for customers</p>
            </div>
          </div>
          <button
            onClick={() => setModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#FFD666] to-[#E5B84D] text-[#1A1A1F] font-semibold rounded-xl hover:opacity-90 transition-opacity"
          >
            <Plus size={18} />
            Configure Rewards
          </button>
        </div>

        {/* Current Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Reward Type */}
          <div className="bg-[#1A1A1F] p-6 rounded-xl border border-[#2A2A30]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-[#9A9AA3] uppercase tracking-wider">Reward Type</h3>
              <div className="p-2 bg-[#FFD666]/10 rounded-lg">
                <Sparkles size={18} className="text-[#FFD666]" />
              </div>
            </div>
            <p className="text-3xl font-bold text-[#FFD666]">
              {config.rewardType === 'points' ? `${config.value} Points` :
               config.rewardType === 'discount' ? `${config.value}% Off` :
               'Free Item'}
            </p>
            <p className="text-xs text-[#6E6E78] mt-2">
              Reward value given on customer&apos;s birthday
            </p>
          </div>

          {/* Status */}
          <div className="bg-[#1A1A1F] p-6 rounded-xl border border-[#2A2A30]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-[#9A9AA3] uppercase tracking-wider">Status</h3>
            </div>
            <p className={`text-3xl font-bold ${config.isActive ? 'text-[#4ADE80]' : 'text-[#FF6B6B]'}`}>
              {config.isActive ? 'Active' : 'Inactive'}
            </p>
            <button
              onClick={() => setConfig({ ...config, isActive: !config.isActive })}
              className={`mt-4 px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
                config.isActive
                  ? 'bg-[#FF6B6B]/10 text-[#FF6B6B] border border-[#FF6B6B]/30 hover:bg-[#FF6B6B]/20'
                  : 'bg-[#4ADE80]/10 text-[#4ADE80] border border-[#4ADE80]/30 hover:bg-[#4ADE80]/20'
              }`}
            >
              {config.isActive ? 'Disable' : 'Enable'}
            </button>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-[#1A1A1F] rounded-xl border border-[#2A2A30] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#2A2A30]">
            <h2 className="text-lg font-semibold text-[#F5F5F7]">How It Works</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#5BA0FF]/20 text-[#5BA0FF] flex items-center justify-center font-bold">1</div>
              <div>
                <p className="font-medium text-[#F5F5F7]">System Scans Birthdays</p>
                <p className="text-sm text-[#6E6E78]">Background job runs daily to find customers with birthdays today from tblCustomer</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#FFD666]/20 text-[#FFD666] flex items-center justify-center font-bold">2</div>
              <div>
                <p className="font-medium text-[#F5F5F7]">Award Reward</p>
                <p className="text-sm text-[#6E6E78]">Automatically credits configured reward (points, discount, or item) to tblPointsDetail</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#4ADE80]/20 text-[#4ADE80] flex items-center justify-center font-bold">3</div>
              <div>
                <p className="font-medium text-[#F5F5F7]">Send Notification</p>
                <p className="text-sm text-[#6E6E78]">Firebase FCM notification sent with birthday greeting</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activations */}
        <div className="bg-[#1A1A1F] rounded-xl border border-[#2A2A30] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#2A2A30]">
            <h2 className="text-lg font-semibold text-[#F5F5F7]">Recent Birthday Rewards Sent</h2>
          </div>
          <div className="flex flex-col items-center justify-center py-12 text-[#6E6E78]">
            <Gift size={40} className="mb-4 opacity-50" />
            <p>No birthday rewards sent yet this month</p>
          </div>
        </div>

        {/* Edit Modal */}
        {modal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-[#1A1A1F] rounded-2xl border border-[#2A2A30] w-full max-w-md mx-4 shadow-2xl">
              <div className="flex items-center justify-between p-6 border-b border-[#2A2A30]">
                <h3 className="text-lg font-semibold text-[#F5F5F7]">
                  Configure Birthday Rewards
                </h3>
                <button
                  onClick={() => setModal(false)}
                  className="p-2 text-[#6E6E78] hover:text-[#F5F5F7] hover:bg-[#222228] rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Reward Name */}
                <div>
                  <label className="block text-xs font-medium text-[#6E6E78] uppercase tracking-wider mb-2">
                    Reward Name
                  </label>
                  <input
                    type="text"
                    value={config.name}
                    onChange={(e) => setConfig({ ...config, name: e.target.value })}
                    className="w-full px-4 py-3 bg-[#222228] border border-[#2A2A30] rounded-xl text-[#F5F5F7] focus:outline-none focus:border-[#5BA0FF] transition-colors"
                    placeholder="e.g., Birthday Gift"
                  />
                </div>

                {/* Reward Type */}
                <div>
                  <label className="block text-xs font-medium text-[#6E6E78] uppercase tracking-wider mb-2">
                    Reward Type
                  </label>
                  <select
                    value={config.rewardType}
                    onChange={(e) => setConfig({ ...config, rewardType: e.target.value })}
                    className="w-full px-4 py-3 bg-[#222228] border border-[#2A2A30] rounded-xl text-[#F5F5F7] focus:outline-none focus:border-[#5BA0FF] transition-colors"
                  >
                    <option value="points">Points</option>
                    <option value="discount">Discount %</option>
                    <option value="freeItem">Free Item</option>
                  </select>
                </div>

                {/* Value */}
                <div>
                  <label className="block text-xs font-medium text-[#6E6E78] uppercase tracking-wider mb-2">
                    Reward Value
                  </label>
                  <input
                    type="number"
                    value={config.value}
                    onChange={(e) => setConfig({ ...config, value: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 bg-[#222228] border border-[#2A2A30] rounded-xl text-[#F5F5F7] focus:outline-none focus:border-[#5BA0FF] transition-colors"
                    min="0"
                  />
                </div>

                {/* Active Toggle */}
                <div className="flex items-center justify-between p-4 bg-[#222228] border border-[#2A2A30] rounded-xl">
                  <label className="text-sm font-medium text-[#F5F5F7]">
                    Enable Birthday Rewards
                  </label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.isActive}
                      onChange={(e) => setConfig({ ...config, isActive: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-[#2A2A30] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#6E6E78] after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4ADE80] peer-checked:after:bg-white"></div>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 p-6 border-t border-[#2A2A30]">
                <button
                  onClick={() => setModal(false)}
                  className="flex-1 px-4 py-2.5 border border-[#2A2A30] text-[#9A9AA3] rounded-xl hover:bg-[#222228] hover:text-[#F5F5F7] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#5BA0FF] to-[#3D82E0] text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {loading ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
