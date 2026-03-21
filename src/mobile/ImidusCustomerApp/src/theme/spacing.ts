/**
 * IMIDUS Technologies – Spacing & Layout System
 * Consistent spacing scale used across all screens and components.
 */

import { StyleSheet } from 'react-native';
import { Colors } from './colors';

export const Spacing = {
  xs:   4,
  sm:   8,
  md:   12,
  base: 16,
  lg:   20,
  xl:   24,
  '2xl':32,
  '3xl':40,
  '4xl':48,
  '5xl':64,
} as const;

export const BorderRadius = {
  sm:    4,
  md:    8,
  lg:    12,
  xl:    16,
  '2xl': 24,
  full:  9999,
} as const;

// ── Imperial Onyx Elevation System ────────────────────────
// Ambient shadows with brand blue tint for studio lighting effect
export const Elevation = {
  // Level 1 - Interactive Cards (0 1px 3px rgba(30, 90, 168, 0.08))
  level1: {
    shadowColor: Colors.brandBlue,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  // Level 2 - Hover State (0 4px 6px rgba(30, 90, 168, 0.10))
  level2: {
    shadowColor: Colors.brandBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 2,
  },
  // Level 3 - Primary CTA, Floating Panels (0 10px 20px rgba(30, 90, 168, 0.12))
  level3: {
    shadowColor: Colors.brandBlue,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 4,
  },
  // Level 4 - Persistent Navigation, Modals (0 20px 40px rgba(30, 90, 168, 0.15))
  level4: {
    shadowColor: Colors.brandBlue,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 40,
    elevation: 8,
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
