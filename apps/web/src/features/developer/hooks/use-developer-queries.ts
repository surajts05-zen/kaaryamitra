import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useParams } from 'react-router-dom';

export function useApiKeys() {
  const { slug } = useParams();
  return useQuery({
    queryKey: ['api-keys', slug],
    queryFn: async () => {
      const res = await apiClient.get(`/t/${slug}/api-keys`);
      return res.data.data;
    },
    enabled: !!slug,
  });
}

export function useCreateApiKey() {
  const { slug } = useParams();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; scopes: string[] }) => {
      const res = await apiClient.post(`/t/${slug}/api-keys`, data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys', slug] });
    },
  });
}

export function useRevokeApiKey() {
  const { slug } = useParams();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete(`/t/${slug}/api-keys/${id}`);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys', slug] });
    },
  });
}

export function useWebhooks() {
  const { slug } = useParams();
  return useQuery({
    queryKey: ['webhooks', slug],
    queryFn: async () => {
      const res = await apiClient.get(`/t/${slug}/webhooks`);
      return res.data.data;
    },
    enabled: !!slug,
  });
}

export function useCreateWebhook() {
  const { slug } = useParams();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; url: string; events: string[] }) => {
      const res = await apiClient.post(`/t/${slug}/webhooks`, data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks', slug] });
    },
  });
}

export function useTestWebhook() {
  const { slug } = useParams();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.post(`/t/${slug}/webhooks/${id}/test`);
      return res.data;
    },
  });
}

export function useToggleWebhook() {
  const { slug } = useParams();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await apiClient.put(`/t/${slug}/webhooks/${id}`, { isActive });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks', slug] });
    },
  });
}

export function useDeleteWebhook() {
  const { slug } = useParams();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete(`/t/${slug}/webhooks/${id}`);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks', slug] });
    },
  });
}

export function useIntegrations() {
  const { slug } = useParams();
  return useQuery({
    queryKey: ['integrations', slug],
    queryFn: async () => {
      const res = await apiClient.get(`/t/${slug}/integrations`);
      return res.data.data;
    },
    enabled: !!slug,
  });
}

export function useConfigureIntegration() {
  const { slug } = useParams();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { provider: string; config: any; secrets?: any }) => {
      const res = await apiClient.post(`/t/${slug}/integrations`, data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations', slug] });
    },
  });
}

export function useDeleteIntegration() {
  const { slug } = useParams();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete(`/t/${slug}/integrations/${id}`);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations', slug] });
    },
  });
}
