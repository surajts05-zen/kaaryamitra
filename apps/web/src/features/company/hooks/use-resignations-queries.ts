import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useParams } from 'react-router-dom';

export function useResignations() {
  const { slug } = useParams();
  return useQuery({
    queryKey: ['resignations', slug],
    queryFn: async () => {
      const res = await apiClient.get(`/t/${slug}/resignations`);
      return res.data.data;
    },
  });
}

export function useMyResignation() {
  const { slug } = useParams();
  return useQuery({
    queryKey: ['my-resignation', slug],
    queryFn: async () => {
      const res = await apiClient.get(`/t/${slug}/me/resignations/my`);
      return res.data.data;
    },
  });
}

export function useSubmitResignation() {
  const { slug } = useParams();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await apiClient.post(`/t/${slug}/me/resignations/my`, data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-resignation', slug] });
    },
  });
}

export function useUpdateResignationStatus() {
  const { slug } = useParams();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string, data: any }) => {
      const res = await apiClient.patch(`/t/${slug}/resignations/${id}/status`, data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resignations', slug] });
    },
  });
}
