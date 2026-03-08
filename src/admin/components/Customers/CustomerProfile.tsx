'use client';

import React from 'react';
import Modal from '@/components/Dialogs/Modal';
import Spinner from '@/components/Loading/Spinner';
import { Mail, Phone, MapPin, ShoppingCart, Gift } from 'lucide-react';

interface CustomerProfile {
  id: number;
  name: string;
  email: string;
  phone: string;
  segment: string;
  totalSpent: number;
  orderCount: number;
  earnedPoints: number;
  redeemablePoints: number;
  lastOrder: string;
  joinDate: string;
  city?: string;
  address?: string;
}

interface CustomerProfileProps {
  isOpen: boolean;
  onClose: () => void;
  profile?: CustomerProfile;
  loading?: boolean;
}

export default function CustomerProfile({
  isOpen,
  onClose,
  profile,
  loading = false,
}: CustomerProfileProps) {
  if (!profile) return null;

  const getSegmentColor = (segment: string) => {
    const colors: Record<string, string> = {
      vip: 'bg-purple-100 text-purple-800',
      regular: 'bg-blue-100 text-blue-800',
      at_risk: 'bg-red-100 text-red-800',
      new: 'bg-green-100 text-green-800',
    };
    return colors[segment] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Customer Profile"
      size="lg"
    >
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Spinner size="md" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{profile.name}</h3>
                <span
                  className={`inline-block px-3 py-1 text-xs font-medium rounded mt-2 ${getSegmentColor(
                    profile.segment
                  )}`}
                >
                  {profile.segment.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Contact */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gray-600">
                <Mail size={16} />
                <a href={`mailto:${profile.email}`} className="text-sm hover:text-orange-500">
                  {profile.email}
                </a>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Phone size={16} />
                <a href={`tel:${profile.phone}`} className="text-sm hover:text-orange-500">
                  {profile.phone}
                </a>
              </div>
              {profile.address && (
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin size={16} />
                  <span className="text-sm">{profile.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <ShoppingCart size={16} className="text-blue-600" />
                <p className="text-xs font-medium text-blue-600 uppercase">Total Orders</p>
              </div>
              <p className="text-2xl font-bold text-blue-900">{profile.orderCount}</p>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <DollarIcon size={16} className="text-orange-600" />
                <p className="text-xs font-medium text-orange-600 uppercase">Total Spent</p>
              </div>
              <p className="text-2xl font-bold text-orange-900">
                ${(profile.totalSpent / 100).toLocaleString('en-US', { maximumFractionDigits: 2 })}
              </p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Gift size={16} className="text-green-600" />
                <p className="text-xs font-medium text-green-600 uppercase">Earned Points</p>
              </div>
              <p className="text-2xl font-bold text-green-900">{profile.earnedPoints.toLocaleString()}</p>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Gift size={16} className="text-purple-600" />
                <p className="text-xs font-medium text-purple-600 uppercase">Redeemable</p>
              </div>
              <p className="text-2xl font-bold text-purple-900">{profile.redeemablePoints.toLocaleString()}</p>
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-3 border-t border-gray-200 pt-4">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Member Since</p>
              <p className="text-sm text-gray-900">
                {new Date(profile.joinDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Last Order</p>
              <p className="text-sm text-gray-900">
                {new Date(profile.lastOrder).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

function DollarIcon(props: any) {
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
