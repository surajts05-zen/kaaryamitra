import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useParams } from 'react-router-dom';

// ─── GOALS ──────────────────────────────────────────────────────────────────

export function useGoals(filters: Record<string, string> = {}) {
  const { slug } = useParams();
  
  return useQuery({
    queryKey: ['goals', slug, filters],
    queryFn: async () => {
      const params = new URLSearchParams(filters).toString();
      const { data } = await apiClient.get(`/t/${slug}/performance/goals?${params}`);
      return data.data;
    },
    enabled: !!slug,
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();
  const { slug } = useParams();
  
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await apiClient.post(`/t/${slug}/performance/goals`, data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals', slug] });
    },
  });
}

export function useUpdateGoal() {
  const queryClient = useQueryClient();
  const { slug } = useParams();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiClient.put(`/t/${slug}/performance/goals/${id}`, data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals', slug] });
    },
  });
}

// ─── REVIEW CYCLES ──────────────────────────────────────────────────────────

export function useReviewCycles() {
  const { slug } = useParams();
  
  return useQuery({
    queryKey: ['review-cycles', slug],
    queryFn: async () => {
      const { data } = await apiClient.get(`/t/${slug}/performance/reviews/cycles`);
      return data.data;
    },
    enabled: !!slug,
  });
}

export function useCreateReviewCycle() {
  const queryClient = useQueryClient();
  const { slug } = useParams();
  
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await apiClient.post(`/t/${slug}/performance/reviews/cycles`, data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review-cycles', slug] });
    },
  });
}

export function useStartReviewCycle() {
  const queryClient = useQueryClient();
  const { slug } = useParams();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.post(`/t/${slug}/performance/reviews/cycles/${id}/start`);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review-cycles', slug] });
    },
  });
}

// ─── REVIEWS ────────────────────────────────────────────────────────────────

export function useMyReviews() {
  const { slug } = useParams();
  
  return useQuery({
    queryKey: ['my-reviews', slug],
    queryFn: async () => {
      const { data } = await apiClient.get(`/t/${slug}/performance/me/reviews`);
      return data.data;
    },
    enabled: !!slug,
  });
}

export function useTeamReviews() {
  const { slug } = useParams();
  
  return useQuery({
    queryKey: ['team-reviews', slug],
    queryFn: async () => {
      const { data } = await apiClient.get(`/t/${slug}/performance/me/team-reviews`);
      return data.data;
    },
    enabled: !!slug,
  });
}

export function useSubmitSelfEvaluation() {
  const queryClient = useQueryClient();
  const { slug } = useParams();
  
  return useMutation({
    mutationFn: async ({ id, rating, comments }: { id: string, rating: number, comments: string }) => {
      const res = await apiClient.post(`/t/${slug}/performance/reviews/${id}/self-evaluation`, { rating, comments });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-reviews', slug] });
    },
  });
}

export function useSubmitManagerEvaluation() {
  const queryClient = useQueryClient();
  const { slug } = useParams();
  
  return useMutation({
    mutationFn: async ({ id, rating, comments }: { id: string, rating: number, comments: string }) => {
      const res = await apiClient.post(`/t/${slug}/performance/reviews/${id}/manager-evaluation`, { rating, comments });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-reviews', slug] });
      queryClient.invalidateQueries({ queryKey: ['review-cycles', slug] });
    },
  });
}
