import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface LibraryFolder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
}

export enum LibraryItemType {
  FILE = 'FILE',
  ARTICLE = 'ARTICLE',
  ANNOUNCEMENT = 'ANNOUNCEMENT',
}

export interface LibraryItem {
  id: string;
  folderId: string | null;
  type: LibraryItemType;
  title: string;
  content?: string;
  fileUrl?: string;
  mimeType?: string;
  sizeBytes?: number;
  tags: string[];
  isPinned: boolean;
  createdBy: { id: string; firstName: string; lastName: string };
  createdAt: string;
  updatedAt: string;
}

// FOLDERS
export function useLibraryFolders(parentId: string | null) {
  return useQuery<LibraryFolder[]>({
    queryKey: ['library-folders', parentId],
    queryFn: async () => {
      const { data } = await apiClient.get('/library/folders', { params: { parentId } });
      return data.data;
    },
  });
}

export function useCreateFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string; parentId: string | null }) => {
      const { data } = await apiClient.post('/library/folders', payload);
      return data.data;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['library-folders', variables.parentId] });
    },
  });
}

export function useDeleteFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (folderId: string) => {
      await apiClient.delete(`/library/folders/${folderId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['library-folders'] });
      qc.invalidateQueries({ queryKey: ['library-items'] });
    },
  });
}

// ITEMS
export function useLibraryItems(folderId: string | null, type?: LibraryItemType) {
  return useQuery<LibraryItem[]>({
    queryKey: ['library-items', folderId, type],
    queryFn: async () => {
      const { data } = await apiClient.get('/library/items', { params: { folderId, type } });
      return data.data;
    },
  });
}

export function usePinnedAnnouncements() {
  return useQuery<LibraryItem[]>({
    queryKey: ['library-announcements-pinned'],
    queryFn: async () => {
      const { data } = await apiClient.get('/library/announcements/pinned');
      return data.data;
    },
  });
}

export function useCreateArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<LibraryItem>) => {
      const { data } = await apiClient.post('/library/articles', payload);
      return data.data;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['library-items', variables.folderId] });
      if (variables.isPinned) qc.invalidateQueries({ queryKey: ['library-announcements-pinned'] });
    },
  });
}

export function useUpdateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<LibraryItem> }) => {
      const res = await apiClient.put(`/library/items/${id}`, data);
      return res.data.data;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['library-items'] });
      qc.invalidateQueries({ queryKey: ['library-announcements-pinned'] });
    },
  });
}

export function useDeleteItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: string) => {
      await apiClient.delete(`/library/items/${itemId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['library-items'] });
      qc.invalidateQueries({ queryKey: ['library-announcements-pinned'] });
    },
  });
}

export function useUploadFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, folderId }: { file: File; folderId: string | null }) => {
      const formData = new FormData();
      formData.append('file', file);
      if (folderId) formData.append('folderId', folderId);
      
      const { data } = await apiClient.post('/library/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data.data;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['library-items', variables.folderId] });
    },
  });
}
