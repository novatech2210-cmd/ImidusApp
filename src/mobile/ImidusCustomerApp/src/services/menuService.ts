import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/apiClient';
import {Category, MenuItem} from '../types/menu.types';

const MENU_CACHE_KEY = 'menu_cache';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes per RESEARCH.md recommendation

interface CachedMenu {
  categories: Category[];
  timestamp: number;
}

export const getCachedMenu = async (): Promise<{
  categories: Category[];
  isStale: boolean;
} | null> => {
  try {
    const cached = await AsyncStorage.getItem(MENU_CACHE_KEY);
    if (!cached) return null;

    const {categories, timestamp}: CachedMenu = JSON.parse(cached);
    const isStale = Date.now() - timestamp > CACHE_TTL_MS;
    return {categories, isStale};
  } catch (error) {
    console.error('Error reading cached menu:', error);
    return null;
  }
};

export const fetchMenuWithCache = async (): Promise<Category[]> => {
  // Fetch fresh data from API
  const response = await apiClient.get('/Menu/categories');
  const categories: Category[] = response.data;

  // Cache for next load
  const cacheData: CachedMenu = {
    categories,
    timestamp: Date.now(),
  };

  try {
    await AsyncStorage.setItem(MENU_CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Error caching menu:', error);
    // Non-fatal - continue without caching
  }

  return categories;
};

export const fetchItemsByCategory = async (
  categoryId: number,
): Promise<MenuItem[]> => {
  const response = await apiClient.get(`/Menu/items/${categoryId}`);
  return response.data;
};
