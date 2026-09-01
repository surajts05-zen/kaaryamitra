import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';

export interface TimesheetEntry {
  id: string;
  date: string;
  hours: number;
  overtimeHours: number;
  description?: string;
}

export interface Timesheet {
  id: string;
  periodStartDate: string;
  periodEndDate: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  totalHours: number;
  totalOvertime: number;
  entries: TimesheetEntry[];
  approverNote?: string;
}

export function useGenerateTimesheet() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  
  return useMutation({
    mutationFn: async (data: { periodStartDate: string; periodEndDate: string }) => {
      const res = await apiClient.post<{ data: Timesheet }>(`/t/${user?.tenantSlug}/me/timesheets/generate`, data);
      return res.data.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['timesheet', data.id], data);
    },
  });
}

export function useSubmitTimesheet() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  
  return useMutation({
    mutationFn: async ({ id, entries }: { id: string; entries: Pick<TimesheetEntry, 'id' | 'hours' | 'overtimeHours' | 'description'>[] }) => {
      const res = await apiClient.post<{ data: Timesheet }>(`/t/${user?.tenantSlug}/me/timesheets/${id}/submit`, { entries });
      return res.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['timesheet', data.id] });
    },
  });
}

export function useTimesheet(id?: string) {
  const { user } = useAuthStore();
  
  return useQuery({
    queryKey: ['timesheet', id],
    queryFn: async () => {
      const res = await apiClient.get<{ data: Timesheet }>(`/t/${user?.tenantSlug}/me/timesheets/${id}`);
      return res.data.data;
    },
    enabled: !!user?.tenantSlug && !!id,
  });
}
