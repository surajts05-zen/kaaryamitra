import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useParams } from 'react-router-dom';

// ─── ADMIN / HR HOOKS ─────────────────────────────────────────────────────────

export function useHelpdeskCategories() {
  const { slug } = useParams();
  return useQuery({
    queryKey: ['helpdesk-categories', slug],
    queryFn: async () => {
      const res = await apiClient.get(`/t/${slug}/helpdesk/categories`);
      return res.data.data;
    },
    enabled: !!slug,
  });
}

export function useCreateHelpdeskCategory() {
  const queryClient = useQueryClient();
  const { slug } = useParams();
  
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await apiClient.post(`/t/${slug}/helpdesk/categories`, data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['helpdesk-categories', slug] });
    },
  });
}

export function useUpdateHelpdeskCategory() {
  const queryClient = useQueryClient();
  const { slug } = useParams();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const res = await apiClient.patch(`/t/${slug}/helpdesk/categories/${id}`, data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['helpdesk-categories', slug] });
    },
  });
}

export function useDeleteHelpdeskCategory() {
  const queryClient = useQueryClient();
  const { slug } = useParams();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/t/${slug}/helpdesk/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['helpdesk-categories', slug] });
    },
  });
}

export function useAdminTickets(filters?: any) {
  const { slug } = useParams();
  return useQuery({
    queryKey: ['admin-helpdesk-tickets', slug, filters],
    queryFn: async () => {
      const res = await apiClient.get(`/t/${slug}/helpdesk/tickets`, { params: filters });
      return res.data.data;
    },
    enabled: !!slug,
  });
}

export function useAdminTicketDetails(id: string) {
  const { slug } = useParams();
  return useQuery({
    queryKey: ['admin-helpdesk-tickets', slug, id],
    queryFn: async () => {
      const res = await apiClient.get(`/t/${slug}/helpdesk/tickets/${id}`);
      return res.data.data;
    },
    enabled: !!slug && !!id,
  });
}

export function useUpdateTicket() {
  const queryClient = useQueryClient();
  const { slug } = useParams();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const res = await apiClient.patch(`/t/${slug}/helpdesk/tickets/${id}`, data);
      return res.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-helpdesk-tickets', slug] });
      queryClient.invalidateQueries({ queryKey: ['admin-helpdesk-tickets', slug, variables.id] });
    },
  });
}

export function useAddAdminComment() {
  const queryClient = useQueryClient();
  const { slug } = useParams();
  
  return useMutation({
    mutationFn: async ({ ticketId, ...data }: any) => {
      const res = await apiClient.post(`/t/${slug}/helpdesk/tickets/${ticketId}/comments`, data);
      return res.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-helpdesk-tickets', slug, variables.ticketId] });
    },
  });
}

// ─── ESS HOOKS ──────────────────────────────────────────────────────────────

export function useEssHelpdeskCategories() {
  const { slug } = useParams();
  return useQuery({
    queryKey: ['ess-helpdesk-categories', slug],
    queryFn: async () => {
      const res = await apiClient.get(`/t/${slug}/me/helpdesk/categories`);
      return res.data.data;
    },
    enabled: !!slug,
  });
}

export function useMyTickets() {
  const { slug } = useParams();
  return useQuery({
    queryKey: ['my-helpdesk-tickets', slug],
    queryFn: async () => {
      const res = await apiClient.get(`/t/${slug}/me/helpdesk/tickets`);
      return res.data.data;
    },
    enabled: !!slug,
  });
}

export function useMyTicketDetails(id: string) {
  const { slug } = useParams();
  return useQuery({
    queryKey: ['my-helpdesk-tickets', slug, id],
    queryFn: async () => {
      const res = await apiClient.get(`/t/${slug}/me/helpdesk/tickets/${id}`);
      return res.data.data;
    },
    enabled: !!slug && !!id,
  });
}

export function useCreateMyTicket() {
  const queryClient = useQueryClient();
  const { slug } = useParams();
  
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await apiClient.post(`/t/${slug}/me/helpdesk/tickets`, data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-helpdesk-tickets', slug] });
    },
  });
}

export function useAddMyComment() {
  const queryClient = useQueryClient();
  const { slug } = useParams();
  
  return useMutation({
    mutationFn: async ({ ticketId, ...data }: any) => {
      const res = await apiClient.post(`/t/${slug}/me/helpdesk/tickets/${ticketId}/comments`, data);
      return res.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['my-helpdesk-tickets', slug, variables.ticketId] });
    },
  });
}
