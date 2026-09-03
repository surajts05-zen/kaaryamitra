import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient as api } from '@/lib/api-client';
import { useParams } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';

function useTenantSlug() {
  const { slug } = useParams();
  const user = useAuthStore((s) => s.user);
  return slug || user?.tenantSlug || '';
}

export const payrollKeys = {
  all: ['payroll'] as const,
  runs: (tenantSlug: string) => [...payrollKeys.all, tenantSlug, 'runs'] as const,
  run: (tenantSlug: string, id: string) => [...payrollKeys.all, tenantSlug, 'runs', id] as const,
  myPayslips: (tenantSlug: string) => [...payrollKeys.all, tenantSlug, 'my-payslips'] as const,
  myPayslip: (tenantSlug: string, id: string) => [...payrollKeys.all, tenantSlug, 'my-payslips', id] as const,
  statutoryRules: (tenantSlug: string) => [...payrollKeys.all, tenantSlug, 'statutory-rules'] as const,
};

export function usePayrollRuns() {
  const tenantSlug = useTenantSlug();
  return useQuery({
    queryKey: payrollKeys.runs(tenantSlug),
    queryFn: () => api.get(`/t/${tenantSlug}/payroll/runs`).then((res) => res.data),
    enabled: !!tenantSlug,
  });
}

export function usePayrollRun(id: string) {
  const tenantSlug = useTenantSlug();
  return useQuery({
    queryKey: payrollKeys.run(tenantSlug, id),
    queryFn: () => api.get(`/t/${tenantSlug}/payroll/runs/${id}`).then((res) => res.data),
    enabled: !!tenantSlug && !!id,
  });
}

export function useCreatePayrollRun() {
  const tenantSlug = useTenantSlug();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post(`/t/${tenantSlug}/payroll/runs`, data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.runs(tenantSlug) });
    },
  });
}

export function useUpdatePayrollRunStatus() {
  const tenantSlug = useTenantSlug();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      api.patch(`/t/${tenantSlug}/payroll/runs/${id}/status`, data).then((res) => res.data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.runs(tenantSlug) });
      queryClient.invalidateQueries({ queryKey: payrollKeys.run(tenantSlug, id) });
    },
  });
}

export function useUploadPayrollCsv() {
  const tenantSlug = useTenantSlug();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => {
      const formData = new FormData();
      formData.append('file', file);
      return api.post(`/t/${tenantSlug}/payroll/runs/${id}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      }).then((res) => res.data);
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.runs(tenantSlug) });
      queryClient.invalidateQueries({ queryKey: payrollKeys.run(tenantSlug, id) });
    },
  });
}

export function useMyPayslips() {
  const tenantSlug = useTenantSlug();
  return useQuery({
    queryKey: payrollKeys.myPayslips(tenantSlug),
    queryFn: () => api.get(`/t/${tenantSlug}/payroll/me/payslips`).then((res) => res.data),
    enabled: !!tenantSlug,
  });
}

export function useMyPayslipDetails(id: string) {
  const tenantSlug = useTenantSlug();
  return useQuery({
    queryKey: payrollKeys.myPayslip(tenantSlug, id),
    queryFn: () => api.get(`/t/${tenantSlug}/payroll/me/payslips/${id}`).then((res) => res.data),
    enabled: !!tenantSlug && !!id,
  });
}

export function useStatutoryRules() {
  const tenantSlug = useTenantSlug();
  return useQuery({
    queryKey: payrollKeys.statutoryRules(tenantSlug),
    queryFn: () => api.get(`/t/${tenantSlug}/payroll/statutory`).then((res) => res.data),
    enabled: !!tenantSlug,
  });
}

export function useCreateStatutoryRule() {
  const tenantSlug = useTenantSlug();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post(`/t/${tenantSlug}/payroll/statutory`, data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.statutoryRules(tenantSlug) });
    },
  });
}

export function useUpdateStatutoryRule() {
  const tenantSlug = useTenantSlug();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      api.patch(`/t/${tenantSlug}/payroll/statutory/${id}`, data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.statutoryRules(tenantSlug) });
    },
  });
}
