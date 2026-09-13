import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

// ── Types ──────────────────────────────────────────────────────────────────

export interface CostCenter {
  id: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface BudgetCategory {
  id: string;
  code: string;
  name: string;
  capexOpex: 'CAPEX' | 'OPEX';
  isActive: boolean;
}

export interface BudgetRequestLineItem {
  id: string;
  categoryId?: string;
  description: string;
  quantity: number;
  unitCost: number;
  requestedAmount: number;
  capexOpex: 'CAPEX' | 'OPEX';
  category?: BudgetCategory;
}

export interface BudgetRequest {
  id: string;
  requestNumber: string;
  requestType: string;
  status: string;
  priority: string;
  requestedAmount: number;
  objective?: string;
  businessJustification?: string;
  projectId?: string;
  project?: { name: string; code: string };
  costCenter?: { name: string };
  createdAt: string;
  lineItems?: BudgetRequestLineItem[];
  workflowInstance?: {
    id: string;
    status: string;
    currentStepIndex: number;
  };
}

// ── Cost Centers ───────────────────────────────────────────────────────────

export function useCostCenters() {
  return useQuery({
    queryKey: ['cost-centers'],
    queryFn: async () => {
      const res = await apiClient.get('/cost-centers');
      return res.data.data as CostCenter[];
    },
  });
}

export function useCreateCostCenter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const res = await apiClient.post('/cost-centers', data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost-centers'] });
    },
  });
}

export function useBulkCreateCostCenter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any[]) => {
      const res = await apiClient.post('/cost-centers/bulk', data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost-centers'] });
    },
  });
}

// ── Budget Categories ──────────────────────────────────────────────────────

export function useBudgetCategories() {
  return useQuery({
    queryKey: ['budget-categories'],
    queryFn: async () => {
      const res = await apiClient.get('/budget-categories');
      return res.data.data as BudgetCategory[];
    },
  });
}

export function useCreateBudgetCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const res = await apiClient.post('/budget-categories', data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-categories'] });
    },
  });
}

export function useBulkCreateBudgetCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any[]) => {
      const res = await apiClient.post('/budget-categories/bulk', data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-categories'] });
    },
  });
}

// ── Budget Requests ────────────────────────────────────────────────────────

export function useBudgetRequests() {
  return useQuery({
    queryKey: ['budget-requests'],
    queryFn: async () => {
      const res = await apiClient.get('/budget-requests');
      return res.data.data as BudgetRequest[];
    },
  });
}

export function useBudgetRequest(id?: string) {
  return useQuery({
    queryKey: ['budget-requests', id],
    queryFn: async () => {
      if (!id) return null;
      const res = await apiClient.get(`/budget-requests/${id}`);
      return res.data.data as BudgetRequest;
    },
    enabled: !!id,
  });
}

export function useCreateBudgetRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const res = await apiClient.post('/budget-requests', data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-requests'] });
    },
  });
}

export function useSubmitBudgetRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.post(`/budget-requests/${id}/submit`);
      return res.data.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['budget-requests'] });
      queryClient.invalidateQueries({ queryKey: ['budget-requests', id] });
    },
  });
}

export function useApproveBudgetRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, comment }: { id: string; comment?: string }) => {
      const res = await apiClient.post(`/budget-requests/${id}/approve`, { comment });
      return res.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['budget-requests'] });
      queryClient.invalidateQueries({ queryKey: ['budget-requests', variables.id] });
    },
  });
}

export function useRejectBudgetRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, comment }: { id: string; comment?: string }) => {
      const res = await apiClient.post(`/budget-requests/${id}/reject`, { comment });
      return res.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['budget-requests'] });
      queryClient.invalidateQueries({ queryKey: ['budget-requests', variables.id] });
    },
  });
}

export function useArchiveBudgetRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.put(`/budget-requests/${id}/archive`);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-requests'] });
    },
  });
}

// ── Dashboard Overview ─────────────────────────────────────────────────────

export function useBudgetDashboard() {
  return useQuery({
    queryKey: ['budget-dashboard'],
    queryFn: async () => {
      const res = await apiClient.get('/budget-dashboard');
      return res.data.data;
    },
  });
}
