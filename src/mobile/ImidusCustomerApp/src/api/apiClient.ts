import axios from 'axios';
import { ENV } from '../config/environment';
import { tokenStorage } from '../utils/tokenStorage';

// Generate a unique idempotency key using timestamp + random string
const generateIdempotencyKey = (): string => {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  const randomPart2 = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${randomPart}-${randomPart2}`;
};

const apiClient = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: ENV.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - attach JWT token and idempotency key to requests
apiClient.interceptors.request.use(
  async config => {
    const token = await tokenStorage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add Idempotency-Key header for POST, PUT, PATCH requests
    const method = config.method?.toLowerCase() || '';
    if (['post', 'put', 'patch'].includes(method)) {
      config.headers['X-Idempotency-Key'] = generateIdempotencyKey();
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

    // If 401 and not already retried, clear tokens and reject
    // (Token refresh is handled by authService to avoid circular dependency)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      console.log('[API] 401 error - token may be invalid');
    }

    return Promise.reject(error);
  },
);

// Log API URL in development
if (ENV.IS_DEV) {
  console.log('[API] Base URL:', ENV.API_BASE_URL);
}

export default apiClient;
