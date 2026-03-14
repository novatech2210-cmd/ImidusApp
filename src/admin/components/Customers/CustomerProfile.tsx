'use client';

import React from 'react';
import Modal from '@/components/Dialogs/Modal';
import Spinner from '@/components/Loading/Spinner';
import { Mail, Phone, MapPin, ShoppingCart, Gift, Calendar, TrendingUp, Clock, Award, ArrowUpRight, ArrowDownLeft, Settings } from 'lucide-react';
import { useCustomerLoyalty } from '@/lib/hooks';

interface CustomerProfile {
  id?: number;
  customerId?: number;
  customerID?: number;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  segment: string;
  lifetimeValue?: number;
  totalSpent?: number;
  visitCount?: number;
  orderCount?: number;
  earnedPoints?: number;
  redeemablePoints?: number;
  lastOrderDate?: string;
  lastOrder?: string;
  createdAt?: string;
  joinDate?: string;
  city?: string;
  address?: string;
  rScore?: number;
  fScore?: number;
  mScore?: number;
}

interface LoyaltyTransaction {
  id: number;
  date: string;
  type: 'earned' | 'redeemed';
  points: number;
  orderId?: number;
  description: string;
}

interface CustomerProfileProps {
  isOpen: boolean;
  onClose: () => void;
  profile?: CustomerProfile;
  loading?: boolean;
}

