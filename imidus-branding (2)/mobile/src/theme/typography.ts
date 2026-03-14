/**
 * IMIDUS Technologies – Typography System
 * Consistent type scale for iOS and Android.
 * Import from '@/theme': import { Typography } from '@/theme';
 */

import { StyleSheet } from 'react-native';
import { Colors } from './colors';

export const FontFamily = {
  // React Native uses system fonts by default — optimal for performance.
  // Override with a custom font if the client requests (e.g. Georgia for brand name).
  regular:   undefined,   // System default
  medium:    undefined,
  semiBold:  undefined,
  bold:      undefined,
  brand:     'Georgia',   // Used ONLY for 'IMIDUSAPP' wordmark display
  mono:      'Courier New', // Order numbers, prices in monospace contexts
} as const;

export const FontSize = {
  xs:    11,
  sm:    12,
  base:  14,
  md:    16,
  lg:    18,
  xl:    20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
  '5xl': 40,
} as const;

export const LineHeight = {
  tight:  1.2,
  normal: 1.5,
  loose:  1.8,
} as const;

/** Pre-built text styles for consistent UI usage */
export const TextStyles = StyleSheet.create({
  // Brand / App name
  brandName: {
    fontFamily: FontFamily.brand,
    fontSize: FontSize['3xl'],
    fontWeight: '700',
    color: Colors.brandGold,
    letterSpacing: 2,
  },
  tagline: {
    fontSize: FontSize.base,
    color: Colors.textOnDark,
    letterSpacing: 1,
    opacity: 0.85,
  },

  // Screen titles
  screenTitle: {
    fontSize: FontSize['2xl'],
    fontWeight: '700',
    color: Colors.brandBlue,
  },
  screenSubtitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.brandBlue,
  },

  // Section headers
  sectionHeader: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },

  // Cards
  cardTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  cardBody: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    lineHeight: FontSize.base * LineHeight.normal,
  },

  // Prices
  price: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.brandGold,
  },
  priceSmall: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.brandGold,
  },

  // Loyalty / points
  pointsBalance: {
    fontSize: FontSize['4xl'],
    fontWeight: '700',
    color: Colors.brandGold,
  },
  pointsLabel: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },

  // Buttons
  buttonLabel: {
    fontSize: FontSize.md,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  buttonLabelSmall: {
    fontSize: FontSize.base,
    fontWeight: '600',
  },

  // Inputs
  inputText: {
    fontSize: FontSize.base,
    color: Colors.textPrimary,
  },
  inputLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },

  // Captions / metadata
  caption: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  orderNumber: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    letterSpacing: 1,
  },

  // Status
  statusBadge: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
});
