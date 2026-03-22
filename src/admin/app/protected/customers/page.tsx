'use client';

import React, { useState, useMemo, useCallback } from 'react';
import MainLayout from '@/components/Navigation/MainLayout';
import CustomerList from '@/components/Customers/CustomerList';
import CustomerProfile from '@/components/Customers/CustomerProfile';
import RFMSegmentChart, { CustomerSegments } from '@/components/Customers/RFMSegmentChart';
import CustomerSearchModal from '@/components/Customers/CustomerSearchModal';
import { useCustomerList, useCustomerSegments, useCustomerProfile } from '@/lib/hooks';
import Spinner from '@/components/Loading/Spinner';
import { Search, Download, Users, Filter, X, Database } from 'lucide-react';

interface Customer {
  id?: number;
  customerId?: number;
  customerID?: number;
  name: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  segment: string;
  lifetimeValue?: number;
  totalSpent?: number;
  visitCount?: number;
  orderCount?: number;
  lastOrderDate?: string;
  lastOrder?: string;
  earnedPoints?: number;
}

// Segment filter tabs
const SEGMENT_TABS = [
  { key: '', label: 'All' },
  { key: 'high-spend', label: 'High-Spend' },
  { key: 'frequent', label: 'Frequent' },
  { key: 'recent', label: 'Recent' },
  { key: 'at-risk', label: 'At-Risk' },
  { key: 'new', label: 'New' },
];

