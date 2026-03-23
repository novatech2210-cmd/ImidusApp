import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useDispatch, useSelector} from 'react-redux';
import {AppDispatch, RootState} from '../store';
import {clearError, registerUser} from '../store/authSlice';
import {Colors, Spacing} from '@/theme';

interface RegisterScreenProps {
  navigation: any;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({navigation}) => {
  const dispatch = useDispatch<AppDispatch>();
  const {isLoading, error, isAuthenticated} = useSelector(
    (state: RootState) => state.auth,
  );

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  // Navigate to Menu if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigation.replace('Menu');
    }
  }, [isAuthenticated, navigation]);

  // Show error alert
  useEffect(() => {
    if (error) {
      Alert.alert('Registration Failed', error, [
        {text: 'OK', onPress: () => dispatch(clearError())},
      ]);
    }
  }, [error, dispatch]);

  // Format phone number as (XXX) XXX-XXXX
  const formatPhoneNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    const limited = cleaned.substring(0, 10);

    if (limited.length <= 3) {
      return limited;
    } else if (limited.length <= 6) {
      return `(${limited.slice(0, 3)}) ${limited.slice(3)}`;
    } else {
      return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`;
    }
  };

  const handlePhoneChange = (text: string) => {
    const formatted = formatPhoneNumber(text);
    setPhone(formatted);
  };

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (firstName.trim().length < 1 || firstName.trim().length > 50) {
      newErrors.firstName = 'First name must be between 1 and 50 characters';
    }

    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (lastName.trim().length < 1 || lastName.trim().length > 50) {
      newErrors.lastName = 'Last name must be between 1 and 50 characters';
    }

    const cleanedPhone = phone.replace(/\D/g, '');
    if (!cleanedPhone) {
      newErrors.phone = 'Phone number is required';
    } else if (cleanedPhone.length !== 10) {
      newErrors.phone = 'Phone number must be 10 digits';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(email.trim())) {
      newErrors.email = 'Invalid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (password.length > 100) {
      newErrors.password = 'Password must be less than 100 characters';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');

    try {
      await dispatch(
        registerUser({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: cleanPhone,
          email: email.trim(),
          password,
        }),
      ).unwrap();
    } catch (err) {
      // Error handled by useEffect
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.inner}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            {/* Header */}
            <View style={styles.headerWrapper}>
              <Text style={styles.brandName}>IMIDUS</Text>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Join and start earning rewards</Text>
            </View>

            {/* Form Card */}
            <View style={styles.formCard}>
              {/* Name Row */}
              <View style={styles.nameRow}>
                <View style={[styles.inputContainer, styles.halfInput]}>
                  <Text style={styles.inputLabel}>FIRST NAME</Text>
                  <TextInput
                    style={[
                      styles.input,
                      focusedInput === 'firstName' ? styles.inputFocused : undefined,
                      errors.firstName ? styles.inputError : undefined,
                    ]}
                    placeholder="John"
                    placeholderTextColor={Colors.textMuted}
                    value={firstName}
                    onChangeText={setFirstName}
                    autoCapitalize="words"
                    onFocus={() => setFocusedInput('firstName')}
                    onBlur={() => setFocusedInput(null)}
                  />
                  {errors.firstName && (
                    <Text style={styles.errorText}>{errors.firstName}</Text>
                  )}
                </View>

                <View style={[styles.inputContainer, styles.halfInput]}>
                  <Text style={styles.inputLabel}>LAST NAME</Text>
                  <TextInput
                    style={[
                      styles.input,
                      focusedInput === 'lastName' ? styles.inputFocused : undefined,
                      errors.lastName ? styles.inputError : undefined,
                    ]}
                    placeholder="Doe"
                    placeholderTextColor={Colors.textMuted}
                    value={lastName}
                    onChangeText={setLastName}
                    autoCapitalize="words"
                    onFocus={() => setFocusedInput('lastName')}
                    onBlur={() => setFocusedInput(null)}
                  />
                  {errors.lastName && (
                    <Text style={styles.errorText}>{errors.lastName}</Text>
                  )}
                </View>
              </View>

              {/* Phone */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>PHONE</Text>
                <TextInput
                  style={[
                    styles.input,
                    focusedInput === 'phone' ? styles.inputFocused : undefined,
                    errors.phone ? styles.inputError : undefined,
                  ]}
                  placeholder="(555) 123-4567"
                  placeholderTextColor={Colors.textMuted}
                  value={phone}
                  onChangeText={handlePhoneChange}
                  keyboardType="phone-pad"
                  onFocus={() => setFocusedInput('phone')}
                  onBlur={() => setFocusedInput(null)}
                />
                {errors.phone && (
                  <Text style={styles.errorText}>{errors.phone}</Text>
                )}
              </View>

              {/* Email */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>EMAIL</Text>
                <TextInput
                  style={[
                    styles.input,
                    focusedInput === 'email' ? styles.inputFocused : undefined,
                    errors.email ? styles.inputError : undefined,
                  ]}
                  placeholder="john@example.com"
                  placeholderTextColor={Colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onFocus={() => setFocusedInput('email')}
                  onBlur={() => setFocusedInput(null)}
                />
                {errors.email && (
                  <Text style={styles.errorText}>{errors.email}</Text>
                )}
              </View>

              {/* Password */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>PASSWORD</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[
                      styles.passwordInput,
                      focusedInput === 'password' ? styles.inputFocused : undefined,
                      errors.password ? styles.inputError : undefined,
                    ]}
                    placeholder="Min 8 characters"
                    placeholderTextColor={Colors.textMuted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    onFocus={() => setFocusedInput('password')}
                    onBlur={() => setFocusedInput(null)}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}>
                    <Text style={styles.eyeButtonText}>
                      {showPassword ? 'Hide' : 'Show'}
                    </Text>
                  </TouchableOpacity>
                </View>
                {errors.password && (
                  <Text style={styles.errorText}>{errors.password}</Text>
                )}
              </View>

              {/* Confirm Password */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>CONFIRM PASSWORD</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[
                      styles.passwordInput,
                      focusedInput === 'confirmPassword' ? styles.inputFocused : undefined,
                      errors.confirmPassword ? styles.inputError : undefined,
                    ]}
                    placeholder="Re-enter password"
                    placeholderTextColor={Colors.textMuted}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    onFocus={() => setFocusedInput('confirmPassword')}
                    onBlur={() => setFocusedInput(null)}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    <Text style={styles.eyeButtonText}>
                      {showConfirmPassword ? 'Hide' : 'Show'}
                    </Text>
                  </TouchableOpacity>
                </View>
                {errors.confirmPassword && (
                  <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                )}
              </View>

              {/* Register Button */}
              <TouchableOpacity
                onPress={handleRegister}
                disabled={isLoading}
                activeOpacity={0.8}>
                <LinearGradient
                  colors={[Colors.brandGold, Colors.goldDark]}
                  style={styles.registerButton}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}>
                  {isLoading ? (
                    <ActivityIndicator color={Colors.textOnGold} />
                  ) : (
                    <Text style={styles.registerButtonText}>Create Account</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Login Link */}
            <TouchableOpacity
              style={styles.loginLink}
              onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLinkText}>
                Already have an account?{' '}
                <Text style={styles.loginLinkHighlight}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    flex: 1,
  },
  inner: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  headerWrapper: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  brandName: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: 4,
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  formCard: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  nameRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  halfInput: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 1,
    marginBottom: Spacing.xs,
  },
  input: {
    height: 52,
    backgroundColor: Colors.surfaceContainer,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputFocused: {
    borderColor: Colors.brandBlue,
    backgroundColor: Colors.surfaceContainerLow,
  },
  inputError: {
    borderColor: Colors.error,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    height: 52,
    backgroundColor: Colors.surfaceContainer,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingRight: 70,
    fontSize: 16,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  eyeButton: {
    position: 'absolute',
    right: Spacing.md,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  eyeButtonText: {
    color: Colors.brandBlue,
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    marginTop: Spacing.xs,
  },
  registerButton: {
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  registerButtonText: {
    color: Colors.textOnGold,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  loginLink: {
    alignItems: 'center',
    padding: Spacing.md,
  },
  loginLinkText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  loginLinkHighlight: {
    color: Colors.brandBlue,
    fontWeight: '600',
  },
});

export default RegisterScreen;
