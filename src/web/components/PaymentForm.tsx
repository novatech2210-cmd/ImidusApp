"use client";

import {
  CardValidationError,
  detectCardType,
  formatCardNumber,
  formatExpiry,
  getCvvLength,
  tokenizeCard,
  validateExpiry,
  validateLuhn,
  type CardType,
  type PaymentToken,
} from "@/lib/payment";
import { CreditCardIcon, LockClosedIcon } from "@heroicons/react/24/solid";
import { useCallback, useEffect, useState } from "react";

// ── Props Interface ─────────────────────────────────────────────────────

export interface PaymentFormProps {
  onSubmit: (token: PaymentToken) => Promise<void>;
  amount: number;
  isLoading?: boolean;
  error?: string | null;
  onBack?: () => void;
}

// ── Card Brand Icons ────────────────────────────────────────────────────

const CardBrandIcon = ({ cardType }: { cardType: CardType }) => {
  const icons: Record<CardType, string> = {
    visa: "V",
    mastercard: "MC",
    amex: "AX",
    discover: "D",
    unknown: "",
  };

  const colors: Record<CardType, string> = {
    visa: "bg-blue-600",
    mastercard: "bg-orange-500",
    amex: "bg-blue-400",
    discover: "bg-orange-600",
    unknown: "bg-gray-400",
  };

  if (cardType === "unknown") {
    return null;
  }

  return (
    <span
      className={`inline-flex items-center justify-center w-8 h-5 rounded text-xs font-bold text-white ${colors[cardType]}`}
    >
      {icons[cardType]}
    </span>
  );
};

// ── Validation Error Display ────────────────────────────────────────────

const FieldError = ({ message }: { message?: string }) => {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-600 font-medium">{message}</p>;
};

// ── PaymentForm Component ───────────────────────────────────────────────

