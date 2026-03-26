/**
 * IMIDUS Technologies – Modern Dark Theme Color System
 * Inspired by Google Stitch / Material Design 3 dark mode
 *
 * DO NOT hardcode colours anywhere else in the codebase.
 * Import from this file: import { Colors } from '@/theme';
 */

export const Colors = {
  // ── CORE LUXURY SURFACES ────────────────────────────────────
  background: '#1A1A2E', // Midnight Navy background
  surface: '#252538', // Dark slate cards
  surfaceContainer: '#2D2D44',
  surfaceContainerLow: '#1E1E30',
  surfaceContainerHigh: '#363654',
  surfaceContainerHighest: '#404060',

  // ── BRAND COLORS (Imperial Onyx) ────────────────────────────
  brandBlue: '#1E5AA8', // Brand Blue - primary dominance
  brandBlueDark: '#154178',
  brandBlueLight: '#2D75D4',
  brandGold: '#D4AF37', // Imperial Gold - luxury accents
  goldLight: '#E5C76B',
  goldDark: '#B08D26',
  midnightNavy: '#1A1A2E',
  darkBg: '#1A1A2E',

  // ── NEUTRAL SURFACES ────────────────────────────────────────
  white: '#FFFFFF',
  lightBlue: '#2D75D4',
  lightGold: '#FFF0C2',
  lightGray: '#2D2D44',
  midGray: '#404060',

  // ── TEXT HIERARCHY (Optimized for Dark Mode) ────────────────
  slate900: '#FFFFFF', // Primary text
  slate800: '#F7F9FC', // Strong text
  slate700: '#EDF2F7', // Medium text
  slate600: '#E2E8F0', // Secondary text
  slate500: '#A0AEC0', // Muted text
  slate400: '#718096', // Hint text
  textPrimary: '#FFFFFF',
  textSecondary: '#E2E8F0',
  textMuted: '#A0AEC0',
  textOnDark: '#FFFFFF',
  textOnGold: '#1A1A2E', // Dark text on gold button for readability

  // ── STATUS COLORS ───────────────────────────────────────────
  error: '#FF5C5C',
  errorLight: 'rgba(255, 92, 92, 0.1)',
  success: '#4ADE80',
  successLight: 'rgba(74, 222, 128, 0.1)',
  warning: '#FBBF24',
  warningLight: 'rgba(251, 191, 36, 0.1)',
  info: '#60A5FA',
  infoLight: 'rgba(96, 165, 250, 0.1)',

  // ── GLASS / OVERLAY ─────────────────────────────────────────
  overlay: 'rgba(0, 0, 0, 0.6)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
  cardShadow: 'rgba(0, 0, 0, 0.4)',
  glassBg: 'rgba(37, 37, 56, 0.85)',
  glassBgDark: 'rgba(26, 26, 46, 0.90)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
  glassShadow: 'rgba(0, 0, 0, 0.5)',

  // ── INPUT FIELDS ────────────────────────────────────────────
  inputBorder: '#404060',
  inputBorderFocus: '#1E5AA8',
  inputBackground: '#2D2D44',
  placeholderText: '#718096',

  // ── SEMANTIC ALIASES ────────────────────────────────────────
  primary: '#1E5AA8', // Brand Blue
  primaryDark: '#154178',
  primaryLight: '#2D75D4',
  secondary: '#D4AF37', // Imperial Gold
  border: '#363654',
  text: '#FFFFFF',

  // ── ELEVATION LEVELS ────────────────────────────────────────
  elevation0: '#1A1A2E', // Base background
  elevation1: '#252538', // Surface
  elevation2: '#2D2D44', // Raised
  elevation3: '#363654', // Dialogs
  elevation4: '#404060', // Navigation
  elevation5: '#4B4B70', // Highest

  // ── LEGACY ──────────────────────────────────────────────────
  gray: '#A0AEC0',
  goldButton: '#D4AF37',
} as const;

export type ColorKey = keyof typeof Colors;
