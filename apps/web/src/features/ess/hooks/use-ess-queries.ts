import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export function useMyProfile() {
  return useQuery({
    queryKey: ['me', 'profile'],
    queryFn: async () => {
      const res = await apiClient.get('/me/profile');
      return res.data.data;
    },
  });
}

export function useUpdateMyProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await apiClient.put('/me/profile', data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me', 'profile'] });
    },
  });
}

export function useBulkCreateAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (items: any[]) => {
      const res = await apiClient.post('/me/attendance/bulk', { items });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['me', 'attendance'] });
    },
  });
}
