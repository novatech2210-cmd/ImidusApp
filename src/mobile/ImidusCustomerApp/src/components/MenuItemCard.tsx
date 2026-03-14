import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MenuItem, MenuItemSize } from '../types/menu.types';
import { Colors } from '../theme/colors';

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
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    // Modern elevation Level 1 - subtle blue tint shadow
    shadowColor: Colors.brandBlue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  image: {
    width: 100,
    height: 100,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  content: {
    flex: 1,
    padding: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: Colors.textPrimary,
  },
  description: {
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.brandGold, // Brand Gold
  },
  sizesAvailable: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  outOfStock: {
    fontSize: 12,
    color: Colors.error,
    fontWeight: '600',
  },
});
