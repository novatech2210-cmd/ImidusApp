'use client';

/**
 * Segment Tester Component
 *
 * Admin tool to test banner targeting for specific customers.
 * Useful for verifying targeting rules before deploying banners.
 *
 * Features:
 * - Input customer ID or email
 * - Evaluate customer segments
 * - Display RFM metrics
 * - Show which banners customer would see
 * - Preview banner appearance
 *
 * SSOT Compliance:
 * - All data READ from INI_Restaurant
 * - NO writes to POS database
 */

import React, { useState, useCallback } from 'react';
import {
  formatSegmentName,
  getSegmentColor,
  SEGMENT_THRESHOLDS,
  type CustomerSegment,
  type TargetedBanner,
} from '@/lib/segments';

// ============================================================================
// Types
// ============================================================================

interface CustomerRFMDetails {
  customerId: number;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  lifetimeValue: number;
  visitCount: number;
  lastOrderDate: string | null;
  birthdate: string | null;
  daysSinceLastOrder: number | null;
  daysUntilBirthday: number | null;
  segments: string[];
}

interface TestResult {
  customer: CustomerRFMDetails;
  segments: CustomerSegment;
  banners: TargetedBanner[];
}

// ============================================================================
// API Helpers
// ============================================================================

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5004/api';

async function evaluateCustomerSegments(customerIdOrEmail: string): Promise<CustomerRFMDetails> {
  // Determine if input is numeric (ID) or email
  const isNumeric = /^\d+$/.test(customerIdOrEmail);
  const endpoint = isNumeric
    ? `/Admin/customers/${customerIdOrEmail}/rfm-details`
    : `/Admin/customers/by-email/${encodeURIComponent(customerIdOrEmail)}/rfm-details`;

  const response = await fetch(`${API_BASE}${endpoint}`);
  if (!response.ok) {
    throw new Error('Customer not found');
  }
  return response.json();
}

