import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiResponse } from '@/types/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://10.0.0.26:5004';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include cookies
});

// Request interceptor - add JWT token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('adminToken');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

// Dashboard APIs
export const dashboardAPI = {
  getSummary: (startDate: string, endDate: string) =>
    apiClient.get<ApiResponse<any>>(`/api/admin/dashboard/summary`, {
      params: { startDate, endDate },
    }),

  getSalesChart: (startDate: string, endDate: string, groupBy = 'day') =>
    apiClient.get<ApiResponse<any>>(`/api/admin/dashboard/sales-chart`, {
      params: { startDate, endDate, groupBy },
    }),

  getPopularItems: (limit = 10) =>
    apiClient.get<ApiResponse<any>>(`/api/admin/dashboard/popular-items`, {
      params: { limit },
    }),
};

// Order APIs
export const orderAPI = {
  getQueue: (status?: string, searchTerm?: string, limit = 50) =>
    apiClient.get<ApiResponse<any>>(`/api/admin/orders/queue`, {
      params: { status, searchTerm, limit },
    }),

  getDetail: (salesId: number) =>
    apiClient.get<ApiResponse<any>>(`/api/admin/orders/${salesId}`),

  refund: (salesId: number, data: any) =>
    apiClient.post<ApiResponse<any>>(`/api/admin/orders/${salesId}/refund`, data),

  cancel: (salesId: number, data: any) =>
    apiClient.post<ApiResponse<any>>(`/api/admin/orders/${salesId}/cancel`, data),
};

// Customer APIs
export const customerAPI = {
  getSegments: () =>
    apiClient.get<ApiResponse<any>>(`/api/admin/customers/segments`),

  getList: (segment?: string, limit = 50, offset = 0) =>
    apiClient.get<ApiResponse<any>>(`/api/admin/customers`, {
      params: { segment, limit, offset },
    }),

  getProfile: (customerId: number) =>
    apiClient.get<ApiResponse<any>>(`/api/admin/customers/${customerId}/profile`),

  getHistory: (customerId: number) =>
    apiClient.get<ApiResponse<any>>(`/api/admin/customers/${customerId}/history`),
};

// Campaign APIs
export const campaignAPI = {
  getList: (status?: string) =>
    apiClient.get<ApiResponse<any>>(`/api/admin/campaigns`, {
      params: { status },
    }),

  create: (data: any) =>
    apiClient.post<ApiResponse<any>>(`/api/admin/campaigns`, data),

  update: (id: number, data: any) =>
    apiClient.put<ApiResponse<any>>(`/api/admin/campaigns/${id}`, data),

  send: (id: number) =>
    apiClient.post<ApiResponse<any>>(`/api/admin/campaigns/${id}/send`, {}),

  getTargetAudience: (filter: any) =>
    apiClient.post<ApiResponse<any>>(`/api/admin/campaigns/target-audience`, filter),
};

// Menu APIs
export const menuAPI = {
  getOverrides: () =>
    apiClient.get<ApiResponse<any>>(`/api/admin/menu/overrides`),

  updateOverride: (itemId: number, data: any) =>
    apiClient.put<ApiResponse<any>>(`/api/admin/menu/overrides/${itemId}`, data),

  getInventory: () =>
    apiClient.get<ApiResponse<any>>(`/api/admin/menu/inventory`),
};

// Activity Log APIs
export const activityLogAPI = {
  getList: (limit = 100, action?: string) =>
    apiClient.get<ApiResponse<any>>(`/api/admin/logs`, {
      params: { limit, action },
    }),
};

// Birthday Reward APIs
export const birthdayRewardAPI = {
  getConfig: () =>
    apiClient.get<ApiResponse<any>>(`/api/admin/rewards/birthday`),

  updateConfig: (data: any) =>
    apiClient.put<ApiResponse<any>>(`/api/admin/rewards/birthday`, data),
};

// Terminal Bridge APIs
export const terminalBridgeAPI = {
  getRequests: (status?: string) =>
    apiClient.get<ApiResponse<any>>(`/api/admin/terminal-bridge/requests`, {
      params: { status },
    }),

  createRequest: (data: any) =>
    apiClient.post<ApiResponse<any>>(`/api/admin/terminal-bridge/requests`, data),

  getResponse: (requestId: string) =>
    apiClient.get<ApiResponse<any>>(`/api/admin/terminal-bridge/requests/${requestId}/response`),
};

// Auth APIs
export const authAPI = {
  login: (email: string, password: string) =>
    apiClient.post<ApiResponse<any>>(`/api/auth/admin-login`, { email, password }),

  logout: () =>
    apiClient.post<ApiResponse<any>>(`/api/auth/admin-logout`, {}),

  refreshToken: () =>
    apiClient.post<ApiResponse<any>>(`/api/auth/refresh`, {}),
};

export default apiClient;
