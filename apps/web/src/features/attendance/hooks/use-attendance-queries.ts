import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface PunchData {
  latitude?: number;
  longitude?: number;
  locationAccuracy?: number;
  clientTimestamp?: string;
  channel?: 'DESKTOP' | 'MOBILE' | 'API';
  deviceId?: string;
  platform?: string;
  transactionId?: string;
  reason?: string;
}

export interface RegularizeData {
  date: string;
  requestedCheckIn?: string;
  requestedCheckOut?: string;
  reason: string;
}

export interface TrustedNetwork {
  id: string;
  name: string;
  cidr: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// ESS: My Attendance
// ─────────────────────────────────────────────────────────────────────────────

export function useMyAttendance(date?: string) {
  return useQuery({
    queryKey: ['me', 'attendance', date],
    queryFn: async () => {
      const res = await apiClient.get('/me/attendance', { params: { date } });
      return { records: res.data.data, stats: res.data.stats };
    },
  });
}

export function useTodayStatus() {
  return useQuery({
    queryKey: ['me', 'attendance', 'today-status'],
    queryFn: async () => {
      const res = await apiClient.get('/me/attendance/today');
      return res.data.data;
    },
    refetchInterval: 30000, // refresh every 30 seconds
  });
}

export function useCheckIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: PunchData) => {
      const payload = {
        ...data,
        clientTimestamp: new Date().toISOString(),
        channel: 'DESKTOP',
        transactionId: crypto.randomUUID(),
      };
      const res = await apiClient.post('/me/attendance/check-in', payload);
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
    mutationFn: async (data: PunchData) => {
      const payload = {
        ...data,
        clientTimestamp: new Date().toISOString(),
        channel: 'DESKTOP',
        transactionId: crypto.randomUUID(),
      };
      const res = await apiClient.post('/me/attendance/check-out', payload);
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

// ─────────────────────────────────────────────────────────────────────────────
// Admin: Attendance Overview
// ─────────────────────────────────────────────────────────────────────────────

export function useAdminAttendanceOverview() {
  return useQuery({
    queryKey: ['admin', 'attendance', 'today'],
    queryFn: async () => {
      const res = await apiClient.get('/attendance/today');
      return res.data.data;
    },
    refetchInterval: 60000, // refresh every minute
  });
}

export function useAdminAttendanceRecords(filters: {
  date?: string;
  startDate?: string;
  endDate?: string;
  employeeId?: string;
  status?: string;
  isLate?: boolean;
  page?: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: ['admin', 'attendance', 'records', filters],
    queryFn: async () => {
      const res = await apiClient.get('/attendance', { params: filters });
      return res.data;
    },
  });
}

export function usePendingCorrections() {
  return useQuery({
    queryKey: ['admin', 'attendance', 'corrections', 'pending'],
    queryFn: async () => {
      const res = await apiClient.get('/attendance/corrections');
      return res.data.data;
    },
  });
}

export function useApproveCorrection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, comment }: { id: string; comment?: string }) => {
      const res = await apiClient.post(`/attendance/corrections/${id}/approve`, { comment });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'attendance', 'corrections'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'attendance', 'records'] });
    },
  });
}

export function useRejectCorrection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, comment }: { id: string; comment?: string }) => {
      const res = await apiClient.post(`/attendance/corrections/${id}/reject`, { comment });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'attendance', 'corrections'] });
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin: Trusted Networks
// ─────────────────────────────────────────────────────────────────────────────

export function useTrustedNetworks() {
  return useQuery({
    queryKey: ['admin', 'attendance', 'networks'],
    queryFn: async () => {
      const res = await apiClient.get('/attendance/networks');
      return res.data.data as TrustedNetwork[];
    },
  });
}

export function useCreateTrustedNetwork() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; cidr: string; description?: string }) => {
      const res = await apiClient.post('/attendance/networks', data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'attendance', 'networks'] });
    },
  });
}

export function useUpdateTrustedNetwork() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; cidr?: string; description?: string; isActive?: boolean }) => {
      const res = await apiClient.put(`/attendance/networks/${id}`, data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'attendance', 'networks'] });
    },
  });
}

export function useDeleteTrustedNetwork() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/attendance/networks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'attendance', 'networks'] });
    },
  });
}
