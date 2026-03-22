'use client';

import React from 'react';
import { Filter } from 'lucide-react';

export const RFM_SEGMENTS = [
  { value: 'Champions', label: 'Champions', description: 'Top spenders, most engaged' },
  { value: 'Loyal', label: 'Loyal Customers', description: 'Regular buyers' },
  { value: 'Potential', label: 'Potential', description: 'Shows promise, recent activity' },
  { value: 'At Risk', label: 'At Risk', description: 'Dormant, high lifetime value' },
  { value: 'Lost', label: 'Lost', description: 'No recent activity' },
  { value: 'Regular', label: 'Regular', description: 'All others' },
] as const;

interface CustomerSegmentFilterProps {
  selectedSegment?: string;
  onSegmentChange?: (segment: string | undefined) => void;
  loading?: boolean;
}

export default function CustomerSegmentFilter({
  selectedSegment,
  onSegmentChange,
  loading = false,
}: CustomerSegmentFilterProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
      <div className="flex items-center gap-2">
        <Filter size={18} className="text-onyx-text-muted" />
        <span className="text-sm font-medium text-onyx-text-primary">Segment:</span>
      </div>

      <div className="w-full sm:w-auto flex flex-wrap gap-2">
        {/* All Customers Option */}
        <button
          onClick={() => onSegmentChange?.(undefined)}
          disabled={loading}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            !selectedSegment
              ? 'bg-onyx-gold text-onyx-bg-secondary'
              : 'bg-onyx-bg-tertiary border border-onyx-border text-onyx-text-secondary hover:border-onyx-border-hover'
          } disabled:opacity-50`}
        >
          All Customers
        </button>

        {/* RFM Segment Buttons */}
        {RFM_SEGMENTS.map((segment) => (
          <button
            key={segment.value}
            onClick={() => onSegmentChange?.(segment.value)}
            disabled={loading}
            title={segment.description}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedSegment === segment.value
                ? 'bg-onyx-blue text-white'
                : 'bg-onyx-bg-tertiary border border-onyx-border text-onyx-text-secondary hover:border-onyx-border-hover'
            } disabled:opacity-50`}
          >
            {segment.label}
          </button>
        ))}
      </div>
    </div>
  );
}
