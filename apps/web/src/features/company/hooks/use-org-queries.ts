import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

// ── Settings ───────────────────────────────────────────────────────────────
export function useCompanySettings() {
  return useQuery({
    queryKey: ['org', 'settings'],
    queryFn: async () => {
      const res = await apiClient.get('/org/settings');
      return res.data.data;
    },
  });
}

export function useUpdateCompanySettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await apiClient.put('/org/settings', data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org', 'settings'] });
    },
  });
}

// ── Departments ────────────────────────────────────────────────────────────
export function useDepartments() {
  return useQuery({
    queryKey: ['org', 'departments'],
    queryFn: async () => {
      const res = await apiClient.get('/org/departments');
      return res.data.data;
    },
  });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await apiClient.post('/org/departments', data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org', 'departments'] });
    },
  });
}

// ── Locations ──────────────────────────────────────────────────────────────
export function useLocations() {
  return useQuery({
    queryKey: ['org', 'locations'],
    queryFn: async () => {
      const res = await apiClient.get('/org/locations');
      return res.data.data;
    },
  });
}

export function useCreateLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await apiClient.post('/org/locations', data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org', 'locations'] });
    },
  });
}

// ── Designations ───────────────────────────────────────────────────────────
export function useDesignations() {
  return useQuery({
    queryKey: ['org', 'designations'],
    queryFn: async () => {
      const res = await apiClient.get('/org/designations');
      return res.data.data;
    },
  });
}

export function useCreateDesignation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await apiClient.post('/org/designations', data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org', 'designations'] });
    },
  });
}
