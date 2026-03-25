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

  // Add idempotency key for auth requests (login and register)
  if (path.includes("/auth/login") || path.includes("/auth/register")) {
    headers["Idempotency-Key"] =
      `auth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
  imageUrl?: string;
  displayOrder: number;
}

export interface OrderItemRequest {
  menuItemId: number;
  sizeId: number;
  quantity: number;
  unitPrice: number;
}

export interface OrderItem {
  menuItemId: number;
  sizeId: number;
  sizeName?: string;
  name?: string;
  quantity: number;
  unitPrice: number;
  totalPrice?: number;
}

// Order type for order details/confirmation (READ-ONLY from POS)
export interface Order {
  id: string;
  orderNumber: string;
  transactionId?: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  subtotal: number;
  gst: number;
  pst: number;
  total: number;
  paymentMethod?: string;
  lastFourDigits?: string;
  createdAt: string;
  status?: "received" | "preparing" | "ready" | "completed" | "cancelled";
  _meta?: {
    source: string;
    readonly: boolean;
    fetchedAt?: string;
  };
}

// Order status for real-time tracking (READ-ONLY from POS)
export interface OrderStatus {
  orderId: string;
  status: "received" | "preparing" | "ready" | "completed" | "cancelled";
  estimatedReadyTime?: string;
  currentStep?: number;
  _meta?: {
    source: string;
    readonly: boolean;
    timestamp?: string;
  };
}

export interface CreateOrderRequest {
  customerId: number;
  items: OrderItemRequest[];
  paymentAuthorizationNo?: string;
  paymentBatchNo?: string;
  paymentTypeId?: number;
  tipAmount?: number;
  createAccount?: boolean;
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

  completePayment: (
    salesId: number,
    data: CompletePaymentRequest,
  ): Promise<OrderCompletionResult> =>
    apiClient(`/Orders/${salesId}/complete-payment`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getStatus: (id: number) => apiClient(`/Orders/${id}/status`),
  getOrderHistory: (customerId: number) =>
    apiClient(`/Orders/history/${customerId}`),

  // Get single order by ID (READ-ONLY from POS)
  getOrderById: (orderId: string): Promise<Order> =>
    apiClient(`/Orders/${orderId}`),

  // Get order status for tracking (READ-ONLY from POS)
  getOrderStatus: (orderId: string): Promise<OrderStatus> =>
    apiClient(`/Orders/${orderId}/status`),
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
  birthMonth?: number;
  birthDay?: number;
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
    apiClient("/Auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    }),
};

export const CustomerAPI = {
  lookup: (phone?: string, email?: string) => {
    const params = new URLSearchParams();
    if (phone) params.append("phone", phone);
    if (email) params.append("email", email);
    return apiClient(`/Customers/lookup?${params.toString()}`);
  },
  updateBirthday: (customerId: number, month: number, day: number) =>
    apiClient(`/Customers/${customerId}/birthday`, {
      method: "POST",
      body: JSON.stringify({ month, day }),
    }),
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
  createAccount?: boolean;
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

export interface ScheduledOrderPaymentRequest {
  scheduledOrderId: number;
  token: PaymentToken;
  amount: number;
  customerId?: number;
}

export interface ScheduledOrderPaymentResponse {
  success: boolean;
  message?: string;
  transactionId?: string;
  authorizationCode?: string;
}

export const ScheduledOrderAPI = {
  create: (data: CreateScheduledOrderRequest) =>
    apiClient("/ScheduledOrders", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Process payment for scheduled order (charges card immediately per locked decision)
  processPayment: (
    orderId: number,
    data: ScheduledOrderPaymentRequest,
  ): Promise<ScheduledOrderPaymentResponse> =>
    apiClient(`/ScheduledOrders/${orderId}/payment`, {
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

  getTimeSlots: (
    date: string,
    leadTimeMinutes?: number,
  ): Promise<{ availableSlots: TimeSlot[] }> =>
    apiClient(
      `/ScheduledOrders/timeslots?date=${date}&leadTimeMinutes=${leadTimeMinutes || 30}`,
    ),
};

// ── Menu API ───────────────────────────────────────────────────────────

export interface AnalyticsSummary {
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
}

export interface TopProduct {
  itemId: number;
  itemName: string;
  orderCount: number;
  totalRevenue: number;
}

export interface SalesTrendPoint {
  date: string;
  sales: number;
  orders: number;
}

export const MenuAPI = {
  getCategories: (): Promise<Category[]> => apiClient("/Menu/categories"),
  getItemsByCategory: (categoryId: number): Promise<MenuItem[]> =>
    apiClient(`/Menu/items/${categoryId}`),
  getItemSizes: (itemId: number): Promise<MenuItemSize[]> =>
    apiClient(`/Menu/${itemId}/sizes`),
  // Stub functions for merchant dashboard (Milestone 4)
  getAnalyticsSummary: (): Promise<AnalyticsSummary> =>
    Promise.resolve({ totalSales: 0, totalOrders: 0, averageOrderValue: 0 }),
  getTopProducts: (): Promise<TopProduct[]> => Promise.resolve([]),
  getSalesTrend: (): Promise<SalesTrendPoint[]> => Promise.resolve([]),
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

export interface OrderItemDto {
  id: number;
  itemId: number;
  name: string;
  sizeName?: string;
  quantity: number;
  price: number; // In cents
}

export interface OrderDetailDto {
  id: number;
  salesId: number;
  orderNumber: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  items: OrderItemDto[];
  subtotal: number;
  gstAmt: number;
  pstAmt: number;
  total: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  transType: number;
  createdAt: string;
  paidAt?: string;
  readyAt?: string;
  completedAt?: string;
  notes?: string;
}

export interface CampaignSendResponse {
  success: boolean;
  campaignId: number;
  recipientsCount: number;
  sentAt: string;
}

export interface ActivityLogInfo {
  id: number;
  timestamp: string;
  category: string;
  action: string;
  entityType: string;
  entityId?: string;
  description: string;
  userId?: number;
  userName?: string;
  severity: string;
}

export interface OrderQueueItem {
  id: number;
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  total: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: string;
  transType: number;
}

export interface RefundRequest {
  amount: number;
  reason?: string;
}

export interface RefundResponse {
  message: string;
}

export interface CustomerHistoryEntry {
  orderID: number;
  dailyOrderNumber: number;
  orderDate: string;
  subTotal: number;
  gstAmt: number;
  total: number;
  status: string;
}

export interface CustomerSegment {
  customerID: number;
  name: string;
  email?: string;
  phone?: string;
  segment: string;
  lifetimeValue: number;
  orderCount: number;
  lastOrderDate?: string;
  earnedPoints: number;
}

export interface SegmentCounts {
  highSpend: number;
  frequent: number;
  recent: number;
  atRisk: number;
  newCustomers: number;
  total: number;
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

export interface CampaignSendResponse {
  success: boolean;
  message: string;
  sentCount: number;
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
  // Auth
  login: (data: LoginRequest) =>
    apiClient("/Auth/admin-login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Dashboard
  getDashboardSummary: (
    startDate?: string,
    endDate?: string,
  ): Promise<DashboardSummary> =>
    apiClient(
      `/Admin/dashboard/summary?startDate=${startDate || ""}&endDate=${endDate || ""}`,
    ).then((res) => res.data),
  getSalesChart: (
    startDate: string,
    endDate: string,
    groupBy = "day",
  ): Promise<SalesChartPoint[]> =>
    apiClient(
      `/Admin/dashboard/sales-chart?startDate=${startDate}&endDate=${endDate}&groupBy=${groupBy}`,
    ).then((res) => res.data),
  getPopularItems: (
    startDate?: string,
    endDate?: string,
    limit = 10,
  ): Promise<PopularItem[]> => {
    const query = new URLSearchParams();
    if (startDate) query.append("startDate", startDate);
    if (endDate) query.append("endDate", endDate);
    query.append("limit", limit.toString());
    return apiClient(`/Admin/dashboard/popular-items?${query.toString()}`).then(
      (res) => res.data,
    );
  },

  // Order Queue
  getOrderQueue: (params: {
    status?: string;
    paymentStatus?: string;
    searchTerm?: string;
    limit?: number;
  }): Promise<{ success: boolean; data: OrderQueueItem[] }> => {
    const query = new URLSearchParams();
    if (params.status) query.append("status", params.status);
    if (params.paymentStatus)
      query.append("paymentStatus", params.paymentStatus);
    if (params.searchTerm) query.append("searchTerm", params.searchTerm);
    if (params.limit) query.append("limit", params.limit.toString());
    return apiClient(`/Admin/orders/queue?${query.toString()}`);
  },
  getOrderDetail: (
    salesId: number,
  ): Promise<{ success: boolean; data: OrderDetailDto }> =>
    apiClient(`/Admin/orders/${salesId}`),
  processRefund: (
    salesId: number,
    data: RefundRequest,
  ): Promise<RefundResponse> =>
    apiClient(`/Admin/orders/${salesId}/refund`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Customers (RFM)
  getCustomers: (params: {
    segment?: string;
    searchTerm?: string;
    limit?: number;
  }): Promise<{ success: boolean; data: CustomerSegment[] }> => {
    const query = new URLSearchParams();
    if (params.segment) query.append("segment", params.segment);
    if (params.searchTerm) query.append("searchTerm", params.searchTerm);
    if (params.limit) query.append("limit", params.limit.toString());
    return apiClient(`/Admin/customers?${query.toString()}`);
  },
  getCustomerProfile: (
    customerId: number,
  ): Promise<{ success: boolean; data: CustomerSegment }> =>
    apiClient(`/Admin/customers/${customerId}`),
  getCustomerSegments: (): Promise<{ success: boolean; data: SegmentCounts }> =>
    apiClient("/Admin/customers/segments"),
  getCustomerHistory: (
    customerId: number,
  ): Promise<{ success: boolean; data: CustomerHistoryEntry[] }> =>
    apiClient(`/Admin/customers/${customerId}/history`),
  getCustomerLoyalty: (
    customerId: number,
  ): Promise<{ success: boolean; data: unknown[] }> =>
    apiClient(`/Admin/customers/${customerId}/loyalty`),

  // Campaigns
  getCampaigns: (): Promise<Campaign[]> =>
    apiClient("/Admin/campaigns").then((res) => res.data),
  createCampaign: (data: Partial<Campaign>): Promise<Campaign> =>
    apiClient("/Admin/campaigns", {
      method: "POST",
      body: JSON.stringify(data),
    }).then((res) => res.data),
  sendCampaign: (campaignId: number): Promise<CampaignSendResponse> =>
    apiClient(`/Admin/campaigns/${campaignId}/send`, { method: "POST" }).then(
      (res) => res.data,
    ),

  // Menu Overrides
  getMenuOverrides: (): Promise<MenuOverride[]> =>
    apiClient("/Admin/menu/overrides").then((res) => res.data),
  updateMenuOverride: (
    itemId: number,
    data: Partial<MenuOverride>,
  ): Promise<MenuOverride> =>
    apiClient(`/Admin/menu/overrides/${itemId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }).then((res) => res.data),

  // Activity Logs
  getActivityLogs: (limit = 100): Promise<ActivityLogInfo[]> =>
    apiClient(`/Admin/logs?limit=${limit}`).then((res) => res.data),

  // Birthday Rewards
  getBirthdayRewardConfig: (): Promise<{
    success: boolean;
    data: {
      id: number;
      rewardPoints: number;
      isActive: boolean;
      notificationTitle?: string;
      notificationMessage?: string;
    };
  }> => apiClient("/Admin/rewards/birthday"),

  updateBirthdayRewardConfig: (data: {
    rewardPoints: number;
    isActive: boolean;
    notificationTitle?: string;
    notificationMessage?: string;
  }): Promise<{ success: boolean; message: string }> =>
    apiClient("/Admin/rewards/birthday", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};
