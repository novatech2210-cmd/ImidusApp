import { TextStyle } from 'react-native';
import {Colors} from './colors';

// Typography Modernization Rules from MASTER.md

export const FontFamilies = {
  primary: 'System', // Default system font
  display: 'Georgia', // For wordmark only
  mono: 'Courier New', // For order numbers, etc.
};

export type FontFamily = keyof typeof FontFamilies;
export type FontSize = number;
export type LineHeight = number;

interface CustomTextStyles {
  wordmark: TextStyle;
  brandName: TextStyle;
  tagline: TextStyle;
  taglineGold: TextStyle;
  h1: TextStyle;
  h2: TextStyle;
  h3: TextStyle;
  h4: TextStyle;
  h5: TextStyle;
  h6: TextStyle;
  price: TextStyle;
  loyaltyPoints: TextStyle;
  // Add other common text styles as needed
}

export const TextStyles: CustomTextStyles = {
  // Wordmark (Georgia font, for display contexts only)
  wordmark: {
    fontFamily: FontFamilies.display,
    fontSize: 48,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: -1,
  },
  // Brand Name (similar to wordmark but using primary font)
  brandName: {
    fontFamily: FontFamilies.primary,
    fontSize: 28,
    fontWeight: '800',
    color: Colors.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Tagline (regular weight, subtle white)
  tagline: {
    fontFamily: FontFamilies.primary,
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  // Tagline (Gold for splash screen)
  taglineGold: {
    fontFamily: FontFamilies.primary,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.brandGold,
    textTransform: 'none',
    letterSpacing: 0.5,
  },

  // Headings (Bold, slight letter spacing, Brand Blue)
  h1: {
    fontFamily: FontFamilies.primary,
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 0.3,
    color: Colors.brandBlue,
  },
  h2: {
    fontFamily: FontFamilies.primary,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 0.3,
    color: Colors.brandBlue,
  },
  h3: {
    fontFamily: FontFamilies.primary,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 0.3,
    color: Colors.brandBlue,
  },
  h4: {
    fontFamily: FontFamilies.primary,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.3,
    color: Colors.brandBlue,
  },
  h5: {
    fontFamily: FontFamilies.primary,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
    color: Colors.brandBlue,
  },
  h6: {
    fontFamily: FontFamilies.primary,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
    color: Colors.brandBlue,
  },

  // Prices (Bold, Brand Gold, slight scale increase)
  price: {
    fontFamily: FontFamilies.primary, // Using primary for now, can be mono if preferred
    fontSize: 18, // Base size, 1.1x scale applied in transform
    fontWeight: '700',
    color: Colors.brandGold,
    transform: [{scale: 1.1}],
  },

  // Loyalty Points (40px, Brand Gold, text shadow)
  loyaltyPoints: {
    fontFamily: FontFamilies.primary,
    fontSize: 40,
    fontWeight: '700',
    color: Colors.brandGold,
    textShadowColor: 'rgba(212, 175, 55, 0.25)',
    textShadowOffset: {width: 0, height: 2},
    textShadowRadius: 8,
  },
};
