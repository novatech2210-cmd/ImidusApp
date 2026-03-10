/**
 * IMIDUS Technologies – Loyalty Points Card
 * Displays the customer's current points balance with gold brand treatment.
 * Used on the home screen and loyalty tab.
 */

import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { Colors, Spacing, BorderRadius, Shadow, Images } from "@/theme";

interface LoyaltyCardProps {
  customerName: string;
  points: number;
  onRedeem?: () => void;
  birthdayMonth?: boolean;
}

export default function LoyaltyCard({
  customerName,
  points,
  onRedeem,
  birthdayMonth = false,
}: LoyaltyCardProps) {
  return (
    <View style={[styles.card, birthdayMonth && styles.birthdayCard]}>
      {/* Header row */}
      <View style={styles.headerRow}>
        <Image
          source={Images.logoTriangle}
          style={styles.icon}
          resizeMode="contain"
        />
        <View style={styles.headerText}>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.name}>{customerName}</Text>
        </View>
        {birthdayMonth && (
          <Text style={styles.birthdayBadge}>🎂 Birthday Month!</Text>
        )}
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Points display */}
      <View style={styles.pointsRow}>
        <View>
          <Text style={styles.pointsBalance}>{points.toLocaleString()}</Text>
          <Text style={styles.pointsLabel}>LOYALTY POINTS</Text>
        </View>
        {onRedeem && (
          <TouchableOpacity
            style={styles.redeemBtn}
            onPress={onRedeem}
            activeOpacity={0.85}
          >
            <Text style={styles.redeemText}>REDEEM</Text>
          </TouchableOpacity>
        )}
      </View>

      {birthdayMonth && (
        <View style={styles.birthdayBanner}>
          <Text style={styles.birthdayText}>
            🎉 You have a birthday reward waiting! Tap Redeem to apply.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.lightGold,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    borderColor: Colors.brandGold,
    padding: Spacing.base,
    marginHorizontal: Spacing.base,
    marginVertical: Spacing.sm,
    ...Shadow.md,
  },
  birthdayCard: {
    borderColor: Colors.brandGold,
    borderWidth: 2.5,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  icon: {
    width: 36,
    height: 36,
  },
  headerText: {
    flex: 1,
  },
  greeting: {
    fontSize: 11,
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  birthdayBadge: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.brandBlue,
    backgroundColor: Colors.lightBlue,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    overflow: "hidden",
  },

  divider: {
    height: 1,
    backgroundColor: Colors.brandGold,
    opacity: 0.3,
    marginVertical: Spacing.sm,
  },

  pointsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pointsBalance: {
    fontSize: 36,
    fontWeight: "700",
    color: Colors.brandGold,
    letterSpacing: -1,
  },
  pointsLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.textMuted,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginTop: 2,
  },
  redeemBtn: {
    backgroundColor: Colors.brandGold,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    ...Shadow.sm,
  },
  redeemText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textOnGold,
    letterSpacing: 1,
  },

  birthdayBanner: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.brandBlue,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
  },
  birthdayText: {
    fontSize: 12,
    color: Colors.white,
    textAlign: "center",
    lineHeight: 18,
  },
});
