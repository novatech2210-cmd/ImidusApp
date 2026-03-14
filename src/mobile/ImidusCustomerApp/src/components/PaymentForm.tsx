import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { CardData } from '../types/payment.types';

interface PaymentFormProps {
  onSubmit: (cardData: CardData) => void;
  loading: boolean;
  error?: string;
}

/**
 * Payment form component with credit card input and validation
 * Implements Luhn algorithm for card validation and auto-formatting
 */
export default function PaymentForm({ onSubmit, loading, error }: PaymentFormProps) {
  const [cardNumber, setCardNumber] = useState('');
  const [expirationMonth, setExpirationMonth] = useState('');
  const [expirationYear, setExpirationYear] = useState('');
  const [cvv, setCvv] = useState('');
  const [saveCard, setSaveCard] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  /**
   * Format card number with spaces every 4 digits
   * Example: "1234567890123456" -> "1234 5678 9012 3456"
   */
  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    const chunks = cleaned.match(/.{1,4}/g) || [];
    return chunks.join(' ');
  };

  /**
   * Luhn algorithm for card number validation
   * https://en.wikipedia.org/wiki/Luhn_algorithm
   */
  const validateCardNumber = (cardNum: string): boolean => {
    const cleaned = cardNum.replace(/\s/g, '');
    if (!/^\d{13,19}$/.test(cleaned)) return false;

    let sum = 0;
    let isEven = false;

    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned[i], 10);

      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  };

  /**
   * Validate expiration date is in the future
   */
  const validateExpiration = (month: string, year: string): boolean => {
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);

    if (monthNum < 1 || monthNum > 12) return false;
    if (year.length !== 4) return false;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (yearNum < currentYear) return false;
    if (yearNum === currentYear && monthNum < currentMonth) return false;

    return true;
  };

  /**
   * Validate CVV format (3-4 digits)
   */
  const validateCvv = (cvvValue: string): boolean => {
    return /^\d{3,4}$/.test(cvvValue);
  };

  /**
   * Handle card number input with auto-formatting
   */
  const handleCardNumberChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 16) {
      setCardNumber(formatCardNumber(cleaned));
      if (validationErrors.cardNumber) {
        setValidationErrors({ ...validationErrors, cardNumber: '' });
      }
    }
  };

  /**
   * Handle form submission with validation
   */
  const handleSubmit = () => {
    const errors: Record<string, string> = {};

    // Validate card number
    if (!validateCardNumber(cardNumber)) {
      errors.cardNumber = 'Invalid card number';
    }

    // Validate expiration
    if (!validateExpiration(expirationMonth, expirationYear)) {
      errors.expiration = 'Invalid or expired card';
    }

    // Validate CVV
    if (!validateCvv(cvv)) {
      errors.cvv = 'Invalid CVV (3-4 digits)';
    }

    setValidationErrors(errors);

    if (Object.keys(errors).length === 0) {
      onSubmit({
        cardNumber: cardNumber.replace(/\s/g, ''),
        expirationMonth,
        expirationYear,
        cvv,
      });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Payment Information</Text>

      {/* Card Number */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Card Number</Text>
        <TextInput
          style={[styles.input, validationErrors.cardNumber ? styles.inputError : undefined]}
          placeholder="1234 5678 9012 3456"
          keyboardType="numeric"
          value={cardNumber}
          onChangeText={handleCardNumberChange}
          editable={!loading}
          maxLength={19}
        />
        {validationErrors.cardNumber && (
          <Text style={styles.errorText}>{validationErrors.cardNumber}</Text>
        )}
      </View>

      {/* Expiration Date */}
      <View style={styles.row}>
        <View style={[styles.inputGroup, styles.flex1]}>
          <Text style={styles.label}>Month</Text>
          <TextInput
            style={[styles.input, validationErrors.expiration ? styles.inputError : undefined]}
            placeholder="MM"
            keyboardType="numeric"
            value={expirationMonth}
            onChangeText={(value) => {
              if (/^\d{0,2}$/.test(value)) {
                setExpirationMonth(value);
                if (validationErrors.expiration) {
                  setValidationErrors({ ...validationErrors, expiration: '' });
                }
              }
            }}
            editable={!loading}
            maxLength={2}
          />
        </View>

        <View style={[styles.inputGroup, styles.flex1, styles.marginLeft]}>
          <Text style={styles.label}>Year</Text>
          <TextInput
            style={[styles.input, validationErrors.expiration ? styles.inputError : undefined]}
            placeholder="YYYY"
            keyboardType="numeric"
            value={expirationYear}
            onChangeText={(value) => {
              if (/^\d{0,4}$/.test(value)) {
                setExpirationYear(value);
                if (validationErrors.expiration) {
                  setValidationErrors({ ...validationErrors, expiration: '' });
                }
              }
            }}
            editable={!loading}
            maxLength={4}
          />
        </View>

        <View style={[styles.inputGroup, styles.cvvGroup]}>
          <Text style={styles.label}>CVV</Text>
          <TextInput
            style={[styles.input, validationErrors.cvv ? styles.inputError : undefined]}
            placeholder="123"
            keyboardType="numeric"
            secureTextEntry
            value={cvv}
            onChangeText={(value) => {
              if (/^\d{0,4}$/.test(value)) {
                setCvv(value);
                if (validationErrors.cvv) {
                  setValidationErrors({ ...validationErrors, cvv: '' });
                }
              }
            }}
            editable={!loading}
            maxLength={4}
          />
        </View>
      </View>
      {validationErrors.expiration && (
        <Text style={styles.errorText}>{validationErrors.expiration}</Text>
      )}
      {validationErrors.cvv && <Text style={styles.errorText}>{validationErrors.cvv}</Text>}

      {/* Save Card Option (V1 UI placeholder - not functional) */}
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Save card for future orders</Text>
        <Switch
          value={saveCard}
          onValueChange={setSaveCard}
          disabled={loading}
          trackColor={{ false: '#d1d5db', true: '#10b981' }}
          thumbColor="#fff"
        />
      </View>
      <Text style={styles.comingSoon}>(Coming soon)</Text>

      {/* Error Display */}
      {error && <Text style={styles.apiError}>{error}</Text>}

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Complete Payment</Text>
        )}
      </TouchableOpacity>

      {/* Security Notice */}
      <Text style={styles.securityNotice}>
        Your card information is encrypted and never stored on our servers
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  flex1: {
    flex: 1,
  },
  marginLeft: {
    marginLeft: 12,
  },
  cvvGroup: {
    width: 90,
    marginLeft: 12,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  switchLabel: {
    fontSize: 14,
    color: '#374151',
  },
  comingSoon: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 16,
  },
  apiError: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 14,
  },
  button: {
    backgroundColor: '#10b981',
    height: 52,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  securityNotice: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 12,
  },
});
