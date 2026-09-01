import { useMutation } from '@tanstack/react-query';
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
