import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useParams } from 'react-router-dom';

export function useAssetCategories() {
  const { slug } = useParams();
  return useQuery({
    queryKey: ['asset-categories', slug],
    queryFn: async () => {
      const { data } = await apiClient.get(`/t/${slug}/assets/categories`);
      return data.data;
    },
    enabled: !!slug,
  });
}

export function useCreateAssetCategory() {
  const queryClient = useQueryClient();
  const { slug } = useParams();
  
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await apiClient.post(`/t/${slug}/assets/categories`, data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset-categories', slug] });
    },
  });
}

export function useAssets(filters: any = {}) {
  const { slug } = useParams();
  return useQuery({
    queryKey: ['assets', slug, filters],
    queryFn: async () => {
      const params = new URLSearchParams(filters).toString();
      const { data } = await apiClient.get(`/t/${slug}/assets?${params}`);
      return data.data;
    },
    enabled: !!slug,
  });
}

export function useAssetDetails(id: string) {
  const { slug } = useParams();
  return useQuery({
    queryKey: ['assets', slug, id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/t/${slug}/assets/${id}`);
      return data.data;
    },
    enabled: !!slug && !!id,
  });
}

export function useCreateAsset() {
  const queryClient = useQueryClient();
  const { slug } = useParams();
  
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

export function useBulkCreateAssets() {
  const queryClient = useQueryClient();
  const { slug } = useParams();
  
  return useMutation({
    mutationFn: async (items: any[]) => {
      const res = await apiClient.post(`/t/${slug}/assets/bulk`, { items });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets', slug] });
    },
  });
}

export function useUpdateAsset() {
  const queryClient = useQueryClient();
  const { slug } = useParams();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiClient.put(`/t/${slug}/assets/${id}`, data);
      return res.data.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['assets', slug] });
      queryClient.invalidateQueries({ queryKey: ['assets', slug, variables.id] });
    },
  });
}

export function useDeleteAsset() {
  const queryClient = useQueryClient();
  const { slug } = useParams();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/t/${slug}/assets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets', slug] });
    },
  });
}

export function useAssignAsset() {
  const queryClient = useQueryClient();
  const { slug } = useParams();
  
  return useMutation({
    mutationFn: async ({ id, employeeId, notes }: { id: string; employeeId: string; notes?: string }) => {
      const res = await apiClient.post(`/t/${slug}/assets/${id}/assign`, { employeeId, notes });
      return res.data.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['assets', slug] });
      queryClient.invalidateQueries({ queryKey: ['assets', slug, variables.id] });
    },
  });
}

export function useReturnAsset() {
  const queryClient = useQueryClient();
  const { slug } = useParams();
  
  return useMutation({
    mutationFn: async ({ id, returnCondition, notes }: { id: string; returnCondition: string; notes?: string }) => {
      const res = await apiClient.post(`/t/${slug}/assets/${id}/return`, { returnCondition, notes });
      return res.data.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['assets', slug] });
      queryClient.invalidateQueries({ queryKey: ['assets', slug, variables.id] });
    },
  });
}

// ─── ESS ───────────────────────────────────────────────────────────────────

export function useMyAssets() {
  const { slug } = useParams();
  return useQuery({
    queryKey: ['my-assets', slug],
    queryFn: async () => {
      const { data } = await apiClient.get(`/t/${slug}/me/assets`);
      return data.data;
    },
    enabled: !!slug,
  });
}

export function useAcknowledgeAsset() {
  const queryClient = useQueryClient();
  const { slug } = useParams();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.post(`/t/${slug}/me/assets/${id}/acknowledge`);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-assets', slug] });
    },
  });
}
