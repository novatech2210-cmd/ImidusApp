/**
 * IMIDUS Technologies – Brand Colour System
 * Single source of truth for all colour usage in the React Native app.
 * Extracted from official Imidus brand assets (Feb 2026).
 *
 * DO NOT hardcode colours anywhere else in the codebase.
 * Import from this file: import { Colors } from '@/theme';
 */

export const Colors = {
  // ── Imperial Onyx × IMIDUS Primary Brand ──────────────────
  brandBlue: '#1E5AA8', // Primary — nav bar, buttons, headings, splash bg
  brandBlueDark: '#154378', // Darker shade for gradients
  brandBlueLight: '#2E6AB8', // Light shade for hover states
  midnightNavy: '#0A1F3D', // Imperial Onyx — Deep authority backgrounds
  brandGold: '#D4AF37', // Accent  — CTA, prices, loyalty points, active tabs
  goldLight: '#E8C55B', // Soft gold for shimmer effects
  goldDark: '#B8941F', // Rich gold for pressed states
  darkBg: '#1A1A2E', // Dark    — splash overlay, modal backdrop, sidebar

  // ── Imperial Onyx Surfaces ────────────────────────────────
  white: '#FFFFFF',
  surface: '#FFFFFF', // Pure white canvas
  surfaceContainerLow: '#F5F5F5', // Secondary dashboard modules
  surfaceContainer: '#E5E5E5', // Input backgrounds, unselected cards
  surfaceContainerHighest: '#DDDDDD', // Preview states
  lightBlue: '#D6E4F7', // Table row alternate, info cards, secondary btn bg
  lightGold: '#FDF6E3', // Loyalty/rewards section bg, birthday offer cards
  lightGray: '#F5F5F5', // List item bg, dividers, disabled fills
  midGray: '#DDDDDD', // Input borders, card separators, table lines

  // ── Imperial Onyx Text Hierarchy ──────────────────────────
  slate900: '#0F172A', // Text Primary — high contrast authority
  slate600: '#475569', // Text Muted — secondary information
  textPrimary: '#0F172A', // Using slate-900 for Imperial Onyx authority
  textSecondary: '#475569', // Using slate-600
  textMuted: '#888888',
  textOnDark: '#FFFFFF',
  textOnGold: '#0F172A', // Dark text for gold backgrounds (contrast)

  // ── Status ─────────────────────────────────────────────────
  error: '#C62828', // Failed payments, out-of-stock, form errors
  errorLight: '#FFEBEE',
  success: '#2E7D32', // Order confirmed, payment success, loyalty earned
  successLight: '#E8F5E9',
  warning: '#E65100', // Pending, low stock, caution notices
  warningLight: '#FFF3E0',
  info: '#1565C0',
  infoLight: '#E3F2FD',

  // ── Transparent / Overlay ─────────────────────────────────
  overlay: 'rgba(0,0,0,0.5)',
  overlayLight: 'rgba(0,0,0,0.2)',
  cardShadow: 'rgba(30, 90, 168, 0.12)',
  glassBg: 'rgba(255, 255, 255, 0.80)', // Glassmorphism background
  glassBgDark: 'rgba(26, 26, 46, 0.85)', // Dark glass background
  glassBorder: 'rgba(255, 255, 255, 0.2)', // Glass border
  glassShadow: 'rgba(30, 90, 168, 0.12)', // Glass shadow tint

  // ── Input ─────────────────────────────────────────────────
  inputBorder: '#DDDDDD',
  inputBorderFocus: '#1E5AA8',
  inputBackground: '#E5E5E5', // surfaceContainer for borderless inputs
  placeholderText: '#47556980', // slate-600 at 50% opacity

  // ── Semantic Aliases (Recommended) ────────────────────────
  primary: '#1E5AA8', // brandBlue
  primaryDark: '#0A1F3D', // midnightNavy
  primaryLight: '#2E6AB8', // brandBlueLight
  secondary: '#D4AF37', // brandGold
  background: '#FFFFFF',
  border: '#DDDDDD', // midGray
  text: '#0F172A', // slate900 for Imperial authority
  
  // ── Legacy Aliases ────────────────────────────────────
  gray: '#808080',
  goldButton: '#D4AF37',
  elevation0: 'transparent',
} as const;

export type ColorKey = keyof typeof Colors;
