import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

// ─── Types ────────────────────────────────────────────────────────────────────

export type Permission = {
  id: string;
  action: string;
  description: string;
};

export type Role = {
  id: string;
  name: string;
  description?: string;
  isSystem: boolean;
  tenantId: string;
  _count?: { userRoles: number; rolePermissions?: number };
};

export type UserRoleEntry = {
  userId: string;
  roleId: string;
  grantedAt: string;
  role: Role;
};

export type EmployeeWithRoles = {
  id: string;
  firstName: string;
  lastName: string;
  employeeCode?: string;
  department?: { name: string };
  designation?: { name: string };
  user: {
    id: string;
    email: string;
    status: string;
    userRoles: UserRoleEntry[];
  };
};

// ─── Role Queries ─────────────────────────────────────────────────────────────

export function useRoles() {
  return useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await apiClient.get('/roles');
      return res.data.data;
    },
  });
}

export function useCreateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const res = await apiClient.post('/roles', data);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['roles'] }),
  });
}

export function useUpdateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name?: string; description?: string } }) => {
      const res = await apiClient.put(`/roles/${id}`, data);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['roles'] }),
  });
}

export function useDeleteRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/roles/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['roles'] }),
  });
}

// ─── Role Assignment Queries ───────────────────────────────────────────────────

export function useEmployeesWithRoles() {
  return useQuery<EmployeeWithRoles[]>({
    queryKey: ['roles', 'assignments'],
    queryFn: async () => {
      const res = await apiClient.get('/roles/assignments/employees');
      return res.data.data;
    },
  });
}

export function useAssignRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, roleId }: { userId: string; roleId: string }) => {
      await apiClient.post(`/roles/assignments/${userId}`, { roleId });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['roles', 'assignments'] }),
  });
}

export function useRevokeRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, roleId }: { userId: string; roleId: string }) => {
      await apiClient.delete(`/roles/assignments/${userId}/${roleId}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['roles', 'assignments'] }),
  });
}

// ─── Permission Queries ────────────────────────────────────────────────────────

export function useAllPermissions() {
  return useQuery<Permission[]>({
    queryKey: ['permissions'],
    queryFn: async () => {
      const res = await apiClient.get('/roles/permissions');
      return res.data.data;
    },
  });
}

export function useRolePermissions(roleId: string | null) {
  return useQuery<string[]>({
    queryKey: ['roles', roleId, 'permissions'],
    queryFn: async () => {
      if (!roleId) return [];
      const res = await apiClient.get(`/roles/${roleId}/permissions`);
      return res.data.data;
    },
    enabled: !!roleId,
  });
}

export function useUpdateRolePermissions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ roleId, permissionIds }: { roleId: string; permissionIds: string[] }) => {
      const res = await apiClient.put(`/roles/${roleId}/permissions`, { permissionIds });
      return res.data.data;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['roles'] });
      qc.invalidateQueries({ queryKey: ['roles', variables.roleId, 'permissions'] });
    },
  });
}
