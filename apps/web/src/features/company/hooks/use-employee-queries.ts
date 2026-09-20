import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';

export function useEmployees(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const res = await apiClient.get('/employees');
      return res.data.data;
    },
    ...options,
  });
}

export function useEmployee(id: string) {
  return useQuery({
    queryKey: ['employees', id],
    queryFn: async () => {
      const res = await apiClient.get(`/employees/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await apiClient.post('/employees', data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiClient.put(`/employees/${id}`, data);
      return res.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employees', variables.id] });
    },
  });
}

export function useResetEmployeePassword() {
  return useMutation({
    mutationFn: async ({ id, sendToAlternate }: { id: string; sendToAlternate: boolean }) => {
      const res = await apiClient.post(`/employees/${id}/reset-password`, { sendToAlternate });
      return res.data;
    },
  });
}

export function useBulkCreateEmployees() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (items: any[]) => {
      const res = await apiClient.post('/employees/bulk', { items });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}

export function useUpdatePresence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (status: string) => {
      const res = await apiClient.put('/auth/me/presence', { status });
      return res.data.data;
    },
    onSuccess: (data) => {
      useAuthStore.getState().setUser(data);
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}

export function useUpdatePinnedColleagues() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (pinnedEmployeeIds: string[]) => {
      const res = await apiClient.put('/auth/me/pinned-colleagues', { pinnedEmployeeIds });
      return res.data.data;
    },
    onSuccess: (data) => {
      useAuthStore.getState().setUser(data);
    },
  });
}

export function useBulkPresence(userIds: string[], enabled = true) {
  return useQuery({
    queryKey: ['presence', 'bulk', userIds],
    queryFn: async () => {
      if (!userIds.length) return {};
      const res = await apiClient.post('/auth/presence/bulk', { userIds });
      return res.data.data;
    },
    enabled: enabled && userIds.length > 0,
    refetchInterval: 30000, // optionally refresh every 30s
  });
}
