'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnBackdrop?: boolean;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
}: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        onClick={() => closeOnBackdrop && onClose()}
      />

      {/* Modal */}
      <div className={`relative bg-onyx-bg-secondary rounded-2xl border border-onyx-border shadow-2xl ${sizeClasses[size]} w-full mx-4 max-h-[90vh] flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-onyx-border">
          <h2 className="text-lg font-semibold text-onyx-text-primary">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 text-onyx-text-muted hover:text-onyx-text-primary hover:bg-onyx-bg-tertiary rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="border-t border-onyx-border px-6 py-4 bg-onyx-bg-tertiary rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
