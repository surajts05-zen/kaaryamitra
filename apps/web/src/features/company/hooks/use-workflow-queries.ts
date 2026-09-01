import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

// ── Types ──────────────────────────────────────────────────────────────────────

export type WorkflowStepDef = {
  stepOrder: number;
  label: string;
  assigneeType: 'MANAGER' | 'DEPARTMENT_HEAD' | 'ROLE' | 'SPECIFIC_USER' | 'HR';
  assigneeId?: string;
};

export type WorkflowTemplate = {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  triggerType: 'LEAVE_REQUEST' | 'EXPENSE_REQUEST' | 'OFFBOARDING_REQUEST' | 'DOCUMENT_REQUEST' | 'ATTENDANCE_REGULARIZATION' | 'TIMESHEET_APPROVAL' | 'SHIFT_SWAP_REQUEST' | 'CUSTOM';
  entityType: string;
  isActive: boolean;
  steps: WorkflowStepDef[];
  createdAt: string;
  updatedAt: string;
};

export type PendingApproval = {
  instance: {
    id: string;
    status: string;
    currentStepIndex: number;
    leaveApplication: {
      id: string;
      startDate: string;
      endDate: string;
      totalDays: number;
      reason?: string;
      status: string;
      isHalfDay: boolean;
      leaveType: { id: string; name: string; code: string; color?: string };
      employee: {
        id: string;
        firstName: string;
        lastName: string;
        employeeCode?: string;
        avatarUrl?: string;
        department?: { name: string };
        designation?: { name: string };
      };
    } | null;
    attendanceCorrection: {
      id: string;
      requestedCheckIn?: string;
      requestedCheckOut?: string;
      reason?: string;
      status: string;
      record: {
        id: string;
        date: string;
        employee: {
          id: string;
          firstName: string;
          lastName: string;
          employeeCode?: string;
          avatarUrl?: string;
          department?: { name: string };
          designation?: { name: string };
        };
      };
    } | null;
    shiftSwapRequest: {
      id: string;
      date: string;
      reason?: string;
      status: string;
      requestingEmployee: {
        id: string;
        firstName: string;
        lastName: string;
        employeeCode?: string;
        avatarUrl?: string;
        department?: { name: string };
        designation?: { name: string };
      };
    } | null;
    timesheet: {
      id: string;
      startDate: string;
      endDate: string;
      totalRegularMinutes: number;
      totalOvertimeMinutes: number;
      status: string;
      employee: {
        id: string;
        firstName: string;
        lastName: string;
        employeeCode?: string;
        avatarUrl?: string;
        department?: { name: string };
        designation?: { name: string };
      };
    } | null;
  };
  currentStep: WorkflowStepDef;
};

// ── Workflow Template Queries ───────────────────────────────────────────────────

export function useWorkflowTemplates() {
  return useQuery<WorkflowTemplate[]>({
    queryKey: ['workflows', 'templates'],
    queryFn: async () => {
      const res = await apiClient.get('/workflows/templates');
      return res.data.data;
    },
  });
}

export function useCreateWorkflowTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await apiClient.post('/workflows/templates', data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows', 'templates'] });
    },
  });
}

export function useUpdateWorkflowTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiClient.put(`/workflows/templates/${id}`, data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows', 'templates'] });
    },
  });
}

// ── Approvals Inbox Queries ────────────────────────────────────────────────────

export function useMyPendingApprovals() {
  return useQuery<PendingApproval[]>({
    queryKey: ['workflows', 'approvals', 'pending'],
    queryFn: async () => {
      const res = await apiClient.get('/workflows/approvals');
      return res.data.data;
    },
  });
}

export function useProcessWorkflowAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      instanceId,
      action,
      comment,
    }: {
      instanceId: string;
      action: 'APPROVED' | 'REJECTED';
      comment?: string;
    }) => {
      const res = await apiClient.post(`/workflows/approvals/${instanceId}`, { action, comment });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows', 'approvals'] });
      queryClient.invalidateQueries({ queryKey: ['leave'] });
    },
  });
}
