/**
 * IMIDUS Technologies – Order Status Badge
 * Modern pill-style badges for order statuses.
 * Mirrors high-end restaurant SaaS systems like Toast, Square.
 */

import React from 'react';

interface StatusBadgeProps {
  status: 'confirmed' | 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  showIcon?: boolean;
}

const statusConfig = {
  confirmed: {
    label: 'Confirmed',
    bg: 'rgba(46, 125, 50, 0.12)',
    color: '#2E7D32',
    icon: '✓',
  },
  pending: {
    label: 'Pending',
    bg: 'rgba(230, 81, 0, 0.12)',
    color: '#E65100',
    icon: '⏳',
  },
  preparing: {
    label: 'Preparing',
    bg: 'rgba(25, 118, 210, 0.12)',
    color: '#1976D2',
    icon: '👨‍🍳',
  },
  ready: {
    label: 'Ready',
    bg: 'rgba(212, 175, 55, 0.15)',
    color: '#B8952E',
    icon: '🔔',
  },
  completed: {
    label: 'Completed',
    bg: 'rgba(66, 133, 244, 0.12)',
    color: '#4285F4',
    icon: '✓✓',
  },
  cancelled: {
    label: 'Cancelled',
    bg: 'rgba(198, 40, 40, 0.12)',
    color: '#C62828',
    icon: '✕',
  },
};

export default function StatusBadge({ status, showIcon = true }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 12px',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        backgroundColor: config.bg,
        color: config.color,
      }}
    >
      {showIcon && <span>{config.icon}</span>}
      <span>{config.label}</span>
    </span>
  );
}
