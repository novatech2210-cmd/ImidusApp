'use client';

import React, { useState, useMemo } from 'react';
import MainLayout from '@/components/Navigation/MainLayout';
import CampaignList from '@/components/Campaigns/CampaignList';
import CampaignBuilder from '@/components/Campaigns/CampaignBuilder';
import { useCampaignList, useSendCampaign } from '@/lib/hooks';
import Spinner from '@/components/Loading/Spinner';
import { Plus, Filter, RotateCcw } from 'lucide-react';

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

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Campaigns</h1>
            <p className="text-gray-600">Create and manage marketing campaigns</p>
          </div>
          <button
            onClick={() => setShowBuilder(true)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
          >
            <Plus size={20} />
            New Campaign
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Filter size={16} />
            Filters
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RotateCcw size={16} />
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Campaign List */}
        {isLoading && !campaignsData.length ? (
          <div className="flex items-center justify-center h-64">
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
          <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedCampaign.name}</h3>
                <p className="text-sm text-gray-600">
                  Created {new Date(selectedCampaign.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedCampaign(null)}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase">Type</p>
                <p className="text-sm font-medium text-gray-900">{selectedCampaign.type}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Status</p>
                <p className="text-sm font-medium text-gray-900 capitalize">{selectedCampaign.status}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Target Audience</p>
                <p className="text-sm font-medium text-gray-900">{selectedCampaign.targetAudience.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Sent</p>
                <p className="text-sm font-medium text-gray-900">{selectedCampaign.sent.toLocaleString()}</p>
              </div>
            </div>

            {selectedCampaign.status === 'draft' && (
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleSendCampaign}
                  disabled={isSending}
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 font-medium"
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
