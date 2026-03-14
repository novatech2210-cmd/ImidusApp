import BottomSheet from '@gorhom/bottom-sheet';
import React, {useCallback, useEffect, useRef, useState} from 'react';
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
import {Colors, Shadow, Spacing} from '../theme';
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
          toValue: 1.2,
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
      // Load items from cache for all categories
      await loadAllCategoryItems(cached.categories);
      setLoading(false);
    }

    // 2. Fetch fresh data in background
    try {
      const freshCategories = await fetchMenuWithCache();
      setCategories(freshCategories);

      // Load items for all categories
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
      // Load items for all categories in parallel
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
      // Filter out empty categories
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

    // Find section index and scroll to it
    const sectionIndex = sections.findIndex(s => s.categoryId === categoryId);
    if (sectionIndex !== -1 && sectionListRef.current) {
      sectionListRef.current.scrollToLocation({
        sectionIndex,
        itemIndex: 0,
        animated: true,
        viewPosition: 0,
      });
    }

    // Scroll category tab into view
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
        style={styles.categoryButton}
        onPress={() => handleCategoryPress(item.categoryId, index)}>
        <Text
          style={[
            styles.categoryText,
            isSelected && styles.selectedCategoryText,
          ]}>
          {item.name}
        </Text>
        {isSelected && <View style={styles.activeIndicator} />}
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

        // Scroll category tab into view
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
      <View style={{flex: 1, backgroundColor: Colors.background}}>
        <LinearGradient
          colors={[Colors.brandBlue, Colors.brandBlueDark]}
          style={styles.headerGradient}>
          <SafeAreaView edges={['top']}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
                <Text style={styles.headerLink}>Profile</Text>
              </TouchableOpacity>

              <View style={styles.titleContainer}>
                <Text style={styles.title}>Menu</Text>
                <Animated.View
                  style={[
                    styles.syncDot,
                    posConnected
                      ? styles.syncDotConnected
                      : styles.syncDotReconnecting,
                    {transform: [{scale: pulseAnim}]},
                  ]}
                />
              </View>

              <TouchableOpacity
                style={styles.cartCountButton}
                onPress={() => navigation.navigate('Cart')}>
                <Text style={styles.cartCountText}>Cart ({cartCount})</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </LinearGradient>

        <View style={styles.categoryListContainer}>
          <FlatList
            ref={categoryListRef}
            data={categories}
            renderItem={renderCategory}
            keyExtractor={item => item.categoryId.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryList}
            onScrollToIndexFailed={() => {}}
          />
        </View>

        {loading && sections.length === 0 ? (
          <SkeletonMenuList />
        ) : (
          <SectionList
            ref={sectionListRef}
            sections={sections}
            renderItem={renderItem}
            renderSectionHeader={renderSectionHeader}
            keyExtractor={item => item.itemId.toString()}
            contentContainerStyle={styles.itemList}
            stickySectionHeadersEnabled={false}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewConfigRef}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={Colors.primary}
                colors={[Colors.primary]}
              />
            }
            onScrollToIndexFailed={() => {}}
          />
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
  headerGradient: {
    paddingBottom: Spacing.xs,
  },
  header: {
    padding: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.white,
    letterSpacing: 0.5,
  },
  syncDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: Spacing.sm,
  },
  syncDotConnected: {
    backgroundColor: Colors.success, // Green when POS connected
  },
  syncDotReconnecting: {
    backgroundColor: Colors.warning, // Orange when reconnecting
  },
  cartCountButton: {
    backgroundColor: Colors.brandGold,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 20,
    ...Shadow.goldButton,
  },
  cartCountText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
  headerLink: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  categoryListContainer: {
    backgroundColor: Colors.white,
    paddingVertical: 0,
    borderBottomWidth: 1,
    borderBottomColor: Colors.midGray,
  },
  categoryList: {
    paddingHorizontal: Spacing.sm,
  },
  categoryButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginHorizontal: Spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: Spacing.md,
    right: Spacing.md,
    height: 3,
    backgroundColor: Colors.brandGold,
    borderRadius: 1.5,
  },
  categoryText: {
    color: Colors.textSecondary,
    fontWeight: '600',
    fontSize: 15,
  },
  selectedCategoryText: {
    color: Colors.brandBlue,
    fontWeight: '700',
  },
  sectionHeader: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  itemList: {
    paddingVertical: Spacing.sm,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  errorText: {
    fontSize: 16,
    color: Colors.error,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
  },
  retryButtonText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 16,
  },
});

export default MenuScreen;