export function PaymentForm({
  onSubmit,
  amount,
  isLoading = false,
  error,
  onBack,
}: PaymentFormProps) {
  // Form state
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  // Derived state
  const [cardType, setCardType] = useState<CardType>("unknown");
  const [isTokenizing, setIsTokenizing] = useState(false);

  // Validation errors (field-specific)
  const [errors, setErrors] = useState<{
    cardNumber?: string;
    expiry?: string;
    cvv?: string;
    general?: string;
  }>({});

  // Environment variables for Authorize.net
  const apiLoginId = process.env.NEXT_PUBLIC_AUTH_NET_API_LOGIN_ID || "";
  const clientKey = process.env.NEXT_PUBLIC_AUTH_NET_PUBLIC_KEY || "";

  // Update card type as user types
  useEffect(() => {
    const newCardType = detectCardType(cardNumber);
    setCardType(newCardType);
  }, [cardNumber]);

  // ── Input Handlers ────────────────────────────────────────────────────

  const handleCardNumberChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatCardNumber(e.target.value);
      setCardNumber(formatted);
      // Clear error on change
      setErrors((prev) => ({ ...prev, cardNumber: undefined }));
    },
    [],
  );

  const handleExpiryChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatExpiry(e.target.value);
      setExpiry(formatted);
      setErrors((prev) => ({ ...prev, expiry: undefined }));
    },
    [],
  );

  const handleCvvChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const digits = e.target.value.replace(/\D/g, "");
      const maxLen = getCvvLength(cardType);
      setCvv(digits.slice(0, maxLen));
      setErrors((prev) => ({ ...prev, cvv: undefined }));
    },
    [cardType],
  );

  // ── Validation ────────────────────────────────────────────────────────

  const validateCardNumber = useCallback((): boolean => {
    const cleanNumber = cardNumber.replace(/\s/g, "");
    if (!cleanNumber) {
      setErrors((prev) => ({ ...prev, cardNumber: "Card number is required" }));
      return false;
    }
    if (cleanNumber.length < 13) {
      setErrors((prev) => ({
        ...prev,
        cardNumber: "Card number is too short",
      }));
      return false;
    }
    if (!validateLuhn(cleanNumber)) {
      setErrors((prev) => ({ ...prev, cardNumber: "Invalid card number" }));
      return false;
    }
    return true;
  }, [cardNumber]);

  const validateExpiryField = useCallback((): boolean => {
    const [month, year] = expiry.split("/");
    if (!month || !year || year.length < 2) {
      setErrors((prev) => ({ ...prev, expiry: "Enter expiry as MM/YY" }));
      return false;
    }
    if (!validateExpiry(month, year)) {
      setErrors((prev) => ({ ...prev, expiry: "Card is expired" }));
      return false;
    }
    return true;
  }, [expiry]);

  const validateCvvField = useCallback((): boolean => {
    const requiredLength = getCvvLength(cardType);
    if (!cvv) {
      setErrors((prev) => ({ ...prev, cvv: "CVV is required" }));
      return false;
    }
    if (cvv.length < requiredLength) {
      setErrors((prev) => ({
        ...prev,
        cvv: `CVV must be ${requiredLength} digits`,
      }));
      return false;
    }
    return true;
  }, [cvv, cardType]);

  const validateAll = useCallback((): boolean => {
    const cardValid = validateCardNumber();
    const expiryValid = validateExpiryField();
    const cvvValid = validateCvvField();
    return cardValid && expiryValid && cvvValid;
  }, [validateCardNumber, validateExpiryField, validateCvvField]);

  // ── Form Submission ───────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    setErrors({});

    // Validate all fields
    if (!validateAll()) {
      return;
    }

    // Check credentials
    if (!apiLoginId || !clientKey) {
      setErrors({
        general: "Payment configuration missing. Please contact support.",
      });
      return;
    }

    setIsTokenizing(true);

    try {
      const [month, year] = expiry.split("/");

      const token = await tokenizeCard(
        {
          cardNumber: cardNumber.replace(/\s/g, ""),
          expirationMonth: month,
          expirationYear: year,
          cvv,
        },
        apiLoginId,
        clientKey,
      );

      // Pass token to parent handler
      await onSubmit(token);
    } catch (err) {
      if (err instanceof CardValidationError) {
        // Map to appropriate field or show as general error
        if (err.code === "E_WC_05") {
          setErrors({ cardNumber: err.userMessage });
        } else if (err.code === "E_WC_06" || err.code === "E_WC_08") {
          setErrors({ expiry: err.userMessage });
        } else if (err.code === "E_WC_07") {
          setErrors({ cvv: err.userMessage });
        } else {
          setErrors({ general: err.userMessage });
        }
      } else {
        setErrors({ general: "Payment processing failed. Please try again." });
      }
    } finally {
      setIsTokenizing(false);
    }
  };

  const disabled = isLoading || isTokenizing;
  const cvvMaxLength = getCvvLength(cardType);

  return (
    <form onSubmit={handleSubmit} className="card card-body">
      <div className="flex items-center gap-2 mb-6">
        <CreditCardIcon className="w-6 h-6 text-[#1E5AA8]" />
        <h2 className="text-xl font-bold text-[#1A1A2E]">
          Payment Information
        </h2>
      </div>

      {/* Global error display */}
      {(error || errors.general) && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4">
          {error || errors.general}
        </div>
      )}

      {/* Card Number */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-[#4A4A5A] mb-2">
          Card Number *
        </label>
        <div className="relative">
          <input
            type="text"
            inputMode="numeric"
            autoComplete="cc-number"
            required
            maxLength={19}
            value={cardNumber}
            onChange={handleCardNumberChange}
            onBlur={validateCardNumber}
            disabled={disabled}
            className={`input font-mono pr-12 ${errors.cardNumber ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}`}
            placeholder="1234 5678 9012 3456"
            aria-invalid={!!errors.cardNumber}
            aria-describedby={
              errors.cardNumber ? "card-number-error" : undefined
            }
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <CardBrandIcon cardType={cardType} />
          </div>
        </div>
        <FieldError message={errors.cardNumber} />
      </div>

      {/* Expiry and CVV Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Expiry */}
        <div>
          <label className="block text-sm font-semibold text-[#4A4A5A] mb-2">
            Expiry (MM/YY) *
          </label>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="cc-exp"
            required
            maxLength={5}
            value={expiry}
            onChange={handleExpiryChange}
            onBlur={validateExpiryField}
            disabled={disabled}
            className={`input font-mono ${errors.expiry ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}`}
            placeholder="12/25"
            aria-invalid={!!errors.expiry}
            aria-describedby={errors.expiry ? "expiry-error" : undefined}
          />
          <FieldError message={errors.expiry} />
        </div>

        {/* CVV */}
        <div>
          <label className="block text-sm font-semibold text-[#4A4A5A] mb-2">
            {cardType === "amex" ? "CID" : "CVV"} *
          </label>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="cc-csc"
            required
            maxLength={cvvMaxLength}
            value={cvv}
            onChange={handleCvvChange}
            onBlur={validateCvvField}
            disabled={disabled}
            className={`input font-mono ${errors.cvv ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}`}
            placeholder={cardType === "amex" ? "1234" : "123"}
            aria-invalid={!!errors.cvv}
            aria-describedby={errors.cvv ? "cvv-error" : undefined}
          />
          <FieldError message={errors.cvv} />
        </div>
      </div>

      {/* Security Badge */}
      <div className="flex items-center gap-2 mb-6 text-sm text-[#4A4A5A]">
        <LockClosedIcon className="w-4 h-4" />
        <span>Your payment is secured with SSL encryption</span>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={disabled}
        className="w-full btn btn-gold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isTokenizing ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Securing card...
          </span>
        ) : isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Processing...
          </span>
        ) : (
          `Pay $${(amount || 0).toFixed(2)}`
        )}
      </button>

      {/* Back Button */}
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          disabled={disabled}
          className="w-full mt-3 py-2 text-[#4A4A5A] hover:text-[#1E5AA8] font-medium disabled:opacity-50"
        >
          &larr; Back to Customer Info
        </button>
      )}
    </form>
  );
}

export default PaymentForm;
