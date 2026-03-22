/**
 * Form Validation Utilities
 * Comprehensive validators for all form inputs in the IMIDUS mobile app.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\d{10}$/;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 100;

/**
 * Validates an email address format
 */
export const validateEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') {
    return false;
  }
  return EMAIL_REGEX.test(email.trim());
};

/**
 * Validates a US phone number (10 digits)
 */
export const validatePhone = (phone: string): boolean => {
  if (!phone || typeof phone !== 'string') {
    return false;
  }
  const cleaned = phone.replace(/\D/g, '');
  return PHONE_REGEX.test(cleaned);
};

export interface PasswordValidationResult {
  valid: boolean;
  message: string;
  strength: 'weak' | 'fair' | 'good' | 'strong';
  checks: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
  };
}

/**
 * Validates password strength and returns detailed feedback
 */
export const validatePassword = (password: string): PasswordValidationResult => {
  const checks = {
    minLength: password.length >= PASSWORD_MIN_LENGTH,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };

  const passedChecks = Object.values(checks).filter(Boolean).length;

  let strength: PasswordValidationResult['strength'] = 'weak';
  if (passedChecks >= 5) {
    strength = 'strong';
  } else if (passedChecks >= 4) {
    strength = 'good';
  } else if (passedChecks >= 3) {
    strength = 'fair';
  }

  if (!password) {
    return {
      valid: false,
      message: 'Password is required',
      strength: 'weak',
      checks,
    };
  }

  if (password.length > PASSWORD_MAX_LENGTH) {
    return {
      valid: false,
      message: `Password must be less than ${PASSWORD_MAX_LENGTH} characters`,
      strength: 'weak',
      checks,
    };
  }

  if (!checks.minLength) {
    return {
      valid: false,
      message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
      strength: 'weak',
      checks,
    };
  }

  const meetsMinimum = checks.minLength && (checks.hasUppercase || checks.hasLowercase) && checks.hasNumber;

  if (!meetsMinimum) {
    return {
      valid: false,
      message: 'Password must contain letters and at least one number',
      strength,
      checks,
    };
  }

  const strengthMessages: Record<PasswordValidationResult['strength'], string> = {
    strong: 'Excellent password strength',
    good: 'Good password strength',
    fair: 'Fair password strength - consider adding special characters',
    weak: 'Weak password',
  };

  return {
    valid: true,
    message: strengthMessages[strength],
    strength,
    checks,
  };
};

/**
 * Validates a credit card number using Luhn algorithm
 */
export const validateCardNumber = (cardNumber: string): boolean => {
  if (!cardNumber || typeof cardNumber !== 'string') {
    return false;
  }

  const cleaned = cardNumber.replace(/[\s-]/g, '');
  if (!/^\d{13,19}$/.test(cleaned)) {
    return false;
  }

  let sum = 0;
  let isEven = false;

  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i], 10);

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
};

/**
 * Validates CVV (3-4 digits)
 */
export const validateCVV = (cvv: string): boolean => {
  if (!cvv || typeof cvv !== 'string') {
    return false;
  }
  return /^\d{3,4}$/.test(cvv);
};

/**
 * Validates card expiration date
 */
export const validateExpiry = (month: string, year: string): boolean => {
  const monthNum = parseInt(month, 10);
  const yearNum = parseInt(year, 10);

  if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
    return false;
  }

  if (isNaN(yearNum)) {
    return false;
  }

  let fullYear = yearNum;
  if (year.length === 2) {
    fullYear = 2000 + yearNum;
  } else if (year.length !== 4) {
    return false;
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  if (fullYear < currentYear) {
    return false;
  }

  if (fullYear === currentYear && monthNum < currentMonth) {
    return false;
  }

  if (fullYear > currentYear + 20) {
    return false;
  }

  return true;
};

const ERROR_MESSAGES: Record<string, Record<string, string>> = {
  email: {
    required: 'Email is required',
    invalid: 'Please enter a valid email address',
  },
  phone: {
    required: 'Phone number is required',
    invalid: 'Please enter a valid 10-digit phone number',
  },
  password: {
    required: 'Password is required',
    invalid: 'Password does not meet requirements',
    mismatch: 'Passwords do not match',
  },
  confirmPassword: {
    required: 'Please confirm your password',
    mismatch: 'Passwords do not match',
  },
  firstName: {
    required: 'First name is required',
    invalid: 'First name must be 1-50 characters',
  },
  lastName: {
    required: 'Last name is required',
    invalid: 'Last name must be 1-50 characters',
  },
  cardNumber: {
    required: 'Card number is required',
    invalid: 'Please enter a valid card number',
  },
  cvv: {
    required: 'CVV is required',
    invalid: 'CVV must be 3-4 digits',
  },
  generic: {
    required: 'This field is required',
    invalid: 'Invalid value',
    network: 'Network error. Please check your connection.',
  },
};

/**
 * Gets a user-friendly error message for a field and error type
 */
export const getErrorMessage = (fieldName: string, errorType: string): string => {
  const fieldMessages = ERROR_MESSAGES[fieldName];
  if (fieldMessages && fieldMessages[errorType]) {
    return fieldMessages[errorType];
  }
  return ERROR_MESSAGES.generic[errorType] || ERROR_MESSAGES.generic.invalid;
};

/**
 * Validates a name field (first name, last name)
 */
export const validateName = (name: string, maxLength: number = 50): boolean => {
  if (!name || typeof name !== 'string') {
    return false;
  }
  const trimmed = name.trim();
  return trimmed.length >= 1 && trimmed.length <= maxLength;
};

/**
 * Format phone number as (XXX) XXX-XXXX
 */
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  const limited = cleaned.substring(0, 10);

  if (limited.length <= 3) {
    return limited;
  } else if (limited.length <= 6) {
    return `(${limited.slice(0, 3)}) ${limited.slice(3)}`;
  } else {
    return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`;
  }
};

/**
 * Format card number with spaces every 4 digits
 */
export const formatCardNumber = (cardNumber: string): string => {
  const cleaned = cardNumber.replace(/\D/g, '');
  const limited = cleaned.substring(0, 16);
  const chunks = limited.match(/.{1,4}/g) || [];
  return chunks.join(' ');
};

export type CardType = 'visa' | 'mastercard' | 'amex' | 'discover' | 'unknown';

/**
 * Detect card type from card number
 */
export const detectCardType = (cardNumber: string): CardType => {
  const cleaned = cardNumber.replace(/[\s-]/g, '');

  if (/^4/.test(cleaned)) return 'visa';
  if (/^5[1-5]/.test(cleaned) || /^2[2-7]/.test(cleaned)) return 'mastercard';
  if (/^3[47]/.test(cleaned)) return 'amex';
  if (/^6011|^622|^64[4-9]|^65/.test(cleaned)) return 'discover';

  return 'unknown';
};
