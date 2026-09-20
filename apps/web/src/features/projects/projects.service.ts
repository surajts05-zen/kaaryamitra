import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

// ── Types ──────────────────────────────────────────────────────────────────

export interface ProjectMember {
  id: string;
  projectId: string;
  employeeId: string;
  role: string;
  allocationPct: number;
  startDate?: string;
  endDate?: string;
  billingRate?: number;
}

export interface ProjectMilestone {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  ownerId?: string;
  status: string;
  completionPct: number;
  plannedStart?: string;
  plannedEnd?: string;
  actualStart?: string;
  actualEnd?: string;
  plannedBudget: number;
  actualCost: number;
}

export interface Project {
  id: string;
  code: string;
  name: string;
  description?: string;
  status: string;
  priority: string;
  managerId?: string;
  departmentId?: string;
  costCenterId?: string;
  client?: string;
  startDate?: string;
  plannedEndDate?: string;
  actualEndDate?: string;
  approvedBudget: number;
  currentBudget: number;
  actualCost: number;
  committedCost: number;
  availableBudget: number;
  completionPercentage: number;
  
  costCenter?: { name: string };
  members?: ProjectMember[];
  milestones?: ProjectMilestone[];
}

// ── Projects Services ──────────────────────────────────────────────────────

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await apiClient.get('/projects');
      return res.data.data as Project[];
    },
  });
}

export function useProject(projectId?: string) {
  return useQuery({
    queryKey: ['projects', projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const res = await apiClient.get(`/projects/${projectId}`);
      return res.data.data as Project;
    },
    enabled: !!projectId,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const res = await apiClient.post('/projects', data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useBulkCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any[]) => {
      const res = await apiClient.post('/projects/bulk', data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Project> }) => {
      const res = await apiClient.put(`/projects/${id}`, data);
      return res.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects', variables.id] });
    },
  });
}

// ── Milestones Services ────────────────────────────────────────────────────

export function useMilestones(projectId: string) {
  return useQuery({
    queryKey: ['projects', projectId, 'milestones'],
    queryFn: async () => {
      const res = await apiClient.get(`/projects/${projectId}/milestones`);
      return res.data.data as ProjectMilestone[];
    },
    enabled: !!projectId,
  });
}

export function useCreateMilestone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, data }: { projectId: string; data: Partial<ProjectMilestone> }) => {
      const res = await apiClient.post(`/projects/${projectId}/milestones`, data);
      return res.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects', variables.projectId, 'milestones'] });
    },
  });
}

export function useUpdateMilestone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, id, data }: { projectId: string; id: string; data: Partial<ProjectMilestone> }) => {
      const res = await apiClient.put(`/projects/${projectId}/milestones/${id}`, data);
      return res.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects', variables.projectId, 'milestones'] });
    },
  });
}
