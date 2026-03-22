'use client';

import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react';

export interface Column<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  pageSize?: number;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  emptyMessage?: string;
  sortableBy?: (keyof T)[];
}

type SortDirection = 'asc' | 'desc' | null;

export default function DataTable<T extends { id?: number | string }>({
  columns,
  data,
  pageSize = 10,
  onRowClick,
  loading = false,
  emptyMessage = 'No data available',
  sortableBy = [],
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Handle sorting
  const sortedData = useMemo(() => {
    if (!sortKey || !sortDirection) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortKey, sortDirection]);

  // Handle pagination
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = startIdx + pageSize;
  const paginatedData = sortedData.slice(startIdx, endIdx);

  const handleSort = (key: keyof T) => {
    if (sortKey === key) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortKey(null);
      }
    } else {
      setSortKey(key);
      setSortDirection('asc');
      setCurrentPage(1);
    }
  };

  const getSortIcon = (key: keyof T) => {
    if (sortKey !== key) return <ChevronUp size={14} className="opacity-30" />;
    if (sortDirection === 'asc') return <ChevronUp size={14} className="text-onyx-gold" />;
    return <ChevronDown size={14} className="text-onyx-gold" />;
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: pageSize }).map((_, i) => (
          <div key={i} className="h-12 bg-onyx-bg-tertiary rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-onyx-text-muted">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="overflow-x-auto border border-onyx-border rounded-xl">
        <table className="w-full text-sm">
          <thead className="bg-onyx-bg-tertiary border-b border-onyx-border">
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={`px-6 py-4 text-left font-semibold text-onyx-text-muted text-xs uppercase tracking-wider ${
                    column.width ? `w-${column.width}` : ''
                  }`}
                >
                  <button
                    onClick={() => handleSort(column.key)}
                    disabled={!column.sortable}
                    className={`flex items-center gap-1 ${
                      column.sortable ? 'cursor-pointer hover:text-onyx-text-primary' : 'cursor-default'
                    }`}
                  >
                    {column.label}
                    {column.sortable && getSortIcon(column.key)}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, idx) => (
              <tr
                key={row.id || idx}
                onClick={() => onRowClick?.(row)}
                className={`border-b border-onyx-border/50 ${
                  onRowClick ? 'hover:bg-onyx-bg-tertiary cursor-pointer' : ''
                } transition-colors`}
              >
                {columns.map((column) => (
                  <td key={String(column.key)} className="px-6 py-4 text-onyx-text-primary">
                    {column.render ? column.render(row[column.key], row) : String(row[column.key] ?? '-')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-onyx-text-muted">
          <p>
            Showing {startIdx + 1} to {Math.min(endIdx, sortedData.length)} of {sortedData.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-2 hover:bg-onyx-bg-tertiary rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronsLeft size={16} />
            </button>
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 hover:bg-onyx-bg-tertiary rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
              const pageNum = Math.max(1, currentPage - 2) + i;
              if (pageNum > totalPages) return null;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    pageNum === currentPage
                      ? 'bg-onyx-blue-gradient text-white'
                      : 'hover:bg-onyx-bg-tertiary text-onyx-text-secondary'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 hover:bg-onyx-bg-tertiary rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-2 hover:bg-onyx-bg-tertiary rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
