"use client";

import { useCart } from "@/context/CartContext";
import { OrderAPI } from "@/lib/api";
import {
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/solid";
import jsPDF from "jspdf";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

interface OrderDetails {
  orderNumber: string;
  transactionId: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  subtotal: number;
  gst: number;
  pst: number;
  total: number;
  paymentMethod: string;
  lastFourDigits: string;
  createdAt: string;
  itemCount: number;
}

function OrderConfirmationContent() {
  const { clearCart } = useCart(); // Destructured clearCart from useCart
  const searchParams = useSearchParams();
  const router = useRouter();

  // URL params
  const orderId = searchParams.get("orderId");
  const isScheduled = searchParams.get("scheduled") === "true";
  const scheduledOrderId = searchParams.get("scheduledOrderId");
  const totalFromUrl = searchParams.get("total");
  const scheduledDateTimeParam = searchParams.get("scheduledDateTime");

  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pickupTime, setPickupTime] = useState<string>("");
  const [ssotVerified, setSsotVerified] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  // Parse scheduled date/time if provided
  const scheduledDateTime = scheduledDateTimeParam
    ? new Date(scheduledDateTimeParam)
    : null;

  /**
   * Calculate pickup time based on item count
   * Formula: 15 min base + 2 min per item (rounded to nearest 5 min)
   */
  const calculatePickupTime = (itemCount: number): string => {
    const baseTime = 15; // minutes
    const perItemTime = 2; // minutes per item
    const totalMinutes = baseTime + itemCount * perItemTime;

    // Round to nearest 5 minutes
    const roundedMinutes = Math.round(totalMinutes / 5) * 5;

    // Calculate ready time
    const readyTime = new Date(Date.now() + roundedMinutes * 60000);

    return readyTime.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  /**
   * Format scheduled pickup time for display
   */
  const formatScheduledPickup = (dateTime: Date): string => {
    return (
      dateTime.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      }) +
      " at " +
      dateTime.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    );
  };

  /**
   * Generate confirmation code for scheduled orders
   */
  const getConfirmationCode = (): string => {
    if (scheduledOrderId) {
      return `SCH-${scheduledOrderId.toString().padStart(6, "0")}`;
    }
    return `SCH-${Date.now().toString().slice(-6)}`;
  };

  /**
   * Fetch order details from POS (SSOT)
   * READ-ONLY operation
   */
  useEffect(() => {
    const fetchOrderDetails = async () => {
      // For scheduled orders, we may not have a POS order yet
      if (isScheduled) {
        setLoading(false);
        return;
      }

      if (!orderId) {
        setError("No order ID provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Fetch from POS via READ-ONLY API
        const order = await OrderAPI.getOrderById(orderId);

        // Verify SSOT marker
        if (order._meta?.source === "INI_Restaurant" && order._meta?.readonly) {
          setSsotVerified(true);
        } else {
          console.warn("SSOT verification failed for order data");
        }

        // Transform for display (NO writes to POS)
        const details: OrderDetails = {
          orderNumber: order.orderNumber || order.id,
          transactionId: order.transactionId || order.id,
          items: order.items.map((item) => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price, // Price from POS (SSOT)
            total: item.total,
          })),
          subtotal: order.subtotal,
          gst: order.gst,
          pst: order.pst,
          total: order.total,
          paymentMethod: order.paymentMethod || "Credit Card",
          lastFourDigits: order.lastFourDigits || "****",
          createdAt: order.createdAt,
          itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
        };

        setOrderDetails(details);
        setPickupTime(calculatePickupTime(details.itemCount));
        setError(null);
      } catch (err) {
        console.error("Failed to fetch order from POS:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load order details from POS system",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
    // Clear cart once we land on confirmation page
    clearCart();
  }, [orderId, isScheduled, clearCart]); // clearCart is now a stable function from useCart

  /**
   * Handle print functionality
   * Uses browser's native print dialog
   */
  const handlePrint = () => {
    window.print();
  };

  /**
   * Handle PDF download
   * Generates PDF receipt using jsPDF
   */
  const handleDownloadPDF = () => {
    if (!orderDetails && !isScheduled) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    // Header
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Imidus Restaurant", pageWidth / 2, yPos, { align: "center" });

    yPos += 10;
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(
      isScheduled ? "Scheduled Order Confirmation" : "Order Receipt",
      pageWidth / 2,
      yPos,
      { align: "center" },
    );

    yPos += 15;
    doc.setDrawColor(0);
    doc.line(20, yPos, pageWidth - 20, yPos);

    // Order details
    yPos += 10;
    doc.setFontSize(10);

    if (isScheduled) {
      doc.text(`Confirmation Code: ${getConfirmationCode()}`, 20, yPos);
      yPos += 6;
      if (scheduledDateTime) {
        doc.text(
          `Scheduled Pickup: ${formatScheduledPickup(scheduledDateTime)}`,
          20,
          yPos,
        );
        yPos += 6;
      }
      if (totalFromUrl) {
        doc.text(
          `Order Total: $${(parseFloat(totalFromUrl!) || 0).toFixed(2)}`,
          20,
          yPos,
        );
        yPos += 6;
      }
    } else if (orderDetails) {
      doc.text(`Order Number: ${orderDetails.orderNumber}`, 20, yPos);
      yPos += 6;
      doc.text(`Transaction ID: ${orderDetails.transactionId}`, 20, yPos);
      yPos += 6;
      doc.text(
        `Date: ${new Date(orderDetails.createdAt).toLocaleString()}`,
        20,
        yPos,
      );
      yPos += 6;
      doc.text(`Estimated Pickup: ${pickupTime}`, 20, yPos);
    }

    // Footer
    yPos += 20;
    doc.setFontSize(8);
    doc.text("Thank you for your order.", pageWidth / 2, yPos, {
      align: "center",
    });

    // Save PDF
    const filename = isScheduled
      ? `scheduled-order-${getConfirmationCode()}.pdf`
      : `receipt-${orderDetails?.orderNumber || "order"}.pdf`;
    doc.save(filename);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E5AA8] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  // Error state for immediate orders
  if (!isScheduled && (error || !orderDetails)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h2 className="mt-4 text-xl font-semibold text-gray-900">
              Order Not Found
            </h2>
            <p className="mt-2 text-gray-600">{error}</p>
            <button
              onClick={() => router.push("/menu")}
              className="mt-6 px-6 py-2 bg-[#1E5AA8] text-white rounded-lg hover:bg-[#164785] transition-colors"
            >
              Return to Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ========== SCHEDULED ORDER CONFIRMATION ==========
  if (isScheduled) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Success Header - Scheduled Order */}
          <div className="bg-white rounded-lg shadow-md p-8 mb-6 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-[rgba(212,175,55,0.15)]">
              <CalendarIcon className="h-10 w-10 text-[#D4AF37]" />
            </div>
            <h1 className="mt-4 text-3xl font-bold text-[#1A1A2E]">
              Scheduled Order Confirmed
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              Your order has been scheduled
            </p>

            {/* Scheduled Pickup Badge */}
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#D4AF37] text-white rounded-full text-sm font-semibold">
              <ClockIcon className="h-4 w-4" />
              Scheduled Pickup
            </div>

            {/* Pickup Time - Prominent Display */}
            <div className="mt-6 bg-[rgba(212,175,55,0.08)] border-2 border-[rgba(212,175,55,0.3)] rounded-lg p-6">
              <p className="text-sm text-gray-600 uppercase tracking-wide">
                Pickup Date & Time
              </p>
              {scheduledDateTime ? (
                <p className="mt-2 text-2xl font-bold text-[#D4AF37]">
                  {formatScheduledPickup(scheduledDateTime)}
                </p>
              ) : (
                <p className="mt-2 text-2xl font-bold text-[#D4AF37]">
                  See confirmation email for details
                </p>
              )}
            </div>

            {/* Confirmation Code */}
            <div className="mt-6 bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Confirmation Code</p>
              <p className="text-2xl font-mono font-bold text-[#1A1A2E]">
                {getConfirmationCode()}
              </p>
            </div>

            {/* Order Total */}
            {totalFromUrl && (
              <div className="mt-4">
                <p className="text-sm text-gray-600">Order Total</p>
                <p className="text-xl font-bold text-[#1E5AA8]">
                  ${(parseFloat(totalFromUrl!) || 0).toFixed(2)}
                </p>
              </div>
            )}
          </div>

          {/* Important Notes */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold text-[#1A1A2E] mb-4">
              Important Information
            </h2>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-600">
                  Your order will be ready at the scheduled pickup time.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <ClockIcon className="h-5 w-5 text-[#1E5AA8] flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-600">
                  Please arrive within 15 minutes of your scheduled pickup time.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <svg
                  className="h-5 w-5 text-[#D4AF37] flex-shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm text-gray-600">
                  <strong>Cancellation Policy:</strong> You can cancel this
                  order up to 2 hours before your scheduled pickup time.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 print:hidden">
            <button
              onClick={handleDownloadPDF}
              className="flex items-center justify-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Download Confirmation
            </button>

            <Link
              href="/account/orders"
              className="flex items-center justify-center px-6 py-3 bg-[#1E5AA8] text-white rounded-lg hover:bg-[#164785] transition-colors font-medium"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              View Order History
            </Link>
          </div>

          {/* Return to Menu */}
          <div className="mt-4 text-center print:hidden">
            <Link
              href="/menu"
              className="text-[#1E5AA8] hover:text-[#164785] font-medium"
            >
              Return to Menu
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ========== IMMEDIATE ORDER CONFIRMATION ==========
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* SSOT Verification Badge (dev only) */}
        {process.env.NODE_ENV === "development" && (
          <div
            className={`mb-4 p-3 rounded-lg text-sm ${
              ssotVerified
                ? "bg-green-100 text-green-800 border border-green-200"
                : "bg-yellow-100 text-yellow-800 border border-yellow-200"
            }`}
          >
            {ssotVerified ? "Verified" : "Warning"} SSOT Status:{" "}
            {ssotVerified
              ? "Verified from INI_Restaurant"
              : "Verification failed"}
          </div>
        )}

        {/* Success Header */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-6 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
            <CheckCircleIcon className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="mt-4 text-3xl font-bold text-[#1A1A2E]">
            Order Confirmed
          </h1>
          <p className="mt-2 text-lg text-gray-600">Thank you for your order</p>

          {/* Pickup Time - Prominent Display */}
          <div className="mt-6 bg-[rgba(30,90,168,0.08)] border-2 border-[rgba(30,90,168,0.2)] rounded-lg p-6">
            <p className="text-sm text-gray-600 uppercase tracking-wide">
              Estimated Pickup Time
            </p>
            <p className="mt-2 text-4xl font-bold text-[#1E5AA8]">
              {pickupTime}
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Approximately {orderDetails!.itemCount} item
              {orderDetails!.itemCount !== 1 ? "s" : ""} - Ready in{" "}
              {15 + orderDetails!.itemCount * 2} minutes
            </p>
          </div>
        </div>

        {/* Receipt Details */}
        <div
          ref={receiptRef}
          className="bg-white rounded-lg shadow-md p-8 print:shadow-none"
        >
          <div className="border-b pb-4 mb-4">
            <h2 className="text-2xl font-bold text-[#1A1A2E]">Order Receipt</h2>
            <div className="mt-2 text-sm text-gray-600">
              <p>
                Order Number:{" "}
                <span className="font-mono font-semibold">
                  {orderDetails!.orderNumber}
                </span>
              </p>
              <p>
                Transaction ID:{" "}
                <span className="font-mono">{orderDetails!.transactionId}</span>
              </p>
              <p>Date: {new Date(orderDetails!.createdAt).toLocaleString()}</p>
            </div>
          </div>

          {/* Items */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-[#1A1A2E] mb-3">
              Order Items
            </h3>
            <div className="space-y-2">
              {orderDetails!.items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center py-2 border-b border-gray-100"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-500">
                      Qty: {item.quantity} x ${(item.price || 0).toFixed(2)}
                    </p>
                  </div>
                  <p className="font-semibold text-gray-900">
                    ${(item.total || 0).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>${(orderDetails!.subtotal || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>GST (6%)</span>
              <span>${(orderDetails!.gst || 0).toFixed(2)}</span>
            </div>
            {orderDetails!.pst > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>PST</span>
                <span>${(orderDetails!.pst || 0).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-xl font-bold text-[#1A1A2E] pt-2 border-t">
              <span>Total</span>
              <span>${(orderDetails!.total || 0).toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Info */}
          <div className="mt-6 pt-6 border-t">
            <p className="text-sm text-gray-600">
              Payment Method:{" "}
              <span className="font-semibold">
                {orderDetails!.paymentMethod}
              </span>{" "}
              ending in {orderDetails!.lastFourDigits}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 print:hidden">
          <button
            onClick={handlePrint}
            className="flex items-center justify-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
            Print Receipt
          </button>

          <button
            onClick={handleDownloadPDF}
            className="flex items-center justify-center px-6 py-3 bg-[#1E5AA8] text-white rounded-lg hover:bg-[#164785] transition-colors font-medium"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Download PDF
          </button>

          <Link
            href={`/order/tracking?orderId=${orderId}`}
            className="flex items-center justify-center px-6 py-3 bg-[#D4AF37] text-white rounded-lg hover:bg-[#B8963A] transition-colors font-medium"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            Track Your Order
          </Link>
        </div>

        {/* Return to Menu */}
        <div className="mt-4 text-center print:hidden">
          <Link
            href="/menu"
            className="text-[#1E5AA8] hover:text-[#164785] font-medium"
          >
            Return to Menu
          </Link>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E5AA8] mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <OrderConfirmationContent />
    </Suspense>
  );
}