const SEGMENT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'high-spend': { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  'frequent': { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
  'recent': { bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-200' },
  'at-risk': { bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-200' },
  'new': { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200' },
  'vip': { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200' },
  'regular': { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
  'at_risk': { bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-200' },
};

// Get relative time string
function getRelativeTime(dateString?: string): string {
  if (!dateString) return 'Never';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

export default function CustomerProfile({
  isOpen,
  onClose,
  profile,
  loading = false,
}: CustomerProfileProps) {
  const customerId = profile?.id || profile?.customerId || profile?.customerID || 0;
  const { data: loyaltyData = [], isLoading: isLoadingLoyalty } = useCustomerLoyalty(customerId, 20);

  if (!isOpen) return null;

  const getSegmentStyle = (segment: string) => {
    const style = SEGMENT_COLORS[segment.toLowerCase()] || SEGMENT_COLORS['new'];
    return `${style.bg} ${style.text} border ${style.border}`;
  };

  const getName = (): string => {
    if (profile?.name) return profile.name;
    const first = profile?.firstName || '';
    const last = profile?.lastName || '';
    return `${first} ${last}`.trim() || 'Unknown Customer';
  };

  const getLifetimeValue = (): number => {
    return profile?.lifetimeValue || profile?.totalSpent || 0;
  };

  const getOrderCount = (): number => {
    return profile?.visitCount || profile?.orderCount || 0;
  };

  const getLastOrderDate = (): string | undefined => {
    return profile?.lastOrderDate || profile?.lastOrder;
  };

  const getJoinDate = (): string | undefined => {
    return profile?.createdAt || profile?.joinDate;
  };

  const loyaltyTransactions = Array.isArray(loyaltyData) ? loyaltyData as LoyaltyTransaction[] : [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Customer Profile"
      size="lg"
    >
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="md" />
        </div>
      ) : !profile ? (
        <div className="flex items-center justify-center py-12 text-gray-500">
          No customer data available
        </div>
      ) : (
        <div className="space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Header Section */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">{getName()}</h3>
              <span className={`inline-block px-3 py-1 text-xs font-medium rounded mt-2 ${getSegmentStyle(profile.segment)}`}>
                {profile.segment.replace('-', ' ').replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>

          {/* Contact Info */}
          <div className="space-y-2">
            {profile.email && (
              <div className="flex items-center gap-2 text-gray-600">
                <Mail size={16} />
                <a href={`mailto:${profile.email}`} className="text-sm hover:text-orange-500">
                  {profile.email}
                </a>
              </div>
            )}
            {profile.phone && (
              <div className="flex items-center gap-2 text-gray-600">
                <Phone size={16} />
                <a href={`tel:${profile.phone}`} className="text-sm hover:text-orange-500">
                  {profile.phone}
                </a>
              </div>
            )}
            {profile.address && (
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin size={16} />
                <span className="text-sm">{profile.address}</span>
              </div>
            )}
          </div>

          {/* RFM Metrics Section */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
              <TrendingUp size={16} />
              Customer Insights
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Lifetime Value */}
              <div>
                <p className="text-xs text-gray-500 uppercase">Lifetime Value</p>
                <p className="text-xl font-bold text-gray-900">
                  ${getLifetimeValue().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              {/* Visit Count */}
              <div>
                <p className="text-xs text-gray-500 uppercase">Total Orders</p>
                <p className="text-xl font-bold text-gray-900">{getOrderCount()}</p>
              </div>
              {/* Last Order */}
              <div>
                <p className="text-xs text-gray-500 uppercase">Last Order</p>
                <p className="text-xl font-bold text-gray-900">{getRelativeTime(getLastOrderDate())}</p>
              </div>
              {/* Member Since */}
              <div>
                <p className="text-xs text-gray-500 uppercase">Member Since</p>
                <p className="text-xl font-bold text-gray-900">
                  {getJoinDate() ? new Date(getJoinDate()!).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Unknown'}
                </p>
              </div>
            </div>
          </div>

          {/* Loyalty Points Section */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4 border border-amber-200">
            <h4 className="text-sm font-semibold text-amber-800 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Award size={16} />
              Loyalty Points
            </h4>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-4xl font-bold text-amber-700">
                  {(profile.earnedPoints || 0).toLocaleString()}
                </p>
                <p className="text-sm text-amber-600">Points Balance</p>
              </div>
              <div className="text-right space-y-1">
                <p className="text-xs text-amber-700">
                  <span className="font-medium">Earn Rate:</span> 1 pt per $10 spent
                </p>
                <p className="text-xs text-amber-700">
                  <span className="font-medium">Redeem Rate:</span> $0.40 per point
                </p>
                <p className="text-sm font-medium text-amber-800 mt-2">
                  Value: ${((profile.earnedPoints || 0) * 0.40).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <div className="flex items-center gap-2 mb-1">
                <ShoppingCart size={16} className="text-blue-600" />
                <p className="text-xs font-medium text-blue-600 uppercase">Total Orders</p>
              </div>
              <p className="text-2xl font-bold text-blue-900">{getOrderCount()}</p>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
              <div className="flex items-center gap-2 mb-1">
                <DollarIcon width={16} height={16} className="text-orange-600" />
                <p className="text-xs font-medium text-orange-600 uppercase">Total Spent</p>
              </div>
              <p className="text-2xl font-bold text-orange-900">
                ${getLifetimeValue().toLocaleString('en-US', { maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Loyalty History Table */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Clock size={16} />
                Loyalty History
              </h4>
              <span className="text-xs text-gray-500">Last 20 transactions</span>
            </div>

            {isLoadingLoyalty ? (
              <div className="flex items-center justify-center py-8">
                <Spinner size="sm" />
              </div>
            ) : loyaltyTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                <Gift className="w-8 h-8 text-gray-300 mb-2" />
                <p className="text-sm">No loyalty transactions yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
                {loyaltyTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      {/* Transaction Type Icon */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        transaction.type === 'earned'
                          ? 'bg-green-100 text-green-600'
                          : 'bg-red-100 text-red-600'
                      }`}>
                        {transaction.type === 'earned' ? (
                          <ArrowUpRight size={16} />
                        ) : (
                          <ArrowDownLeft size={16} />
                        )}
                      </div>

                      {/* Transaction Details */}
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {transaction.description}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(transaction.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Points */}
                    <div className="text-right">
                      <p className={`text-sm font-bold ${
                        transaction.type === 'earned' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'earned' ? '+' : '-'}{transaction.points.toLocaleString()} pts
                      </p>
                      {transaction.orderId && (
                        <p className="text-xs text-gray-400">
                          Order #{transaction.orderId}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Adjust Points Button (Placeholder) */}
          <div className="flex justify-end">
            <button
              className="px-4 py-2 text-sm font-medium text-orange-600 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors flex items-center gap-2"
              onClick={() => alert('Adjust Points feature coming soon!')}
            >
              <Gift size={16} />
              Adjust Points
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function DollarIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <line x1="12" y1="1" x2="12" y2="23"></line>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
    </svg>
  );
}
