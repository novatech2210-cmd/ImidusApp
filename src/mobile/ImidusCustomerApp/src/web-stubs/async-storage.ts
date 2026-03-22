/**
 * Web stub for @react-native-async-storage/async-storage
 * Uses localStorage for web
 */

const AsyncStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Ignore storage errors
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore storage errors
    }
  },
  clear: async (): Promise<void> => {
    try {
      localStorage.clear();
    } catch {
      // Ignore storage errors
    }
  },
  getAllKeys: async (): Promise<string[]> => {
    try {
      return Object.keys(localStorage);
    } catch {
      return [];
    }
  },
  multiGet: async (keys: string[]): Promise<[string, string | null][]> => {
    try {
      return keys.map(key => [key, localStorage.getItem(key)]);
    } catch {
      return keys.map(key => [key, null]);
    }
  },
  multiSet: async (keyValuePairs: [string, string][]): Promise<void> => {
    try {
      keyValuePairs.forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });
    } catch {
      // Ignore storage errors
    }
  },
  multiRemove: async (keys: string[]): Promise<void> => {
    try {
      keys.forEach(key => localStorage.removeItem(key));
    } catch {
      // Ignore storage errors
    }
  },
};

export default AsyncStorage;
