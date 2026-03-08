const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5004/api";

export async function apiClient(path: string, options: RequestInit = {}) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (
    token &&
    !path.includes("/auth/login") &&
    !path.includes("/auth/register")
  ) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Add idempotency key for register requests
  if (path.includes("/auth/register")) {
    headers["Idempotency-Key"] = `reg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  const url = `${API_BASE}${path}`;
  console.log(`[API] Fetching: ${url}`); // Debug logging

  const res = await fetch(url, { ...options, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error(`[API] Error ${res.status}:`, err);
    throw new Error(err.error || err.message || `HTTP ${res.status}`);
  }

  return res.json();
}

// ── Typed API helpers ──────────────────────────────────────────────────

export interface MenuItemSize {
  sizeId: number;
  sizeName: string;
  shortName?: string;
  price: number;
  inStock: boolean;
  stockQuantity: number;
  displayOrder: number;
}

export interface MenuItem {
  itemId: number;
  name: string;
  description?: string;
  imageUrl?: string;
  categoryId: number;
  isAlcohol: boolean;
  isAvailable: boolean;
  applyGST?: boolean;
  applyPST?: boolean;
  sizes: MenuItemSize[];
}

export interface Category {
  categoryId: number;
  name: string;
  displayOrder: number;
}

export interface OrderItemRequest {
  menuItemId: number;
  sizeId: number;
  quantity: number;
  unitPrice: number;
}

export interface CreateOrderRequest {
  customerId: number;
  items: OrderItemRequest[];
  paymentAuthorizationNo?: string;
  paymentBatchNo?: string;
  paymentTypeId?: number;
  tipAmount?: number;
}

export interface CreateOrderResponse {
  success: boolean;
  message?: string;
  salesId?: number;
  orderNumber?: string;
  totalAmount?: number;
  createdAt?: string;
}

export interface PaymentToken {
  dataDescriptor: string;
  dataValue: string;
}

export interface CompletePaymentRequest {
  token: PaymentToken;
  amount: number;
  customerId?: number;
  pointsToRedeem?: number;
}

export interface OrderCompletionResult {
  success: boolean;
  transactionId?: string;
  ticketId?: number;
  dailyOrderNumber?: number;
  errorMessage?: string;
}

export const OrderAPI = {
  create: (data: CreateOrderRequest) =>
    apiClient("/Orders", {
      method: "POST",
      body: JSON.stringify(data),
      headers: { "X-Idempotency-Key": crypto.randomUUID() },
    }),

  completePayment: (salesId: number, data: CompletePaymentRequest): Promise<OrderCompletionResult> =>
    apiClient(`/Orders/${salesId}/complete-payment`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getStatus: (id: number) => apiClient(`/Orders/${id}/status`),
  getOrderHistory: (customerId: number) =>
    apiClient(`/Orders/history/${customerId}`),
};

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

export interface LoginRequest {
  phone?: string;
  email?: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  password: string;
}

export const AuthAPI = {
  login: (data: LoginRequest) => 
    apiClient("/Auth/login", { method: "POST", body: JSON.stringify(data) }),
  register: (data: RegisterRequest) =>
    apiClient("/Auth/register", { method: "POST", body: JSON.stringify(data) }),
  getCurrentUser: () => apiClient("/Auth/me"),
  refreshToken: (refreshToken: string) =>
    apiClient("/Auth/refresh", { method: "POST", body: JSON.stringify({ refreshToken }) }),
};

export const CustomerAPI = {
  lookup: (phone?: string, email?: string) => {
    const params = new URLSearchParams();
    if (phone) params.append("phone", phone);
    if (email) params.append("email", email);
    return apiClient(`/Customers/lookup?${params.toString()}`);
  },
};

export const LoyaltyAPI = {
  getBalance: () => apiClient("/loyalty/balance"),
};

// ── Scheduled Orders API ───────────────────────────────────────────────

export interface ScheduledOrderItemRequest {
  menuItemId: number;
  sizeId: number;
  quantity: number;
  unitPrice: number;
  specialInstructions?: string;
}

export interface CreateScheduledOrderRequest {
  customerId: number;
  scheduledDateTime: string; // ISO format
  items: ScheduledOrderItemRequest[];
  paymentAuthorizationNo?: string;
  paymentBatchNo?: string;
  paymentTypeId?: number;
  tipAmount?: number;
  specialInstructions?: string;
  idempotencyKey: string;
}

export interface ScheduledOrderResponse {
  success: boolean;
  message: string;
  scheduledOrderId?: number;
  confirmationCode?: string;
  scheduledDateTime?: string;
  totalAmount?: number;
}

export interface ScheduledOrder {
  id: number;
  customerId: number;
  customerName: string;
  scheduledDateTime: string;
  status: string;
  items: Array<{
    itemName: string;
    sizeName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  confirmationCode: string;
  canCancel: boolean;
}

export interface TimeSlot {
  time: string;
  displayText: string;
  isAvailable: boolean;
}

export const ScheduledOrderAPI = {
  create: (data: CreateScheduledOrderRequest) =>
    apiClient("/ScheduledOrders", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  
  getByCustomer: (customerId: number): Promise<ScheduledOrder[]> =>
    apiClient(`/ScheduledOrders/customer/${customerId}`),
  
  cancel: (orderId: number, reason?: string) =>
    apiClient(`/ScheduledOrders/${orderId}/cancel`, {
      method: "POST",
      body: JSON.stringify(reason || "Customer requested"),
    }),
  
  getTimeSlots: (date: string, leadTimeMinutes?: number): Promise<{ availableSlots: TimeSlot[] }> =>
    apiClient(`/ScheduledOrders/timeslots?date=${date}&leadTimeMinutes=${leadTimeMinutes || 30}`),
};

// ── Menu API ───────────────────────────────────────────────────────────

export const MenuAPI = {
  getCategories: (): Promise<Category[]> => apiClient("/Menu/categories"),
  getItemsByCategory: (categoryId: number): Promise<MenuItem[]> => 
    apiClient(`/Menu/items/${categoryId}`),
  // Stub functions for merchant dashboard (Milestone 4)
  getAnalyticsSummary: (): Promise<any> => 
    Promise.resolve({ totalSales: 0, totalOrders: 0, averageOrderValue: 0 }),
  getTopProducts: (): Promise<any[]> => Promise.resolve([]),
  getSalesTrend: (): Promise<any[]> => Promise.resolve([]),
};

// ── Sync API (Real-time POS Connection Status) ─────────────────────────

export interface SyncStatusResponse {
  status: string;
  isHealthy: boolean;
  message: string;
  timestamp: string;
  serverTime: string;
  lastSuccessfulSync?: string;
  posDatabaseStatus: string;
  posDatabaseLatency?: number;
  posDatabaseError?: string;
  categoriesAvailable: number;
}

export interface SyncStatsResponse {
  timestamp: string;
  databaseStatus: string;
  errorMessage?: string;
  lastCheckTime?: string;
  totalOrdersToday: number;
  totalRevenueToday: number;
  averageOrderValue: number;
  totalCategories: number;
  totalMenuItems: number;
}

export const SyncAPI = {
  getStatus: (): Promise<SyncStatusResponse> => apiClient("/Sync/status"),
  healthCheck: (): Promise<{ status: string; timestamp: string }> => 
    apiClient("/Sync/health"),
  getStats: (): Promise<SyncStatsResponse> => apiClient("/Sync/stats"),
  forceCheck: (): Promise<SyncStatusResponse> => 
    apiClient("/Sync/check", { method: "POST" }),
};

// ── Admin API (Milestone 4 - Merchant Portal) ───────────────────────────

export interface DashboardSummary {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  totalCustomers: number;
  periodStart: string;
  periodEnd: string;
}

export interface SalesChartPoint {
  label: string;
  orderCount: number;
  revenue: number;
}

export interface PopularItem {
  itemId: number;
  name: string;
  quantity: number;
  revenue: number;
}

export interface OrderQueueItem {
  orderId: number;
  dailyOrderNumber: number;
  customerName: string;
  status: string;
  total: number;
  orderTime: string;
  items: any[];
}

export interface CustomerSegment {
  customerId: number;
  name: string;
  segment: string;
  rScore: number;
  fScore: number;
  mScore: number;
  totalSpent: number;
  orderCount: number;
  lastOrderDate: string;
}

export interface Campaign {
  id: number;
  name: string;
  description: string;
  campaignType: string;
  status: string;
  targetQuery: string;
  scheduledAt: string;
  sentAt: string;
  createdAt: string;
}

export interface MenuOverride {
  itemId: number;
  itemName: string;
  isAvailable: boolean;
  hiddenFromOnline: boolean;
  overridePrice: number;
  overrideName: string;
}

export const AdminAPI = {
  // Dashboard
  getDashboardSummary: (startDate?: string, endDate?: string): Promise<DashboardSummary> =>
    apiClient(`/Admin/dashboard/summary?startDate=${startDate || ''}&endDate=${endDate || ''}`),
  getSalesChart: (startDate: string, endDate: string, groupBy = 'day'): Promise<SalesChartPoint[]> =>
    apiClient(`/Admin/dashboard/sales-chart?startDate=${startDate}&endDate=${endDate}&groupBy=${groupBy}`),
  getPopularItems: (startDate?: string, endDate?: string, limit = 10): Promise<PopularItem[]> =>
    apiClient(`/Admin/dashboard/popular-items?limit=${limit}`),
  
  // Order Queue
  getOrderQueue: (status?: string, limit = 50): Promise<OrderQueueItem[]> =>
    apiClient(`/Admin/orders/queue?status=${status || ''}&limit=${limit}`),
  processRefund: (salesId: number, amount: number, reason?: string): Promise<any> =>
    apiClient(`/Admin/orders/${salesId}/refund`, {
      method: 'POST',
      body: JSON.stringify({ amount, reason }),
    }),
  
  // Customers (RFM)
  getCustomerSegments: (): Promise<CustomerSegment[]> =>
    apiClient('/Admin/customers/segments'),
  getCustomerHistory: (customerId: number): Promise<any[]> =>
    apiClient(`/Admin/customers/${customerId}/history`),
  
  // Campaigns
  getCampaigns: (): Promise<Campaign[]> =>
    apiClient('/Admin/campaigns'),
  createCampaign: (data: Partial<Campaign>): Promise<Campaign> =>
    apiClient('/Admin/campaigns', { method: 'POST', body: JSON.stringify(data) }),
  sendCampaign: (campaignId: number): Promise<any> =>
    apiClient(`/Admin/campaigns/${campaignId}/send`, { method: 'POST' }),
  
  // Menu Overrides
  getMenuOverrides: (): Promise<MenuOverride[]> =>
    apiClient('/Admin/menu/overrides'),
  updateMenuOverride: (itemId: number, data: Partial<MenuOverride>): Promise<MenuOverride> =>
    apiClient(`/Admin/menu/overrides/${itemId}`, { method: 'PUT', body: JSON.stringify(data) }),
  
  // Activity Logs
  getActivityLogs: (limit = 100): Promise<any[]> =>
    apiClient(`/Admin/logs?limit=${limit}`),
};
