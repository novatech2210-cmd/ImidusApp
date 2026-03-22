/**
 * IMIDUS Technologies – Modern Dark Theme Color System
 * Inspired by Google Stitch / Material Design 3 dark mode
 *
 * DO NOT hardcode colours anywhere else in the codebase.
 * Import from this file: import { Colors } from '@/theme';
 */

export const Colors = {
  // ── CORE LUXURY SURFACES ────────────────────────────────────
  background: '#F5F7FA', // Soft gray-white background
  surface: '#FFFFFF', // Pure white cards
  surfaceContainer: '#FFFFFF',
  surfaceContainerLow: '#FBFCFD',
  surfaceContainerHigh: '#F0F4F8',
  surfaceContainerHighest: '#E2E8F0',

  // ── BRAND COLORS (Imperial Onyx) ────────────────────────────
  brandBlue: '#0A1F3D', // Midnight Navy - primary dominance
  brandBlueDark: '#051020',
  brandBlueLight: '#152E52',
  brandGold: '#D4AF37', // Imperial Gold - luxury accents
  goldLight: '#E5C76B',
  goldDark: '#B08D26',
  midnightNavy: '#0A1F3D',
  darkBg: '#0A1F3D',

  // ── NEUTRAL SURFACES ────────────────────────────────────────
  white: '#FFFFFF',
  lightBlue: '#F0F4F8',
  lightGold: '#FFF9E6',
  lightGray: '#F5F7FA',
  midGray: '#E2E8F0',

  // ── TEXT HIERARCHY (Midnight Navy based) ────────────────────
  slate900: '#0A1F3D', // Primary text
  slate800: '#1A2E44', // Strong text
  slate700: '#2D3E50', // Medium text
  slate600: '#4A5568', // Secondary text
  slate500: '#718096', // Muted text
  slate400: '#A0AEC0', // Hint text
  textPrimary: '#0A1F3D',
  textSecondary: '#4A5568',
  textMuted: '#718096',
  textOnDark: '#FFFFFF',
  textOnGold: '#FFFFFF', // White looks better on gold in high-end UI

  // ── STATUS COLORS ───────────────────────────────────────────
  error: '#E53E3E',
  errorLight: '#FFF5F5',
  success: '#38A169',
  successLight: '#F0FFF4',
  warning: '#D69E2E',
  warningLight: '#FFFFF0',
  info: '#3182CE',
  infoLight: '#EBF8FF',

  // ── GLASS / OVERLAY ─────────────────────────────────────────
  overlay: 'rgba(10, 31, 61, 0.4)',
  overlayLight: 'rgba(10, 31, 61, 0.2)',
  cardShadow: 'rgba(10, 31, 61, 0.08)',
  glassBg: 'rgba(255, 255, 255, 0.85)',
  glassBgDark: 'rgba(10, 31, 61, 0.90)',
  glassBorder: 'rgba(10, 31, 61, 0.05)',
  glassShadow: 'rgba(10, 31, 61, 0.12)',

  // ── INPUT FIELDS ────────────────────────────────────────────
  inputBorder: '#E2E8F0',
  inputBorderFocus: '#0A1F3D',
  inputBackground: '#FFFFFF',
  placeholderText: '#A0AEC0',

  // ── SEMANTIC ALIASES ────────────────────────────────────────
  primary: '#0A1F3D', // Midnight Navy
  primaryDark: '#051020',
  primaryLight: '#152E52',
  secondary: '#D4AF37', // Imperial Gold
  border: 'transparent', // Favor surfaces over lines
  text: '#0A1F3D',

  // ── ELEVATION LEVELS ────────────────────────────────────────
  elevation0: '#F5F7FA', // Base background
  elevation1: '#FFFFFF', // Surface
  elevation2: '#FBFCFD', // Raised
  elevation3: '#F3F5F7', // Dialogs
  elevation4: '#EBEFF2', // Navigation
  elevation5: '#E2E8F0', // Highest

  // ── LEGACY ──────────────────────────────────────────────────
  gray: '#718096',
  goldButton: '#D4AF37',
} as const;

export type ColorKey = keyof typeof Colors;
