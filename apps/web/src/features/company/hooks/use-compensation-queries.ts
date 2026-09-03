import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient as api } from '@/lib/api-client';
import { useParams } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';

function useTenantSlug() {
  const { slug } = useParams();
  const user = useAuthStore((s) => s.user);
  return slug || user?.tenantSlug || '';
}

export const compensationKeys = {
  all: ['compensation'] as const,
  components: (tenantSlug: string) => [...compensationKeys.all, tenantSlug, 'components'] as const,
  structures: (tenantSlug: string) => [...compensationKeys.all, tenantSlug, 'structures'] as const,
  employee: (tenantSlug: string, employeeId: string) => [...compensationKeys.all, tenantSlug, 'employee', employeeId] as const,
  employeeHistory: (tenantSlug: string, employeeId: string) => [...compensationKeys.all, tenantSlug, 'employee', employeeId, 'history'] as const,
  myCompensation: (tenantSlug: string) => [...compensationKeys.all, tenantSlug, 'my-compensation'] as const,
  myHistory: (tenantSlug: string) => [...compensationKeys.all, tenantSlug, 'my-history'] as const,
};

export function useSalaryComponents() {
  const tenantSlug = useTenantSlug();
  return useQuery({
    queryKey: compensationKeys.components(tenantSlug),
    queryFn: () => api.get(`/t/${tenantSlug}/compensation/components`).then((res) => res.data),
    enabled: !!tenantSlug,
  });
}

export function useSeedDefaultSalaryComponents() {
  const tenantSlug = useTenantSlug();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post(`/t/${tenantSlug}/compensation/components/seed-defaults`).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: compensationKeys.components(tenantSlug) });
    },
  });
}

export function useCreateSalaryComponent() {
  const tenantSlug = useTenantSlug();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post(`/t/${tenantSlug}/compensation/components`, data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: compensationKeys.components(tenantSlug) });
    },
  });
}

export function useUpdateSalaryComponent() {
  const tenantSlug = useTenantSlug();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/t/${tenantSlug}/compensation/components/${id}`, data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: compensationKeys.components(tenantSlug) });
    },
  });
}

export function useSalaryStructures() {
  const tenantSlug = useTenantSlug();
  return useQuery({
    queryKey: compensationKeys.structures(tenantSlug),
    queryFn: () => api.get(`/t/${tenantSlug}/compensation/structures`).then((res) => res.data),
    enabled: !!tenantSlug,
  });
}

export function useCreateSalaryStructure() {
  const tenantSlug = useTenantSlug();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post(`/t/${tenantSlug}/compensation/structures`, data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: compensationKeys.structures(tenantSlug) });
    },
  });
}

export function useUpdateSalaryStructure() {
  const tenantSlug = useTenantSlug();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/t/${tenantSlug}/compensation/structures/${id}`, data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: compensationKeys.structures(tenantSlug) });
    },
  });
}

export function useEmployeeCompensation(employeeId: string) {
  const tenantSlug = useTenantSlug();
  return useQuery({
    queryKey: compensationKeys.employee(tenantSlug, employeeId),
    queryFn: () => api.get(`/t/${tenantSlug}/compensation/employees/${employeeId}`).then((res) => res.data),
    enabled: !!tenantSlug && !!employeeId,
  });
}

export function useReviseCompensation() {
  const tenantSlug = useTenantSlug();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, data }: { employeeId: string; data: any }) => 
      api.post(`/t/${tenantSlug}/compensation/employees/${employeeId}/revise`, data).then((res) => res.data),
    onSuccess: (_, { employeeId }) => {
      queryClient.invalidateQueries({ queryKey: compensationKeys.employee(tenantSlug, employeeId) });
      queryClient.invalidateQueries({ queryKey: compensationKeys.employeeHistory(tenantSlug, employeeId) });
    },
  });
}

export function useEmployeeCompensationHistory(employeeId: string) {
  const tenantSlug = useTenantSlug();
  return useQuery({
    queryKey: compensationKeys.employeeHistory(tenantSlug, employeeId),
    queryFn: () => api.get(`/t/${tenantSlug}/compensation/employees/${employeeId}/history`).then((res) => res.data),
    enabled: !!tenantSlug && !!employeeId,
  });
}

export function useMyCompensation() {
  const tenantSlug = useTenantSlug();
  return useQuery({
    queryKey: compensationKeys.myCompensation(tenantSlug),
    queryFn: () => api.get(`/t/${tenantSlug}/compensation/me`).then((res) => res.data),
    enabled: !!tenantSlug,
  });
}

export function useMyCompensationHistory() {
  const tenantSlug = useTenantSlug();
  return useQuery({
    queryKey: compensationKeys.myHistory(tenantSlug),
    queryFn: () => api.get(`/t/${tenantSlug}/compensation/me/history`).then((res) => res.data),
    enabled: !!tenantSlug,
  });
}
