/**
 * Authorize.net Accept.js integration for secure card tokenization
 *
 * Card data goes directly to Authorize.net servers - NEVER touches our backend
 * Tokens have 15-minute expiration and are single-use
 */

// ── Accept.js SDK Types ─────────────────────────────────────────────────

declare global {
  interface Window {
    Accept?: {
      dispatchData: (
        secureData: AcceptSecureData,
        callback: (response: AcceptResponse) => void,
      ) => void;
    };
  }
}

interface AcceptSecureData {
  authData: {
    clientKey: string;
    apiLoginID: string;
  };
  cardData: {
    cardNumber: string;
    month: string;
    year: string;
    cardCode: string;
  };
}

interface AcceptResponse {
  messages: {
    resultCode: "Ok" | "Error";
    message: Array<{ code: string; text: string }>;
  };
  opaqueData?: {
    dataDescriptor: string;
    dataValue: string;
  };
}

// ── Exported Types ──────────────────────────────────────────────────────

export interface PaymentToken {
  dataDescriptor: string;
  dataValue: string;
}

export interface CardData {
  cardNumber: string;
  expirationMonth: string;
  expirationYear: string;
  cvv: string;
}

export type CardType = "visa" | "mastercard" | "amex" | "discover" | "unknown";

// ── Error Handling ──────────────────────────────────────────────────────

/**
 * User-friendly error messages mapped from Accept.js error codes
 */
const ERROR_CODE_MAP: Record<string, string> = {
  E_WC_05: "Invalid credit card number",
  E_WC_06: "Invalid expiration date",
  E_WC_07: "Invalid card code (CVV)",
  E_WC_08: "Expired card",
  E_WC_10: "Card declined",
  E_WC_14: "Token expired. Please re-enter your card details",
  E_WC_15: "Network error. Please try again",
  E_WC_17: "Invalid client key",
  E_WC_19: "Invalid API Login ID",
  E_WC_21: "Payment data could not be processed",
};

/**
 * Custom error class for card validation and tokenization errors
 */
export class CardValidationError extends Error {
  public readonly code: string;
  public readonly userMessage: string;

  constructor(code: string, technicalMessage: string) {
    const userMessage =
      ERROR_CODE_MAP[code] || "Payment processing failed. Please try again";
    super(technicalMessage);
    this.name = "CardValidationError";
    this.code = code;
    this.userMessage = userMessage;
    Object.setPrototypeOf(this, CardValidationError.prototype);
  }
}

// ── Script Loading ──────────────────────────────────────────────────────

let acceptJSPromise: Promise<void> | null = null;

/**
 * Load Accept.js SDK script asynchronously
 * Idempotent - only loads once per page session
 *
 * @returns Promise that resolves when SDK is ready
 */
export function loadAcceptJS(): Promise<void> {
  // Return existing promise if already loading/loaded
  if (acceptJSPromise) {
    return acceptJSPromise;
  }

  acceptJSPromise = new Promise<void>((resolve, reject) => {
    // SSR guard
    if (typeof window === "undefined") {
      reject(new Error("Accept.js requires browser environment"));
      return;
    }

    // Already loaded
    if (window.Accept) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    // Always use base Accept.js (not AcceptUI which adds hosted form)
    script.src = "https://js.authorize.net/v1/Accept.js";
    script.async = true;
    script.id = "authorize-net-accept-js";

    script.onload = () => {
      if (window.Accept) {
        resolve();
      } else {
        reject(new Error("Accept.js loaded but Accept object not available"));
      }
    };

    script.onerror = () => {
      acceptJSPromise = null; // Reset so it can be retried
      reject(new CardValidationError("E_WC_15", "Failed to load payment SDK"));
    };

    document.body.appendChild(script);
  });

  return acceptJSPromise;
}

// ── Card Validation ─────────────────────────────────────────────────────

/**
 * Luhn algorithm for credit card number validation
 * Returns true if card number passes checksum validation
 */
export function validateLuhn(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, "");

  if (digits.length < 13 || digits.length > 19) {
    return false;
  }

  let sum = 0;
  let isEven = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

/**
 * Detect card type from BIN (Bank Identification Number)
 * First 4-6 digits of card number identify the issuer
 */
