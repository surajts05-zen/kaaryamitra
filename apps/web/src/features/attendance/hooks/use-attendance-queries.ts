import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

interface LocationData {
  ipAddress?: string;
  latitude?: number;
  longitude?: number;
}

export function useMyAttendance(date?: string) {
  return useQuery({
    queryKey: ['me', 'attendance', date],
    queryFn: async () => {
      const res = await apiClient.get('/me/attendance', { params: { date } });
      return res.data.data;
    },
  });
}

export function useCheckIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (location: LocationData) => {
      const res = await apiClient.post('/me/attendance/check-in', location);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me', 'attendance'] });
    },
  });
}

export function useCheckOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (location: LocationData) => {
      const res = await apiClient.post('/me/attendance/check-out', location);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me', 'attendance'] });
    },
  });
}

export function useStartBreak() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (type: string = 'BREAK') => {
      const res = await apiClient.post('/me/attendance/break/start', { type });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me', 'attendance'] });
    },
  });
}

export function useEndBreak() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/me/attendance/break/end');
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me', 'attendance'] });
    },
  });
}

interface RegularizeData {
  date: string;
  requestedCheckIn?: string;
  requestedCheckOut?: string;
  reason: string;
}

export function useRequestRegularization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: RegularizeData) => {
      const res = await apiClient.post('/me/attendance/regularize', data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me', 'attendance'] });
    },
  });
}
