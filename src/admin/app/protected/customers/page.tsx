'use client';

import React, { useState, useMemo } from 'react';
import MainLayout from '@/components/Navigation/MainLayout';
import CustomerList from '@/components/Customers/CustomerList';
import CustomerProfile from '@/components/Customers/CustomerProfile';
import SegmentationChart from '@/components/Customers/SegmentationChart';
import { useCustomerList, useCustomerSegments, useCustomerProfile } from '@/lib/hooks';
import Spinner from '@/components/Loading/Spinner';
import { Filter, RotateCcw } from 'lucide-react';

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  segment: 'vip' | 'regular' | 'at_risk' | 'new';
  totalSpent: number;
  orderCount: number;
  lastOrder: string;
}

export default function CustomersPage() {
  const [segmentFilter, setSegmentFilter] = useState<string>('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showProfile, setShowProfile] = useState(false);

  const { data: segments = [], isPending: isLoadingSegments } = useCustomerSegments();
  const { data: customers = [], isPending: isLoadingCustomers } = useCustomerList(
    segmentFilter || undefined
  );
  const { data: profile, isPending: isLoadingProfile } = useCustomerProfile(
    selectedCustomer?.id ?? 0
  );

  const customersData = useMemo(() => {
    return Array.isArray(customers)
      ? customers.map((customer, idx) => ({
          ...customer,
          id: customer.id || idx,
        }))
      : [];
  }, [customers]);

  const segmentsData = useMemo(() => {
    if (!Array.isArray(segments)) return [];
    return segments.map((segment: any, idx: number) => ({
      name: segment.name || segment,
      value: segment.count || segment.value || 0,
      color: ['#f97316', '#3b82f6', '#10b981', '#f59e0b'][idx % 4],
    }));
  }, [segments]);

  const handleCustomerClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowProfile(true);
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
            <p className="text-gray-600">View and manage customer relationships</p>
          </div>
        </div>

        {/* Segmentation */}
        {isLoadingSegments ? (
          <div className="flex items-center justify-center h-64">
            <Spinner text="Loading segments..." />
          </div>
        ) : (
          <SegmentationChart data={segmentsData} loading={isLoadingSegments} />
        )}

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Filter size={16} />
            Filters
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Segment Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Segment
              </label>
              <select
                value={segmentFilter}
                onChange={(e) => setSegmentFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">All Segments</option>
                <option value="vip">VIP</option>
                <option value="regular">Regular</option>
                <option value="at_risk">At Risk</option>
                <option value="new">New</option>
              </select>
            </div>

            {/* Reset */}
            <div className="flex items-end">
              <button
                onClick={() => setSegmentFilter('')}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RotateCcw size={16} />
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Customer List */}
        {isLoadingCustomers && !customersData.length ? (
          <div className="flex items-center justify-center h-64">
            <Spinner text="Loading customers..." />
          </div>
        ) : (
          <CustomerList
            customers={customersData}
            loading={isLoadingCustomers}
            onCustomerClick={handleCustomerClick}
          />
        )}
      </div>

      {/* Customer Profile Modal */}
      {selectedCustomer && (
        <CustomerProfile
          isOpen={showProfile}
          onClose={() => {
            setShowProfile(false);
            setSelectedCustomer(null);
          }}
          profile={profile || undefined}
          loading={isLoadingProfile}
        />
      )}
    </MainLayout>
  );
}