async function getTargetedBanners(customerId: string): Promise<TargetedBanner[]> {
  const response = await fetch(`/api/banners/active?customerId=${customerId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch targeted banners');
  }
  const data = await response.json();
  return data.banners || [];
}

// ============================================================================
// Segment Badge Component
// ============================================================================

interface SegmentBadgeProps {
  segment: string;
}

function SegmentBadge({ segment }: SegmentBadgeProps) {
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
      style={{ backgroundColor: getSegmentColor(segment) }}
    >
      {formatSegmentName(segment)}
    </span>
  );
}

// ============================================================================
// Metric Card Component
// ============================================================================

interface MetricCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  color?: string;
}

function MetricCard({ label, value, subValue, color }: MetricCardProps) {
  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="mt-1 text-2xl font-bold" style={{ color: color || 'inherit' }}>
        {value}
      </div>
      {subValue && <div className="text-xs text-gray-400 mt-1">{subValue}</div>}
    </div>
  );
}

// ============================================================================
// Banner Preview Component
// ============================================================================

interface BannerPreviewProps {
  banner: TargetedBanner;
}

function BannerPreview({ banner }: BannerPreviewProps) {
  return (
    <div
      className="rounded-lg p-6 text-white"
      style={{ background: banner.bgGradient }}
    >
      <div className="max-w-md">
        <h3 className="text-xl font-bold">{banner.title}</h3>
        <p className="text-lg opacity-90 mt-1">{banner.subtitle}</p>
        {banner.description && (
          <p className="text-sm opacity-80 mt-2">{banner.description}</p>
        )}
        <button className="mt-4 px-4 py-2 bg-white/20 backdrop-blur rounded-md text-sm font-medium hover:bg-white/30 transition">
          {banner.ctaText}
        </button>
      </div>
      <div className="mt-4 flex items-center gap-2 text-xs opacity-70">
        <span>Priority: {banner.priority}</span>
        {banner.targeting_rules?.segments && (
          <>
            <span>|</span>
            <span>Targets: {banner.targeting_rules.segments.join(', ')}</span>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Main Tester Component
// ============================================================================

export default function SegmentTester() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TestResult | null>(null);

  // Handle segment evaluation
  const handleEvaluate = useCallback(async () => {
    if (!input.trim()) {
      setError('Please enter a customer ID or email');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Fetch customer RFM details
      const customer = await evaluateCustomerSegments(input.trim());

      // Build segment object
      const segments: CustomerSegment = {
        customerId: String(customer.customerId),
        segments: customer.segments,
        metadata: {
          lifetime_value: customer.lifetimeValue,
          visit_count: customer.visitCount,
          last_order_date: customer.lastOrderDate,
          birthdate: customer.birthdate,
          days_since_last_order: customer.daysSinceLastOrder,
          days_until_birthday: customer.daysUntilBirthday,
        },
        evaluatedAt: new Date().toISOString(),
      };

      // Fetch targeted banners
      const banners = await getTargetedBanners(String(customer.customerId));

      setResult({ customer, segments, banners });
    } catch (err) {
      console.error('Failed to evaluate customer:', err);
      setError(err instanceof Error ? err.message : 'Failed to evaluate customer');

      // Set mock data for development
      const mockCustomer: CustomerRFMDetails = {
        customerId: 12345,
        firstName: 'John',
        lastName: 'Doe',
        phone: '555-123-4567',
        email: 'john.doe@example.com',
        lifetimeValue: 750.50,
        visitCount: 15,
        lastOrderDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        birthdate: new Date(1990, 2, 15).toISOString(),
        daysSinceLastOrder: 5,
        daysUntilBirthday: 3,
        segments: ['high-spend', 'frequent', 'recent', 'birthday'],
      };

      const mockSegments: CustomerSegment = {
        customerId: '12345',
        segments: mockCustomer.segments,
        metadata: {
          lifetime_value: mockCustomer.lifetimeValue,
          visit_count: mockCustomer.visitCount,
          last_order_date: mockCustomer.lastOrderDate,
          birthdate: mockCustomer.birthdate,
          days_since_last_order: mockCustomer.daysSinceLastOrder,
          days_until_birthday: mockCustomer.daysUntilBirthday,
        },
        evaluatedAt: new Date().toISOString(),
      };

      const mockBanners: TargetedBanner[] = [
        {
          id: 'birthday-special',
          title: 'Happy Birthday!',
          subtitle: 'Celebrate With Us',
          description: "It's your special day! Enjoy a complimentary dessert.",
          ctaText: 'Claim Reward',
          ctaLink: '/menu',
          bgGradient: 'linear-gradient(135deg, #E91E63 0%, #AD1457 100%)',
          priority: 100,
          active: true,
          targeting_rules: { segments: ['birthday'] },
        },
        {
          id: 'high-spend-exclusive',
          title: 'VIP Customer Exclusive',
          subtitle: 'Thank You for Your Loyalty',
          ctaText: 'View VIP Menu',
          ctaLink: '/menu',
          bgGradient: 'linear-gradient(135deg, #D4AF37 0%, #B8960C 100%)',
          priority: 95,
          active: true,
          targeting_rules: { segments: ['high-spend'] },
        },
      ];

      setResult({
        customer: mockCustomer,
        segments: mockSegments,
        banners: mockBanners,
      });
      setError('Using mock data (API unavailable)');
    } finally {
      setLoading(false);
    }
  }, [input]);

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEvaluate();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Segment Tester</h2>
        <p className="text-gray-500 mt-1">
          Test banner targeting rules for specific customers
        </p>
      </div>

      {/* Input */}
      <div className="flex gap-4">
        <div className="flex-1">
          <label htmlFor="customer-input" className="sr-only">
            Customer ID or Email
          </label>
          <input
            id="customer-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter customer ID or email..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <button
          onClick={handleEvaluate}
          disabled={loading}
          className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Evaluating...
            </>
          ) : (
            'Evaluate Segments'
          )}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className={`rounded-md p-4 ${error.includes('mock') ? 'bg-yellow-50 border border-yellow-200' : 'bg-red-50 border border-red-200'}`}>
          <p className={`text-sm ${error.includes('mock') ? 'text-yellow-600' : 'text-red-600'}`}>{error}</p>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Customer Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-500">Name</span>
                <p className="font-medium">
                  {result.customer.firstName} {result.customer.lastName}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Customer ID</span>
                <p className="font-medium">{result.customer.customerId}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Phone</span>
                <p className="font-medium">{result.customer.phone}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Email</span>
                <p className="font-medium">{result.customer.email}</p>
              </div>
            </div>
          </div>

          {/* Segments */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Customer Segments</h3>
            {result.segments.segments.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {result.segments.segments.map((segment) => (
                  <SegmentBadge key={segment} segment={segment} />
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No segments matched</p>
            )}
          </div>

          {/* RFM Metrics */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="font-semibold text-gray-900 mb-4">RFM Metrics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard
                label="Lifetime Value"
                value={`$${result.segments.metadata.lifetime_value.toFixed(2)}`}
                subValue={
                  result.segments.metadata.lifetime_value > SEGMENT_THRESHOLDS.HIGH_SPEND_MIN
                    ? 'High Spender'
                    : `$${(SEGMENT_THRESHOLDS.HIGH_SPEND_MIN - result.segments.metadata.lifetime_value).toFixed(2)} to High Spender`
                }
                color={
                  result.segments.metadata.lifetime_value > SEGMENT_THRESHOLDS.HIGH_SPEND_MIN
                    ? getSegmentColor('high-spend')
                    : undefined
                }
              />
              <MetricCard
                label="Visit Count"
                value={result.segments.metadata.visit_count}
                subValue={
                  result.segments.metadata.visit_count > SEGMENT_THRESHOLDS.FREQUENT_MIN
                    ? 'Frequent Customer'
                    : `${SEGMENT_THRESHOLDS.FREQUENT_MIN - result.segments.metadata.visit_count} more to Frequent`
                }
                color={
                  result.segments.metadata.visit_count > SEGMENT_THRESHOLDS.FREQUENT_MIN
                    ? getSegmentColor('frequent')
                    : undefined
                }
              />
              <MetricCard
                label="Days Since Last Order"
                value={result.segments.metadata.days_since_last_order ?? 'N/A'}
                subValue={
                  result.segments.metadata.days_since_last_order !== null
                    ? result.segments.metadata.days_since_last_order < SEGMENT_THRESHOLDS.RECENT_MAX_DAYS
                      ? 'Recent Customer'
                      : 'Not Recent'
                    : 'No orders'
                }
                color={
                  result.segments.metadata.days_since_last_order !== null &&
                  result.segments.metadata.days_since_last_order < SEGMENT_THRESHOLDS.RECENT_MAX_DAYS
                    ? getSegmentColor('recent')
                    : undefined
                }
              />
              <MetricCard
                label="Days Until Birthday"
                value={result.segments.metadata.days_until_birthday ?? 'N/A'}
                subValue={
                  result.segments.metadata.days_until_birthday !== null
                    ? Math.abs(result.segments.metadata.days_until_birthday) <= SEGMENT_THRESHOLDS.BIRTHDAY_RANGE_DAYS
                      ? 'Birthday!'
                      : 'Not Birthday Season'
                    : 'No birthdate'
                }
                color={
                  result.segments.metadata.days_until_birthday !== null &&
                  Math.abs(result.segments.metadata.days_until_birthday) <= SEGMENT_THRESHOLDS.BIRTHDAY_RANGE_DAYS
                    ? getSegmentColor('birthday')
                    : undefined
                }
              />
            </div>
          </div>

          {/* Banners This Customer Would See */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="font-semibold text-gray-900 mb-4">
              Banners This Customer Would See ({result.banners.length})
            </h3>
            {result.banners.length > 0 ? (
              <div className="space-y-4">
                {result.banners.map((banner) => (
                  <BannerPreview key={banner.id} banner={banner} />
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No targeted banners for this customer</p>
            )}
          </div>

          {/* Evaluation Timestamp */}
          <div className="text-center text-sm text-gray-400">
            Evaluated at: {new Date(result.segments.evaluatedAt).toLocaleString()}
          </div>
        </div>
      )}

      {/* Instructions */}
      {!result && (
        <div className="bg-gray-50 rounded-lg border p-6">
          <h3 className="font-semibold text-gray-900 mb-4">How to Use</h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-600">
            <li>Enter a customer ID (numeric) or email address</li>
            <li>Click "Evaluate Segments" to fetch customer data from POS</li>
            <li>View the customer's RFM metrics and matched segments</li>
            <li>See which banners would be displayed to this customer</li>
          </ol>
          <div className="mt-4 p-4 bg-blue-50 rounded">
            <p className="text-sm text-blue-700">
              <strong>Note:</strong> All data is READ from INI_Restaurant. No writes to POS database.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
