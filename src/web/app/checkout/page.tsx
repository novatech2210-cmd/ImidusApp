"use client";

import { useState, useEffect, useRef } from "react";
import { useCart } from "@/context/CartContext";
import { OrderAPI, AuthAPI, ScheduledOrderAPI, CustomerAPI } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CreditCardIcon,
  LockClosedIcon,
  ClockIcon,
} from "@heroicons/react/24/solid";
import { TimeSlotPicker } from "@/components/TimeSlotPicker";

// Authorize.net Accept.js configuration from environment variables
const AUTHORIZE_NET_API_LOGIN_ID =
  process.env.NEXT_PUBLIC_AUTH_NET_API_LOGIN_ID || "";
const AUTHORIZE_NET_PUBLIC_CLIENT_KEY =
  process.env.NEXT_PUBLIC_AUTH_NET_PUBLIC_KEY || "";
const AUTHORIZE_NET_ENV =
  process.env.NEXT_PUBLIC_AUTH_NET_ENVIRONMENT || "sandbox";

// Load Authorize.net Accept.js script
const loadAcceptJS = () => {
  return new Promise<void>((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Window not available"));
      return;
    }

    // @ts-ignore
    if (window.Accept) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://js.authorize.net/v1/Accept.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Accept.js"));
    document.body.appendChild(script);
  });
};

