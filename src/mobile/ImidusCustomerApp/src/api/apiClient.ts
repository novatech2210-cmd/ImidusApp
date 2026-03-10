import axios from 'axios';
import {ENV} from '../config/environment';
import authService from '../services/authService';

const apiClient = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: ENV.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - attach JWT token to all requests
apiClient.interceptors.request.use(
  async config => {
    const token = await authService.getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  },
);

// Response interceptor - handle 401 errors (token expired/invalid)
apiClient.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // If 401 and not already retried, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        const response = await authService.refreshToken();

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${response.token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login (handled by authService.logout)
        console.log('[API] Token refresh failed, user needs to re-login');
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);

// Log API URL in development
if (ENV.IS_DEV) {
  console.log('[API] Base URL:', ENV.API_BASE_URL);
}

export default apiClient;
