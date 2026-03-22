import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Switch,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {CardData} from '../types/payment.types';
import {Colors} from '../theme/colors';
import {Spacing, Elevation} from '../theme/spacing';

interface PaymentFormProps {
  onSubmit: (cardData: CardData) => void;
  loading: boolean;
  error?: string;
}

export default function PaymentForm({onSubmit, loading, error}: PaymentFormProps) {
  const [cardNumber, setCardNumber] = useState('');
  const [expirationMonth, setExpirationMonth] = useState('');
  const [expirationYear, setExpirationYear] = useState('');
  const [cvv, setCvv] = useState('');
  const [saveCard, setSaveCard] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    const chunks = cleaned.match(/.{1,4}/g) || [];
    return chunks.join(' ');
  };

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

  const validateCvv = (cvvValue: string): boolean => {
    return /^\d{3,4}$/.test(cvvValue);
  };

  const handleCardNumberChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 16) {
      setCardNumber(formatCardNumber(cleaned));
      if (validationErrors.cardNumber) {
        setValidationErrors({...validationErrors, cardNumber: ''});
      }
    }
  };

  const handleSubmit = () => {
    const errors: Record<string, string> = {};

    if (!validateCardNumber(cardNumber)) {
      errors.cardNumber = 'Invalid card number';
    }

    if (!validateExpiration(expirationMonth, expirationYear)) {
      errors.expiration = 'Invalid or expired card';
    }

    if (!validateCvv(cvv)) {
      errors.cvv = 'Invalid CVV';
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
      <Text style={styles.subtitle}>Enter your card details securely</Text>

      {/* Card Number */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>CARD NUMBER</Text>
        <TextInput
          style={[
            styles.input,
            focusedInput === 'cardNumber' ? styles.inputFocused : undefined,
            validationErrors.cardNumber ? styles.inputError : undefined,
          ]}
          placeholder="1234 5678 9012 3456"
          placeholderTextColor={Colors.textMuted}
          keyboardType="numeric"
          value={cardNumber}
          onChangeText={handleCardNumberChange}
          editable={!loading}
          maxLength={19}
          onFocus={() => setFocusedInput('cardNumber')}
          onBlur={() => setFocusedInput(null)}
        />
        {validationErrors.cardNumber && (
          <Text style={styles.errorText}>{validationErrors.cardNumber}</Text>
        )}
      </View>

      {/* Expiration Date & CVV */}
      <View style={styles.row}>
        <View style={[styles.inputGroup, styles.flex1]}>
          <Text style={styles.label}>MONTH</Text>
          <TextInput
            style={[
              styles.input,
              focusedInput === 'month' ? styles.inputFocused : undefined,
              validationErrors.expiration ? styles.inputError : undefined,
            ]}
            placeholder="MM"
            placeholderTextColor={Colors.textMuted}
            keyboardType="numeric"
            value={expirationMonth}
            onChangeText={value => {
              if (/^\d{0,2}$/.test(value)) {
                setExpirationMonth(value);
                if (validationErrors.expiration) {
                  setValidationErrors({...validationErrors, expiration: ''});
                }
              }
            }}
            editable={!loading}
            maxLength={2}
            onFocus={() => setFocusedInput('month')}
            onBlur={() => setFocusedInput(null)}
          />
        </View>

        <View style={[styles.inputGroup, styles.flex1, styles.marginLeft]}>
          <Text style={styles.label}>YEAR</Text>
          <TextInput
            style={[
              styles.input,
              focusedInput === 'year' ? styles.inputFocused : undefined,
              validationErrors.expiration ? styles.inputError : undefined,
            ]}
            placeholder="YYYY"
            placeholderTextColor={Colors.textMuted}
            keyboardType="numeric"
            value={expirationYear}
            onChangeText={value => {
              if (/^\d{0,4}$/.test(value)) {
                setExpirationYear(value);
                if (validationErrors.expiration) {
                  setValidationErrors({...validationErrors, expiration: ''});
                }
              }
            }}
            editable={!loading}
            maxLength={4}
            onFocus={() => setFocusedInput('year')}
            onBlur={() => setFocusedInput(null)}
          />
        </View>

        <View style={[styles.inputGroup, styles.cvvGroup]}>
          <Text style={styles.label}>CVV</Text>
          <TextInput
            style={[
              styles.input,
              focusedInput === 'cvv' ? styles.inputFocused : undefined,
              validationErrors.cvv ? styles.inputError : undefined,
            ]}
            placeholder="123"
            placeholderTextColor={Colors.textMuted}
            keyboardType="numeric"
            secureTextEntry
            value={cvv}
            onChangeText={value => {
              if (/^\d{0,4}$/.test(value)) {
                setCvv(value);
                if (validationErrors.cvv) {
                  setValidationErrors({...validationErrors, cvv: ''});
                }
              }
            }}
            editable={!loading}
            maxLength={4}
            onFocus={() => setFocusedInput('cvv')}
            onBlur={() => setFocusedInput(null)}
          />
        </View>
      </View>

      {validationErrors.expiration && (
        <Text style={styles.errorText}>{validationErrors.expiration}</Text>
      )}
      {validationErrors.cvv && (
        <Text style={styles.errorText}>{validationErrors.cvv}</Text>
      )}

      {/* Save Card Option */}
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Save card for future orders</Text>
        <Switch
          value={saveCard}
          onValueChange={setSaveCard}
          disabled={loading}
          trackColor={{false: Colors.surfaceContainerHigh, true: Colors.success}}
          thumbColor={Colors.white}
        />
      </View>
      <Text style={styles.comingSoon}>(Coming soon)</Text>

      {/* Error Display */}
      {error && (
        <View style={styles.apiErrorContainer}>
          <Text style={styles.apiError}>{error}</Text>
        </View>
      )}

      {/* Submit Button */}
      <TouchableOpacity
        onPress={handleSubmit}
        disabled={loading}
        activeOpacity={0.8}>
        <LinearGradient
          colors={
            loading
              ? [Colors.surfaceContainerHigh, Colors.surfaceContainerHigh]
              : [Colors.success, '#2DA066']
          }
          style={styles.button}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}>
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.buttonText}>Complete Payment</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>

      {/* Security Notice */}
      <View style={styles.securityNotice}>
        <Text style={styles.securityIcon}>🔒</Text>
        <Text style={styles.securityText}>
          Your card information is encrypted and never stored on our servers
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.md,
    ...Elevation.level1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 1,
    marginBottom: Spacing.xs,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
    color: Colors.textPrimary,
    backgroundColor: Colors.surfaceContainer,
  },
  inputFocused: {
    borderColor: Colors.brandBlue,
    backgroundColor: Colors.surfaceContainerLow,
  },
  inputError: {
    borderColor: Colors.error,
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    marginTop: Spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  flex1: {
    flex: 1,
  },
  marginLeft: {
    marginLeft: Spacing.sm,
  },
  cvvGroup: {
    width: 100,
    marginLeft: Spacing.sm,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
    marginBottom: 4,
  },
  switchLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  comingSoon: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
  },
  apiErrorContainer: {
    backgroundColor: Colors.errorLight,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.error,
  },
  apiError: {
    color: Colors.error,
    fontSize: 14,
  },
  button: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  securityIcon: {
    fontSize: 14,
    marginRight: Spacing.xs,
  },
  securityText: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    flex: 1,
  },
});
