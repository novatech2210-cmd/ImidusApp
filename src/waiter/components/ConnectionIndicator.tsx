/**
 * IMIDUS Technologies – Real-Time Connection Indicator
 * Shows POS connection status with animated pulse.
 * Reinforces trust in legacy SQL sync.
 */

import React from 'react';

interface ConnectionIndicatorProps {
  status: 'connected' | 'reconnecting' | 'disconnected';
}

const statusConfig = {
  connected: {
    label: 'Live',
    bg: 'rgba(46, 125, 50, 0.12)',
    color: '#2E7D32',
    dotColor: '#2E7D32',
    animation: 'pulse-connected',
  },
  reconnecting: {
    label: 'Reconnecting',
    bg: 'rgba(230, 81, 0, 0.12)',
    color: '#E65100',
    dotColor: '#E65100',
    animation: 'pulse-reconnecting',
  },
  disconnected: {
    label: 'Offline',
    bg: 'rgba(198, 40, 40, 0.12)',
    color: '#C62828',
    dotColor: '#C62828',
    animation: 'none',
  },
};

export default function ConnectionIndicator({ status }: ConnectionIndicatorProps) {
  const config = statusConfig[status];
  
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 10px',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: '600',
        backgroundColor: config.bg,
        color: config.color,
      }}
    >
      <span
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: config.dotColor,
          animation: config.animation === 'none' ? 'none' : `${config.animation} 2s ease-in-out infinite`,
        }}
      />
      <span>{config.label}</span>
    </div>
  );
}
