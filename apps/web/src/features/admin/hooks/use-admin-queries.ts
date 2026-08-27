import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export type TenantStats = {
  totalTenants: number;
  activeTenants: number;
  suspendedTenants: number;
  totalUsers: number;
};

export type Tenant = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  createdAt: string;
  _count: { users: number };
};

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: TenantStats }>('/admin/stats');
      return res.data.data;
    },
  });
}

export function useAdminTenants() {
  return useQuery({
    queryKey: ['admin-tenants'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: Tenant[] }>('/admin/tenants');
      return res.data.data;
    },
  });
}

export function useCreateTenant() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Record<string, any>) => {
      const res = await apiClient.post('/admin/tenants', data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tenants'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });
}

export function useResetTenantPassword() {
  return useMutation({
    mutationFn: async (tenantId: string) => {
      const res = await apiClient.post<{ data: { email: string; generatedPassword: string } }>(
        `/admin/tenants/${tenantId}/reset-password`,
      );
      return res.data.data;
    },
  });
}
