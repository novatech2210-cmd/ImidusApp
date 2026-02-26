import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { MenuItem, MenuItemSize } from '../types/menu.types';
import { Colors } from '../theme/colors';
import { Spacing } from '../theme/spacing';

interface ItemDetailSheetProps {
  item: MenuItem | null;
  bottomSheetRef: React.RefObject<BottomSheet>;
  onAddToCart: (item: MenuItem, size: MenuItemSize, quantity: number) => void;
}

export const ItemDetailSheet: React.FC<ItemDetailSheetProps> = ({
  item,
  bottomSheetRef,
  onAddToCart
}) => {
  const [selectedSize, setSelectedSize] = useState<MenuItemSize | null>(null);
  const [quantity, setQuantity] = useState(1);

  // Reset state when item changes
  useEffect(() => {
    if (item) {
      setSelectedSize(null);
      setQuantity(1);
    }
  }, [item]);

  if (!item) return null;

  const handleAddToCart = () => {
    if (selectedSize) {
      onAddToCart(item, selectedSize, quantity);
      bottomSheetRef.current?.close();
      // Reset state
      setSelectedSize(null);
      setQuantity(1);
    }
  };

  const inStockSizes = item.sizes.filter(s => s.inStock);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={['50%', '75%']}
      enablePanDownToClose={true}
    >
      <BottomSheetView style={styles.contentContainer}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>{item.name}</Text>
          {item.description && (
            <Text style={styles.description}>{item.description}</Text>
          )}

          {item.isAlcohol && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Alcohol</Text>
            </View>
          )}

          <Text style={styles.sectionTitle}>Select Size</Text>
          <View style={styles.sizeChips}>
            {inStockSizes.map(size => (
              <TouchableOpacity
                key={size.sizeId}
                style={[
                  styles.sizeChip,
                  selectedSize?.sizeId === size.sizeId && styles.sizeChipSelected
                ]}
                onPress={() => setSelectedSize(size)}
              >
                <Text style={[
                  styles.sizeChipText,
                  selectedSize?.sizeId === size.sizeId && styles.sizeChipTextSelected
                ]}>
                  {size.sizeName}
                </Text>
                <Text style={[
                  styles.sizeChipPrice,
                  selectedSize?.sizeId === size.sizeId && styles.sizeChipPriceSelected
                ]}>
                  ${size.price.toFixed(2)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.quantityRow}>
            <Text style={styles.sectionTitle}>Quantity</Text>
            <View style={styles.quantityControls}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Text style={styles.quantityButtonText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.quantityText}>{quantity}</Text>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => setQuantity(quantity + 1)}
              >
                <Text style={styles.quantityButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.addButton, !selectedSize && styles.addButtonDisabled]}
            onPress={handleAddToCart}
            disabled={!selectedSize}
          >
            <Text style={styles.addButtonText}>
              Add to Cart - ${((selectedSize?.price || 0) * quantity).toFixed(2)}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </BottomSheetView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    padding: Spacing.md
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.sm
  },
  description: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: Spacing.md
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFC107',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 4,
    marginBottom: Spacing.md
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.text
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm
  },
  sizeChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.lg
  },
  sizeChip: {
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm
  },
  sizeChipSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#FFF9E6'
  },
  sizeChipText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text
  },
  sizeChipTextSelected: {
    color: Colors.primary
  },
  sizeChipPrice: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4
  },
  sizeChipPriceSelected: {
    color: Colors.primary,
    fontWeight: '600'
  },
  quantityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center'
  },
  quantityButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text
  },
  quantityText: {
    fontSize: 18,
    marginHorizontal: Spacing.md,
    color: Colors.text
  },
  addButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: Spacing.sm
  },
  addButtonDisabled: {
    backgroundColor: Colors.gray
  },
  addButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white
  }
});
