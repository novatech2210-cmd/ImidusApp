"use client";

import { OrderFilterState } from "@/components/Orders/OrderFilters";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  activityLogAPI,
  authAPI,
  birthdayRewardAPI,
  campaignAPI,
  customerAPI,
  CustomerListFilters,
  dashboardAPI,
  menuAPI,
  orderAPI,
  OrderQueueFilters,
} from "./api-client";

// Dashboard Hooks
export function useDashboardSummary(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ["dashboard", "summary", startDate, endDate],
    queryFn: () =>
      dashboardAPI.getSummary(startDate, endDate).then((res) => res.data.data),
    staleTime: 5 * 60 * 1000,
  });
}

export function useSalesChart(
  startDate: string,
  endDate: string,
  groupBy = "day",
) {
  return useQuery({
    queryKey: ["dashboard", "sales-chart", startDate, endDate, groupBy],
    queryFn: () =>
      dashboardAPI
        .getSalesChart(startDate, endDate, groupBy)
        .then((res) => res.data.data),
    staleTime: 5 * 60 * 1000,
  });
}

export function usePopularItems(limit = 10) {
  return useQuery({
    queryKey: ["dashboard", "popular-items", limit],
    queryFn: () =>
      dashboardAPI.getPopularItems(limit).then((res) => res.data.data),
    staleTime: 10 * 60 * 1000,
  });
}

// Order Hooks
export function useOrderQueue(filters?: OrderFilterState) {
  const apiFilters: OrderQueueFilters | undefined = filters
    ? {
        status: filters.status || undefined,
        paymentStatus: filters.paymentStatus || undefined,
        searchTerm: filters.searchTerm || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
      }
    : undefined;

  return useQuery({
    queryKey: ["orders", "queue", filters],
    queryFn: () => orderAPI.getQueue(apiFilters).then((res) => res.data.data),
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });
}

export function useOrderDetail(salesId: number) {
  return useQuery({
    queryKey: ["orders", "detail", salesId],
    queryFn: () => orderAPI.getDetail(salesId).then((res) => res.data.data),
    staleTime: 1 * 60 * 1000,
  });
}

export function useRefundOrder(salesId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      orderAPI.refund(salesId, data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useCancelOrder(salesId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      orderAPI.cancel(salesId, data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

// Customer Hooks
export function useCustomerSegments() {
  return useQuery({
    queryKey: ["customers", "segments"],
    queryFn: () => customerAPI.getSegments().then((res) => res.data.data),
    staleTime: 30 * 60 * 1000,
  });
}

export function useCustomerList(filters?: CustomerListFilters) {
  return useQuery({
    queryKey: ["customers", "list", filters],
    queryFn: () => customerAPI.getList(filters).then((res) => res.data.data),
    staleTime: 10 * 60 * 1000,
  });
}

export function useCustomerProfile(customerId: number) {
  return useQuery({
    queryKey: ["customers", "profile", customerId],
    queryFn: () =>
      customerAPI.getProfile(customerId).then((res) => res.data.data),
    enabled: customerId > 0,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCustomerLoyalty(customerId: number, limit?: number) {
  return useQuery({
    queryKey: ["customers", customerId, "loyalty"],
    queryFn: () =>
      customerAPI.getLoyalty(customerId, limit).then((res) => res.data.data),
    enabled: customerId > 0,
    staleTime: 5 * 60 * 1000,
  });
}

// Campaign Hooks
export function useCampaignList(status?: string) {
  return useQuery({
    queryKey: ["campaigns", "list", status],
    queryFn: () => campaignAPI.getList(status).then((res) => res.data.data),
    staleTime: 10 * 60 * 1000,
  });
}

// Menu Hooks
export function useMenuOverrides() {
  return useQuery({
    queryKey: ["menu", "overrides"],
    queryFn: () => menuAPI.getOverrides().then((res) => res.data.data),
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateMenuOverride(itemId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      menuAPI.updateOverride(itemId, data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu"] });
    },
  });
}

// Activity Log Hooks
export function useActivityLogs(limit = 100) {
  return useQuery({
    queryKey: ["logs", "activity", limit],
    queryFn: () => activityLogAPI.getList(limit).then((res) => res.data.data),
    staleTime: 5 * 60 * 1000,
  });
}

// Auth Hooks
export function useLogin() {
  return useMutation({
    mutationFn: (credentials: { email: string; password: string }) =>
      authAPI
        .login(credentials.email, credentials.password)
        .then((res) => res.data.data),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => authAPI.logout().then((res) => res.data),
    onSuccess: () => {
      queryClient.clear();
      if (typeof window !== "undefined") {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
      }
    },
  });
}

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("adminUser");
      const token = localStorage.getItem("adminToken");

      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          console.error("Failed to parse stored user", e);
        }
      }
      setIsAuthenticated(!!token);
      setLoading(false);
    }
  }, []);

  return { user, isAuthenticated, loading };
}

// Polling Hook
export function usePolling(
  fn: () => Promise<any>,
  interval = 5000,
  enabled = true,
) {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    if (!enabled) return;

    const timer = setInterval(async () => {
      try {
        const result = await fn();
        setData(result);
      } catch (err) {
        setError(err);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [fn, interval, enabled]);

  return { data, error };
}

// Birthday Reward Hooks
export function useBirthdayRewardConfig() {
  return useQuery({
    queryKey: ["rewards", "birthday"],
    queryFn: () => birthdayRewardAPI.getConfig().then((res) => res.data.data),
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateBirthdayRewardConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      birthdayRewardAPI.updateConfig(data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rewards", "birthday"] });
    },
  });
}

// Campaign Hooks
export function useCreateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      campaignAPI.create(data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
}

export function useSendCampaign(campaignId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      campaignAPI.send(campaignId).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
}
