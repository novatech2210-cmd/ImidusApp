import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import authService, {
  RegisterData,
  LoginData,
  UserProfile,
} from '../services/authService';
import NotificationService from '../services/NotificationService';

// State interface
interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// ===== ASYNC THUNKS =====

/**
 * Register a new user
 */
export const registerUser = createAsyncThunk(
  'auth/register',
  async (data: RegisterData, {rejectWithValue}) => {
    try {
      const response = await authService.register(data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Registration failed');
    }
  },
);

/**
 * Login user with phone/email and password
 */
export const loginUser = createAsyncThunk(
  'auth/login',
  async (data: LoginData, {rejectWithValue}) => {
    try {
      const response = await authService.login(data);

      // Register FCM token with backend after successful login
      try {
        await NotificationService.registerTokenWithBackend(response.user.id);
        // Set up token refresh listener
        NotificationService.setupTokenRefreshListener(response.user.id);
      } catch (notifError) {
        console.warn('Failed to register FCM token after login:', notifError);
        // Don't block login on token registration failure
      }

      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Login failed');
    }
  },
);

/**
 * Logout user and clear stored auth data
 */
export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, {rejectWithValue}) => {
    try {
      await authService.logout();
      return null;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Logout failed');
    }
  },
);

/**
 * Load stored authentication data on app launch
 * Checks AsyncStorage for existing token and user data
 */
export const loadStoredAuth = createAsyncThunk(
  'auth/loadStored',
  async (_, {rejectWithValue}) => {
    try {
      const [token, user] = await Promise.all([
        authService.getStoredToken(),
        authService.getStoredUser(),
      ]);

      if (token && user) {
        // Register FCM token on authenticated app launch
        try {
          await NotificationService.registerTokenWithBackend(user.id);
          NotificationService.setupTokenRefreshListener(user.id);
        } catch (notifError) {
          console.warn(
            'Failed to register FCM token on app launch:',
            notifError,
          );
          // Don't block app launch on token registration failure
        }

        return {token, user};
      } else {
        return null;
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to load stored auth');
    }
  },
);

/**
 * Refresh current user data from backend
 */
export const refreshUserData = createAsyncThunk(
  'auth/refreshUserData',
  async (_, {rejectWithValue}) => {
    try {
      const user = await authService.getCurrentUser();
      return user;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to refresh user data');
    }
  },
);

// ===== SLICE =====

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Manual logout action (for immediate state clear)
    clearAuth: state => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
    },
    // Clear error
    clearError: state => {
      state.error = null;
    },
  },
  extraReducers: builder => {
    // ===== REGISTER =====
    builder.addCase(registerUser.pending, state => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(registerUser.fulfilled, (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
    });
    builder.addCase(registerUser.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // ===== LOGIN =====
    builder.addCase(loginUser.pending, state => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(loginUser.fulfilled, (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
    });
    builder.addCase(loginUser.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // ===== LOGOUT =====
    builder.addCase(logoutUser.pending, state => {
      state.isLoading = true;
    });
    builder.addCase(logoutUser.fulfilled, state => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
    });
    builder.addCase(logoutUser.rejected, (state, action) => {
      // Even if logout fails, clear local state
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // ===== LOAD STORED AUTH =====
    builder.addCase(loadStoredAuth.pending, state => {
      state.isLoading = true;
    });
    builder.addCase(loadStoredAuth.fulfilled, (state, action) => {
      if (action.payload) {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      }
      state.isLoading = false;
    });
    builder.addCase(loadStoredAuth.rejected, state => {
      state.isLoading = false;
      state.isAuthenticated = false;
    });

    // ===== REFRESH USER DATA =====
    builder.addCase(refreshUserData.pending, state => {
      // Don't set isLoading for refresh (background operation)
    });
    builder.addCase(refreshUserData.fulfilled, (state, action) => {
      state.user = action.payload;
    });
    builder.addCase(refreshUserData.rejected, (state, action) => {
      // If refresh fails, user might need to re-login
      state.error = action.payload as string;
    });
  },
});

export const {clearAuth, clearError} = authSlice.actions;
export default authSlice.reducer;
