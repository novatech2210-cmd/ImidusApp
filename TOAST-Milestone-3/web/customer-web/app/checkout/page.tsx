"use client";

import { CustomerInfoForm } from "@/components/CustomerInfoForm";
import { OrderSummary } from "@/components/OrderSummary";
import { PaymentForm } from "@/components/PaymentForm";
import {
  PaymentProcessing,
  ProcessingStep,
} from "@/components/PaymentProcessing";
import { TimeSlotPicker } from "@/components/TimeSlotPicker";
import UpsellSuggestion from "@/components/UpsellSuggestion";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import {
  CustomerAPI,
  MenuAPI,
  OrderAPI,
  ScheduledOrderAPI,
  type PaymentToken,
} from "@/lib/api";
import { loadAcceptJS } from "@/lib/payment";
import {
  CheckCircleIcon,
  ClockIcon,
  TrophyIcon,
} from "@heroicons/react/24/solid";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

// Track upsell result via API (server-side)
async function trackUpsellResult(
  ruleId: string,
  sessionId: string,
  customerId: string | undefined,
  suggestedItemId: string,
  result: "accepted" | "declined",
  revenue: number,
): Promise<void> {
  try {
    await fetch("/api/upsell/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ruleId,
        sessionId,
        customerId,
        itemId: suggestedItemId,
        result,
        revenue,
      }),
    });
  } catch (error) {
    console.error("Failed to track upsell result:", error);
  }
}

// Token expiration threshold (14 minutes - tokens expire at 15)
const TOKEN_EXPIRATION_MS = 14 * 60 * 1000;

interface CustomerInfoData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  createAccount?: boolean;
}