export default function CustomersPage() {
  const [segmentFilter, setSegmentFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);

  // Fetch segment counts
  const { data: segmentsRaw, isPending: isLoadingSegments } = useCustomerSegments();

  // Parse segments data into CustomerSegments format
  const segments: CustomerSegments = useMemo(() => {
    if (!segmentsRaw) {
      return { highSpend: 0, frequent: 0, recent: 0, atRisk: 0, newCustomers: 0, total: 0 };
    }
    // Handle both object format and array format
    if (typeof segmentsRaw === 'object' && !Array.isArray(segmentsRaw)) {
      return {
        highSpend: segmentsRaw.highSpend || 0,
        frequent: segmentsRaw.frequent || 0,
        recent: segmentsRaw.recent || 0,
        atRisk: segmentsRaw.atRisk || 0,
        newCustomers: segmentsRaw.newCustomers || 0,
        total: segmentsRaw.total || 0,
      };
    }
    return { highSpend: 0, frequent: 0, recent: 0, atRisk: 0, newCustomers: 0, total: 0 };
  }, [segmentsRaw]);

  // Fetch customer list with filters
  const { data: customersRaw = [], isPending: isLoadingCustomers } = useCustomerList({
    segment: segmentFilter || undefined,
    searchTerm: searchTerm || undefined,
  });

  // Get selected customer profile
  const selectedCustomerId = selectedCustomer?.id || selectedCustomer?.customerId || selectedCustomer?.customerID || 0;
  const { data: profile, isPending: isLoadingProfile } = useCustomerProfile(selectedCustomerId);

  // Transform customer data for the list component
  const customersData = useMemo(() => {
    if (!Array.isArray(customersRaw)) return [];
    return customersRaw.map((customer: Customer, idx: number) => ({
      id: customer.customerID || customer.customerId || customer.id || idx,
      name: customer.name || `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Unknown',
      email: customer.email || '',
      phone: customer.phone || '',
      segment: customer.segment || 'new',
      totalSpent: Math.round((customer.lifetimeValue || customer.totalSpent || 0) * 100), // Convert to cents for CustomerList
      orderCount: customer.visitCount || customer.orderCount || 0,
      lastOrder: customer.lastOrderDate || customer.lastOrder || '',
      earnedPoints: customer.earnedPoints || 0,
    }));
  }, [customersRaw]);

  // Handle segment click from chart
  const handleSegmentClick = useCallback((segment: string) => {
    setSegmentFilter(segment);
  }, []);

  // Handle customer row click
  const handleCustomerClick = useCallback((customer: Customer) => {
    setSelectedCustomer(customer);
    setShowProfile(true);
  }, []);

  // Handle search modal selection
  const handleSearchSelect = useCallback((customer: Customer) => {
    setShowSearchModal(false);
    setSelectedCustomer(customer);
    setShowProfile(true);
  }, []);

  // Clear filters
  const clearFilters = useCallback(() => {
    setSegmentFilter('');
    setSearchTerm('');
  }, []);

  // Export placeholder
  const handleExport = useCallback(() => {
    alert('Export feature coming soon!');
  }, []);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#4ADE80]/10 rounded-xl">
              <Users size={24} className="text-[#4ADE80]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#F5F5F7]">Customers</h1>
              <p className="text-sm text-[#6E6E78]">
                {segments.total.toLocaleString()} total customers from POS
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live from POS badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#4ADE80]/10 rounded-full border border-[#4ADE80]/30">
              <Database size={14} className="text-[#4ADE80]" />
              <span className="text-xs font-medium text-[#4ADE80]">tblCustomer</span>
            </div>

            <button
              onClick={() => setShowSearchModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#9A9AA3] bg-[#1A1A1F] border border-[#2A2A30] rounded-xl hover:bg-[#222228] hover:text-[#F5F5F7] transition-colors"
            >
              <Search size={16} />
              Quick Search
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#9A9AA3] bg-[#1A1A1F] border border-[#2A2A30] rounded-xl hover:bg-[#222228] hover:text-[#F5F5F7] transition-colors"
            >
              <Download size={16} />
              Export
            </button>
          </div>
        </div>

        {/* RFM Segment Chart */}
        {isLoadingSegments ? (
          <div className="flex items-center justify-center h-64 bg-[#1A1A1F] rounded-xl border border-[#2A2A30]">
            <Spinner text="Loading segments..." />
          </div>
        ) : (
          <RFMSegmentChart
            segments={segments}
            loading={isLoadingSegments}
            onSegmentClick={handleSegmentClick}
          />
        )}

        {/* Segment Filter Tabs */}
        <div className="bg-[#1A1A1F] rounded-xl border border-[#2A2A30] p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-2 text-sm font-medium text-[#9A9AA3] mr-2">
              <Filter size={16} />
              Filter:
            </span>
            {SEGMENT_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSegmentFilter(tab.key)}
                className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
                  segmentFilter === tab.key
                    ? 'bg-gradient-to-r from-[#5BA0FF] to-[#3D82E0] text-white'
                    : 'bg-[#222228] text-[#9A9AA3] hover:bg-[#2A2A30] hover:text-[#F5F5F7]'
                }`}
              >
                {tab.label}
              </button>
            ))}

            {/* Clear filters button */}
            {(segmentFilter || searchTerm) && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-3 py-2 text-sm text-[#6E6E78] hover:text-[#FF6B6B] transition-colors"
              >
                <X size={14} />
                Clear
              </button>
            )}
          </div>

          {/* Active filter indicator */}
          {segmentFilter && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-sm text-[#6E6E78]">Active filter:</span>
              <span className="px-3 py-1 text-xs font-medium bg-[#5BA0FF]/10 text-[#5BA0FF] rounded-full border border-[#5BA0FF]/30">
                {SEGMENT_TABS.find(t => t.key === segmentFilter)?.label || segmentFilter}
              </span>
            </div>
          )}
        </div>

        {/* Customer List */}
        {isLoadingCustomers && !customersData.length ? (
          <div className="flex items-center justify-center h-64 bg-[#1A1A1F] rounded-xl border border-[#2A2A30]">
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
      <CustomerProfile
        isOpen={showProfile}
        onClose={() => {
          setShowProfile(false);
          setSelectedCustomer(null);
        }}
        profile={profile || selectedCustomer || undefined}
        loading={isLoadingProfile}
      />

      {/* Customer Search Modal */}
      <CustomerSearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        onSelect={handleSearchSelect}
      />
    </MainLayout>
  );
}
