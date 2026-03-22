/**
 * IMIDUS Technologies – Floating Cart Button
 * Modern bottom-right anchored floating action button for cart access.
 * Displays cart count with gold price badge inside.
 */

import { BorderRadius, Colors, Elevation, Spacing } from '@/theme';
import { useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface FloatingCartButtonProps {
  cartCount: number;
  cartTotal: number;
  onPress: () => void;
}

export default function FloatingCartButton({
  cartCount,
  cartTotal,
  onPress,
}: FloatingCartButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  if (cartCount === 0) return null;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.94,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.9}
      style={styles.container}>
      <Animated.View style={[styles.button, {transform: [{scale: scaleAnim}]}]}>
        <View style={styles.content}>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{cartCount}</Text>
          </View>
          <View style={styles.divider} />
          <Text style={styles.totalText}>${cartTotal.toFixed(2)}</Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Spacing.xl,
    right: Spacing.xl,
    zIndex: 100,
  },
  button: {
    backgroundColor: Colors.brandBlue,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    ...Elevation.level3,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  countBadge: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.full,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  countText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.brandBlue,
  },
  divider: {
    width: 1,
    height: 16,
    backgroundColor: Colors.brandGold,
    opacity: 0.4,
  },
  totalText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.brandGold,
    textShadowColor: 'rgba(212, 175, 55, 0.4)',
    textShadowOffset: {width: 0, height: 2},
    textShadowRadius: 6,
  },
});
