'use client';

import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
}

const sizeClasses = {
  sm: 'w-6 h-6 border-2',
  md: 'w-10 h-10 border-3',
  lg: 'w-16 h-16 border-4',
};

export default function Spinner({ size = 'md', text, fullScreen = false }: SpinnerProps) {
  const spinner = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className={`${sizeClasses[size]} border-onyx-border border-t-onyx-blue rounded-full animate-spin`} />
      {text && <p className="text-sm text-onyx-text-secondary font-medium">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-onyx-bg-secondary p-8 rounded-2xl border border-onyx-border shadow-2xl">
          {spinner}
        </div>
      </div>
    );
  }

  return spinner;
}

export function LoadingOverlay() {
  return (
    <div className="absolute inset-0 bg-onyx-bg-primary/80 backdrop-blur-sm flex items-center justify-center z-40 rounded-xl">
      <Spinner size="md" />
    </div>
  );
}

export function InlineSpinner({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  return (
    <div className={`${sizeClasses[size]} border-onyx-border border-t-onyx-blue rounded-full animate-spin`} />
  );
}

export function PageLoader({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-onyx-border border-t-onyx-blue rounded-full animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-onyx-border border-t-onyx-gold rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
        </div>
      </div>
      <p className="text-onyx-text-secondary font-medium">{text}</p>
    </div>
  );
}
