import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  FlatList,
  RefreshControl,
  SafeAreaView,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import BottomSheet from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MenuItemCard } from '../components/MenuItemCard';
import { SkeletonMenuList } from '../components/SkeletonMenuCard';
import { ItemDetailSheet } from '../components/ItemDetailSheet';
import { fetchMenuWithCache, getCachedMenu, fetchItemsByCategory } from '../services/menuService';
import { addToCart } from '../store/cartSlice';
import { RootState } from '../store';
import { Colors } from '../theme/colors';
import { Spacing } from '../theme/spacing';
import { Category, MenuItem, MenuItemSize } from '../types/menu.types';

interface MenuSection {
  title: string;
  categoryId: number;
  data: MenuItem[];
}

const MenuScreen = ({navigation}: any) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [sections, setSections] = useState<MenuSection[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  const dispatch = useDispatch();
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const bottomSheetRef = useRef<BottomSheet>(null);
  const categoryListRef = useRef<FlatList>(null);
  const sectionListRef = useRef<SectionList>(null);

  useEffect(() => {
    loadMenu();
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
      const itemPromises = categoriesToLoad.map(async (cat) => {
        try {
          const items = await fetchItemsByCategory(cat.categoryId);
          return {
            title: cat.name,
            categoryId: cat.categoryId,
            data: items
          };
        } catch (error) {
          console.error(`Error loading items for category ${cat.categoryId}:`, error);
          return {
            title: cat.name,
            categoryId: cat.categoryId,
            data: []
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
        viewPosition: 0
      });
    }

    // Scroll category tab into view
    if (categoryListRef.current) {
      categoryListRef.current.scrollToIndex({
        index,
        animated: true,
        viewPosition: 0.5
      });
    }
  };

  const handleItemPress = (item: MenuItem) => {
    setSelectedItem(item);
    bottomSheetRef.current?.expand();
  };

  const handleAddToCart = (item: MenuItem, size: MenuItemSize, quantity: number) => {
    dispatch(addToCart({
      menuItemId: item.itemId,
      sizeId: size.sizeId,
      name: item.name,
      sizeName: size.sizeName,
      price: size.price,
      quantity,
      imageUrl: item.imageUrl
    }));
  };

  const renderCategory = ({item, index}: {item: Category; index: number}) => (
    <TouchableOpacity
      style={[
        styles.categoryButton,
        selectedCategoryId === item.categoryId && styles.selectedCategoryButton,
      ]}
      onPress={() => handleCategoryPress(item.categoryId, index)}>
      <Text
        style={[
          styles.categoryText,
          selectedCategoryId === item.categoryId && styles.selectedCategoryText,
        ]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderSectionHeader = ({section}: {section: MenuSection}) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
    </View>
  );

  const renderItem = ({item}: {item: MenuItem}) => (
    <MenuItemCard
      item={item}
      onPress={() => handleItemPress(item)}
    />
  );

  const onViewableItemsChanged = useRef(({viewableItems}: any) => {
    if (viewableItems.length > 0) {
      const firstVisibleSection = viewableItems[0].section;
      if (firstVisibleSection) {
        setSelectedCategoryId(firstVisibleSection.categoryId);

        // Scroll category tab into view
        const categoryIndex = categories.findIndex(c => c.categoryId === firstVisibleSection.categoryId);
        if (categoryIndex !== -1 && categoryListRef.current) {
          categoryListRef.current.scrollToIndex({
            index: categoryIndex,
            animated: true,
            viewPosition: 0.5
          });
        }
      }
    }
  }).current;

  const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

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
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <Text style={styles.profileText}>Profile</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Menu</Text>
          <TouchableOpacity
            style={styles.cartButton}
            onPress={() => navigation.navigate('Cart')}>
            <Text style={styles.cartButtonText}>Cart ({cartCount})</Text>
          </TouchableOpacity>
        </View>

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
            keyExtractor={(item) => item.itemId.toString()}
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
            onScrollToLocationFailed={() => {}}
          />
        )}

        <ItemDetailSheet
          item={selectedItem}
          bottomSheetRef={bottomSheetRef}
          onAddToCart={handleAddToCart}
        />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: Spacing.md,
    backgroundColor: Colors.secondary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  cartButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 20,
  },
  cartButtonText: {
    color: Colors.white,
    fontWeight: 'bold',
  },
  profileText: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  categoryListContainer: {
    backgroundColor: Colors.white,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  categoryList: {
    paddingHorizontal: Spacing.sm,
  },
  categoryButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginHorizontal: Spacing.xs,
    borderRadius: 20,
    backgroundColor: Colors.gray,
  },
  selectedCategoryButton: {
    backgroundColor: Colors.primary,
  },
  categoryText: {
    color: Colors.text,
    fontWeight: '600',
  },
  selectedCategoryText: {
    color: Colors.white,
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
