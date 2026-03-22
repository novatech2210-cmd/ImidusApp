'use client';

import React from 'react';
import { Filter, RotateCcw, Calendar, Search } from 'lucide-react';

export interface OrderFilterState {
  status: string;
  paymentStatus: string;
  startDate: string;
  endDate: string;
  searchTerm: string;
}

export const initialFilters: OrderFilterState = {
  status: '',
  paymentStatus: '',
  startDate: '',
  endDate: '',
  searchTerm: '',
};

interface OrderFiltersProps {
  filters: OrderFilterState;
  onFilterChange: (filters: OrderFilterState) => void;
  onReset: () => void;
}

export default function OrderFilters({
  filters,
  onFilterChange,
  onReset,
}: OrderFiltersProps) {
  const handleChange = (field: keyof OrderFilterState, value: string) => {
    onFilterChange({
      ...filters,
      [field]: value,
    });
  };

  const setQuickDateRange = (days: number | 'today' | 'thisMonth') => {
    const today = new Date();
    let startDate: Date;
    let endDate: Date = today;

    if (days === 'today') {
      startDate = today;
    } else if (days === 'thisMonth') {
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    } else {
      startDate = new Date(today);
      startDate.setDate(today.getDate() - days);
    }

    onFilterChange({
      ...filters,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    });
  };

  const hasActiveFilters =
    filters.status ||
    filters.paymentStatus ||
    filters.startDate ||
    filters.endDate ||
    filters.searchTerm;

  return (
    <div className="bg-[bg-onyx-bg-secondary] p-4 rounded-xl border border-[border-onyx-border] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-[text-onyx-text-secondary]">
          <Filter size={16} />
          Filters
        </div>
        {hasActiveFilters && (
          <span className="text-xs text-[onyx-blue] font-medium px-2 py-0.5 bg-[onyx-blue]/10 rounded-full">
            Filters active
          </span>
        )}
      </div>

      {/* Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Status Dropdown */}
        <div>
          <label className="block text-xs font-medium text-[text-onyx-text-muted] uppercase tracking-wider mb-2">
            Order Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => handleChange('status', e.target.value)}
            className="w-full px-4 py-2.5 bg-[bg-onyx-bg-tertiary] border border-[border-onyx-border] rounded-xl text-[text-onyx-text-primary] text-sm focus:outline-none focus:border-[onyx-blue] transition-colors"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="ready">Ready</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>

        {/* Payment Status Dropdown */}
        <div>
          <label className="block text-xs font-medium text-[text-onyx-text-muted] uppercase tracking-wider mb-2">
            Payment Status
          </label>
          <select
            value={filters.paymentStatus}
            onChange={(e) => handleChange('paymentStatus', e.target.value)}
            className="w-full px-4 py-2.5 bg-[bg-onyx-bg-tertiary] border border-[border-onyx-border] rounded-xl text-[text-onyx-text-primary] text-sm focus:outline-none focus:border-[onyx-blue] transition-colors"
          >
            <option value="">All Payments</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>

        {/* Start Date */}
        <div>
          <label className="block text-xs font-medium text-[text-onyx-text-muted] uppercase tracking-wider mb-2">
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              Start Date
            </span>
          </label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => handleChange('startDate', e.target.value)}
            className="w-full px-4 py-2.5 bg-[bg-onyx-bg-tertiary] border border-[border-onyx-border] rounded-xl text-[text-onyx-text-primary] text-sm focus:outline-none focus:border-[onyx-blue] transition-colors"
          />
        </div>

        {/* End Date */}
        <div>
          <label className="block text-xs font-medium text-[text-onyx-text-muted] uppercase tracking-wider mb-2">
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              End Date
            </span>
          </label>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => handleChange('endDate', e.target.value)}
            className="w-full px-4 py-2.5 bg-[bg-onyx-bg-tertiary] border border-[border-onyx-border] rounded-xl text-[text-onyx-text-primary] text-sm focus:outline-none focus:border-[onyx-blue] transition-colors"
          />
        </div>

        {/* Search Input */}
        <div>
          <label className="block text-xs font-medium text-[text-onyx-text-muted] uppercase tracking-wider mb-2">
            <span className="flex items-center gap-1">
              <Search size={12} />
              Search
            </span>
          </label>
          <input
            type="text"
            placeholder="Order # or customer..."
            value={filters.searchTerm}
            onChange={(e) => handleChange('searchTerm', e.target.value)}
            className="w-full px-4 py-2.5 bg-[bg-onyx-bg-tertiary] border border-[border-onyx-border] rounded-xl text-[text-onyx-text-primary] text-sm placeholder-[text-onyx-text-muted] focus:outline-none focus:border-[onyx-blue] transition-colors"
          />
        </div>

        {/* Reset Button */}
        <div className="flex items-end">
          <button
            onClick={onReset}
            disabled={!hasActiveFilters}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-[border-onyx-border] text-[text-onyx-text-secondary] rounded-xl hover:bg-[bg-onyx-bg-tertiary] hover:text-[text-onyx-text-primary] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <RotateCcw size={16} />
            Reset
          </button>
        </div>
      </div>

      {/* Quick Filter Buttons */}
      <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[border-onyx-border]">
        <span className="text-xs text-[text-onyx-text-muted] mr-2">Quick filters:</span>
        <button
          onClick={() => setQuickDateRange('today')}
          className="px-3 py-1.5 text-xs font-medium text-[text-onyx-text-secondary] bg-[bg-onyx-bg-tertiary] rounded-full hover:bg-[border-onyx-border] hover:text-[text-onyx-text-primary] transition-colors"
        >
          Today
        </button>
        <button
          onClick={() => setQuickDateRange(7)}
          className="px-3 py-1.5 text-xs font-medium text-[text-onyx-text-secondary] bg-[bg-onyx-bg-tertiary] rounded-full hover:bg-[border-onyx-border] hover:text-[text-onyx-text-primary] transition-colors"
        >
          Last 7 Days
        </button>
        <button
          onClick={() => setQuickDateRange('thisMonth')}
          className="px-3 py-1.5 text-xs font-medium text-[text-onyx-text-secondary] bg-[bg-onyx-bg-tertiary] rounded-full hover:bg-[border-onyx-border] hover:text-[text-onyx-text-primary] transition-colors"
        >
          This Month
        </button>
        <button
          onClick={() => handleChange('status', 'pending')}
          className="px-3 py-1.5 text-xs font-medium text-[onyx-gold] bg-[onyx-gold]/10 rounded-full hover:bg-[onyx-gold]/20 transition-colors"
        >
          Pending Only
        </button>
        <button
          onClick={() => handleChange('status', 'ready')}
          className="px-3 py-1.5 text-xs font-medium text-[onyx-blue] bg-[onyx-blue]/10 rounded-full hover:bg-[onyx-blue]/20 transition-colors"
        >
          Ready Only
        </button>
      </div>
    </div>
  );
}
