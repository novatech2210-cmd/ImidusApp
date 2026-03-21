import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MenuItem, MenuItemSize } from '../types/menu.types';
import { Colors, Elevation, Spacing, TextStyles, TouchTarget, BorderRadius } from '../theme';

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
  return `from $${lowest.toFixed(2)}`; // Per CONTEXT.md requirement
};

export const MenuItemCard: React.FC<Props> = ({item, onPress}) => {
  const priceDisplay = getPriceDisplay(item.sizes);

  // Check if any size is in stock
  const anyInStock = item.sizes.some(s => s.inStock);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      disabled={!anyInStock}>
      {item.imageUrl && (
        <Image source={{uri: item.imageUrl}} style={styles.image} />
      )}
      <View style={styles.content}>
        <Text style={styles.name}>{item.name}</Text>
        {item.description && (
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        <View style={styles.footer}>
          <Text style={styles.price}>{priceDisplay}</Text>
          {!anyInStock && <Text style={styles.outOfStock}>Out of Stock</Text>}
          {item.sizes.length > 1 && (
            <Text style={styles.sizesAvailable}>
              {item.sizes.length} sizes available
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.surface, // Imperial Onyx: Pure white surface
    borderRadius: BorderRadius.xl, // 16px for premium feel
    marginHorizontal: Spacing.base,
    marginVertical: Spacing.sm,
    minHeight: TouchTarget.large, // 56px comfortable tap target
    overflow: 'hidden',
    ...Elevation.level1, // Imperial Onyx: Ambient shadow with brand blue tint
  },
  image: {
    width: 100,
    height: 100,
    backgroundColor: Colors.lightGray, // Placeholder background
  },
  content: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: 'space-between',
  },
  name: {
    ...TextStyles.title, // Imperial Onyx: Title style (18px / 600)
    color: Colors.slate900,
    marginBottom: 4,
  },
  description: {
    ...TextStyles.body, // Imperial Onyx: Body style (14px / 500 / 1.625 leading)
    color: Colors.slate600,
    marginBottom: Spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  price: {
    ...TextStyles.price, // Imperial Onyx: Price style (bold, gold)
    fontSize: 18,
  },
  sizesAvailable: {
    ...TextStyles.microLabel, // Imperial Onyx: Micro-label with extreme tracking
    fontSize: 10,
    color: Colors.slate600,
  },
  outOfStock: {
    ...TextStyles.label,
    color: Colors.error,
    fontSize: 11,
  },
});
