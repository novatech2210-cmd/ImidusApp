"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";

interface CustomerInfoData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
}

interface CustomerInfoFormProps {
  initialValues?: Partial<CustomerInfoData>;
  onSubmit: (data: CustomerInfoData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  submitLabel?: string;
}

/**
 * Formats a phone number as (XXX) XXX-XXXX
 * Strips non-digits and formats progressively as user types
 */
function formatPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, "");

  if (digits.length === 0) return "";
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

/**
 * Validates phone number format (10 digits)
 */
function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 10;
}

/**
 * Validates email format
 */
function isValidEmail(email: string): boolean {
  if (!email) return true; // Email is optional
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * CustomerInfoForm - Validated customer information form
 *
 * Features:
 * - Pre-fills from logged-in user context
 * - Phone number auto-formatting as (XXX) XXX-XXXX
 * - Inline validation with error messages
 * - Accessible with proper labels and aria attributes
 */
export function CustomerInfoForm({
  initialValues,
  onSubmit,
  onCancel,
  isLoading = false,
  submitLabel = "Continue",
}: CustomerInfoFormProps) {
  const { user } = useAuth();

  const [formData, setFormData] = useState<CustomerInfoData>({
    firstName: initialValues?.firstName || "",
    lastName: initialValues?.lastName || "",
    phone: initialValues?.phone || "",
    email: initialValues?.email || "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Pre-fill from user context if logged in and no initial values
  useEffect(() => {
    if (user && !initialValues) {
      setFormData((prev) => ({
        ...prev,
        firstName: prev.firstName || user.firstName || "",
        lastName: prev.lastName || user.lastName || "",
        email: prev.email || user.email || "",
      }));
    }
  }, [user, initialValues]);

  /**
   * Validates all fields and returns whether form is valid
   */
  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!isValidPhone(formData.phone)) {
      newErrors.phone = "Please enter a valid 10-digit phone number";
    }

    if (formData.email && !isValidEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  /**
   * Check if form can be submitted (all required fields valid)
   */
  const isFormValid = useCallback((): boolean => {
    return (
      formData.firstName.trim() !== "" &&
      formData.lastName.trim() !== "" &&
      isValidPhone(formData.phone) &&
      (formData.email === "" || isValidEmail(formData.email))
    );
  }, [formData]);

  /**
   * Handle field change with optional formatting
   */
  const handleChange = (field: keyof CustomerInfoData, value: string) => {
    let formattedValue = value;

    if (field === "phone") {
      formattedValue = formatPhoneNumber(value);
    }

    setFormData((prev) => ({
      ...prev,
      [field]: formattedValue,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  /**
   * Handle field blur for validation
   */
  const handleBlur = (field: keyof CustomerInfoData) => {
    setTouched((prev) => ({
      ...prev,
      [field]: true,
    }));

    // Validate individual field on blur
    const newErrors: FormErrors = { ...errors };

    switch (field) {
      case "firstName":
        if (!formData.firstName.trim()) {
          newErrors.firstName = "First name is required";
        } else {
          delete newErrors.firstName;
        }
        break;
      case "lastName":
        if (!formData.lastName.trim()) {
          newErrors.lastName = "Last name is required";
        } else {
          delete newErrors.lastName;
        }
        break;
      case "phone":
        if (!formData.phone.trim()) {
          newErrors.phone = "Phone number is required";
        } else if (!isValidPhone(formData.phone)) {
          newErrors.phone = "Please enter a valid 10-digit phone number";
        } else {
          delete newErrors.phone;
        }
        break;
      case "email":
        if (formData.email && !isValidEmail(formData.email)) {
          newErrors.email = "Please enter a valid email address";
        } else {
          delete newErrors.email;
        }
        break;
    }

    setErrors(newErrors);
  };

  /**
   * Handle form submission
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({
      firstName: true,
      lastName: true,
      phone: true,
      email: true,
    });

    if (validate()) {
      onSubmit(formData);
    }
  };

  /**
   * Get input class with error state
   */
  const getInputClass = (field: keyof CustomerInfoData): string => {
    const baseClass = "input w-full";
    const hasError = touched[field] && errors[field];
    return hasError
      ? `${baseClass} border-red-500 focus:border-red-500 focus:ring-red-500`
      : baseClass;
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="space-y-4">
        {/* First Name / Last Name Row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="firstName"
              className="block text-sm font-semibold text-[#4A4A5A] mb-2"
            >
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={(e) => handleChange("firstName", e.target.value)}
              onBlur={() => handleBlur("firstName")}
              className={getInputClass("firstName")}
              aria-required="true"
              aria-invalid={!!errors.firstName}
              aria-describedby={
                errors.firstName ? "firstName-error" : undefined
              }
              disabled={isLoading}
            />
            {touched.firstName && errors.firstName && (
              <p
                id="firstName-error"
                className="mt-1 text-sm text-red-500"
                role="alert"
              >
                {errors.firstName}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="lastName"
              className="block text-sm font-semibold text-[#4A4A5A] mb-2"
            >
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={(e) => handleChange("lastName", e.target.value)}
              onBlur={() => handleBlur("lastName")}
              className={getInputClass("lastName")}
              aria-required="true"
              aria-invalid={!!errors.lastName}
              aria-describedby={errors.lastName ? "lastName-error" : undefined}
              disabled={isLoading}
            />
            {touched.lastName && errors.lastName && (
              <p
                id="lastName-error"
                className="mt-1 text-sm text-red-500"
                role="alert"
              >
                {errors.lastName}
              </p>
            )}
          </div>
        </div>

        {/* Phone Number */}
        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-semibold text-[#4A4A5A] mb-2"
          >
            Phone Number <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            onBlur={() => handleBlur("phone")}
            className={getInputClass("phone")}
            placeholder="(123) 456-7890"
            aria-required="true"
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? "phone-error" : undefined}
            disabled={isLoading}
          />
          {touched.phone && errors.phone && (
            <p
              id="phone-error"
              className="mt-1 text-sm text-red-500"
              role="alert"
            >
              {errors.phone}
            </p>
          )}
        </div>

        {/* Email (Optional) */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-semibold text-[#4A4A5A] mb-2"
          >
            Email <span className="text-[#71717A] text-xs">(optional)</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            onBlur={() => handleBlur("email")}
            className={getInputClass("email")}
            placeholder="you@example.com"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            disabled={isLoading}
          />
          {touched.email && errors.email && (
            <p
              id="email-error"
              className="mt-1 text-sm text-red-500"
              role="alert"
            >
              {errors.email}
            </p>
          )}
        </div>
      </div>

      {/* Form Actions */}
      <div className="mt-6 flex gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 px-4 border border-gray-300 rounded-xl font-semibold text-[#4A4A5A] hover:bg-gray-50 transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className={`${onCancel ? "flex-1" : "w-full"} btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed`}
          disabled={isLoading || !isFormValid()}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Processing...
            </span>
          ) : (
            submitLabel
          )}
        </button>
      </div>
    </form>
  );
}

export default CustomerInfoForm;
