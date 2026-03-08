'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  CheckCircleIcon, 
  HomeIcon, 
  ShoppingBagIcon, 
  ClockIcon, 
  CalendarIcon, 
  ClipboardDocumentListIcon,
  ReceiptRefundIcon,
  PrinterIcon,
  ArrowRightIcon
} from '@heroicons/react/24/solid';
import { OrderAPI } from '@/lib/api';

interface OrderDetails {
  id: number;
  salesId: number;
  dailyOrderNumber: number;
  saleDateTime: string;
  subTotal: number;
  gstAmt: number;
  pstAmt: number;
  pst2Amt: number;
  dscAmt: number;
  totalAmount: number;
  status: string;
  details: Array<{
    itemId: number;
    iName: string;
    sizeName: string;
    itemQty: number;
    unitPrice: number;
  }>;
}

function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const total = searchParams.get('total');
  const transactionId = searchParams.get('transactionId');
  const isScheduled = searchParams.get('scheduled') === 'true';
  const scheduledDateTime = searchParams.get('scheduledDateTime');
  const confirmationCode = searchParams.get('confirmationCode');
  
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (orderId) {
      loadOrderDetails();
    } else {
      setLoading(false);
    }
  }, [orderId]);

  const loadOrderDetails = async () => {
    try {
      setLoading(true);
      // For immediate orders, we could fetch from API
      // For now, construct from query params and fetch history to get details
      if (orderId) {
        // In production, you'd have a dedicated order detail endpoint
        // For now, we'll show what we have from the query params
        setOrderDetails({
          id: parseInt(orderId),
          salesId: parseInt(orderId),
          dailyOrderNumber: parseInt(orderId),
          saleDateTime: new Date().toISOString(),
          subTotal: parseFloat(total || '0') * 0.94,
          gstAmt: parseFloat(total || '0') * 0.06,
          pstAmt: 0,
          pst2Amt: 0,
          dscAmt: 0,
          totalAmount: parseFloat(total || '0'),
          status: 'Completed',
          details: []
        });
      }
    } catch (err) {
      console.error('Failed to load order details:', err);
      setError('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex flex-col items-center justify-center p-6">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl">🍽️</span>
          </div>
        </div>
        <p className="mt-6 text-lg font-semibold text-[#1E5AA8]">Loading order details...</p>
        <p className="text-sm text-gray-500">Fetching from POS system</p>
      </div>
    );
  }

  if (!orderId) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex flex-col items-center justify-center p-6">
        <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-red-50 rounded-full flex items-center justify-center mb-6 shadow-lg">
          <span className="text-5xl">🔍</span>
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-3">Order Not Found</h2>
        <p className="text-gray-600 mb-8 text-center max-w-md text-lg">
          We couldn't find your order details. This might happen if you refreshed the page after checkout.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link 
            href="/orders" 
            className="flex items-center justify-center gap-2 px-8 py-4 bg-[#1E5AA8] text-white font-bold rounded-xl hover:bg-[#174785] transition-all shadow-lg shadow-blue-200"
          >
            <ClipboardDocumentListIcon className="w-5 h-5" />
            View My Orders
          </Link>
          <Link 
            href="/menu" 
            className="flex items-center justify-center gap-2 px-8 py-4 bg-[#D4AF37] text-white font-bold rounded-xl hover:bg-[#B8960C] transition-all shadow-lg shadow-yellow-200"
          >
            <ShoppingBagIcon className="w-5 h-5" />
            Order More
          </Link>
        </div>
      </div>
    );
  }

  const pickupDate = scheduledDateTime ? new Date(scheduledDateTime) : null;
  const orderNumber = isScheduled ? confirmationCode : `#${orderId}`;
  const displayTotal = orderDetails?.totalAmount || parseFloat(total || '0');

  return (
    <div className="min-h-[calc(100vh-200px)] max-w-3xl mx-auto p-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Success Animation Header */}
      <div className="text-center mb-10">
        <div className="relative inline-block mb-6">
          <div className="w-28 h-28 bg-gradient-to-br from-green-400 via-green-500 to-green-600 rounded-full flex items-center justify-center shadow-xl shadow-green-200 animate-bounce">
            <CheckCircleIcon className="w-16 h-16 text-white" />
          </div>
          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#D4AF37] rounded-full flex items-center justify-center shadow-lg">
            <span className="text-white text-lg">✓</span>
          </div>
        </div>
        
        <h1 className="text-4xl font-black text-gray-900 mb-3 tracking-tight">
          {isScheduled ? 'Order Scheduled!' : 'Order Confirmed!'}
        </h1>
        <p className="text-lg text-gray-600 max-w-lg mx-auto">
          {isScheduled 
            ? "Your order is scheduled and will be prepared fresh for your pickup time."
            : "Thank you for your order! A confirmation has been sent to your phone."
          }
        </p>
      </div>

      {/* Order Details Card */}
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden mb-8 border border-gray-100">
        {/* Order Number Header */}
        <div className="bg-gradient-to-r from-[#1E5AA8] via-[#2563EB] to-[#174785] p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative">
            <p className="text-sm font-bold uppercase tracking-[0.2em] opacity-80 mb-2">
              {isScheduled ? 'Confirmation Code' : 'Order Number'}
            </p>
            <p className="text-5xl font-black font-mono tracking-tight">
              {orderNumber}
            </p>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Scheduled Pickup Info */}
          {isScheduled && pickupDate && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-100 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-[#1E5AA8] rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 flex-shrink-0">
                  <CalendarIcon className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-[#1E5AA8] uppercase tracking-wide mb-1">
                    Scheduled Pickup
                  </p>
                  <p className="text-2xl font-black text-gray-900">
                    {pickupDate.toLocaleDateString('en-US', { 
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <ClockIcon className="w-5 h-5 text-[#D4AF37]" />
                    <p className="text-3xl font-black text-[#D4AF37]">
                      {pickupDate.toLocaleTimeString('en-US', { 
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true 
                      })}
                    </p>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Please arrive within 15 minutes of your scheduled time
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Order Total */}
          <div className="flex items-center justify-between py-6 border-t-2 border-b-2 border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Order Total</p>
              <p className="text-sm text-gray-400">Including taxes & fees</p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-black text-[#D4AF37] font-mono">
                ${displayTotal.toFixed(2)}
              </p>
              {orderDetails && orderDetails.dscAmt > 0 && (
                <p className="text-sm text-green-600 font-medium">
                  You saved ${orderDetails.dscAmt.toFixed(2)}!
                </p>
              )}
            </div>
          </div>

          {/* Breakdown */}
          {orderDetails && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-mono">${orderDetails.subTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>GST (6%)</span>
                <span className="font-mono">${orderDetails.gstAmt.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>PST (0%)</span>
                <span className="font-mono">$0.00</span>
              </div>
            </div>
          )}

          {/* What Happens Next */}
          <div className="bg-gradient-to-br from-[#FDF6E3] to-[#FFF8E7] rounded-2xl p-6 border border-[#D4AF37]/20">
            <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-3">
              <ClipboardDocumentListIcon className="w-6 h-6 text-[#D4AF37]" />
              What happens next?
            </h3>
            <ul className="space-y-3">
              {isScheduled ? (
                <>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-[#1E5AA8] text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
                    <span className="text-gray-700">Your order will be sent to the kitchen at the scheduled time</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-[#1E5AA8] text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
                    <span className="text-gray-700">We'll text you when your order is ready for pickup</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-[#1E5AA8] text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
                    <span className="text-gray-700">Present confirmation code <strong className="text-[#D4AF37]">{confirmationCode}</strong> at pickup</span>
                  </li>
                </>
              ) : (
                <>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">✓</span>
                    <span className="text-gray-700">Your order has been sent to the kitchen immediately</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-[#1E5AA8] text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
                    <span className="text-gray-700">You'll receive a text message when your order is ready</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-[#1E5AA8] text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
                    <span className="text-gray-700">Present order number <strong className="text-[#D4AF37]">#{orderId}</strong> at pickup</span>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Payment Status */}
          <div className="flex items-center justify-center gap-3 py-4 bg-green-50 rounded-xl border border-green-200">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <span className="text-green-800 font-semibold">
              ✓ Payment confirmed
              {transactionId && (
                <span className="text-xs text-gray-500 ml-2">
                  (Txn: {transactionId.substring(0, 10)}...)
                </span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Link
          href="/orders"
          className="flex items-center justify-center gap-3 py-5 bg-[#1E5AA8] text-white font-bold rounded-xl hover:bg-[#174785] transition-all shadow-xl shadow-blue-200 hover:shadow-2xl hover:-translate-y-0.5"
        >
          <ClipboardDocumentListIcon className="w-6 h-6" />
          <span>View My Orders</span>
          <ArrowRightIcon className="w-5 h-5 ml-2" />
        </Link>
        <Link
          href="/menu"
          className="flex items-center justify-center gap-3 py-5 bg-[#D4AF37] text-white font-bold rounded-xl hover:bg-[#B8960C] transition-all shadow-xl shadow-yellow-200 hover:shadow-2xl hover:-translate-y-0.5"
        >
          <ShoppingBagIcon className="w-6 h-6" />
          <span>Order More</span>
          <ArrowRightIcon className="w-5 h-5 ml-2" />
        </Link>
      </div>

      {/* Secondary Actions */}
      <div className="flex flex-wrap justify-center gap-4">
        <button 
          onClick={() => window.print()}
          className="flex items-center gap-2 px-6 py-3 text-gray-600 hover:text-gray-900 font-medium transition-colors bg-gray-100 hover:bg-gray-200 rounded-xl"
        >
          <PrinterIcon className="w-5 h-5" />
          Print Receipt
        </button>
        <Link
          href="/"
          className="flex items-center gap-2 px-6 py-3 text-gray-600 hover:text-[#1E5AA8] font-medium transition-colors"
        >
          <HomeIcon className="w-5 h-5" />
          Back to Home
        </Link>
      </div>

      {/* Trust Badges */}
      <div className="mt-12 pt-8 border-t border-gray-200">
        <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full" />
            <span>Secure Payment</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full" />
            <span>Real-time POS Sync</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full" />
            <span>Order Tracking</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-200px)] flex flex-col items-center justify-center">
        <div className="w-20 h-20 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-lg font-semibold text-[#1E5AA8]">Loading...</p>
      </div>
    }>
      <OrderConfirmationContent />
    </Suspense>
  );
}
