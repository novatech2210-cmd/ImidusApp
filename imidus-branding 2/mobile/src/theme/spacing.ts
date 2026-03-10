/**
 * IMIDUS Technologies – Spacing & Layout System
 * Consistent spacing scale used across all screens and components.
 */

import { StyleSheet } from "react-native";
import { Colors } from "./colors";

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  "2xl": 32,
  "3xl": 40,
  "4xl": 48,
  "5xl": 64,
} as const;

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  "2xl": 24,
  full: 9999,
} as const;

export const Shadow = {
  sm: {
    shadowColor: Colors.brandBlue,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: Colors.brandBlue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: Colors.darkBg,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 8,
  },
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
    alignItems: "center",
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
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
