import BottomSheet, {BottomSheetView} from '@gorhom/bottom-sheet';
import React, {useEffect, useState} from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {Colors} from '../theme/colors';
import {Spacing} from '../theme/spacing';
import {MenuItem, MenuItemSize} from '../types/menu.types';

interface ItemDetailSheetProps {
  item: MenuItem | null;
  bottomSheetRef: React.RefObject<BottomSheet>;
  onAddToCart: (item: MenuItem, size: MenuItemSize, quantity: number) => void;
}

export const ItemDetailSheet: React.FC<ItemDetailSheetProps> = ({
  item,
  bottomSheetRef,
  onAddToCart,
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
      setSelectedSize(null);
      setQuantity(1);
    }
  };

  const inStockSizes = item.sizes.filter(s => s.inStock);
  const totalPrice = (selectedSize?.price || 0) * quantity;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={['50%', '75%']}
      enablePanDownToClose={true}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handleIndicator}>
      <BottomSheetView style={styles.contentContainer}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{item.name}</Text>
            {item.isAlcohol && (
              <View style={styles.alcoholBadge}>
                <Text style={styles.alcoholBadgeText}>21+</Text>
              </View>
            )}
          </View>

          {item.description && (
            <Text style={styles.description}>{item.description}</Text>
          )}

          {/* Size Selection */}
          <Text style={styles.sectionTitle}>SELECT SIZE</Text>
          <View style={styles.sizeChips}>
            {inStockSizes.map(size => (
              <TouchableOpacity
                key={size.sizeId}
                style={[
                  styles.sizeChip,
                  selectedSize?.sizeId === size.sizeId &&
                    styles.sizeChipSelected,
                ]}
                onPress={() => setSelectedSize(size)}
                activeOpacity={0.7}>
                <Text
                  style={[
                    styles.sizeChipText,
                    selectedSize?.sizeId === size.sizeId &&
                      styles.sizeChipTextSelected,
                  ]}>
                  {size.sizeName}
                </Text>
                <Text
                  style={[
                    styles.sizeChipPrice,
                    selectedSize?.sizeId === size.sizeId &&
                      styles.sizeChipPriceSelected,
                  ]}>
                  ${(size.price || 0).toFixed(2)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Quantity */}
          <View style={styles.quantityRow}>
            <Text style={styles.sectionTitle}>QUANTITY</Text>
            <View style={styles.quantityControls}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => setQuantity(Math.max(1, quantity - 1))}>
                <Text style={styles.quantityButtonText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.quantityText}>{quantity}</Text>
              <TouchableOpacity
                style={[styles.quantityButton, styles.quantityButtonAdd]}
                onPress={() => setQuantity(quantity + 1)}>
                <Text
                  style={[
                    styles.quantityButtonText,
                    styles.quantityButtonAddText,
                  ]}>
                  +
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Add to Cart Button */}
          <TouchableOpacity
            onPress={handleAddToCart}
            disabled={!selectedSize}
            activeOpacity={0.8}>
            <LinearGradient
              colors={
                selectedSize
                  ? [Colors.brandGold, Colors.goldDark]
                  : [Colors.surfaceContainerHigh, Colors.surfaceContainerHigh]
              }
              style={styles.addButton}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}>
              <Text
                style={[
                  styles.addButtonText,
                  !selectedSize && styles.addButtonTextDisabled,
                ]}>
                Add to Cart
              </Text>
              <Text
                style={[
                  styles.addButtonPrice,
                  !selectedSize && styles.addButtonTextDisabled,
                ]}>
                ${(totalPrice || 0).toFixed(2)}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </BottomSheetView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handleIndicator: {
    backgroundColor: Colors.surfaceContainerHigh,
    width: 40,
  },
  contentContainer: {
    flex: 1,
    padding: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    flex: 1,
  },
  alcoholBadge: {
    backgroundColor: Colors.warning,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  alcoholBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textOnGold,
  },
  description: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  sizeChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.lg,
  },
  sizeChip: {
    backgroundColor: Colors.surfaceContainer,
    borderWidth: 2,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 12,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
    minWidth: 100,
    alignItems: 'center',
  },
  sizeChipSelected: {
    borderColor: Colors.brandGold,
    backgroundColor: Colors.lightGold,
  },
  sizeChipText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  sizeChipTextSelected: {
    color: Colors.brandGold,
  },
  sizeChipPrice: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  sizeChipPriceSelected: {
    color: Colors.brandGold,
    fontWeight: '600',
  },
  quantityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainer,
    borderRadius: 20,
    padding: 4,
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonAdd: {
    backgroundColor: Colors.brandBlue,
  },
  quantityButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  quantityButtonAddText: {
    color: Colors.white,
  },
  quantityText: {
    fontSize: 18,
    fontWeight: '700',
    marginHorizontal: Spacing.md,
    color: Colors.textPrimary,
    minWidth: 24,
    textAlign: 'center',
  },
  addButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 16,
    marginTop: Spacing.sm,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textOnGold,
  },
  addButtonPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textOnGold,
  },
  addButtonTextDisabled: {
    color: Colors.textMuted,
  },
});
