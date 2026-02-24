const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

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

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || `HTTP ${res.status}`);
  }

  return res.json();
}

// ── Typed API helpers ──────────────────────────────────────────────────

export interface MenuItem {
  menuItemId: number;
  itemName: string;
  description?: string;
  price: number;
  categoryId: number;
  categoryName: string;
  isAvailable: boolean;
  imageUrl?: string;
}

export interface MenuCategory {
  categoryId: number;
  categoryName: string;
  isActive: boolean;
  itemCount: number;
  items: MenuItem[];
}

export interface OrderItem {
  menuItemId: number;
  quantity: number;
  unitPrice: number;
  specialInstructions?: string;
}

export interface CreateOrderRequest {
  items: OrderItem[];
  deliveryType: "pickup" | "dine_in";
  opaqueDataValue?: string;
  opaqueDataDescriptor?: string;
  notes?: string;
}

export const MenuAPI = {
  getFullMenu: () => apiClient("/Menu/full"),
  getTaxRate: () => apiClient("/Menu/tax-rate"),
  // Analytics
  getAnalyticsSummary: (start?: string, end?: string) =>
    apiClient(`/Analytics/summary?start=${start || ""}&end=${end || ""}`),
  getTopProducts: (start?: string, end?: string) =>
    apiClient(`/Analytics/top-products?start=${start || ""}&end=${end || ""}`),
  getSalesTrend: (start?: string, end?: string) =>
    apiClient(`/Analytics/sales-trend?start=${start || ""}&end=${end || ""}`),
};

export const OrderAPI = {
  create: (data: CreateOrderRequest) =>
    apiClient("/orders", {
      method: "POST",
      body: JSON.stringify(data),
      headers: { "X-Idempotency-Key": crypto.randomUUID() },
    }),
  getStatus: (id: number) => apiClient(`/orders/${id}/status`),
  getOrderHistory: (customerId: number) =>
    apiClient(`/orders/history/${customerId}`),
};

export const LoyaltyAPI = {
  getBalance: () => apiClient("/loyalty/balance"),
};
