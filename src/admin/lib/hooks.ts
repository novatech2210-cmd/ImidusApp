'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardAPI, orderAPI, customerAPI, campaignAPI, menuAPI, activityLogAPI, authAPI, birthdayRewardAPI, OrderQueueFilters, CustomerListFilters } from './api-client';
import { useState, useEffect } from 'react';
import { OrderFilterState } from '@/components/Orders/OrderFilters';

// Dashboard Hooks
export function useDashboardSummary(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['dashboard', 'summary', startDate, endDate],
    queryFn: () => dashboardAPI.getSummary(startDate, endDate).then(res => res.data.data),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useSalesChart(startDate: string, endDate: string, groupBy = 'day') {
  return useQuery({
    queryKey: ['dashboard', 'sales-chart', startDate, endDate, groupBy],
    queryFn: () => dashboardAPI.getSalesChart(startDate, endDate, groupBy).then(res => res.data.data),
    staleTime: 5 * 60 * 1000,
  });
}

export function usePopularItems(limit = 10) {
  return useQuery({
    queryKey: ['dashboard', 'popular-items', limit],
    queryFn: () => dashboardAPI.getPopularItems(limit).then(res => res.data.data),
    staleTime: 10 * 60 * 1000,
  });
}

// Order Hooks
export function useOrderQueue(filters?: OrderFilterState) {
  // Convert OrderFilterState to OrderQueueFilters
  const apiFilters: OrderQueueFilters | undefined = filters ? {
    status: filters.status || undefined,
    paymentStatus: filters.paymentStatus || undefined,
    searchTerm: filters.searchTerm || undefined,
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined,
  } : undefined;

  return useQuery({
    queryKey: ['orders', 'queue', filters],
    queryFn: () => orderAPI.getQueue(apiFilters).then(res => res.data.data),
    staleTime: 30 * 1000, // 30 seconds - near real-time
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
  });
}

export function useOrderDetail(salesId: number) {
  return useQuery({
    queryKey: ['orders', 'detail', salesId],
    queryFn: () => orderAPI.getDetail(salesId).then(res => res.data.data),
    staleTime: 1 * 60 * 1000,
  });
}

export function useRefundOrder(salesId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => orderAPI.refund(salesId, data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useCancelOrder(salesId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => orderAPI.cancel(salesId, data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

// Customer Hooks
export function useCustomerSegments() {
  return useQuery({
    queryKey: ['customers', 'segments'],
    queryFn: () => customerAPI.getSegments().then(res => res.data.data),
    staleTime: 30 * 60 * 1000,
  });
}

export function useCustomerList(filters?: CustomerListFilters) {
  return useQuery({
    queryKey: ['customers', 'list', filters],
    queryFn: () => customerAPI.getList(filters).then(res => res.data.data),
    staleTime: 10 * 60 * 1000,
  });
}

export function useCustomerProfile(customerId: number) {
  return useQuery({
    queryKey: ['customers', 'profile', customerId],
    queryFn: () => customerAPI.getProfile(customerId).then(res => res.data.data),
    enabled: customerId > 0,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCustomerLoyalty(customerId: number, limit?: number) {
  return useQuery({
    queryKey: ['customers', customerId, 'loyalty'],
    queryFn: () => customerAPI.getLoyalty(customerId, limit).then(res => res.data.data),
    enabled: customerId > 0,
    staleTime: 5 * 60 * 1000,
  });
}

// Campaign Hooks
export function useCampaignList(status?: string) {
  return useQuery({
    queryKey: ['campaigns', 'list', status],
    queryFn: () => campaignAPI.getList(status).then(res => res.data.data),
    staleTime: 10 * 60 * 1000,
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => campaignAPI.create(data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
}

export function useSendCampaign(campaignId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => campaignAPI.send(campaignId).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
}

// Menu Hooks
export function useMenuOverrides() {
  return useQuery({
    queryKey: ['menu', 'overrides'],
    queryFn: () => menuAPI.getOverrides().then(res => res.data.data),
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateMenuOverride(itemId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => menuAPI.updateOverride(itemId, data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu'] });
    },
  });
}

// Activity Log Hooks
export function useActivityLogs(limit = 100) {
  return useQuery({
    queryKey: ['logs', 'activity', limit],
    queryFn: () => activityLogAPI.getList(limit).then(res => res.data.data),
    staleTime: 5 * 60 * 1000,
  });
}

// Auth Hooks
export function useLogin() {
  return useMutation({
    mutationFn: (credentials: { email: string; password: string }) =>
      authAPI.login(credentials.email, credentials.password).then(res => res.data.data),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => authAPI.logout().then(res => res.data),
    onSuccess: () => {
      queryClient.clear();
    },
  });
}

// Polling Hook
export function usePolling(fn: () => Promise<any>, interval = 5000, enabled = true) {
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
    queryKey: ['rewards', 'birthday'],
    queryFn: () => birthdayRewardAPI.getConfig().then(res => res.data.data),
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateBirthdayRewardConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => birthdayRewardAPI.updateConfig(data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rewards', 'birthday'] });
    },
  });
}
