import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface FilterRule {
  field: string;
  operator: 'equals' | 'contains' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'notIn' | 'notEquals';
  value: any;
}

export interface SortRule {
  field: string;
  order: 'asc' | 'desc';
}

export interface ReportConfig {
  fields: string[];
  filters?: FilterRule[];
  groupBys?: string[];
  sortBys?: SortRule[];
  chartType?: 'TABLE' | 'BAR' | 'PIE' | 'LINE';
}

export interface SavedReport {
  id: string;
  name: string;
  description?: string;
  dataset: string;
  config: ReportConfig;
  isScheduled: boolean;
  cronSchedule?: string;
  emails?: string;
  createdAt: string;
}

// 1. Get Metadata
export const useReportsMeta = (tenantSlug: string) => {
  return useQuery({
    queryKey: ['reports', 'meta', tenantSlug],
    queryFn: async () => {
      const res = await apiClient.get(`/t/${tenantSlug}/reports/meta`);
      return res.data.data;
    },
    enabled: !!tenantSlug
  });
};

// 2. Execute Query
export const useExecuteReport = (tenantSlug: string) => {
  return useMutation({
    mutationFn: async ({ dataset, config }: { dataset: string; config: ReportConfig }) => {
      const res = await apiClient.post(`/t/${tenantSlug}/reports/query`, { dataset, config });
      return res.data.data;
    }
  });
};

// 3. Saved Reports CRUD
export const useSavedReports = (tenantSlug: string) => {
  return useQuery({
    queryKey: ['reports', 'saved', tenantSlug],
    queryFn: async () => {
      const res = await apiClient.get(`/t/${tenantSlug}/reports/saved`);
      return res.data.data as SavedReport[];
    },
    enabled: !!tenantSlug
  });
};

export const useCreateSavedReport = (tenantSlug: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<SavedReport, 'id' | 'createdAt'>) => {
      const res = await apiClient.post(`/t/${tenantSlug}/reports/saved`, data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports', 'saved', tenantSlug] });
    }
  });
};

export const useUpdateSavedReport = (tenantSlug: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<SavedReport> }) => {
      const res = await apiClient.put(`/t/${tenantSlug}/reports/saved/${id}`, data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports', 'saved', tenantSlug] });
    }
  });
};

export const useDeleteSavedReport = (tenantSlug: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/t/${tenantSlug}/reports/saved/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports', 'saved', tenantSlug] });
    }
  });
};
