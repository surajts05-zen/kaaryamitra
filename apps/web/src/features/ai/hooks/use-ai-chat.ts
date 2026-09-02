import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export type ChatRole = 'user' | 'model';

export interface ChatMessage {
  role: ChatRole;
  parts: { text: string }[];
}

export function useAiChat() {
  return useMutation({
    mutationFn: async ({ message, history }: { message: string; history: ChatMessage[] }) => {
      const res = await apiClient.post('/ai/chat', { message, history });
      return res.data.data.text as string;
    },
  });
}

export function useAiInsights() {
  return useQuery({
    queryKey: ['ai', 'insights'],
    queryFn: async () => {
      const res = await apiClient.get('/ai/insights');
      return res.data.data.insights as string;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false, // Don't retry if API key is missing
  });
}

export function useAiExtract() {
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await apiClient.post('/ai/extract', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return res.data.data;
    },
  });
}
