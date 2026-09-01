import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface DocumentCategory {
  id: string;
  name: string;
  description?: string;
  isRequired: boolean;
}

export interface DocumentVersion {
  id: string;
  version: number;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  changeNote?: string;
  createdAt: string;
  uploader: { firstName: string; lastName: string };
}

export interface EmployeeDocument {
  id: string;
  employeeId: string;
  categoryId: string;
  title: string;
  description?: string;
  status: 'VALID' | 'EXPIRED' | 'ARCHIVED';
  fileUrl: string;
  fileType: string;
  fileSize: number;
  expiresAt?: string;
  isVerified: boolean;
  verifiedAt?: string;
  createdAt: string;
  category: DocumentCategory;
  verifier?: { firstName: string; lastName: string };
  versions?: DocumentVersion[];
}

export function useDocumentCategories() {
  return useQuery<DocumentCategory[]>({
    queryKey: ['document-categories'],
    queryFn: async () => {
      const res = await apiClient.get('/documents/categories');
      return res.data.data;
    },
  });
}

export function useCreateDocumentCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<DocumentCategory>) => {
      const res = await apiClient.post('/documents/categories', data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-categories'] });
    },
  });
}

export function useUpdateDocumentCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<DocumentCategory> }) => {
      const res = await apiClient.put(`/documents/categories/${id}`, data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-categories'] });
    },
  });
}

export function useDeleteDocumentCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/documents/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-categories'] });
    },
  });
}

export function useEmployeeDocuments(employeeId: string) {
  return useQuery<EmployeeDocument[]>({
    queryKey: ['employee-documents', employeeId],
    queryFn: async () => {
      const res = await apiClient.get(`/employees/${employeeId}/documents`);
      return res.data.data;
    },
    enabled: !!employeeId,
  });
}

export function useUploadDocument(employeeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await apiClient.post(`/employees/${employeeId}/documents`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-documents', employeeId] });
    },
  });
}

export function useVerifyDocument(employeeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiClient.patch(`/documents/${id}/verify`, { status });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-documents', employeeId] });
    },
  });
}

export function usePreviewDocument() {
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.get(`/documents/${id}/preview`);
      return res.data.data.url;
    },
  });
}
