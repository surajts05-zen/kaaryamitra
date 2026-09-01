import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useParams } from 'react-router-dom';

export function useAssetCategories() {
  const { slug } = useParams();
  return useQuery({
    queryKey: ['asset-categories', slug],
    queryFn: async () => {
      const res = await apiClient.get(`/t/${slug}/assets/categories`);
      return res.data.data;
    },
  });
}

export function useCreateAssetCategory() {
  const { slug } = useParams();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string }) => {
      const res = await apiClient.post(`/t/${slug}/assets/categories`, data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset-categories', slug] });
    },
  });
}

export function useAssets() {
  const { slug } = useParams();
  return useQuery({
    queryKey: ['assets', slug],
    queryFn: async () => {
      const res = await apiClient.get(`/t/${slug}/assets`);
      return res.data.data;
    },
  });
}

export function useCreateAsset() {
  const { slug } = useParams();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await apiClient.post(`/t/${slug}/assets`, data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets', slug] });
    },
  });
}

export function useUpdateAsset() {
  const { slug } = useParams();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string, data: any }) => {
      const res = await apiClient.put(`/t/${slug}/assets/${id}`, data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets', slug] });
    },
  });
}

export function useAssignAsset() {
  const { slug } = useParams();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, employeeId }: { id: string, employeeId: string | null }) => {
      const res = await apiClient.patch(`/t/${slug}/assets/${id}/assign`, { employeeId });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets', slug] });
      queryClient.invalidateQueries({ queryKey: ['employee-assets', slug] });
    },
  });
}

export function useEmployeeAssets(employeeId: string) {
  const { slug } = useParams();
  return useQuery({
    queryKey: ['employee-assets', slug, employeeId],
    queryFn: async () => {
      const url = employeeId === 'me' 
        ? `/t/${slug}/me/assets` 
        : `/t/${slug}/employees/${employeeId}/assets`;
      const res = await apiClient.get(url);
      return res.data.data;
    },
  });
}
