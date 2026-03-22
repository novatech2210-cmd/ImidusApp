import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
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
import {clearError, loginUser} from '../store/authSlice';
import {Colors} from '../theme/colors';
import {Spacing} from '../theme/spacing';

interface LoginScreenProps {
  navigation: any;
}

const LoginScreen: React.FC<LoginScreenProps> = ({navigation}) => {
  const dispatch = useDispatch<AppDispatch>();
  const {isLoading, error, isAuthenticated} = useSelector(
    (state: RootState) => state.auth,
  );

  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [password, setPassword] = useState('');
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
      Alert.alert('Login Failed', error, [
        {text: 'OK', onPress: () => dispatch(clearError())},
      ]);
    }
  }, [error, dispatch]);

  const handleLogin = async () => {
    if (!phoneOrEmail.trim()) {
      Alert.alert('Error', 'Please enter your phone number or email');
      return;
    }

    if (!password) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    const isEmail = phoneOrEmail.includes('@');

    try {
      await dispatch(
        loginUser({
          ...(isEmail
            ? {email: phoneOrEmail.trim()}
            : {phone: phoneOrEmail.trim()}),
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
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <Text style={styles.brandName}>IMIDUS</Text>
            <Text style={styles.tagline}>Order · Track · Earn</Text>
          </View>

          {/* Form Section */}
          <View style={styles.formCard}>
            <Text style={styles.welcomeText}>Welcome back</Text>
            <Text style={styles.instructionText}>
              Sign in to continue ordering
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>PHONE OR EMAIL</Text>
              <TextInput
                style={[
                  styles.input,
                  focusedInput === 'phone' && styles.inputFocused,
                ]}
                placeholder="Enter phone or email"
                placeholderTextColor={Colors.textMuted}
                value={phoneOrEmail}
                onChangeText={setPhoneOrEmail}
                keyboardType="default"
                autoCapitalize="none"
                editable={!isLoading}
                onFocus={() => setFocusedInput('phone')}
                onBlur={() => setFocusedInput(null)}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>PASSWORD</Text>
              <TextInput
                style={[
                  styles.input,
                  focusedInput === 'password' && styles.inputFocused,
                ]}
                placeholder="Enter password"
                placeholderTextColor={Colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!isLoading}
                onFocus={() => setFocusedInput('password')}
                onBlur={() => setFocusedInput(null)}
              />
            </View>

            <TouchableOpacity
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.8}>
              <LinearGradient
                colors={[Colors.brandBlue, Colors.brandBlueDark]}
                style={styles.loginButton}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}>
                {isLoading ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.loginButtonText}>Sign In</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.registerButton}
              onPress={() => navigation.navigate('Register')}
              disabled={isLoading}>
              <Text style={styles.registerButtonText}>Create Account</Text>
            </TouchableOpacity>
          </View>

          {/* Guest Option */}
          <TouchableOpacity
            style={styles.guestButton}
            onPress={() => navigation.navigate('Menu')}
            disabled={isLoading}>
            <Text style={styles.guestButtonText}>Continue as Guest</Text>
            <Text style={styles.guestArrow}>→</Text>
          </TouchableOpacity>
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
    padding: Spacing.lg,
    justifyContent: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  brandName: {
    fontSize: 48,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: 4,
  },
  tagline: {
    fontSize: 14,
    color: Colors.brandGold,
    marginTop: Spacing.xs,
    letterSpacing: 2,
    fontWeight: '500',
  },
  formCard: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  instructionText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
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
  loginButton: {
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  loginButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    color: Colors.textMuted,
    marginHorizontal: Spacing.md,
    fontSize: 12,
  },
  registerButton: {
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.brandGold,
  },
  registerButtonText: {
    color: Colors.brandGold,
    fontSize: 16,
    fontWeight: '600',
  },
  guestButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  guestButtonText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  guestArrow: {
    color: Colors.textSecondary,
    fontSize: 16,
    marginLeft: Spacing.xs,
  },
});

export default LoginScreen;