export default function CheckoutPage() {
  const { items, total, subtotal, tax, clearCart, addItem } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<
    "info" | "payment" | "processing" | "success"
  >("info");

  // Customer info state
  const [customerInfo, setCustomerInfo] = useState<CustomerInfoData | null>(
    null,
  );
  const [welcomeBackName, setWelcomeBackName] = useState<string | null>(null);

  // Token tracking for retry logic
  const tokenTimestampRef = useRef<number | null>(null);
  const lastTokenRef = useRef<PaymentToken | null>(null);

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
  const [scheduledOrderId, setScheduledOrderId] = useState<number | null>(null);

  // Loyalty state
  const [useLoyalty, setUseLoyalty] = useState(false);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const loyaltyDiscount = pointsToRedeem * 0.01; // 1 point = $0.01

  // Upsell suggestions state
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);
  const [orderItems, setOrderItems] = useState<
    Array<{
      menuItemId: number;
      sizeId: number;
      quantity: number;
      unitPrice: number;
    }>
  >([]);

  // Processing step state for PaymentProcessing overlay
  const [processingStep, setProcessingStep] = useState<ProcessingStep | "idle">(
    "idle",
  );
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // 20-second timeout state for loading overlay
  const [showTimeoutMessage, setShowTimeoutMessage] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Prevent navigation during payment processing
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (
        processingStep !== "idle" &&
        processingStep !== "error" &&
        processingStep !== "success"
      ) {
        e.preventDefault();
        e.returnValue =
          "Payment is being processed. Are you sure you want to leave?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [processingStep]);

  // 20-second timeout for processing overlay
  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setShowTimeoutMessage(false);

    // Start timeout when processing begins (not idle, error, or success)
    if (
      processingStep !== "idle" &&
      processingStep !== "error" &&
      processingStep !== "success"
    ) {
      timeoutRef.current = setTimeout(() => {
        setShowTimeoutMessage(true);
      }, 20000); // 20 seconds
    }

    // Cleanup on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [processingStep]);

  // Fetch upsell suggestions when cart changes
  useEffect(() => {
    async function fetchSuggestions() {
      if (items.length === 0) {
        setSuggestions([]);
        setSuggestionsLoading(false);
        return;
      }

      try {
        setSuggestionsLoading(true);
        const response = await fetch("/api/upsell/suggestions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cart: {
              items: items.map((item) => ({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                category: item.categoryName || "",
              })),
              total: total,
            },
          }),
        });

        const data = await response.json();
        setSuggestions(data.suggestions || []);
      } catch (error) {
        console.error("Failed to fetch suggestions:", error);
        setSuggestions([]);
      } finally {
        setSuggestionsLoading(false);
      }
    }

    fetchSuggestions();
  }, [items.length, total]);

  // Check if cart is empty
  if (items.length === 0 && step !== "success") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-4">
        <div className="card card-body text-center max-w-md w-full">
          <h2 className="text-2xl font-bold text-[#1A1A2E] mb-4">
            Your cart is empty
          </h2>
          <p className="text-[#71717A] mb-6">
            Add some items from our menu to checkout.
          </p>
          <Link href="/menu" className="btn btn-primary w-full">
            Browse Menu
          </Link>
        </div>
      </div>
    );
  }

  /**
   * Handle customer info form submission
   * Performs customer lookup and creates order
   */
  const handleCustomerInfoSubmit = async (data: CustomerInfoData) => {
    setCustomerInfo(data);
    setError(null);
    setLoading(true);

    try {
      // Step 1a: Customer lookup
      const customerResponse = await CustomerAPI.lookup(data.phone, data.email);
      setCustomerId(customerResponse.customerId);

      // Check if returning customer
      if (customerResponse.firstName && customerResponse.lastName) {
        setWelcomeBackName(
          `${customerResponse.firstName} ${customerResponse.lastName}`,
        );
      }

      // Step 1b: Calculate total with tip
      const orderTotal = total + tipAmount;

      // Step 1c: Create pending order (no payment yet)
      const mappedOrderItems = items.map((item) => ({
        menuItemId: item.menuItemId,
        sizeId: item.sizeId,
        quantity: item.quantity,
        unitPrice: item.price,
      }));
      setOrderItems(mappedOrderItems);

      if (isScheduledOrder) {
        if (!scheduledDateTime) {
          throw new Error("Please select a pickup date and time");
        }

        const minTime = new Date(Date.now() + 30 * 60000);
        if (scheduledDateTime < minTime) {
          throw new Error("Pickup time must be at least 30 minutes from now");
        }

        // Scheduled orders now charge immediately (locked decision)
        // Create pending scheduled order first, then proceed to payment
        const scheduledRequest = {
          customerId: customerResponse.customerId,
          scheduledDateTime: scheduledDateTime.toISOString(),
          items: mappedOrderItems,
          tipAmount: tipAmount,
          specialInstructions: "",
          idempotencyKey: crypto.randomUUID(),
          createAccount: data.createAccount,
        };

        const orderResponse = await ScheduledOrderAPI.create(scheduledRequest);

        if (!orderResponse.success) {
          throw new Error(
            orderResponse.message || "Scheduled order creation failed",
          );
        }

        // Store scheduled order ID for payment processing
        setScheduledOrderId(orderResponse.scheduledOrderId || null);

        // Proceed to payment step
        setStep("payment");

        loadAcceptJS().catch((err: Error) => {
          console.error("Failed to load payment system:", err);
          setError("Payment system unavailable. Please try again.");
        });
      } else {
        // Immediate order: Create pending order
        const orderRequest = {
          customerId: customerResponse.customerId,
          items: mappedOrderItems,
          tipAmount: tipAmount,
          createAccount: data.createAccount,
        };

        const orderResponse = await OrderAPI.create(orderRequest);

        if (!orderResponse.success) {
          throw new Error(orderResponse.message || "Order creation failed");
        }

        setSalesId(orderResponse.salesId);
        setStep("payment");

        loadAcceptJS().catch((err: Error) => {
          console.error("Failed to load payment system:", err);
          setError("Payment system unavailable. Please try again.");
        });
      }
    } catch (err: unknown) {
      console.error("Customer/Order creation error:", err);

      // Map common POS/database errors to user-friendly messages
      let message: string;
      const errorMessage = err instanceof Error ? err.message : String(err);

      if (
        errorMessage.includes("no longer available") ||
        errorMessage.includes("out of stock")
      ) {
        // Out-of-stock items - return to cart
        message = errorMessage;
      } else if (
        errorMessage.includes("timeout") ||
        errorMessage.includes("ETIMEDOUT") ||
        errorMessage.includes("network")
      ) {
        // Network/timeout errors - show retry option
        message = "Something went wrong. Try again?";
      } else if (
        errorMessage.includes("database") ||
        errorMessage.includes("DB") ||
        errorMessage.includes("SQL")
      ) {
        // POS database errors - show friendly message
        message = "Unable to create order. Please try again.";
      } else {
        // Default fallback
        message = errorMessage || "Failed to create order. Please try again.";
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle payment form submission with token from PaymentForm component
   * PaymentForm handles tokenization; this handles backend payment processing
   *
   * For immediate orders: Charges against existing salesId
   * For scheduled orders: Processes payment and updates scheduled order with payment reference
   */
  const handlePaymentSubmit = useCallback(
    async (token: PaymentToken) => {
      // Validate we have either a salesId (immediate) or scheduledOrderId (scheduled)
      if (!salesId && !scheduledOrderId) {
        setError("Order not found. Please start over.");
        return;
      }

      // Store token and timestamp for retry logic
      tokenTimestampRef.current = Date.now();
      lastTokenRef.current = token;

      // Reset states
      setError(null);
      setPaymentError(null);
      setLoading(true);
      setStep("processing");
      setProcessingStep("charging");

      try {
        const orderTotal = total + tipAmount;

        if (isScheduledOrder && scheduledOrderId) {
          // SCHEDULED ORDER PAYMENT FLOW
          // Process payment for scheduled order using dedicated endpoint
          const paymentRequest = {
            scheduledOrderId: scheduledOrderId,
            token: {
              dataDescriptor: token.dataDescriptor,
              dataValue: token.dataValue,
            },
            amount: orderTotal,
            customerId: customerId || undefined,
          };

          const paymentResponse = await ScheduledOrderAPI.processPayment(
            scheduledOrderId,
            paymentRequest,
          );

          if (!paymentResponse.success) {
            throw new Error(
              paymentResponse.message || "Payment processing failed",
            );
          }

          // Step 3: Complete order
          setProcessingStep("completing");

          // Short delay for UX
          await new Promise((resolve) => setTimeout(resolve, 500));

          setProcessingStep("success");
          clearCart();

          // Navigate to scheduled order confirmation
          setTimeout(() => {
            router.push(
              `/order/confirmation?scheduledOrderId=${scheduledOrderId}&total=${orderTotal}&scheduled=true&scheduledDateTime=${scheduledDateTime?.toISOString()}&transactionId=${paymentResponse.transactionId || ""}`,
            );
          }, 1000);
        } else if (salesId) {
          // IMMEDIATE ORDER PAYMENT FLOW
          const paymentRequest = {
            token: {
              dataDescriptor: token.dataDescriptor,
              dataValue: token.dataValue,
            },
            amount: orderTotal - loyaltyDiscount,
            customerId: customerId || undefined,
            pointsToRedeem: useLoyalty ? pointsToRedeem : 0,
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

          // Step 3: Complete order
          setProcessingStep("completing");

          // Short delay for UX
          await new Promise((resolve) => setTimeout(resolve, 500));

          setProcessingStep("success");
          clearCart();

          // Navigate after showing success briefly
          setTimeout(() => {
            router.push(
              `/order/confirmation?orderId=${paymentResponse.dailyOrderNumber}&total=${orderTotal}&transactionId=${paymentResponse.transactionId}&orderNumber=${paymentResponse.dailyOrderNumber}`,
            );
          }, 1000);
        }
      } catch (err: unknown) {
        console.error("Payment error:", err);
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Payment processing failed. Please try again.";
        setPaymentError(errorMessage);
        setProcessingStep("error");
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [
      salesId,
      scheduledOrderId,
      isScheduledOrder,
      scheduledDateTime,
      total,
      tipAmount,
      customerId,
      clearCart,
      router,
    ],
  );

  /**
   * Check if the last token is still valid (< 14 minutes old)
   */
  const isTokenValid = useCallback((): boolean => {
    if (!tokenTimestampRef.current || !lastTokenRef.current) {
      return false;
    }
    return Date.now() - tokenTimestampRef.current < TOKEN_EXPIRATION_MS;
  }, []);

  /**
   * Handle retry from PaymentProcessing overlay
   * If token is still valid (< 14 min), allow retry with same token
   * Otherwise, return to payment form for re-tokenization
   */
  const handlePaymentRetry = useCallback(() => {
    setProcessingStep("idle");
    setPaymentError(null);

    // Check if we can retry with existing token
    if (isTokenValid() && lastTokenRef.current) {
      // Retry with existing token
      handlePaymentSubmit(lastTokenRef.current);
    } else {
      // Token expired - need re-tokenization
      if (tokenTimestampRef.current) {
        setError("Session expired. Please re-enter your card details.");
      }
      tokenTimestampRef.current = null;
      lastTokenRef.current = null;
      setStep("payment");
    }
  }, [isTokenValid, handlePaymentSubmit]);

  // Handle going back to customer info step
  const handleBackToInfo = () => {
    setStep("info");
    setSalesId(null);
  };

  // Handle accept upsell suggestion
  const handleAcceptSuggestion = async (itemId: string) => {
    const suggestion = suggestions.find((s) => s.suggestion.itemId === itemId);
    if (!suggestion) return;

    try {
      // Fetch item sizes from POS
      const itemSizes = await MenuAPI.getItemSizes(parseInt(itemId, 10));

      // Find first in-stock size
      const availableSize = itemSizes.find((s) => s.inStock) || itemSizes[0];
      if (!availableSize) {
        console.error("No sizes available for item:", itemId);
        return;
      }

      // Calculate final price with discount
      let finalPrice = availableSize.price;
      if (suggestion.suggestion.discountPercent) {
        finalPrice =
          availableSize.price *
          (1 - suggestion.suggestion.discountPercent / 100);
      } else if (suggestion.suggestion.discountAmount) {
        finalPrice = availableSize.price - suggestion.suggestion.discountAmount;
      }

      // Add item to cart
      addItem({
        menuItemId: parseInt(itemId, 10),
        sizeId: availableSize.sizeId,
        name: suggestion.suggestion.itemName,
        sizeName: availableSize.sizeName,
        price: finalPrice,
        image: suggestion.suggestion.imageUrl,
      });

      // Track the acceptance
      await trackUpsellResult(
        suggestion.ruleId,
        "", // sessionId - would come from session
        undefined, // customerId
        itemId,
        "accepted",
        finalPrice,
      );
    } catch (error) {
      console.error("Failed to add upsell item to cart:", error);
      // Still track the acceptance attempt
      await trackUpsellResult(
        suggestion.ruleId,
        "", // sessionId - would come from session
        undefined, // customerId
        itemId,
        "accepted",
        suggestion.suggestion.finalPrice,
      );
    }
  };

  // Handle decline upsell suggestion
  const handleDeclineSuggestion = async (itemId: string) => {
    const suggestion = suggestions.find((s) => s.suggestion.itemId === itemId);
    if (!suggestion) return;

    // Track the decline
    await trackUpsellResult(
      suggestion.ruleId,
      "", // sessionId - would come from session
      undefined, // customerId
      itemId,
      "declined",
      0,
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-[#1E5AA8] mb-6 sm:mb-8 tracking-tight">
        Checkout
      </h1>

      {/* Progress Steps - Improved with labels */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span
            className={`text-sm font-semibold ${step === "info" ? "text-[#D4AF37]" : "text-[#1E5AA8]"}`}
          >
            1. Customer Info
          </span>
          <span
            className={`text-sm font-semibold ${step === "payment" || step === "processing" ? "text-[#D4AF37]" : step === "success" ? "text-[#1E5AA8]" : "text-gray-400"}`}
          >
            2. Payment
          </span>
        </div>
        <div className="flex items-center">
          <div
            className={`flex-1 h-2 rounded-full ${step === "info" ? "bg-[#D4AF37]" : "bg-[#1E5AA8]"}`}
          />
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center mx-2 ${step === "info" ? "bg-[#D4AF37] text-white" : "bg-[#1E5AA8] text-white"}`}
          >
            {step !== "info" ? <CheckCircleIcon className="w-5 h-5" /> : "1"}
          </div>
          <div
            className={`flex-1 h-2 rounded-full ${step === "payment" || step === "processing" || step === "success" ? "bg-[#1E5AA8]" : "bg-gray-200"}`}
          />
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center mx-2 ${step === "payment" || step === "processing" ? "bg-[#D4AF37] text-white" : step === "success" ? "bg-[#1E5AA8] text-white" : "bg-gray-200 text-gray-400"}`}
          >
            {step === "success" ? <CheckCircleIcon className="w-5 h-5" /> : "2"}
          </div>
          <div
            className={`flex-1 h-2 rounded-full ${step === "success" ? "bg-[#1E5AA8]" : "bg-gray-200"}`}
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
          {error}
        </div>
      )}

      {/* Welcome back message */}
      {welcomeBackName && step === "payment" && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
          <CheckCircleIcon className="w-5 h-5" />
          <span>
            Welcome back, <strong>{welcomeBackName}</strong>!
          </span>
        </div>
      )}

      <div className="grid lg:grid-cols-5 gap-6 lg:gap-8">
        {/* Left Column - Forms (3 cols) */}
        <div className="lg:col-span-3">
          {step === "info" && (
            <div className="space-y-6">
              {/* Customer Information Form */}
              <div className="card card-body">
                <h2 className="text-xl font-bold text-[#1A1A2E] mb-6">
                  Customer Information
                </h2>

                <CustomerInfoForm
                  initialValues={
                    user
                      ? {
                          firstName: user.firstName,
                          lastName: user.lastName,
                          email: user.email,
                        }
                      : undefined
                  }
                  onSubmit={handleCustomerInfoSubmit}
                  isLoading={loading}
                  submitLabel="Continue to Payment"
                />
              </div>

              {/* Tip Selection - Separate card */}
              <div className="card card-body">
                <h3 className="text-lg font-bold text-[#1A1A2E] mb-4">
                  Add a Tip (Optional)
                </h3>

                <div className="grid grid-cols-4 gap-2 mb-3">
                  {[0, 2, 5, 10].map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => {
                        setTipAmount(amount);
                        setShowCustomTip(false);
                        setCustomTip("");
                      }}
                      className={`py-3 px-3 rounded-lg border-2 font-semibold transition-all ${
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
                    ? "Back to preset tips"
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
              <div className="card card-body">
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
            </div>
          )}

          {/* Upsell Suggestions */}
          {!suggestionsLoading && suggestions.length > 0 && (
            <div className="space-y-6">
              <div className="card card-body">
                <h3 className="text-lg font-semibold text-[#1A1A2E] mb-4">
                  Complete Your Order
                </h3>
                {suggestions.map((suggestion, index) => (
                  <UpsellSuggestion
                    key={`${suggestion.ruleId}-${index}`}
                    suggestion={suggestion.suggestion}
                    onAccept={handleAcceptSuggestion}
                    onDecline={handleDeclineSuggestion}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Loyalty Points Section */}
          {user && user.earnedPoints > 0 && (
            <div className="card card-body border-[#D4AF37]/30 bg-[#D4AF37]/5 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-[#1A1A2E] flex items-center gap-2">
                    <TrophyIcon className="w-5 h-5 text-[#D4AF37]" />
                    Loyalty Rewards
                  </h3>
                  <p className="text-sm text-[#71717A]">
                    You have <strong>{user.earnedPoints}</strong> points
                    available
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={useLoyalty}
                    onChange={(e) => {
                      setUseLoyalty(e.target.checked);
                      if (e.target.checked) {
                        // Max points that can be used (cannot exceed total or available points)
                        const maxRedeemablePoints = Math.min(
                          user.earnedPoints,
                          Math.floor((total + tipAmount) * 100),
                        );
                        setPointsToRedeem(maxRedeemablePoints);
                      } else {
                        setPointsToRedeem(0);
                      }
                    }}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#D4AF37]"></div>
                </label>
              </div>

              {useLoyalty && (
                <div className="animate-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center gap-4 bg-white p-3 rounded-lg border border-[#D4AF37]/20">
                    <div className="flex-1">
                      <p className="text-xs font-bold uppercase text-[#71717A] mb-1">
                        Redeeming
                      </p>
                      <p className="text-lg font-mono font-bold text-[#D4AF37]">
                        {pointsToRedeem} Points
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold uppercase text-[#71717A] mb-1">
                        Discount
                      </p>
                      <p className="text-lg font-mono font-bold text-[#2E7D32]">
                        -${loyaltyDiscount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <p className="text-[10px] text-[#71717A] mt-2 italic text-center">
                    * Points are deducted from your balance upon successful
                    order completion.
                  </p>
                </div>
              )}
            </div>
          )}

          {step === "payment" && (
            <PaymentForm
              onSubmit={handlePaymentSubmit}
              amount={total + tipAmount - loyaltyDiscount}
              isLoading={loading}
              error={error}
              onBack={handleBackToInfo}
            />
          )}

          {step === "processing" && processingStep === "idle" && (
            <div className="card card-body text-center">
              <div className="w-16 h-16 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <h2 className="text-xl font-bold text-[#1A1A2E] mb-2">
                Processing Payment...
              </h2>
              <p className="text-[#4A4A5A]">Please do not close this window</p>
            </div>
          )}
        </div>

        {/* Right Column - Order Summary (2 cols, sticky) */}
        <div className="lg:col-span-2">
          <div className="card card-body lg:sticky lg:top-6">
            <h2 className="text-xl font-bold text-[#1A1A2E] mb-6">
              Order Summary
            </h2>

            <OrderSummary
              items={items}
              subtotal={subtotal}
              tax={tax}
              total={total}
              tipAmount={tipAmount}
              loyaltyDiscount={loyaltyDiscount}
            />

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

      {/* Payment Processing Overlay */}
      {processingStep !== "idle" && (
        <PaymentProcessing
          step={processingStep}
          error={paymentError || undefined}
          onRetry={handlePaymentRetry}
          showTimeoutMessage={showTimeoutMessage}
        />
      )}
    </div>
  );
}