export function detectCardType(cardNumber: string): CardType {
  const digits = cardNumber.replace(/\D/g, "");

  // Visa: starts with 4
  if (/^4/.test(digits)) {
    return "visa";
  }

  // Mastercard: starts with 51-55 or 2221-2720
  if (
    /^5[1-5]/.test(digits) ||
    /^2(2[2-9][1-9]|2[3-9]\d|[3-6]\d{2}|7[01]\d|720)/.test(digits)
  ) {
    return "mastercard";
  }

  // Amex: starts with 34 or 37
  if (/^3[47]/.test(digits)) {
    return "amex";
  }

  // Discover: starts with 6011, 622126-622925, 644-649, 65
  if (
    /^(6011|622(12[6-9]|1[3-9]\d|[2-8]\d{2}|9[01]\d|92[0-5])|64[4-9]|65)/.test(
      digits,
    )
  ) {
    return "discover";
  }

  return "unknown";
}

/**
 * Get CVV length requirement based on card type
 * Amex uses 4-digit CID, others use 3-digit CVV/CVC
 */
export function getCvvLength(cardType: CardType): number {
  return cardType === "amex" ? 4 : 3;
}

/**
 * Validate expiration date is in the future
 */
export function validateExpiry(month: string, year: string): boolean {
  const expMonth = parseInt(month, 10);
  const expYear = parseInt(year.length === 2 ? `20${year}` : year, 10);

  if (isNaN(expMonth) || isNaN(expYear)) {
    return false;
  }

  if (expMonth < 1 || expMonth > 12) {
    return false;
  }

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  if (expYear < currentYear) {
    return false;
  }

  if (expYear === currentYear && expMonth < currentMonth) {
    return false;
  }

  return true;
}

// ── Tokenization ────────────────────────────────────────────────────────

/**
 * Tokenize card data via Accept.js
 * Card data goes directly to Authorize.net - never touches our backend
 *
 * @param cardData Credit card information
 * @param apiLoginId Authorize.net API Login ID
 * @param clientKey Authorize.net Public Client Key
 * @returns Opaque payment token (15-minute expiration, single-use)
 * @throws CardValidationError with user-friendly message
 */
export async function tokenizeCard(
  cardData: CardData,
  apiLoginId: string,
  clientKey: string,
): Promise<PaymentToken> {
  // Ensure SDK is loaded
  await loadAcceptJS();

  if (!window.Accept) {
    throw new CardValidationError("E_WC_15", "Payment SDK not available");
  }

  // Clean card number (remove spaces/dashes)
  const cleanCardNumber = cardData.cardNumber.replace(/\D/g, "");

  // Pre-validate card number with Luhn
  if (!validateLuhn(cleanCardNumber)) {
    throw new CardValidationError("E_WC_05", "Card number fails Luhn check");
  }

  // Pre-validate expiry
  if (!validateExpiry(cardData.expirationMonth, cardData.expirationYear)) {
    throw new CardValidationError("E_WC_08", "Card is expired");
  }

  // Format year (always 4 digits for Accept.js)
  const fullYear =
    cardData.expirationYear.length === 2
      ? `20${cardData.expirationYear}`
      : cardData.expirationYear;

  const secureData: AcceptSecureData = {
    authData: {
      clientKey,
      apiLoginID: apiLoginId,
    },
    cardData: {
      cardNumber: cleanCardNumber,
      month: cardData.expirationMonth.padStart(2, "0"),
      year: fullYear,
      cardCode: cardData.cvv,
    },
  };

  return new Promise<PaymentToken>((resolve, reject) => {
    window.Accept!.dispatchData(secureData, (response: AcceptResponse) => {
      if (response.messages.resultCode === "Error") {
        const errorMsg = response.messages.message[0];
        reject(
          new CardValidationError(
            errorMsg?.code || "UNKNOWN",
            errorMsg?.text || "Payment processing failed",
          ),
        );
      } else if (response.opaqueData) {
        resolve({
          dataDescriptor: response.opaqueData.dataDescriptor,
          dataValue: response.opaqueData.dataValue,
        });
      } else {
        reject(
          new CardValidationError(
            "UNKNOWN",
            "No token received from payment gateway",
          ),
        );
      }
    });
  });
}

// ── Utility Functions ───────────────────────────────────────────────────

/**
 * Format card number with spaces for display
 * "4111111111111111" -> "4111 1111 1111 1111"
 */
export function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

/**
 * Format expiry date with slash
 * "1225" -> "12/25"
 */
export function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length >= 2) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  return digits;
}

/**
 * Get card brand display name
 */
export function getCardBrandName(cardType: CardType): string {
  const names: Record<CardType, string> = {
    visa: "Visa",
    mastercard: "Mastercard",
    amex: "American Express",
    discover: "Discover",
    unknown: "Card",
  };
  return names[cardType];
}
