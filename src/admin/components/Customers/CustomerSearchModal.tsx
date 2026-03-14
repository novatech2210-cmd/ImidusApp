'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, X, User, Phone, Mail, Loader2 } from 'lucide-react';
import { customerAPI } from '@/lib/api-client';

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
}

interface CustomerSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (customer: Customer) => void;
}

const SEGMENT_COLORS: Record<string, string> = {
  'high-spend': 'bg-amber-100 text-amber-800 border-amber-200',
  'frequent': 'bg-blue-100 text-blue-800 border-blue-200',
  'recent': 'bg-green-100 text-green-800 border-green-200',
  'at-risk': 'bg-orange-100 text-orange-800 border-orange-200',
  'new': 'bg-purple-100 text-purple-800 border-purple-200',
};

const RECENT_SEARCHES_KEY = 'admin_recent_customer_searches';
const MAX_RECENT_SEARCHES = 5;

export default function CustomerSearchModal({
  isOpen,
  onClose,
  onSelect,
}: CustomerSearchModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (saved) {
        try {
          setRecentSearches(JSON.parse(saved));
        } catch {
          setRecentSearches([]);
        }
      }
    }
  }, []);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    if (!isOpen) {
      setSearchTerm('');
      setResults([]);
      setSelectedIndex(-1);
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await customerAPI.getList({ limit: 20 });
        // Filter results by search term on client side since API gets all
        const searchResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://10.0.0.26:5004'}/api/admin/customers?searchTerm=${encodeURIComponent(searchTerm)}&limit=20`,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('adminToken') || ''}`,
            },
          }
        );
        const data = await searchResponse.json();
        if (data.success && Array.isArray(data.data)) {
          setResults(data.data);
        } else {
          setResults([]);
        }
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Save to recent searches
  const saveRecentSearch = useCallback((term: string) => {
    if (!term.trim()) return;
    const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, MAX_RECENT_SEARCHES);
    setRecentSearches(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    }
  }, [recentSearches]);

  // Handle customer selection
  const handleSelect = useCallback((customer: Customer) => {
    saveRecentSearch(searchTerm);
    onSelect({
      ...customer,
      id: customer.id || customer.customerId || customer.customerID,
    });
  }, [searchTerm, saveRecentSearch, onSelect]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter' && selectedIndex >= 0 && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  }, [results, selectedIndex, handleSelect, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && resultsRef.current) {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  const getCustomerId = (customer: Customer): number => {
    return customer.id || customer.customerId || customer.customerID || 0;
  };

  const getLifetimeValue = (customer: Customer): number => {
    return customer.lifetimeValue || customer.totalSpent || 0;
  };

  const getSegmentBadge = (segment: string) => {
    const colorClass = SEGMENT_COLORS[segment.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200';
    return (
      <span className={`px-2 py-0.5 text-xs font-medium rounded border ${colorClass}`}>
        {segment.replace('-', ' ').toUpperCase()}
      </span>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] sm:pt-[20vh]">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* Search Header */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-200">
          <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search by name, phone, or email..."
            className="flex-1 text-base outline-none placeholder:text-gray-400"
            autoComplete="off"
          />
          {isLoading ? (
            <Loader2 className="w-5 h-5 text-gray-400 animate-spin flex-shrink-0" />
          ) : searchTerm ? (
            <button
              onClick={() => setSearchTerm('')}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          ) : null}
          <button
            onClick={onClose}
            className="ml-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>

        {/* Results / Recent Searches */}
        <div className="max-h-96 overflow-y-auto" ref={resultsRef}>
          {/* Loading state */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
              <span className="ml-2 text-gray-500">Searching...</span>
            </div>
          )}

          {/* Results */}
          {!isLoading && results.length > 0 && (
            <div>
              {results.map((customer, index) => (
                <button
                  key={getCustomerId(customer)}
                  onClick={() => handleSelect(customer)}
                  className={`w-full flex items-start gap-4 p-4 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 ${
                    selectedIndex === index ? 'bg-orange-50' : ''
                  }`}
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-gray-400" />
                  </div>

                  {/* Customer Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900 truncate">
                        {customer.name || `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Unknown'}
                      </span>
                      {getSegmentBadge(customer.segment)}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                      {customer.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5" />
                          {customer.phone}
                        </span>
                      )}
                      {customer.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5" />
                          {customer.email}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Lifetime Value */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-medium text-gray-900">
                      ${getLifetimeValue(customer).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-500">
                      {customer.visitCount || customer.orderCount || 0} orders
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* No results */}
          {!isLoading && searchTerm && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <User className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-sm">No customers found</p>
              <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
            </div>
          )}

          {/* Recent searches (when no search term) */}
          {!searchTerm && !isLoading && recentSearches.length > 0 && (
            <div className="p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                Recent Searches
              </p>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((term, index) => (
                  <button
                    key={index}
                    onClick={() => setSearchTerm(term)}
                    className="px-3 py-1.5 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Initial state (no search, no recent) */}
          {!searchTerm && !isLoading && recentSearches.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Search className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-sm">Search for a customer</p>
              <p className="text-xs text-gray-400 mt-1">Enter phone, email, or name</p>
            </div>
          )}
        </div>

        {/* Footer with keyboard hints */}
        <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs">ESC</kbd>
              close
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs">ENTER</kbd>
              select
            </span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs">^</kbd>
            <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs">v</kbd>
            navigate
          </div>
        </div>
      </div>
    </div>
  );
}
