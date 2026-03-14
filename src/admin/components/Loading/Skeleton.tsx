'use client';

import React from 'react';

interface SkeletonProps {
  count?: number;
  height?: string;
  width?: string;
  className?: string;
  circle?: boolean;
}

export function SkeletonText({ count = 1, height = 'h-4', width = 'w-full', className = '' }: SkeletonProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`${height} ${width} bg-gray-200 rounded animate-pulse`} />
      ))}
    </div>
  );
}

export function SkeletonAvatar({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizeClass = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  }[size];

  return <div className={`${sizeClass} bg-gray-200 rounded-full animate-pulse ${className}`} />;
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white p-6 rounded-lg border border-gray-200 space-y-4 ${className}`}>
      <SkeletonText height="h-6" width="w-1/2" />
      <SkeletonText count={3} height="h-4" />
      <div className="flex gap-2 pt-4">
        <div className="h-10 w-24 bg-gray-200 rounded animate-pulse" />
        <div className="h-10 w-24 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2 border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex bg-gray-50 border-b border-gray-200">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={`header-${i}`} className="flex-1 px-6 py-3 h-12 bg-gray-100 animate-pulse" />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={`row-${rowIdx}`} className="flex border-b border-gray-200">
          {Array.from({ length: cols }).map((_, colIdx) => (
            <div key={`cell-${rowIdx}-${colIdx}`} className="flex-1 px-6 py-3 h-12 bg-gray-100 animate-pulse" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
      <SkeletonText height="h-6" width="w-1/3" />
      <div className="h-64 bg-gray-100 rounded animate-pulse" />
    </div>
  );
}

export default function Skeleton({ count = 1, height = 'h-12', width = 'w-full', circle = false, className = '' }: SkeletonProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`${height} ${width} ${circle ? 'rounded-full' : 'rounded'} bg-gray-200 animate-pulse`}
        />
      ))}
    </div>
  );
}
