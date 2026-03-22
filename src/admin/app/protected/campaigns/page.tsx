'use client';

import React, { useState, useMemo } from 'react';
import MainLayout from '@/components/Navigation/MainLayout';
import CampaignList from '@/components/Campaigns/CampaignList';
import CampaignBuilder from '@/components/Campaigns/CampaignBuilder';
import { useCampaignList, useSendCampaign } from '@/lib/hooks';
import Spinner from '@/components/Loading/Spinner';
import { Plus, Filter, RotateCcw, Megaphone, X } from 'lucide-react';

interface Campaign {
  id: number;
  name: string;
  type: 'email' | 'sms' | 'push';
  status: 'draft' | 'scheduled' | 'sent' | 'paused';
  targetAudience: number;
  sent: number;
  opened?: number;
  clicked?: number;
  createdAt: string;
  scheduledAt?: string;
}

export default function CampaignsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showBuilder, setShowBuilder] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  const { data: campaigns = [], isPending: isLoading, refetch } = useCampaignList(
    statusFilter || undefined
  );

  const { mutate: sendCampaign, isPending: isSending } = useSendCampaign(selectedCampaign?.id ?? 0);

  const campaignsData = useMemo(() => {
    return Array.isArray(campaigns)
      ? campaigns.map((campaign, idx) => ({
          ...campaign,
          id: campaign.id || idx,
        }))
      : [];
  }, [campaigns]);

  const handleSendCampaign = () => {
    if (!selectedCampaign) return;

    sendCampaign(undefined, {
      onSuccess: () => {
        setSelectedCampaign(null);
        refetch();
      },
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-[#6E6E78]/20 text-[#9A9AA3]',
      scheduled: 'bg-[#5BA0FF]/20 text-[#5BA0FF]',
      sent: 'bg-[#4ADE80]/20 text-[#4ADE80]',
      paused: 'bg-[#FFD666]/20 text-[#FFD666]',
    };
    return colors[status] || 'bg-[#222228] text-[#9A9AA3]';
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#FFD666]/10 rounded-xl">
              <Megaphone size={24} className="text-[#FFD666]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#F5F5F7]">Campaigns</h1>
              <p className="text-sm text-[#6E6E78]">Create and manage marketing campaigns</p>
            </div>
          </div>
          <button
            onClick={() => setShowBuilder(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#FFD666] to-[#E5B84D] text-[#1A1A1F] font-semibold rounded-xl hover:opacity-90 transition-opacity"
          >
            <Plus size={20} />
            New Campaign
          </button>
        </div>

        {/* Filters */}
        <div className="bg-[#1A1A1F] p-4 rounded-xl border border-[#2A2A30] space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-[#9A9AA3]">
            <Filter size={16} />
            Filters
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-xs font-medium text-[#6E6E78] uppercase tracking-wider mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#222228] border border-[#2A2A30] rounded-xl text-[#F5F5F7] text-sm focus:outline-none focus:border-[#5BA0FF] transition-colors"
              >
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="sent">Sent</option>
                <option value="paused">Paused</option>
              </select>
            </div>

            {/* Reset */}
            <div className="flex items-end">
              <button
                onClick={() => setStatusFilter('')}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-[#2A2A30] text-[#9A9AA3] rounded-xl hover:bg-[#222228] hover:text-[#F5F5F7] transition-colors"
              >
                <RotateCcw size={16} />
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Campaign List */}
        {isLoading && !campaignsData.length ? (
          <div className="flex items-center justify-center h-64 bg-[#1A1A1F] rounded-xl border border-[#2A2A30]">
            <Spinner text="Loading campaigns..." />
          </div>
        ) : (
          <CampaignList
            campaigns={campaignsData}
            loading={isLoading}
            onCampaignClick={(campaign) => setSelectedCampaign(campaign)}
            onSendClick={handleSendCampaign}
          />
        )}

        {/* Selected Campaign Details */}
        {selectedCampaign && (
          <div className="bg-[#1A1A1F] p-6 rounded-xl border border-[#2A2A30] space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-[#F5F5F7]">{selectedCampaign.name}</h3>
                <p className="text-sm text-[#6E6E78]">
                  Created {new Date(selectedCampaign.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedCampaign(null)}
                className="p-2 text-[#6E6E78] hover:text-[#F5F5F7] hover:bg-[#222228] rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-[#222228] rounded-xl">
                <p className="text-xs text-[#6E6E78] uppercase tracking-wider mb-1">Type</p>
                <p className="text-sm font-semibold text-[#F5F5F7] capitalize">{selectedCampaign.type}</p>
              </div>
              <div className="p-4 bg-[#222228] rounded-xl">
                <p className="text-xs text-[#6E6E78] uppercase tracking-wider mb-1">Status</p>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedCampaign.status)}`}>
                  {selectedCampaign.status}
                </span>
              </div>
              <div className="p-4 bg-[#222228] rounded-xl">
                <p className="text-xs text-[#6E6E78] uppercase tracking-wider mb-1">Target Audience</p>
                <p className="text-sm font-semibold text-[#5BA0FF]">{selectedCampaign.targetAudience.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-[#222228] rounded-xl">
                <p className="text-xs text-[#6E6E78] uppercase tracking-wider mb-1">Sent</p>
                <p className="text-sm font-semibold text-[#4ADE80]">{selectedCampaign.sent.toLocaleString()}</p>
              </div>
            </div>

            {selectedCampaign.status === 'draft' && (
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSendCampaign}
                  disabled={isSending}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#5BA0FF] to-[#3D82E0] text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {isSending ? 'Sending...' : 'Send Campaign'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Campaign Builder Modal */}
      <CampaignBuilder
        isOpen={showBuilder}
        onClose={() => setShowBuilder(false)}
        onSuccess={() => refetch()}
      />
    </MainLayout>
  );
}
