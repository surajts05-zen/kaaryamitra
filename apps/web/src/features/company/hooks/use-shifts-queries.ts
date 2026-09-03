import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';

// ── Types ─────────────────────────────────────────────────────────
export interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  type: 'FIXED' | 'FLEXIBLE' | 'ROTATING';
  gracePeriodMinutes: number;
  color: string;
  isActive: boolean;
}

export interface EmployeeShift {
  id: string;
  employeeId: string;
  shiftId: string;
  effectiveFrom: string;
  effectiveTo?: string;
  shift: Shift;
}

export interface ShiftSwapRequest {
  id: string;
  requestingEmployeeId: string;
  targetEmployeeId: string;
  date: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reason?: string;
  requestingEmployee?: { user: { firstName: string; lastName: string } };
  targetEmployee?: { user: { firstName: string; lastName: string } };
}

// ── Admin / Config Queries ──────────────────────────────────────────────
export function useShifts() {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: ['shifts', user?.tenantSlug],
    queryFn: async () => {
      const res = await apiClient.get<{ data: Shift[] }>(`/t/${user?.tenantSlug}/shifts`);
      return res.data.data;
    },
    enabled: !!user?.tenantSlug,
  });
}

export function useCreateShift() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  
  return useMutation({
    mutationFn: async (data: Partial<Shift>) => {
      const res = await apiClient.post<{ data: Shift }>(`/t/${user?.tenantSlug}/shifts`, data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts', user?.tenantSlug] });
    },
  });
}

export function useBulkCreateShifts() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  
  return useMutation({
    mutationFn: async (items: any[]) => {
      const res = await apiClient.post(`/t/${user?.tenantSlug}/shifts/bulk`, { items });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts', user?.tenantSlug] });
    },
  });
}

export function useUpdateShift() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Shift> & { id: string }) => {
      const res = await apiClient.put<{ data: Shift }>(`/t/${user?.tenantSlug}/shifts/${id}`, data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts', user?.tenantSlug] });
    },
  });
}

export function useAssignShift() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  
  return useMutation({
    mutationFn: async (data: { employeeIds: string[], shiftId: string, effectiveFrom: string, effectiveTo?: string }) => {
      const res = await apiClient.post(`/t/${user?.tenantSlug}/shifts/assign`, data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-shifts'] });
    },
  });
}

// ── ESS Queries ──────────────────────────────────────────────────────────

export function useMyShifts(employeeId?: string) {
  const { user } = useAuthStore();
  // Using employeeId from API if needed, otherwise fallback
  return useQuery({
    queryKey: ['employee-shifts', employeeId],
    queryFn: async () => {
      const res = await apiClient.get<{ data: EmployeeShift[] }>(`/t/${user?.tenantSlug}/shifts/employee/${employeeId}`);
      return res.data.data;
    },
    enabled: !!user?.tenantSlug && !!employeeId,
  });
}

export function useMyShiftSwaps() {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: ['shift-swaps', user?.tenantSlug],
    queryFn: async () => {
      const res = await apiClient.get<{ data: ShiftSwapRequest[] }>(`/t/${user?.tenantSlug}/shift-swaps`);
      return res.data.data;
    },
    enabled: !!user?.tenantSlug,
  });
}

export function useRequestShiftSwap() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  
  return useMutation({
    mutationFn: async (data: { targetEmployeeId: string; date: string; reason?: string }) => {
      const res = await apiClient.post(`/t/${user?.tenantSlug}/shift-swaps/request`, data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shift-swaps'] });
    },
  });
}

export function useDailySchedule(date?: string) {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: ['daily-schedule', user?.tenantSlug, date],
    queryFn: async () => {
      const res = await apiClient.get<{ data: EmployeeShift[] }>(`/t/${user?.tenantSlug}/shifts/daily-schedule`, {
        params: { date }
      });
      return res.data.data;
    },
    enabled: !!user?.tenantSlug && !!date,
  });
}
