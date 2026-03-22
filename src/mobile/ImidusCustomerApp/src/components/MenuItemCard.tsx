import React from 'react';
import {Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {MenuItem, MenuItemSize} from '../types/menu.types';
import {Colors} from '../theme/colors';
import {Spacing, Elevation} from '../theme/spacing';

interface Props {
  item: MenuItem;
  onPress: () => void;
}

const getPriceDisplay = (sizes: MenuItemSize[]): string => {
  if (sizes.length === 0) return '';

  const prices = sizes.map(s => s.price).sort((a, b) => a - b);
  const lowest = prices[0];

  if (prices.length === 1 || prices[0] === prices[prices.length - 1]) {
    return `$${lowest.toFixed(2)}`;
  }
  return `from $${lowest.toFixed(2)}`;
};

export const MenuItemCard: React.FC<Props> = ({item, onPress}) => {
  const priceDisplay = getPriceDisplay(item.sizes);
  const anyInStock = item.sizes.some(s => s.inStock);

  return (
    <TouchableOpacity
      style={[styles.card, !anyInStock && styles.cardDisabled]}
      onPress={onPress}
      disabled={!anyInStock}
      activeOpacity={0.7}>
      {item.imageUrl ? (
        <Image source={{uri: item.imageUrl}} style={styles.image} />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.placeholderEmoji}>🍽️</Text>
        </View>
      )}
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>
          {item.name}
        </Text>
        {item.description && (
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        <View style={styles.footer}>
          <Text style={styles.price}>{priceDisplay}</Text>
          <View style={styles.footerRight}>
            {!anyInStock && (
              <View style={styles.outOfStockBadge}>
                <Text style={styles.outOfStockText}>Out of Stock</Text>
              </View>
            )}
            {anyInStock && item.sizes.length > 1 && (
              <Text style={styles.sizesAvailable}>
                {item.sizes.length} sizes
              </Text>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.xs,
    overflow: 'hidden',
    ...Elevation.level1,
  },
  cardDisabled: {
    opacity: 0.6,
  },
  image: {
    width: 100,
    height: 100,
    backgroundColor: Colors.surfaceContainer,
  },
  imagePlaceholder: {
    width: 100,
    height: 100,
    backgroundColor: Colors.surfaceContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 32,
  },
  content: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: Spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.brandGold,
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sizesAvailable: {
    fontSize: 11,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  outOfStockBadge: {
    backgroundColor: Colors.errorLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 8,
  },
  outOfStockText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.error,
    textTransform: 'uppercase',
  },
});
