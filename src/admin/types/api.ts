// Admin Portal API Response Types

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Dashboard Types
export interface DashboardSummary {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  totalCustomers: number;
  revenueGrowth: number;
}

export interface SalesChartData {
  label: string;
  orderCount: number;
  revenue: number;
  date: string;
}

export interface PopularItem {
  itemId: number;
  itemName: string;
  quantity: number;
  revenue: number;
  imageUrl?: string;
}

// Order Types
export interface Order {
  id: number;
  orderNumber: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  items: OrderItem[];
  subtotal: number;
  gstAmt: number;
  pstAmt: number;
  total: number;
  status: 'pending' | 'completed' | 'cancelled' | 'refunded';
  paymentMethod: string;
  paymentStatus: 'paid' | 'pending' | 'failed' | 'refunded';
  createdAt: string;
  updatedAt: string;
  salesId: number;
  transType: number;
}

export interface OrderItem {
  itemId: number;
  itemName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  size?: string;
}

export interface RefundRequest {
  amount: number;
  reason: string;
  adminNotes?: string;
}

// Customer Types
export interface Customer {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  segment: 'VIP' | 'Loyal' | 'Regular' | 'AtRisk' | 'New';
  totalSpend: number;
  visitCount: number;
  lastVisitDate: string;
  loyaltyPointsBalance: number;
  earnedPoints: number;
  redeemedPoints: number;
  preferredItems: number[];
}

export interface CustomerSegments {
  VIP: number;
  Loyal: number;
  Regular: number;
  AtRisk: number;
  New: number;
}

export interface CustomerProfile {
  customer: Customer;
  purchaseHistory: Order[];
  loyaltyTransactions: LoyaltyTransaction[];
  averageOrderValue: number;
  recencyDays: number;
  frequency: number;
  monetary: number;
}

export interface LoyaltyTransaction {
  id: number;
  type: 'earn' | 'redeem';
  points: number;
  amount: number;
  description: string;
  transactionDate: string;
  orderId?: number;
}

// Campaign Types
export interface Campaign {
  id: number;
  name: string;
  type: 'marketing' | 'transactional' | 'birthday' | 'retention';
  status: 'draft' | 'scheduled' | 'sent' | 'paused';
  targetSegment: SegmentFilter;
  messageTitle: string;
  messageBody: string;
  recipientsCount: number;
  sentCount?: number;
  openRate?: number;
  clickRate?: number;
  scheduledTime?: string;
  sentDate?: string;
  createdAt: string;
  createdBy: string;
}

export interface SegmentFilter {
  segments?: string[];
  minSpend?: number;
  maxSpend?: number;
  minFrequency?: number;
  maxRecency?: number;
  customFilters?: Record<string, unknown>;
}

// Menu Types
export interface MenuItem {
  itemId: number;
  itemName: string;
  category: string;
  displayPrice: number;
  onHandQty: number;
  isAvailable: boolean;
  imageUrl?: string;
}

export interface MenuOverride {
  itemId: number;
  itemName: string;
  displayPrice: number;
  isAvailable: boolean;
  imageUrl?: string;
  stock: number;
  lastUpdated: string;
}

// Activity Log Types
export interface ActivityLog {
  id: number;
  timestamp: string;
  adminUser: string;
  action: string;
  resourceType: string;
  resourceId: number;
  description: string;
  ipAddress: string;
  userAgent?: string;
}

// Birthday Reward Types
export interface BirthdayReward {
  id: number;
  name: string;
  rewardType: 'points' | 'discount' | 'freeItem';
  value: number;
  code?: string;
  isActive: boolean;
  createdAt: string;
}

// Terminal Bridge Types
export interface TerminalBridgeRequest {
  id: string;
  orderId: number;
  amount: number;
  terminalId: string;
  transactionType: 'sale' | 'refund' | 'void';
  status: 'pending' | 'success' | 'failed' | 'cancelled';
  createdAt: string;
  respondedAt?: string;
  responseCode?: string;
  responseMessage?: string;
}

export interface TerminalBridgeResponse {
  requestId: string;
  responseCode: string;
  responseMessage: string;
  approvalCode?: string;
  transactionId?: string;
  amount: number;
  timestamp: string;
}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: AdminUser;
  expiresIn: number;
}

export interface AdminUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'manager' | 'staff';
  permissions: string[];
  createdAt: string;
}

// Pagination Types
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Filter Types
export interface OrderFilter {
  status?: string;
  searchTerm?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface CustomerFilter {
  segment?: string;
  minSpend?: number;
  maxSpend?: number;
  searchTerm?: string;
  limit?: number;
  offset?: number;
}
