"use client";

import React, { useState, useMemo } from "react";
import {
  ChevronUp,
  ChevronDown,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
} from "lucide-react";

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

type SortDirection = "asc" | "desc" | null;

export default function DataTable<T extends { id?: number | string }>({
  columns,
  data,
  pageSize = 10,
  onRowClick,
  loading = false,
  emptyMessage = "No data available",
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

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
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
      // Cycle through: asc -> desc -> null
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortDirection(null);
        setSortKey(null);
      }
    } else {
      setSortKey(key);
      setSortDirection("asc");
      setCurrentPage(1);
    }
  };

  const getSortIcon = (key: keyof T) => {
    if (sortKey !== key) return <ChevronUp size={14} className="opacity-30" />;
    if (sortDirection === "asc")
      return <ChevronUp size={14} className="text-orange-500" />;
    return <ChevronDown size={14} className="text-orange-500" />;
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: pageSize }).map((_, i) => (
          <div key={i} className="h-12 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={`px-6 py-3 text-left font-medium text-gray-700 ${
                    column.width ? `w-${column.width}` : ""
                  }`}
                >
                  <button
                    onClick={() => handleSort(column.key)}
                    disabled={!column.sortable}
                    className={`flex items-center gap-1 ${
                      column.sortable
                        ? "cursor-pointer hover:text-gray-900"
                        : "cursor-default"
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
                className={`border-b border-gray-200 ${
                  onRowClick ? "hover:bg-gray-50 cursor-pointer" : ""
                }`}
              >
                {columns.map((column) => (
                  <td
                    key={String(column.key)}
                    className="px-6 py-3 text-gray-900"
                  >
                    {column.render
                      ? column.render(row[column.key], row)
                      : String(row[column.key] ?? "-")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <p>
            Showing {startIdx + 1} to {Math.min(endIdx, sortedData.length)} of{" "}
            {sortedData.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-2 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronsLeft size={16} />
            </button>
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
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
                  className={`px-3 py-1 rounded text-sm ${
                    pageNum === currentPage
                      ? "bg-orange-500 text-white"
                      : "hover:bg-gray-100"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-2 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
