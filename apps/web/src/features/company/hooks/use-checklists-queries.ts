import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useParams } from 'react-router-dom';

export function useChecklistTemplates() {
  const { slug } = useParams();
  return useQuery({
    queryKey: ['checklist-templates', slug],
    queryFn: async () => {
      const res = await apiClient.get(`/t/${slug}/checklists`);
      return res.data.data;
    },
  });
}

export function useCreateChecklistTemplate() {
  const { slug } = useParams();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await apiClient.post(`/t/${slug}/checklists`, data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist-templates', slug] });
    },
  });
}

export function useEmployeeChecklists(employeeId: string) {
  const { slug } = useParams();
  return useQuery({
    queryKey: ['employee-checklists', slug, employeeId],
    queryFn: async () => {
      const url = employeeId === 'me'
        ? `/t/${slug}/me/checklists`
        : `/t/${slug}/employees/${employeeId}/checklists`;
      const res = await apiClient.get(url);
      return res.data.data;
    },
  });
}

export function useAssignChecklist() {
  const { slug } = useParams();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ employeeId, templateId }: { employeeId: string; templateId: string }) => {
      const url = employeeId === 'me'
        ? `/t/${slug}/me/checklists`
        : `/t/${slug}/employees/${employeeId}/checklists`;
      const res = await apiClient.post(url, { templateId });
      return res.data.data;
    },
    onSuccess: (_, { employeeId }) => {
      queryClient.invalidateQueries({ queryKey: ['employee-checklists', slug, employeeId] });
    },
  });
}
