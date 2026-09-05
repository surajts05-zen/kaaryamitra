import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useParams } from 'react-router-dom';

// Categories
export function usePolicyCategories() {
  const { slug } = useParams();
  return useQuery({
    queryKey: ['policy-categories', slug],
    queryFn: async () => {
      const res = await apiClient.get(`/t/${slug}/policies/categories`);
      return res.data;
    },
    enabled: !!slug
  });
}

export function useCreatePolicyCategory() {
  const { slug } = useParams();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const res = await apiClient.post(`/t/${slug}/policies/categories`, data);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['policy-categories', slug] })
  });
}

export function useUpdatePolicyCategory() {
  const { slug } = useParams();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name: string; description?: string } }) => {
      const res = await apiClient.put(`/t/${slug}/policies/categories/${id}`, data);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['policy-categories', slug] })
  });
}

export function useDeletePolicyCategory() {
  const { slug } = useParams();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete(`/t/${slug}/policies/categories/${id}`);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['policy-categories', slug] })
  });
}

export function useSeedPolicyTemplates() {
  const { slug } = useParams();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await apiClient.post(`/t/${slug}/policies/seed-templates`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policy-categories', slug] });
      queryClient.invalidateQueries({ queryKey: ['admin-policies', slug] });
    }
  });
}

export function useAiGeneratePolicy() {
  const { slug } = useParams();
  return useMutation({
    mutationFn: async (prompt: string) => {
      const res = await apiClient.post(`/t/${slug}/policies/ai-generate`, { prompt });
      return res.data;
    }
  });
}


// Admin Policies
export function useAdminPolicies() {
  const { slug } = useParams();
  return useQuery({
    queryKey: ['admin-policies', slug],
    queryFn: async () => {
      const res = await apiClient.get(`/t/${slug}/policies`);
      return res.data;
    },
    enabled: !!slug
  });
}

export function useAdminPolicy(id: string) {
  const { slug } = useParams();
  return useQuery({
    queryKey: ['admin-policy', slug, id],
    queryFn: async () => {
      const res = await apiClient.get(`/t/${slug}/policies/${id}`);
      return res.data;
    },
    enabled: !!slug && !!id
  });
}

export function useCreatePolicy() {
  const { slug } = useParams();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { categoryId: string; title: string; description?: string; requiresAck: boolean }) => {
      const res = await apiClient.post(`/t/${slug}/policies`, data);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-policies', slug] })
  });
}

export function useUpdatePolicy() {
  const { slug } = useParams();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiClient.put(`/t/${slug}/policies/${id}`, data);
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-policies', slug] });
      queryClient.invalidateQueries({ queryKey: ['admin-policy', slug, variables.id] });
    }
  });
}

// Versions
export function useCreateDraftVersion() {
  const { slug } = useParams();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (policyId: string) => {
      const res = await apiClient.post(`/t/${slug}/policies/${policyId}/versions`);
      return res.data;
    },
    onSuccess: (_, policyId) => queryClient.invalidateQueries({ queryKey: ['admin-policy', slug, policyId] })
  });
}

export function useSaveDraftVersion() {
  const { slug } = useParams();
  return useMutation({
    mutationFn: async ({ policyId, versionId, blocks }: { policyId: string; versionId: string; blocks: any[] }) => {
      const res = await apiClient.put(`/t/${slug}/policies/${policyId}/versions/${versionId}`, { blocks });
      return res.data;
    }
  });
}

export function usePublishVersion() {
  const { slug } = useParams();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ policyId, versionId }: { policyId: string; versionId: string }) => {
      const res = await apiClient.post(`/t/${slug}/policies/${policyId}/versions/${versionId}/publish`);
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-policy', slug, variables.policyId] });
      queryClient.invalidateQueries({ queryKey: ['admin-policies', slug] });
    }
  });
}

export function useVersionAcknowledgements(policyId: string, versionId: string) {
  const { slug } = useParams();
  return useQuery({
    queryKey: ['policy-acks', slug, policyId, versionId],
    queryFn: async () => {
      const res = await apiClient.get(`/t/${slug}/policies/${policyId}/versions/${versionId}/acknowledgements`);
      return res.data;
    },
    enabled: !!slug && !!policyId && !!versionId
  });
}

// ESS Policies
export function useESSPolicies() {
  const { slug } = useParams();
  return useQuery({
    queryKey: ['ess-policies', slug],
    queryFn: async () => {
      const res = await apiClient.get(`/t/${slug}/policies/me`);
      return res.data;
    },
    enabled: !!slug
  });
}

export function useAcknowledgePolicy() {
  const { slug } = useParams();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (versionId: string) => {
      const res = await apiClient.post(`/t/${slug}/policies/me/${versionId}/acknowledge`);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ess-policies', slug] })
  });
}

// AI Assistants
export function useAiRefinePolicyText() {
  const { slug } = useParams();
  return useMutation({
    mutationFn: async ({ text, instruction }: { text: string; instruction: string }) => {
      const res = await apiClient.post(`/t/${slug}/policies/ai-refine`, { text, instruction });
      return res.data;
    }
  });
}

export function useAiSummarizePolicy() {
  const { slug } = useParams();
  return useMutation({
    mutationFn: async ({ policyId, versionId, blocks }: { policyId: string; versionId: string; blocks: any[] }) => {
      const res = await apiClient.post(`/t/${slug}/policies/${policyId}/versions/${versionId}/ai-summarize`, { blocks });
      return res.data;
    }
  });
}

export function useAiGenerateFAQ() {
  const { slug } = useParams();
  return useMutation({
    mutationFn: async ({ policyId, versionId, blocks }: { policyId: string; versionId: string; blocks: any[] }) => {
      const res = await apiClient.post(`/t/${slug}/policies/${policyId}/versions/${versionId}/ai-faq`, { blocks });
      return res.data;
    }
  });
}

export function useAiComparePolicies() {
  const { slug } = useParams();
  return useMutation({
    mutationFn: async ({ policyId, oldBlocks, newBlocks }: { policyId: string; oldBlocks: any[]; newBlocks: any[] }) => {
      const res = await apiClient.post(`/t/${slug}/policies/${policyId}/compare`, { oldBlocks, newBlocks });
      return res.data;
    }
  });
}

export function useAiDraftComm() {
  const { slug } = useParams();
  return useMutation({
    mutationFn: async ({ policyId, versionId, policyName, summary }: { policyId: string; versionId: string; policyName: string; summary: string }) => {
      const res = await apiClient.post(`/t/${slug}/policies/${policyId}/versions/${versionId}/ai-draft-comm`, { policyName, summary });
      return res.data;
    }
  });
}

export function useSubmitPolicyForReview() {
  const { slug } = useParams();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ policyId, versionId }: { policyId: string; versionId: string }) => {
      const res = await apiClient.post(`/t/${slug}/policies/${policyId}/versions/${versionId}/submit-review`);
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-policy', slug, variables.policyId] });
      queryClient.invalidateQueries({ queryKey: ['admin-policies', slug] });
    }
  });
}
