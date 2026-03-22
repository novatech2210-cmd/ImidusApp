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
            <div className="p-3 bg-gradient-to-br from-[onyx-gold]/20 to-[#FF6B6B]/20 rounded-xl">
              <Gift size={24} className="text-[onyx-gold]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[text-onyx-text-primary]">Birthday Rewards</h1>
              <p className="text-sm text-[text-onyx-text-muted]">Automated birthday reward system for customers</p>
            </div>
          </div>
          <button
            onClick={() => setModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[onyx-gold] to-[#E5B84D] text-[bg-onyx-bg-secondary] font-semibold rounded-xl hover:opacity-90 transition-opacity"
          >
            <Plus size={18} />
            Configure Rewards
          </button>
        </div>

        {/* Current Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Reward Type */}
          <div className="bg-[bg-onyx-bg-secondary] p-6 rounded-xl border border-[border-onyx-border]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-[text-onyx-text-secondary] uppercase tracking-wider">Reward Type</h3>
              <div className="p-2 bg-[onyx-gold]/10 rounded-lg">
                <Sparkles size={18} className="text-[onyx-gold]" />
              </div>
            </div>
            <p className="text-3xl font-bold text-[onyx-gold]">
              {config.rewardType === 'points' ? `${config.value} Points` :
               config.rewardType === 'discount' ? `${config.value}% Off` :
               'Free Item'}
            </p>
            <p className="text-xs text-[text-onyx-text-muted] mt-2">
              Reward value given on customer&apos;s birthday
            </p>
          </div>

          {/* Status */}
          <div className="bg-[bg-onyx-bg-secondary] p-6 rounded-xl border border-[border-onyx-border]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-[text-onyx-text-secondary] uppercase tracking-wider">Status</h3>
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
        <div className="bg-[bg-onyx-bg-secondary] rounded-xl border border-[border-onyx-border] overflow-hidden">
          <div className="px-6 py-4 border-b border-[border-onyx-border]">
            <h2 className="text-lg font-semibold text-[text-onyx-text-primary]">How It Works</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[onyx-blue]/20 text-[onyx-blue] flex items-center justify-center font-bold">1</div>
              <div>
                <p className="font-medium text-[text-onyx-text-primary]">System Scans Birthdays</p>
                <p className="text-sm text-[text-onyx-text-muted]">Background job runs daily to find customers with birthdays today from tblCustomer</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[onyx-gold]/20 text-[onyx-gold] flex items-center justify-center font-bold">2</div>
              <div>
                <p className="font-medium text-[text-onyx-text-primary]">Award Reward</p>
                <p className="text-sm text-[text-onyx-text-muted]">Automatically credits configured reward (points, discount, or item) to tblPointsDetail</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#4ADE80]/20 text-[#4ADE80] flex items-center justify-center font-bold">3</div>
              <div>
                <p className="font-medium text-[text-onyx-text-primary]">Send Notification</p>
                <p className="text-sm text-[text-onyx-text-muted]">Firebase FCM notification sent with birthday greeting</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activations */}
        <div className="bg-[bg-onyx-bg-secondary] rounded-xl border border-[border-onyx-border] overflow-hidden">
          <div className="px-6 py-4 border-b border-[border-onyx-border]">
            <h2 className="text-lg font-semibold text-[text-onyx-text-primary]">Recent Birthday Rewards Sent</h2>
          </div>
          <div className="flex flex-col items-center justify-center py-12 text-[text-onyx-text-muted]">
            <Gift size={40} className="mb-4 opacity-50" />
            <p>No birthday rewards sent yet this month</p>
          </div>
        </div>

        {/* Edit Modal */}
        {modal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-[bg-onyx-bg-secondary] rounded-2xl border border-[border-onyx-border] w-full max-w-md mx-4 shadow-2xl">
              <div className="flex items-center justify-between p-6 border-b border-[border-onyx-border]">
                <h3 className="text-lg font-semibold text-[text-onyx-text-primary]">
                  Configure Birthday Rewards
                </h3>
                <button
                  onClick={() => setModal(false)}
                  className="p-2 text-[text-onyx-text-muted] hover:text-[text-onyx-text-primary] hover:bg-[bg-onyx-bg-tertiary] rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Reward Name */}
                <div>
                  <label className="block text-xs font-medium text-[text-onyx-text-muted] uppercase tracking-wider mb-2">
                    Reward Name
                  </label>
                  <input
                    type="text"
                    value={config.name}
                    onChange={(e) => setConfig({ ...config, name: e.target.value })}
                    className="w-full px-4 py-3 bg-[bg-onyx-bg-tertiary] border border-[border-onyx-border] rounded-xl text-[text-onyx-text-primary] focus:outline-none focus:border-[onyx-blue] transition-colors"
                    placeholder="e.g., Birthday Gift"
                  />
                </div>

                {/* Reward Type */}
                <div>
                  <label className="block text-xs font-medium text-[text-onyx-text-muted] uppercase tracking-wider mb-2">
                    Reward Type
                  </label>
                  <select
                    value={config.rewardType}
                    onChange={(e) => setConfig({ ...config, rewardType: e.target.value })}
                    className="w-full px-4 py-3 bg-[bg-onyx-bg-tertiary] border border-[border-onyx-border] rounded-xl text-[text-onyx-text-primary] focus:outline-none focus:border-[onyx-blue] transition-colors"
                  >
                    <option value="points">Points</option>
                    <option value="discount">Discount %</option>
                    <option value="freeItem">Free Item</option>
                  </select>
                </div>

                {/* Value */}
                <div>
                  <label className="block text-xs font-medium text-[text-onyx-text-muted] uppercase tracking-wider mb-2">
                    Reward Value
                  </label>
                  <input
                    type="number"
                    value={config.value}
                    onChange={(e) => setConfig({ ...config, value: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 bg-[bg-onyx-bg-tertiary] border border-[border-onyx-border] rounded-xl text-[text-onyx-text-primary] focus:outline-none focus:border-[onyx-blue] transition-colors"
                    min="0"
                  />
                </div>

                {/* Active Toggle */}
                <div className="flex items-center justify-between p-4 bg-[bg-onyx-bg-tertiary] border border-[border-onyx-border] rounded-xl">
                  <label className="text-sm font-medium text-[text-onyx-text-primary]">
                    Enable Birthday Rewards
                  </label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.isActive}
                      onChange={(e) => setConfig({ ...config, isActive: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-[border-onyx-border] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[text-onyx-text-muted] after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4ADE80] peer-checked:after:bg-white"></div>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 p-6 border-t border-[border-onyx-border]">
                <button
                  onClick={() => setModal(false)}
                  className="flex-1 px-4 py-2.5 border border-[border-onyx-border] text-[text-onyx-text-secondary] rounded-xl hover:bg-[bg-onyx-bg-tertiary] hover:text-[text-onyx-text-primary] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[onyx-blue] to-[#3D82E0] text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
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
