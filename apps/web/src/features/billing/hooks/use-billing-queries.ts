import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { api } from '@/lib/api-client';

export const BILLING_QUERY_KEYS = {
  plans: ['billing', 'plans'],
  subscription: (tenantId: string) => ['billing', 'subscription', tenantId],
  invoices: (tenantId: string) => ['billing', 'invoices', tenantId],
  adminSubscriptions: ['admin', 'billing', 'subscriptions'],
  adminStats: ['admin', 'billing', 'stats'],
  adminRazorpay: ['admin', 'billing', 'razorpay'],
};

// ── Types (mirrored from backend) ───────────────────────────────────────────

export interface PlanDefinition {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  monthlyPriceInr: number;
  monthlyPriceUsd: number;
  annualDiscountPct: number;
  maxEmployees: number | null;
  maxStorageMb: number | null;
  maxApiCallsPerMonth: number | null;
  employeeOverageRateInr: number | null;
  employeeOverageRateUsd: number | null;
  trialDays: number;
  modules: string[];
}

export interface ModuleAddon {
  id: string;
  key: string;
  name: string;
  description: string | null;
  monthlyPriceInr: number;
  monthlyPriceUsd: number;
  isActive: boolean;
}

export interface TenantSubscription {
  id: string;
  tenantId: string;
  planId: string;
  billingCycle: 'MONTHLY' | 'ANNUAL';
  status: 'TRIALING' | 'PENDING_PAYMENT' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'PAUSED';
  currency: 'INR' | 'USD';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialEnd: string | null;
  cancelAtPeriodEnd: boolean;
  plan: PlanDefinition;
  addons: { id: string; addon: ModuleAddon }[];
}

export interface UsageSummary {
  employees: { used: number; limit: number | null; percentage: number };
  storageMb: { used: number; limit: number | null; percentage: number };
  apiCalls: { used: number; limit: number | null; percentage: number };
}

// ── Tenant Hooks ────────────────────────────────────────────────────────────

export function usePlans() {
  const { tenant } = useAuth();
  return useQuery({
    queryKey: BILLING_QUERY_KEYS.plans,
    queryFn: async () => {
      if (!tenant) return null;
      const res = await api.get(`/t/${tenant.slug}/billing/plans`);
      return res.data.data as { plans: PlanDefinition[]; addons: ModuleAddon[] };
    },
    enabled: !!tenant,
  });
}

export function useSubscription() {
  const { tenant } = useAuth();
  return useQuery({
    queryKey: BILLING_QUERY_KEYS.subscription(tenant?.id ?? ''),
    queryFn: async () => {
      if (!tenant) return null;
      const res = await api.get(`/t/${tenant.slug}/billing/subscription`);
      return res.data.data as { subscription: TenantSubscription; usage: UsageSummary };
    },
    enabled: !!tenant,
  });
}

export function useCreateSubscription() {
  const queryClient = useQueryClient();
  const { tenant } = useAuth();

  return useMutation({
    mutationFn: async (input: {
      planSlug: string;
      billingCycle: 'MONTHLY' | 'ANNUAL';
      currency: 'INR' | 'USD';
      addonKeys: string[];
    }) => {
      if (!tenant) throw new Error('No tenant context');
      const res = await api.post(`/t/${tenant.slug}/billing/subscription`, input);
      return res.data.data as { subscription: TenantSubscription; razorpayPaymentUrl?: string };
    },
    onSuccess: () => {
      if (tenant) {
        queryClient.invalidateQueries({ queryKey: BILLING_QUERY_KEYS.subscription(tenant.id) });
      }
    },
  });
}

export function useToggleAddon() {
  const queryClient = useQueryClient();
  const { tenant } = useAuth();

  return useMutation({
    mutationFn: async (input: { addonKey: string; enabled: boolean }) => {
      if (!tenant) throw new Error('No tenant context');
      const res = await api.post(`/t/${tenant.slug}/billing/subscription/addons`, input);
      return res.data.data;
    },
    onSuccess: () => {
      if (tenant) {
        queryClient.invalidateQueries({ queryKey: BILLING_QUERY_KEYS.subscription(tenant.id) });
      }
    },
  });
}

export function useCancelSubscription() {
  const queryClient = useQueryClient();
  const { tenant } = useAuth();

  return useMutation({
    mutationFn: async (atPeriodEnd: boolean = true) => {
      if (!tenant) throw new Error('No tenant context');
      const res = await api.delete(`/t/${tenant.slug}/billing/subscription`, { data: { atPeriodEnd } });
      return res.data.data;
    },
    onSuccess: () => {
      if (tenant) {
        queryClient.invalidateQueries({ queryKey: BILLING_QUERY_KEYS.subscription(tenant.id) });
      }
    },
  });
}

// ── Admin Hooks ─────────────────────────────────────────────────────────────

export function useAdminStats() {
  return useQuery({
    queryKey: BILLING_QUERY_KEYS.adminStats,
    queryFn: async () => {
      const res = await api.get('/admin/billing/stats');
      return res.data.data;
    },
  });
}

export function useAdminSubscriptions(params: { page: number; limit: number; status?: string; planSlug?: string }) {
  return useQuery({
    queryKey: [...BILLING_QUERY_KEYS.adminSubscriptions, params],
    queryFn: async () => {
      const res = await api.get('/admin/billing/subscriptions', { params });
      return res.data.data;
    },
  });
}

export function useUpdateRazorpaySettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { razorpayKeyId: string; razorpayKeySecret: string; razorpayWebhookSecret?: string }) => {
      const res = await api.post('/admin/billing/settings/razorpay', input);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BILLING_QUERY_KEYS.adminRazorpay });
    },
  });
}

export function useAdminPlans() {
  return useQuery({
    queryKey: BILLING_QUERY_KEYS.plans,
    queryFn: async () => {
      const res = await api.get('/admin/billing/plans');
      return res.data.data as Plan[];
    },
  });
}

export function useUpdateAdminPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Plan> }) => {
      const res = await api.patch(`/admin/billing/plans/${id}`, data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BILLING_QUERY_KEYS.plans });
    },
  });
}

export function useAdminAddons() {
  return useQuery({
    queryKey: BILLING_QUERY_KEYS.addons,
    queryFn: async () => {
      const res = await api.get('/admin/billing/addons');
      return res.data.data as Addon[];
    },
  });
}

export function useUpdateAdminAddon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Addon> }) => {
      const res = await api.patch(`/admin/billing/addons/${id}`, data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BILLING_QUERY_KEYS.addons });
    },
  });
}

export function useAdminRazorpaySettings() {
  return useQuery({
    queryKey: BILLING_QUERY_KEYS.adminRazorpay,
    queryFn: async () => {
      const res = await api.get('/admin/billing/settings/razorpay');
      return res.data.data;
    },
  });
}
