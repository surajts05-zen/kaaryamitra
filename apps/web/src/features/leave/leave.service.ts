import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

// ── Types ──────────────────────────────────────────────────────────────────

export interface LeaveType {
  id: string;
  name: string;
  code: string;
  color: string;
  isPaid: boolean;
  isActive: boolean;
  description: string;
  daysPerYear: number;
  accrualFrequency: 'YEARLY' | 'MONTHLY';
  isCarryForwardAllowed: boolean;
  maxCarryForward: number;
}

export interface LeaveBalance {
  id: string;
  leaveType: LeaveType;
  totalAccrued: number;
  used: number;
  available: number;
}

export interface LeaveApplication {
  id: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  isHalfDay: boolean;
  halfDayPeriod?: 'FIRST_HALF' | 'SECOND_HALF';
  totalDays: number;
  reason?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'WITHDRAWN';
  approverNote?: string;
  managerNote?: string;
  createdAt: string;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
    employeeCode?: string;
  };
}

// ── Admin Leave Type Services ──────────────────────────────────────────────

export function useLeaveTypes() {
  return useQuery({
    queryKey: ['leave-types'],
    queryFn: async () => {
      const res = await apiClient.get('/leave/types');
      return res.data.data as LeaveType[];
    },
  });
}

export function useCreateLeaveType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<LeaveType>) => {
      const res = await apiClient.post('/leave/types', data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-types'] });
    },
  });
}

export function useUpdateLeaveType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<LeaveType> }) => {
      const res = await apiClient.put(`/leave/types/${id}`, data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-types'] });
    },
  });
}

// ── Employee Self Service ──────────────────────────────────────────────────

export function useMyLeaveBalances() {
  return useQuery({
    queryKey: ['my-leave-balances'],
    queryFn: async () => {
      const res = await apiClient.get('/me/leave/balances');
      return res.data.data as LeaveBalance[];
    },
  });
}

export function useMyLeaveApplications() {
  return useQuery({
    queryKey: ['my-leave-applications'],
    queryFn: async () => {
      const res = await apiClient.get('/me/leave/applications');
      return res.data.data as LeaveApplication[];
    },
  });
}

export function useApplyLeave() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const res = await apiClient.post('/me/leave/applications', data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-leave-balances'] });
      queryClient.invalidateQueries({ queryKey: ['my-leave-applications'] });
    },
  });
}

// ── Manager Approvals ──────────────────────────────────────────────────────

export function usePendingLeaveApprovals() {
  return useQuery({
    queryKey: ['pending-leave-approvals'],
    queryFn: async () => {
      const res = await apiClient.get('/approvals/leave/pending');
      return res.data.data as LeaveApplication[];
    },
  });
}

export function useReviewLeaveApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { status: 'APPROVED' | 'REJECTED'; managerNote?: string } }) => {
      const res = await apiClient.put(`/approvals/leave/${id}/review`, data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-leave-approvals'] });
    },
  });
}
