'use client';

import React from 'react';
import { Check, Clock, CreditCard, ChefHat, CheckCircle, XCircle, Package } from 'lucide-react';

type OrderStatus = 'pending' | 'paid' | 'preparing' | 'ready' | 'completed' | 'cancelled' | 'refunded';

interface OrderStatusTimelineProps {
  status: OrderStatus;
  createdAt: string;
  paidAt?: string;
  readyAt?: string;
  completedAt?: string;
}

interface TimelineStep {
  key: string;
  label: string;
  icon: React.ReactNode;
  timestamp?: string;
  isComplete: boolean;
  isCurrent: boolean;
  isFailed?: boolean;
}

export default function OrderStatusTimeline({
  status,
  createdAt,
  paidAt,
  readyAt,
  completedAt,
}: OrderStatusTimelineProps) {
  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return null;
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // Determine order progress based on status
  const getStatusIndex = (status: OrderStatus): number => {
    switch (status) {
      case 'pending': return 0;
      case 'paid': return 1;
      case 'preparing': return 2;
      case 'ready': return 3;
      case 'completed': return 4;
      case 'cancelled': return -1;
      case 'refunded': return -1;
      default: return 0;
    }
  };

  const isCancelled = status === 'cancelled';
  const isRefunded = status === 'refunded';
  const statusIndex = getStatusIndex(status);

  // Build timeline steps
  const steps: TimelineStep[] = [
    {
      key: 'created',
      label: 'Order Created',
      icon: <Clock size={16} />,
      timestamp: createdAt,
      isComplete: true,
      isCurrent: statusIndex === 0,
    },
    {
      key: 'paid',
      label: 'Payment Received',
      icon: <CreditCard size={16} />,
      timestamp: paidAt,
      isComplete: statusIndex >= 1,
      isCurrent: statusIndex === 1,
    },
    {
      key: 'preparing',
      label: 'Preparing',
      icon: <ChefHat size={16} />,
      timestamp: undefined, // No specific timestamp for preparing
      isComplete: statusIndex >= 2,
      isCurrent: statusIndex === 2,
    },
    {
      key: 'ready',
      label: 'Ready for Pickup',
      icon: <Package size={16} />,
      timestamp: readyAt,
      isComplete: statusIndex >= 3,
      isCurrent: statusIndex === 3,
    },
    {
      key: 'completed',
      label: 'Completed',
      icon: <CheckCircle size={16} />,
      timestamp: completedAt,
      isComplete: statusIndex >= 4,
      isCurrent: statusIndex === 4,
    },
  ];

  // Add cancelled/refunded as alternative end state
  if (isCancelled || isRefunded) {
    steps.push({
      key: isCancelled ? 'cancelled' : 'refunded',
      label: isCancelled ? 'Cancelled' : 'Refunded',
      icon: <XCircle size={16} />,
      timestamp: undefined,
      isComplete: true,
      isCurrent: true,
      isFailed: true,
    });
  }

  return (
    <div className="relative">
      <div className="space-y-0">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;

          // Determine step styling
          let dotColor = 'bg-gray-200';
          let textColor = 'text-gray-400';
          let lineColor = 'bg-gray-200';
          let iconBg = 'bg-gray-100';

          if (step.isFailed) {
            dotColor = 'bg-red-500';
            textColor = 'text-red-700';
            iconBg = 'bg-red-100';
          } else if (step.isComplete) {
            dotColor = 'bg-green-500';
            textColor = 'text-gray-900';
            lineColor = 'bg-green-500';
            iconBg = 'bg-green-100';
          }

          if (step.isCurrent && !step.isFailed) {
            dotColor = 'bg-orange-500 animate-pulse';
            textColor = 'text-orange-700 font-medium';
            iconBg = 'bg-orange-100';
          }

          // Skip steps after current if cancelled/refunded
          if ((isCancelled || isRefunded) && !step.isComplete && !step.isFailed) {
            return null;
          }

          return (
            <div key={step.key} className="relative flex gap-4">
              {/* Timeline connector line */}
              {!isLast && (
                <div
                  className={`absolute left-4 top-8 w-0.5 h-8 ${
                    step.isComplete && !step.isFailed ? 'bg-green-500' : 'bg-gray-200'
                  } ${step.isComplete ? '' : 'border-dashed border-l border-gray-300 bg-transparent'}`}
                  style={{ transform: 'translateX(-50%)' }}
                />
              )}

              {/* Step icon */}
              <div
                className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full ${iconBg} flex-shrink-0`}
              >
                <div className={textColor}>
                  {step.isComplete && !step.isFailed ? (
                    <Check size={16} className="text-green-600" />
                  ) : step.isFailed ? (
                    <XCircle size={16} className="text-red-600" />
                  ) : (
                    step.icon
                  )}
                </div>
              </div>

              {/* Step content */}
              <div className="flex-1 pb-6">
                <p className={`text-sm ${textColor}`}>
                  {step.label}
                </p>
                {step.timestamp && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatTimestamp(step.timestamp)}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Helper to map TransType to status
export function mapTransTypeToStatus(transType?: number): OrderStatus {
  switch (transType) {
    case 1: return 'completed';
    case 2: return 'pending';
    case 9: return 'ready';
    case 0: return 'refunded';
    case -1: return 'cancelled';
    default: return 'pending';
  }
}
