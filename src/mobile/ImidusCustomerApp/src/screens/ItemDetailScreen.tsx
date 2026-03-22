import React, {useState} from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useDispatch} from 'react-redux';
import {addToCart} from '../store/cartSlice';
import {Colors} from '../theme/colors';
import {Spacing, Elevation} from '../theme/spacing';
import {MenuItem, MenuItemSize} from '../types/menu.types';

const ItemDetailScreen = ({route, navigation}: any) => {
  const item: MenuItem = route.params.item;
  const [selectedSize, setSelectedSize] = useState<MenuItemSize | null>(
    item.sizes[0] || null,
  );
  const [quantity, setQuantity] = useState(1);
  const dispatch = useDispatch();

  const handleAddToCart = () => {
    if (!selectedSize) return;

    dispatch(
      addToCart({
        menuItemId: item.itemId,
        sizeId: selectedSize.sizeId,
        name: item.name,
        sizeName: selectedSize.sizeName,
        price: selectedSize.price,
        quantity,
        imageUrl: item.imageUrl,
      }),
    );
    navigation.goBack();
  };

  const totalPrice = (selectedSize?.price || 0) * quantity;

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Item Details</Text>
          <View style={{width: 44}} />
        </View>
      </SafeAreaView>

      <ScrollView>
        {/* Image */}
        {item.imageUrl ? (
          <Image source={{uri: item.imageUrl}} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.placeholderImage]}>
            <Text style={styles.placeholderEmoji}>🍽️</Text>
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        )}

        <View style={styles.content}>
          {/* Title & Badge */}
          <View style={styles.titleRow}>
            <Text style={styles.name}>{item.name}</Text>
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
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>SELECT SIZE</Text>
            <View style={styles.sizeContainer}>
              {item.sizes.map((size: MenuItemSize) => (
                <TouchableOpacity
                  key={size.sizeId}
                  style={[
                    styles.sizeButton,
                    selectedSize?.sizeId === size.sizeId && styles.selectedSizeButton,
                  ]}
                  onPress={() => setSelectedSize(size)}
                  activeOpacity={0.7}>
                  <Text
                    style={[
                      styles.sizeText,
                      selectedSize?.sizeId === size.sizeId && styles.selectedSizeText,
                    ]}>
                    {size.sizeName}
                  </Text>
                  <Text
                    style={[
                      styles.priceText,
                      selectedSize?.sizeId === size.sizeId && styles.selectedPriceText,
                    ]}>
                    ${size.price.toFixed(2)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Quantity */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>QUANTITY</Text>
            <View style={styles.quantityContainer}>
              <TouchableOpacity
                style={styles.quantityBtn}
                onPress={() => setQuantity(Math.max(1, quantity - 1))}>
                <Text style={styles.quantityBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.quantityText}>{quantity}</Text>
              <TouchableOpacity
                style={[styles.quantityBtn, styles.quantityBtnAdd]}
                onPress={() => setQuantity(quantity + 1)}>
                <Text style={[styles.quantityBtnText, styles.quantityBtnAddText]}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>${totalPrice.toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          onPress={handleAddToCart}
          disabled={!selectedSize}
          activeOpacity={0.8}
          style={styles.addButtonWrapper}>
          <LinearGradient
            colors={
              selectedSize
                ? [Colors.brandGold, Colors.goldDark]
                : [Colors.surfaceContainerHigh, Colors.surfaceContainerHigh]
            }
            style={styles.addToCartButton}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}>
            <Text
              style={[
                styles.addToCartText,
                !selectedSize && styles.addToCartTextDisabled,
              ]}>
              Add to Cart
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerSafe: {
    backgroundColor: Colors.surface,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: Colors.textPrimary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  image: {
    width: '100%',
    height: 280,
    backgroundColor: Colors.surfaceContainer,
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 64,
    marginBottom: Spacing.sm,
  },
  placeholderText: {
    color: Colors.textMuted,
    fontSize: 14,
  },
  content: {
    padding: Spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  name: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    flex: 1,
  },
  alcoholBadge: {
    backgroundColor: Colors.warning,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: Spacing.sm,
  },
  alcoholBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textOnGold,
  },
  description: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 1,
    marginBottom: Spacing.md,
  },
  sizeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  sizeButton: {
    backgroundColor: Colors.surfaceContainer,
    padding: Spacing.md,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
    minWidth: 100,
    alignItems: 'center',
  },
  selectedSizeButton: {
    borderColor: Colors.brandGold,
    backgroundColor: 'rgba(255, 214, 102, 0.1)',
  },
  sizeText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  selectedSizeText: {
    color: Colors.brandGold,
  },
  priceText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  selectedPriceText: {
    color: Colors.brandGold,
    fontWeight: '600',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainer,
    borderRadius: 24,
    padding: 4,
    alignSelf: 'flex-start',
  },
  quantityBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityBtnAdd: {
    backgroundColor: Colors.brandBlue,
  },
  quantityBtnText: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  quantityBtnAddText: {
    color: Colors.white,
  },
  quantityText: {
    fontSize: 20,
    fontWeight: '700',
    marginHorizontal: Spacing.lg,
    color: Colors.textPrimary,
    minWidth: 32,
    textAlign: 'center',
  },
  footer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalContainer: {
    flex: 1,
  },
  totalLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.brandGold,
  },
  addButtonWrapper: {
    flex: 1,
  },
  addToCartButton: {
    paddingVertical: Spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  addToCartText: {
    color: Colors.textOnGold,
    fontSize: 16,
    fontWeight: '700',
  },
  addToCartTextDisabled: {
    color: Colors.textMuted,
  },
});

export default ItemDetailScreen;
