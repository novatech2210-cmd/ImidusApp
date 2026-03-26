import BottomSheet from '@gorhom/bottom-sheet';
import {AlertCircle, ShoppingCart, User} from 'lucide-react-native';
import {useCallback, useEffect, useRef, useState} from 'react';
import {
  Animated,
  FlatList,
  RefreshControl,
  SectionList,
  SectionListData,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import LinearGradient from 'react-native-linear-gradient';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useDispatch, useSelector} from 'react-redux';
import {ItemDetailSheet} from '../components/ItemDetailSheet';
import {MenuItemCard} from '../components/MenuItemCard';
import {SkeletonMenuList} from '../components/SkeletonMenuCard';
import {
  fetchItemsByCategory,
  fetchMenuWithCache,
  getCachedMenu,
} from '../services/menuService';
import {RootState} from '../store';
import {addToCart} from '../store/cartSlice';
import {Colors, Elevation, Spacing, TextStyles, TouchTarget} from '../theme';
import {Category, MenuItem, MenuItemSize} from '../types/menu.types';

interface MenuSection {
  title: string;
  categoryId: number;
  data: MenuItem[];
}

const MenuScreen = ({navigation}: any) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [sections, setSections] = useState<MenuSection[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  const dispatch = useDispatch();
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const [posConnected, setPosConnected] = useState(true);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const bottomSheetRef = useRef<BottomSheet>(null);
  const categoryListRef = useRef<FlatList>(null);
  const sectionListRef = useRef<SectionList<MenuItem, MenuSection>>(null);

  useEffect(() => {
    loadMenu();

    // Pulse animation for sync dot
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const loadMenu = async () => {
    setLoading(true);
    setError(null);

    // 1. Load cached data first (instant display)
    const cached = await getCachedMenu();
    if (cached && cached.categories.length > 0) {
      setCategories(cached.categories);
      if (!selectedCategoryId && cached.categories.length > 0) {
        setSelectedCategoryId(cached.categories[0].categoryId);
      }
      await loadAllCategoryItems(cached.categories);
      setLoading(false);
    }

    // 2. Fetch fresh data in background
    try {
      const freshCategories = await fetchMenuWithCache();
      setCategories(freshCategories);

      if (freshCategories.length > 0) {
        if (!selectedCategoryId) {
          setSelectedCategoryId(freshCategories[0].categoryId);
        }
        await loadAllCategoryItems(freshCategories);
      }
    } catch (err) {
      if (!cached) {
        setError("Couldn't load menu. Tap to try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadAllCategoryItems = async (categoriesToLoad: Category[]) => {
    try {
      const itemPromises = categoriesToLoad.map(async cat => {
        try {
          const items = await fetchItemsByCategory(cat.categoryId);
          return {
            title: cat.name,
            categoryId: cat.categoryId,
            data: items,
          };
        } catch (error) {
          console.error(
            `Error loading items for category ${cat.categoryId}:`,
            error,
          );
          return {
            title: cat.name,
            categoryId: cat.categoryId,
            data: [],
          };
        }
      });

      const loadedSections = await Promise.all(itemPromises);
      const nonEmptySections = loadedSections.filter(s => s.data.length > 0);
      setSections(nonEmptySections);
    } catch (error) {
      console.error('Error loading category items:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadMenu();
    setRefreshing(false);
  }, []);

  const handleCategoryPress = (categoryId: number, index: number) => {
    setSelectedCategoryId(categoryId);

    const sectionIndex = sections.findIndex(s => s.categoryId === categoryId);
    if (sectionIndex !== -1 && sectionListRef.current) {
      sectionListRef.current.scrollToLocation({
        sectionIndex,
        itemIndex: 0,
        animated: true,
        viewPosition: 0,
      });
    }

    if (categoryListRef.current) {
      categoryListRef.current.scrollToIndex({
        index,
        animated: true,
        viewPosition: 0.5,
      });
    }
  };

  const handleItemPress = (item: MenuItem) => {
    setSelectedItem(item);
    bottomSheetRef.current?.expand();
  };

  const handleAddToCart = (
    item: MenuItem,
    size: MenuItemSize,
    quantity: number,
  ) => {
    dispatch(
      addToCart({
        menuItemId: item.itemId,
        sizeId: size.sizeId,
        name: item.name,
        sizeName: size.sizeName,
        price: size.price,
        quantity,
        imageUrl: item.imageUrl,
      }),
    );
  };

  const renderCategory = ({item, index}: {item: Category; index: number}) => {
    const isSelected = selectedCategoryId === item.categoryId;
    return (
      <TouchableOpacity
        style={[
          styles.categoryButton,
          isSelected && styles.categoryButtonActive,
        ]}
        onPress={() => handleCategoryPress(item.categoryId, index)}>
        <Text
          style={[
            styles.categoryText,
            isSelected && styles.selectedCategoryText,
          ]}>
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = ({
    section,
  }: {
    section: SectionListData<MenuItem, MenuSection>;
  }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <View style={styles.sectionDivider} />
    </View>
  );

  const renderItem = ({item}: {item: MenuItem}) => (
    <MenuItemCard item={item} onPress={() => handleItemPress(item)} />
  );

  const onViewableItemsChanged = useRef(({viewableItems}: any) => {
    if (viewableItems.length > 0) {
      const firstVisibleSection = viewableItems[0].section;
      if (firstVisibleSection) {
        setSelectedCategoryId(firstVisibleSection.categoryId);

        const categoryIndex = categories.findIndex(
          c => c.categoryId === firstVisibleSection.categoryId,
        );
        if (categoryIndex !== -1 && categoryListRef.current) {
          categoryListRef.current.scrollToIndex({
            index: categoryIndex,
            animated: true,
            viewPosition: 0.5,
          });
        }
      }
    }
  }).current;

  const viewConfigRef = useRef({viewAreaCoveragePercentThreshold: 50}).current;

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <AlertCircle size={64} color={Colors.error} />
          <Text style={styles.errorTitle}>Connection Error</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadMenu}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <View style={styles.container}>
        {/* Header */}
        <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => navigation.navigate('Profile')}>
              <View style={styles.avatarPlaceholder}>
                <User size={20} color={Colors.brandGold} />
              </View>
            </TouchableOpacity>

            <View style={styles.titleContainer}>
              <Text
                style={[
                  TextStyles.wordmark,
                  {fontSize: 22, color: Colors.brandGold},
                ]}>
                IMIDUSAPP
              </Text>
              <View style={styles.syncContainer}>
                <Animated.View
                  style={[
                    styles.syncDot,
                    posConnected
                      ? styles.syncDotConnected
                      : styles.syncDotReconnecting,
                    {transform: [{scale: pulseAnim}]},
                  ]}
                />
                <Text style={styles.syncText}>
                  {posConnected ? 'Live' : 'Syncing'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.cartButton}
              onPress={() => navigation.navigate('Cart')}>
              <ShoppingCart size={24} color={Colors.white} />
              {cartCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{cartCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* Category Tabs */}
        <View style={styles.categoryListContainer}>
          <FlatList
            ref={categoryListRef}
            data={categories}
            renderItem={renderCategory}
            keyExtractor={(item, index) =>
              item?.categoryId?.toString() ?? `cat-${index}`
            }
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryList}
            onScrollToIndexFailed={() => {}}
          />
        </View>

        {/* Menu Items */}
        {loading && sections.length === 0 ? (
          <SkeletonMenuList />
        ) : (
          <SectionList
            ref={sectionListRef}
            sections={sections}
            renderItem={renderItem}
            renderSectionHeader={renderSectionHeader}
            keyExtractor={(item, index) =>
              item?.itemId?.toString() ?? `item-${index}`
            }
            contentContainerStyle={styles.itemList}
            stickySectionHeadersEnabled={false}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewConfigRef}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={Colors.brandGold}
                colors={[Colors.brandGold]}
              />
            }
            onScrollToIndexFailed={() => {}}
          />
        )}

        {/* Floating Cart Button */}
        {cartCount > 0 && (
          <TouchableOpacity
            style={styles.floatingCartButton}
            onPress={() => navigation.navigate('Cart')}>
            <LinearGradient
              colors={[Colors.brandGold, Colors.goldDark]}
              style={styles.floatingCartGradient}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}>
              <Text style={styles.floatingCartText}>
                View Cart · ${(cartTotal || 0).toFixed(2)}
              </Text>
              <View style={styles.floatingCartCount}>
                <Text style={styles.floatingCartCountText}>{cartCount}</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        <ItemDetailSheet
          item={selectedItem}
          bottomSheetRef={bottomSheetRef}
          onAddToCart={handleAddToCart}
        />
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerSafeArea: {
    backgroundColor: Colors.surfaceContainerLow,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  profileButton: {
    minHeight: TouchTarget.minimum,
    minWidth: TouchTarget.minimum,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
  },
  titleContainer: {
    alignItems: 'center',
  },
  brandName: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: 2,
  },
  syncContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  syncDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  syncDotConnected: {
    backgroundColor: Colors.success,
  },
  syncDotReconnecting: {
    backgroundColor: Colors.warning,
  },
  syncText: {
    fontSize: 10,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cartButton: {
    minHeight: TouchTarget.minimum,
    minWidth: TouchTarget.minimum,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cartIcon: {
    fontSize: 24,
  },
  cartBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: Colors.brandGold,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  cartBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textOnGold,
  },
  categoryListContainer: {
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  categoryList: {
    paddingHorizontal: Spacing.sm,
  },
  categoryButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: Colors.surfaceContainer,
    minHeight: 36,
    justifyContent: 'center',
  },
  categoryButtonActive: {
    backgroundColor: Colors.brandBlue,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selectedCategoryText: {
    color: Colors.white,
  },
  sectionHeader: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.background,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  sectionDivider: {
    height: 2,
    width: 40,
    backgroundColor: Colors.brandGold,
    borderRadius: 1,
  },
  itemList: {
    paddingBottom: 100,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.background,
  },
  errorEmoji: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  errorText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  retryButton: {
    backgroundColor: Colors.brandBlue,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: 25,
  },
  retryButtonText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 16,
  },
  floatingCartButton: {
    position: 'absolute',
    bottom: Spacing.xl,
    left: Spacing.lg,
    right: Spacing.lg,
    ...Elevation.level3,
  },
  floatingCartGradient: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 30,
  },
  floatingCartText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textOnGold,
  },
  floatingCartCount: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingCartCountText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textOnGold,
  },
});

export default MenuScreen;
