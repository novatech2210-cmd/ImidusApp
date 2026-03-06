/**
 * IMIDUS Technologies – Brand Colour System
 * Single source of truth for all colour usage in the React Native app.
 * Extracted from official Imidus brand assets (Feb 2026).
 *
 * DO NOT hardcode colours anywhere else in the codebase.
 * Import from this file: import { Colors } from '@/theme';
 */

export const Colors = {
  // ── Primary Brand ──────────────────────────────────────────
  brandBlue:   '#1E5AA8',   // Primary — nav bar, buttons, headings, splash bg
  brandGold:   '#D4AF37',   // Accent  — CTA, prices, loyalty points, active tabs
  darkBg:      '#1A1A2E',   // Dark    — splash overlay, modal backdrop, sidebar

  // ── Surfaces ───────────────────────────────────────────────
  white:        '#FFFFFF',
  lightBlue:    '#D6E4F7',  // Table row alternate, info cards, secondary btn bg
  lightGold:    '#FDF6E3',  // Loyalty/rewards section bg, birthday offer cards
  lightGray:    '#F5F5F5',  // List item bg, dividers, disabled fills
  midGray:      '#DDDDDD',  // Input borders, card separators, table lines

  // ── Text ───────────────────────────────────────────────────
  textPrimary:  '#222222',
  textSecondary:'#555555',
  textMuted:    '#888888',
  textOnDark:   '#FFFFFF',
  textOnGold:   '#222222',

  // ── Status ─────────────────────────────────────────────────
  error:        '#C62828',  // Failed payments, out-of-stock, form errors
  errorLight:   '#FFEBEE',
  success:      '#2E7D32',  // Order confirmed, payment success, loyalty earned
  successLight: '#E8F5E9',
  warning:      '#E65100',  // Pending, low stock, caution notices
  warningLight: '#FFF3E0',
  info:         '#1565C0',
  infoLight:    '#E3F2FD',

  // ── Transparent / Overlay ─────────────────────────────────
  overlay:      'rgba(0,0,0,0.5)',
  overlayLight: 'rgba(0,0,0,0.2)',
  cardShadow:   'rgba(30, 90, 168, 0.12)',

  // ── Input ─────────────────────────────────────────────────
  inputBorder:        '#DDDDDD',
  inputBorderFocus:   '#1E5AA8',
  inputBackground:    '#FFFFFF',
  placeholderText:    '#22222280',
} as const;

export type ColorKey = keyof typeof Colors;
