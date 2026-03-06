/**
 * IMIDUS Technologies – Login / Splash Screen
 * Full brand implementation: blue background, banner logo, triangle icon,
 * gold typography, branded inputs and CTA button.
 */

import React, { useState } from 'react';
import {
  View, Text, Image, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar, KeyboardAvoidingView,
  Platform, ActivityIndicator, Alert,
} from 'react-native';
import { Colors, TextStyles, Spacing, BorderRadius, Shadow, Images } from '@/theme';

interface LoginScreenProps {
  onLogin: (phone: string, password: string) => Promise<void>;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!phone.trim() || !password.trim()) {
      Alert.alert('Required', 'Please enter your phone number and password.');
      return;
    }
    setLoading(true);
    try {
      await onLogin(phone.trim(), password);
    } catch (err: any) {
      Alert.alert('Login Failed', err?.message ?? 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.brandBlue} />

      {/* Full-screen brand-blue background */}
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* ── Blue gradient banner logo ───────────────── */}
        <View style={styles.bannerWrapper}>
          <Image
            source={Images.logoBlueBanner}
            style={styles.bannerLogo}
            resizeMode="contain"
          />
        </View>

        {/* ── Triangle icon mark ──────────────────────── */}
        <View style={styles.iconWrapper}>
          <Image
            source={Images.logoTriangle}
            style={styles.triangleIcon}
            resizeMode="contain"
          />
        </View>

        {/* ── App name & tagline ──────────────────────── */}
        <Text style={styles.appName}>IMIDUSAPP</Text>
        <Text style={styles.tagline}>Order · Track · Earn</Text>

        {/* ── Login form card ─────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign In</Text>

          <Text style={styles.inputLabel}>Phone Number</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="e.g. (604) 555-0123"
            placeholderTextColor={Colors.placeholderText}
            keyboardType="phone-pad"
            autoCapitalize="none"
            returnKeyType="next"
          />

          <Text style={styles.inputLabel}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            placeholderTextColor={Colors.placeholderText}
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />

          {/* CTA button — brand gold */}
          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color={Colors.textOnGold} />
              : <Text style={styles.loginButtonText}>SIGN IN</Text>
            }
          </TouchableOpacity>

          {/* Guest / register links */}
          <TouchableOpacity style={styles.linkRow}>
            <Text style={styles.link}>New customer?  </Text>
            <Text style={[styles.link, styles.linkAccent]}>Create Account</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkRow}>
            <Text style={[styles.link, styles.linkAccent]}>Continue as Guest</Text>
          </TouchableOpacity>
        </View>

        {/* ── Powered-by footer ───────────────────────── */}
        <View style={styles.footer}>
          <Image
            source={Images.logoCompact}
            style={styles.footerLogo}
            resizeMode="contain"
          />
          <Text style={styles.footerText}>Powered by Imidus Technologies</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.brandBlue,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.brandBlue,
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
  },

  // Banner logo
  bannerWrapper: {
    width: '100%',
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
    alignItems: 'center',
  },
  bannerLogo: {
    width: '85%',
    height: 56,
  },

  // Triangle icon
  iconWrapper: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  triangleIcon: {
    width: 84,
    height: 84,
  },

  // Brand name / tagline
  appName: {
    ...TextStyles.brandName,
    marginBottom: Spacing.xs,
  },
  tagline: {
    ...TextStyles.tagline,
    marginBottom: Spacing.xl,
  },

  // Login card
  card: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    ...Shadow.lg,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.brandBlue,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },

  // Input
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    height: 48,
    borderWidth: 1.5,
    borderColor: Colors.inputBorder,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    fontSize: 15,
    color: Colors.textPrimary,
    backgroundColor: Colors.lightGray,
    marginBottom: Spacing.md,
  },

  // CTA button
  loginButton: {
    height: 52,
    backgroundColor: Colors.brandGold,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  loginButtonDisabled: {
    opacity: 0.65,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textOnGold,
    letterSpacing: 1.5,
  },

  // Links
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: Spacing.xs,
  },
  link: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  linkAccent: {
    color: Colors.brandBlue,
    fontWeight: '600',
  },

  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  footerLogo: {
    width: 60,
    height: 20,
    opacity: 0.7,
  },
  footerText: {
    fontSize: 11,
    color: Colors.lightBlue,
    opacity: 0.8,
  },
});
