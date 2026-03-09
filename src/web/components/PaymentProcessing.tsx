'use client';

import { useEffect, useRef } from 'react';
import { LockClosedIcon, CreditCardIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';

export type ProcessingStep = 'tokenizing' | 'charging' | 'completing' | 'success' | 'error';

interface PaymentProcessingProps {
  step: ProcessingStep;
  error?: string;
  onRetry?: () => void;
}

const STEPS = [
  { id: 'tokenizing', label: 'Securing Card', icon: LockClosedIcon },
  { id: 'charging', label: 'Processing Payment', icon: CreditCardIcon },
  { id: 'completing', label: 'Completing Order', icon: CheckCircleIcon },
] as const;

function getStepIndex(step: ProcessingStep): number {
  if (step === 'error') return -1;
  if (step === 'success') return STEPS.length;
  return STEPS.findIndex(s => s.id === step);
}

function getStepStatus(stepIndex: number, currentIndex: number): 'completed' | 'current' | 'pending' {
  if (currentIndex === -1) return 'pending'; // Error state
  if (stepIndex < currentIndex) return 'completed';
  if (stepIndex === currentIndex) return 'current';
  return 'pending';
}

export function PaymentProcessing({ step, error, onRetry }: PaymentProcessingProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const currentIndex = getStepIndex(step);

  // Keyboard trap - prevent tab navigation out
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        e.preventDefault();
      }
      // Prevent escape closing
      if (e.key === 'Escape') {
        e.preventDefault();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus trap
  useEffect(() => {
    if (overlayRef.current) {
      overlayRef.current.focus();
    }
  }, []);

  return (
    <div
      ref={overlayRef}
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="payment-processing-title"
      aria-describedby="payment-processing-description"
    >
      <div className="bg-white rounded-2xl shadow-2xl p-8 mx-4 max-w-md w-full transform transition-all duration-300 scale-100">
        {/* Header */}
        <div className="text-center mb-8">
          {step === 'error' ? (
            <>
              <div className="w-20 h-20 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <XCircleIcon className="w-12 h-12 text-red-500" />
              </div>
              <h2 id="payment-processing-title" className="text-2xl font-bold text-gray-900">
                Payment Failed
              </h2>
            </>
          ) : step === 'success' ? (
            <>
              <div className="w-20 h-20 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
                <CheckCircleIcon className="w-12 h-12 text-green-500" />
              </div>
              <h2 id="payment-processing-title" className="text-2xl font-bold text-gray-900">
                Payment Successful!
              </h2>
            </>
          ) : (
            <>
              <div className="w-20 h-20 mx-auto mb-4 relative">
                <div className="absolute inset-0 border-4 border-[#1E5AA8]/20 rounded-full" />
                <div className="absolute inset-0 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <LockClosedIcon className="w-8 h-8 text-[#1E5AA8]" />
                </div>
              </div>
              <h2 id="payment-processing-title" className="text-2xl font-bold text-gray-900">
                Processing Payment
              </h2>
            </>
          )}
        </div>

        {/* Step Indicators */}
        <div className="relative mb-8">
          {/* Progress Line */}
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200">
            <div
              className="h-full bg-[#1E5AA8] transition-all duration-500 ease-out"
              style={{
                width: step === 'error' ? '0%' : `${Math.min(100, (currentIndex / (STEPS.length - 1)) * 100)}%`
              }}
            />
          </div>

          {/* Steps */}
          <div className="relative flex justify-between">
            {STEPS.map((s, index) => {
              const status = getStepStatus(index, currentIndex);
              const Icon = s.icon;

              return (
                <div key={s.id} className="flex flex-col items-center">
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                      ${status === 'completed' ? 'bg-[#1E5AA8] text-white scale-100' : ''}
                      ${status === 'current' ? 'bg-[#D4AF37] text-white scale-110 ring-4 ring-[#D4AF37]/30' : ''}
                      ${status === 'pending' ? 'bg-gray-200 text-gray-400 scale-100' : ''}
                    `}
                  >
                    {status === 'completed' ? (
                      <CheckCircleIcon className="w-6 h-6" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  <span
                    className={`
                      mt-2 text-xs font-medium text-center max-w-[80px] transition-colors duration-300
                      ${status === 'completed' ? 'text-[#1E5AA8]' : ''}
                      ${status === 'current' ? 'text-[#D4AF37] font-bold' : ''}
                      ${status === 'pending' ? 'text-gray-400' : ''}
                    `}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Status Message */}
        <div id="payment-processing-description" className="text-center">
          {step === 'error' && error ? (
            <div className="space-y-4">
              <p className="text-red-600 font-medium">{error}</p>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="w-full py-3 px-4 bg-[#1E5AA8] text-white font-semibold rounded-xl hover:bg-[#174785] transition-colors"
                >
                  Try Again
                </button>
              )}
            </div>
          ) : step === 'success' ? (
            <p className="text-green-600 font-medium">
              Redirecting to order confirmation...
            </p>
          ) : (
            <p className="text-gray-500">
              {step === 'tokenizing' && 'Encrypting your card information...'}
              {step === 'charging' && 'Authorizing payment with your bank...'}
              {step === 'completing' && 'Finalizing your order...'}
            </p>
          )}
        </div>

        {/* Security Badge */}
        {step !== 'error' && step !== 'success' && (
          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
              <LockClosedIcon className="w-4 h-4" />
              <span>Secured by SSL encryption</span>
            </div>
          </div>
        )}

        {/* Do not close warning */}
        {step !== 'error' && step !== 'success' && (
          <p className="mt-4 text-center text-xs text-gray-400 font-medium">
            Please do not close or refresh this page
          </p>
        )}
      </div>
    </div>
  );
}

export default PaymentProcessing;
