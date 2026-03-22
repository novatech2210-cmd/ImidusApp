import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const TOKEN_KEY = '@imidus_auth_token';
const REFRESH_TOKEN_KEY = '@imidus_refresh_token';
const USER_KEY = '@imidus_user';

export const tokenStorage = {
  async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(TOKEN_KEY);
    } catch (error) {
      console.error('[TokenStorage] Get token error:', error);
      return null;
    }
  },

  async getRefreshToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('[TokenStorage] Get refresh token error:', error);
      return null;
    }
  },

  async setTokens(token: string, refreshToken: string): Promise<void> {
    try {
      await AsyncStorage.multiSet([
        [TOKEN_KEY, token],
        [REFRESH_TOKEN_KEY, refreshToken],
      ]);
    } catch (error) {
      console.error('[TokenStorage] Set tokens error:', error);
      throw error;
    }
  },

  async clearTokens(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY]);
    } catch (error) {
      console.error('[TokenStorage] Clear tokens error:', error);
      throw error;
    }
  },

  async getUser(): Promise<any | null> {
    try {
      const userJson = await AsyncStorage.getItem(USER_KEY);
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      console.error('[TokenStorage] Get user error:', error);
      return null;
    }
  },

  async setUser(user: any): Promise<void> {
    try {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('[TokenStorage] Set user error:', error);
      throw error;
    }
  },

  // Constants for external use
  TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  USER_KEY,
};

export default tokenStorage;
