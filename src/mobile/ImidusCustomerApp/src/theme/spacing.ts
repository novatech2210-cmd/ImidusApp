/**
 * IMIDUS Technologies – Spacing & Layout System
 * Consistent spacing scale used across all screens and components.
 */

import { StyleSheet } from 'react-native';
import { Colors } from './colors';

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
} as const;

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
} as const;

// ── Imperial Onyx Elevation System ────────────────────────
// Soft, large-spread shadows with brand Navy tint for premium studio effect
export const Elevation = {
  // Level 1 - Interactive Cards
  level1: {
    shadowColor: Colors.brandBlue,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  // Level 2 - Hover / Active State
  level2: {
    shadowColor: Colors.brandBlue,
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 4,
  },
  // Level 3 - Primary CTA, Floating Panels
  level3: {
    shadowColor: Colors.brandBlue,
    shadowOffset: {width: 0, height: 16},
    shadowOpacity: 0.08,
    shadowRadius: 30,
    elevation: 8,
  },
  // Level 4 - Persistent Navigation, Modals
  level4: {
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 24},
    shadowOpacity: 0.12,
    shadowRadius: 40,
    elevation: 16,
  },
} as const;

// Legacy shadow aliases (backwards compatibility)
export const Shadow = {
  sm: Elevation.level1,
  md: Elevation.level2,
  lg: Elevation.level3,
  xl: Elevation.level4,
} as const;

// ── Touch Targets (UX Pro Max Guidelines) ─────────────────
// CRITICAL: Minimum 44x44px for all interactive elements
export const TouchTarget = {
  minimum: 44, // iOS/Android minimum touch target
  comfortable: 48, // Comfortable tap target
  large: 56, // Large buttons/menu items
  spacing: 8, // Minimum gap between adjacent touch targets
} as const;

/** Common shared layout styles */
export const Layout = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.lightGray,
  },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.base,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    ...Shadow.md,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.midGray,
    marginVertical: Spacing.sm,
  },
  // Brand-specific surfaces
  brandSurface: {
    backgroundColor: Colors.brandBlue,
  },
  goldSurface: {
    backgroundColor: Colors.lightGold,
    borderWidth: 1,
    borderColor: Colors.brandGold,
    borderRadius: BorderRadius.lg,
  },
});
