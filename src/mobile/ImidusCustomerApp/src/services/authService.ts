import apiClient from '../api/apiClient';
import { tokenStorage } from '../utils/tokenStorage';

// Types
export interface RegisterData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  password: string;
}

export interface LoginData {
  phone?: string;
  email?: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  expiresAt: string;
  user: UserProfile;
}

export interface UserProfile {
  customerId: number;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  earnedPoints: number;
}

/**
 * Auth Service
 * Handles authentication API calls and token management
 */
class AuthService {
  /**
   * Register a new user account
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/register', data);

      // Store tokens and user data
      await this.storeAuthData(
        response.data.token,
        response.data.refreshToken,
        response.data.user
      );

      return response.data;
    } catch (error: any) {
      console.error('[AuthService] Registration error:', error.response?.data || error.message);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Login with phone/email and password
   */
  async login(data: LoginData): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', data);

      // Store tokens and user data
      await this.storeAuthData(
        response.data.token,
        response.data.refreshToken,
        response.data.user
      );

      return response.data;
    } catch (error: any) {
      console.error('[AuthService] Login error:', error.response?.data || error.message);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Logout and clear stored auth data
   */
  async logout(): Promise<void> {
    try {
      await tokenStorage.clearTokens();
      console.log('[AuthService] Logout successful');
    } catch (error) {
      console.error('[AuthService] Logout error:', error);
      throw new Error('Failed to logout');
    }
  }

  /**
   * Get current user profile from backend
   * Requires valid authentication token
   */
  async getCurrentUser(): Promise<UserProfile> {
    try {
      const token = await this.getStoredToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await apiClient.get<UserProfile>('/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Update stored user data
      await this.storeUserData(response.data);

      return response.data;
    } catch (error: any) {
      console.error('[AuthService] Get current user error:', error.response?.data || error.message);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Refresh expired JWT token
   * Note: Simplified implementation for MVP
   */
  async refreshToken(): Promise<AuthResponse> {
    try {
      const refreshToken = await this.getStoredRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token found');
      }

      const response = await apiClient.post<AuthResponse>('/auth/refresh', {
        refreshToken,
      });

      // Store new tokens
      await this.storeAuthData(
        response.data.token,
        response.data.refreshToken,
        response.data.user
      );

      return response.data;
    } catch (error: any) {
      console.error('[AuthService] Token refresh error:', error.response?.data || error.message);
      // If refresh fails, clear auth data
      await this.logout();
      throw this.handleAuthError(error);
    }
  }

  /**
   * Get stored JWT token
   */
  async getStoredToken(): Promise<string | null> {
    return tokenStorage.getToken();
  }

  /**
   * Get stored refresh token
   */
  async getStoredRefreshToken(): Promise<string | null> {
    return tokenStorage.getRefreshToken();
  }

  /**
   * Get stored user data
   */
  async getStoredUser(): Promise<UserProfile | null> {
    return tokenStorage.getUser();
  }

  /**
   * Check if user is authenticated (has valid token)
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getStoredToken();
    return token !== null;
  }

  // ===== PRIVATE HELPERS =====

  /**
   * Store authentication data
   */
  private async storeAuthData(
    token: string,
    refreshToken: string,
    user: UserProfile
  ): Promise<void> {
    try {
      await tokenStorage.setTokens(token, refreshToken);
      await tokenStorage.setUser(user);
      console.log('[AuthService] Auth data stored successfully');
    } catch (error) {
      console.error('[AuthService] Store auth data error:', error);
      throw new Error('Failed to store authentication data');
    }
  }

  /**
   * Store user data
   */
  private async storeUserData(user: UserProfile): Promise<void> {
    try {
      await tokenStorage.setUser(user);
      console.log('[AuthService] User data updated');
    } catch (error) {
      console.error('[AuthService] Store user data error:', error);
      throw new Error('Failed to store user data');
    }
  }

  /**
   * Handle auth errors and return user-friendly messages
   */
  private handleAuthError(error: any): Error {
    if (error.response) {
      // Server responded with error
      const message = error.response.data?.error || error.response.data?.message || 'Authentication failed';
      return new Error(message);
    } else if (error.request) {
      // Request made but no response
      return new Error('Unable to connect to server. Please check your internet connection.');
    } else {
      // Something else happened
      return new Error(error.message || 'An unexpected error occurred');
    }
  }
}

// Export singleton instance
export default new AuthService();
