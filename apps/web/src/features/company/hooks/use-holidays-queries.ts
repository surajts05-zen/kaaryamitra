import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface Holiday {
  id: string;
  name: string;
  date: string;
  type: 'PUBLIC' | 'OPTIONAL';
  locationId?: string | null;
}

export function useHolidays() {
  return useQuery({
    queryKey: ['holidays'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: Holiday[] }>('/holidays');
      return res.data.data;
    },
  });
}

export function useCreateHoliday() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<Holiday, 'id'>) => {
      const res = await apiClient.post<{ data: Holiday }>('/holidays', data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
    },
  });
}

export function useUpdateHoliday() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Omit<Holiday, 'id'>> }) => {
      const res = await apiClient.patch<{ data: Holiday }>(`/holidays/${id}`, data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
    },
  });
}

export function useDeleteHoliday() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/holidays/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
    },
  });
}

export function useBulkCreateHolidays() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (items: Array<{ name: string; date: string; type?: string }>) => {
      const res = await apiClient.post<{ success: boolean; count: number }>('/holidays/bulk', { items });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
    },
  });
}
