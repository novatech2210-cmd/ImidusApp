import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function truncate(str: string, length: number): string {
  return str.length > length ? str.slice(0, length) + '...' : str;
}

export function getSegmentColor(segment: string): string {
  const colors: Record<string, string> = {
    VIP: 'bg-purple-100 text-purple-800',
    Loyal: 'bg-blue-100 text-blue-800',
    Regular: 'bg-gray-100 text-gray-800',
    AtRisk: 'bg-red-100 text-red-800',
    New: 'bg-green-100 text-green-800',
  };
  return colors[segment] || 'bg-gray-100 text-gray-800';
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    refunded: 'bg-orange-100 text-orange-800',
    paid: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function getPaymentStatusBadge(status: string): string {
  const badges: Record<string, string> = {
    paid: '✓ Paid',
    pending: '⏱ Pending',
    failed: '✗ Failed',
    refunded: '↺ Refunded',
  };
  return badges[status] || status;
}

export function getDaysSince(date: string | Date): number {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function generateDateRange(days: number): { startDate: string; endDate: string } {
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  };
}