export default function CheckoutPage() {
  const { items, total, subtotal, clearCart } = useCart();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<
    "info" | "payment" | "processing" | "success"
  >("info");

  // Customer info
  const [customerInfo, setCustomerInfo] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
  });

  // Payment info
  const [cardInfo, setCardInfo] = useState({
    cardNumber: "",
    expiry: "",
    cvv: "",
  });

  // Tip state
  const [tipAmount, setTipAmount] = useState(0);
  const [customTip, setCustomTip] = useState("");
  const [showCustomTip, setShowCustomTip] = useState(false);

  // Order IDs from Step 1
  const [salesId, setSalesId] = useState<number | null>(null);
  const [customerId, setCustomerId] = useState<number | null>(null);

  // Scheduled order state
  const [isScheduledOrder, setIsScheduledOrder] = useState(false);
  const [scheduledDateTime, setScheduledDateTime] = useState<Date | null>(null);

  // Check if cart is empty
  if (items.length === 0 && step !== "success") {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] card">
        <h2 className="text-2xl font-bold text-[#1A1A2E] mb-4">
          Your cart is empty
        </h2>
        <Link
          href="/menu"
          className="text-[#1E5AA8] hover:text-[#D4AF37] font-semibold transition-colors"
        >
          ← Back to Menu
        </Link>
      </div>
    );
  }

  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !customerInfo.firstName ||
      !customerInfo.lastName ||
      !customerInfo.phone
    ) {
      setError("Please fill in all required fields");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // Step 1a: Customer lookup
      const customerResponse = await CustomerAPI.lookup(
        customerInfo.phone,
        customerInfo.email,
      );
      setCustomerId(customerResponse.customerId);

      // Step 1b: Calculate total with tip
      const orderTotal = total + tipAmount;

      // Step 1c: Create pending order (no payment yet)
      const orderItems = items.map((item) => ({
        menuItemId: item.menuItemId,
        sizeId: item.sizeId,
        quantity: item.quantity,
        unitPrice: item.price,
      }));

      if (isScheduledOrder) {
        if (!scheduledDateTime) {
          throw new Error("Please select a pickup date and time");
        }

        const minTime = new Date(Date.now() + 30 * 60000);
        if (scheduledDateTime < minTime) {
          throw new Error("Pickup time must be at least 30 minutes from now");
        }

        // Scheduled orders skip payment step
        const scheduledRequest = {
          customerId: customerResponse.customerId,
          scheduledDateTime: scheduledDateTime.toISOString(),
          items: orderItems,
          tipAmount: tipAmount,
          specialInstructions: "",
          idempotencyKey: crypto.randomUUID(),
        };

        const orderResponse = await ScheduledOrderAPI.create(scheduledRequest);

        if (!orderResponse.success) {
          throw new Error(
            orderResponse.message || "Scheduled order creation failed",
          );
        }

        clearCart();
        router.push(
          `/order/confirmation?scheduledOrderId=${orderResponse.scheduledOrderId}&total=${orderTotal}&scheduled=true`,
        );
      } else {
        // Immediate order: Create pending order
        const orderRequest = {
          customerId: customerResponse.customerId,
          items: orderItems,
          tipAmount: tipAmount,
        };

        const orderResponse = await OrderAPI.create(orderRequest);

        if (!orderResponse.success) {
          throw new Error(orderResponse.message || "Order creation failed");
        }

        setSalesId(orderResponse.salesId);
        setStep("payment");

        loadAcceptJS().catch((err) => {
          console.error("Failed to load payment system:", err);
          setError("Payment system unavailable. Please try again.");
        });
      }
    } catch (err: any) {
      console.error("Customer/Order creation error:", err);
      setError(err.message || "Failed to create order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!salesId) {
      setError("Order not found. Please start over.");
      return;
    }

    setError(null);
    setLoading(true);
    setStep("processing");

    try {
      await loadAcceptJS();

      const [expMonth, expYear] = cardInfo.expiry.split("/");
      if (!expMonth || !expYear) {
        throw new Error("Invalid expiry date format. Use MM/YY");
      }

      const secureData = {
        authData: {
          clientKey: AUTHORIZE_NET_PUBLIC_CLIENT_KEY,
          apiLoginID: AUTHORIZE_NET_API_LOGIN_ID,
        },
        cardData: {
          cardNumber: cardInfo.cardNumber.replace(/\s/g, ""),
          month: expMonth,
          year: "20" + expYear,
          cardCode: cardInfo.cvv,
        },
      };

      // @ts-ignore
      const response = await new Promise((resolve, reject) => {
        // @ts-ignore
        window.Accept.dispatchData(secureData, (response: any) => {
          if (response.messages.resultCode === "Error") {
            reject(
              new Error(
                response.messages.message[0]?.text ||
                  "Payment processing failed",
              ),
            );
          } else {
            resolve(response);
          }
        });
      });

      // @ts-ignore
      const opaqueData = response.opaqueData;

      // Step 2c: Complete payment
      const paymentRequest = {
        token: {
          dataDescriptor: opaqueData.dataDescriptor,
          dataValue: opaqueData.dataValue,
        },
        amount: total + tipAmount,
        customerId: customerId || undefined,
        pointsToRedeem: 0,
      };

      const paymentResponse = await OrderAPI.completePayment(
        salesId,
        paymentRequest,
      );

      if (!paymentResponse.success) {
        throw new Error(
          paymentResponse.errorMessage || "Payment processing failed",
        );
      }

      clearCart();
      setStep("success");
      router.push(
        `/order/confirmation?orderId=${paymentResponse.dailyOrderNumber}&total=${total + tipAmount}&transactionId=${paymentResponse.transactionId}`,
      );
    } catch (err: any) {
      console.error("Payment error:", err);
      setError(err.message || "Payment processing failed. Please try again.");
      setStep("payment");
    } finally {
      setLoading(false);
    }
  };

  // Calculate taxes
  const gst = subtotal * 0.06;
  const pst = 0;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-[#1E5AA8] mb-8 tracking-tight">
        Checkout
      </h1>

      {/* Progress Steps */}
      <div className="flex items-center mb-8">
        <div
          className={`flex-1 h-2 rounded-full ${step === "info" ? "bg-[#D4AF37]" : "bg-[#1E5AA8]"}`}
        />
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center mx-2 ${step === "info" ? "bg-[#D4AF37] text-white" : "bg-[#1E5AA8] text-white"}`}
        >
          1
        </div>
        <div
          className={`flex-1 h-2 rounded-full ${step === "payment" || step === "processing" || step === "success" ? "bg-[#1E5AA8]" : "bg-gray-200"}`}
        />
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center mx-2 ${step === "payment" || step === "processing" ? "bg-[#D4AF37] text-white" : step === "success" ? "bg-[#1E5AA8] text-white" : "bg-gray-200"}`}
        >
          2
        </div>
        <div
          className={`flex-1 h-2 rounded-full ${step === "success" ? "bg-[#1E5AA8]" : "bg-gray-200"}`}
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left Column - Forms */}
        <div>
          {step === "info" && (
            <form onSubmit={handleCustomerSubmit} className="card card-body">
              <h2 className="text-xl font-bold text-[#1A1A2E] mb-6">
                Customer Information
              </h2>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-[#4A4A5A] mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerInfo.firstName}
                    onChange={(e) =>
                      setCustomerInfo({
                        ...customerInfo,
                        firstName: e.target.value,
                      })
                    }
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#4A4A5A] mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerInfo.lastName}
                    onChange={(e) =>
                      setCustomerInfo({
                        ...customerInfo,
                        lastName: e.target.value,
                      })
                    }
                    className="input"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-[#4A4A5A] mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={customerInfo.phone}
                  onChange={(e) =>
                    setCustomerInfo({ ...customerInfo, phone: e.target.value })
                  }
                  className="input"
                  placeholder="(123) 456-7890"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-[#4A4A5A] mb-2">
                  Email (optional)
                </label>
                <input
                  type="email"
                  value={customerInfo.email}
                  onChange={(e) =>
                    setCustomerInfo({ ...customerInfo, email: e.target.value })
                  }
                  className="input"
                  placeholder="you@example.com"
                />
              </div>

              {/* Tip Selection */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-[#4A4A5A] mb-3">
                  Add a Tip (Optional)
                </label>

                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[0, 2, 5, 10].map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => {
                        setTipAmount(amount);
                        setShowCustomTip(false);
                        setCustomTip("");
                      }}
                      className={`py-2 px-3 rounded-lg border-2 font-semibold transition-all ${
                        tipAmount === amount && !showCustomTip
                          ? "border-[#D4AF37] bg-[#D4AF37] text-white"
                          : "border-gray-300 bg-white text-[#4A4A5A] hover:border-[#1E5AA8]"
                      }`}
                    >
                      {amount === 0 ? "No Tip" : `$${amount}`}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setShowCustomTip(!showCustomTip)}
                  className="text-sm text-[#1E5AA8] hover:text-[#D4AF37] font-medium"
                >
                  {showCustomTip
                    ? "← Back to preset tips"
                    : "Enter custom amount"}
                </button>

                {showCustomTip && (
                  <div className="mt-3">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={customTip}
                      onChange={(e) => {
                        setCustomTip(e.target.value);
                        setTipAmount(parseFloat(e.target.value) || 0);
                      }}
                      className="input"
                      placeholder="Enter custom tip amount"
                    />
                  </div>
                )}
              </div>

              {/* Scheduled Order Toggle */}
              <div className="mb-6 p-4 bg-[rgba(30,90,168,0.05)] rounded-xl border border-[rgba(30,90,168,0.15)]">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isScheduledOrder}
                    onChange={(e) => {
                      setIsScheduledOrder(e.target.checked);
                      if (!e.target.checked) {
                        setScheduledDateTime(null);
                      }
                    }}
                    className="w-5 h-5 rounded border-gray-300 text-[#1E5AA8] focus:ring-[#1E5AA8]"
                  />
                  <div>
                    <span className="font-semibold text-[#1A1A2E] flex items-center gap-2">
                      <ClockIcon className="w-4 h-4 text-[#1E5AA8]" />
                      Schedule for Later
                    </span>
                    <p className="text-xs text-[#71717A]">
                      Order now, pickup later. Minimum 30 minutes advance
                      notice.
                    </p>
                  </div>
                </label>

                {isScheduledOrder && (
                  <div className="mt-4 pt-4 border-t border-[rgba(30,90,168,0.1)]">
                    <TimeSlotPicker
                      selectedDateTime={scheduledDateTime}
                      onSelect={setScheduledDateTime}
                      minLeadTimeMinutes={30}
                    />
                  </div>
                )}
              </div>

              <button type="submit" className="w-full btn btn-primary">
                Continue to Payment
              </button>
            </form>
          )}

          {step === "payment" && (
            <form onSubmit={handlePaymentSubmit} className="card card-body">
              <div className="flex items-center gap-2 mb-6">
                <CreditCardIcon className="w-6 h-6 text-[#1E5AA8]" />
                <h2 className="text-xl font-bold text-[#1A1A2E]">
                  Payment Information
                </h2>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-[#4A4A5A] mb-2">
                  Card Number *
                </label>
                <input
                  type="text"
                  required
                  maxLength={19}
                  value={cardInfo.cardNumber}
                  onChange={(e) => {
                    // Format card number with spaces
                    const value = e.target.value
                      .replace(/\s/g, "")
                      .replace(/[^0-9]/g, "");
                    const formatted =
                      value.match(/.{1,4}/g)?.join(" ") || value;
                    setCardInfo({ ...cardInfo, cardNumber: formatted });
                  }}
                  className="input font-mono"
                  placeholder="1234 5678 9012 3456"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-[#4A4A5A] mb-2">
                    Expiry (MM/YY) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    value={cardInfo.expiry}
                    onChange={(e) => {
                      let value = e.target.value.replace(/[^0-9]/g, "");
                      if (value.length >= 2) {
                        value = value.slice(0, 2) + "/" + value.slice(2, 4);
                      }
                      setCardInfo({ ...cardInfo, expiry: value });
                    }}
                    className="input font-mono"
                    placeholder="12/25"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#4A4A5A] mb-2">
                    CVV *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={4}
                    value={cardInfo.cvv}
                    onChange={(e) =>
                      setCardInfo({
                        ...cardInfo,
                        cvv: e.target.value.replace(/\D/g, ""),
                      })
                    }
                    className="input font-mono"
                    placeholder="123"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 mb-6 text-sm text-[#4A4A5A]">
                <LockClosedIcon className="w-4 h-4" />
                <span>Your payment is secured with SSL encryption</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn btn-gold disabled:opacity-50"
              >
                {loading ? "Processing..." : `Pay $${total.toFixed(2)}`}
              </button>

              <button
                type="button"
                onClick={() => setStep("info")}
                className="w-full mt-3 py-2 text-[#4A4A5A] hover:text-[#1E5AA8] font-medium"
              >
                ← Back to Customer Info
              </button>
            </form>
          )}

          {step === "processing" && (
            <div className="card card-body text-center">
              <div className="w-16 h-16 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <h2 className="text-xl font-bold text-[#1A1A2E] mb-2">
                Processing Payment...
              </h2>
              <p className="text-[#4A4A5A]">Please do not close this window</p>
            </div>
          )}
        </div>

        {/* Right Column - Order Summary */}
        <div className="card card-body h-fit">
          <h2 className="text-xl font-bold text-[#1A1A2E] mb-6">
            Order Summary
          </h2>

          <div className="space-y-3 mb-6">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <div>
                  <span className="font-semibold text-[#1A1A2E]">
                    {item.name}
                  </span>
                  <span className="text-[#71717A]"> × {item.quantity}</span>
                  <div className="text-xs text-[#71717A]">{item.sizeName}</div>
                </div>
                <span className="font-mono font-semibold">
                  ${(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-[rgba(30,90,168,0.08)] pt-4 space-y-2">
            <div className="flex justify-between text-[#4A4A5A]">
              <span>Subtotal</span>
              <span className="font-mono">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[#4A4A5A]">
              <span>GST (6%)</span>
              <span className="font-mono">${gst.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[#4A4A5A]">
              <span>PST (0%)</span>
              <span className="font-mono">$0.00</span>
            </div>
            {tipAmount > 0 && (
              <div className="flex justify-between text-[#4A4A5A]">
                <span>Tip</span>
                <span className="font-mono">${tipAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="border-t border-[rgba(30,90,168,0.08)] pt-3">
              <div className="flex justify-between text-xl font-bold text-[#1A1A2E]">
                <span>Total</span>
                <span className="price">${(total + tipAmount).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Scheduled Order Info */}
          {isScheduledOrder && scheduledDateTime && (
            <div className="mt-4 p-4 bg-[rgba(30,90,168,0.08)] border border-[rgba(30,90,168,0.2)] rounded-lg">
              <p className="text-sm font-semibold text-[#1E5AA8] mb-1 flex items-center gap-2">
                <ClockIcon className="w-4 h-4" />
                Scheduled Pickup
              </p>
              <p className="text-sm text-[#4A4A5A]">
                {scheduledDateTime.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}{" "}
                at{" "}
                {scheduledDateTime.toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })}
              </p>
            </div>
          )}

          <div className="mt-6 p-4 bg-[rgba(212,175,55,0.08)] border border-[rgba(212,175,55,0.2)] rounded-lg">
            <p className="text-sm text-[#4A4A5A]">
              <strong>Note:</strong>{" "}
              {isScheduledOrder
                ? "Your order will be prepared for your scheduled pickup time. Please arrive within 15 minutes of your selected time."
                : "Orders are prepared fresh. Estimated pickup time will be provided after order confirmation."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
