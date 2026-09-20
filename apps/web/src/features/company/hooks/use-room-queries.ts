import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface MeetingRoom {
  id: string;
  tenantId: string;
  name: string;
  capacity: number;
  location?: string;
  equipment?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CreateMeetingRoomDto = Omit<MeetingRoom, 'id' | 'tenantId' | 'createdAt' | 'updatedAt' | 'isActive'> & { isActive?: boolean };
export type UpdateMeetingRoomDto = Partial<CreateMeetingRoomDto>;

export function useMeetingRooms() {
  return useQuery({
    queryKey: ['meeting-rooms'],
    queryFn: async () => {
      const res = await apiClient.get('/rooms');
      return res.data as MeetingRoom[];
    },
  });
}

export function useCreateMeetingRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateMeetingRoomDto) => {
      const res = await apiClient.post('/rooms', data);
      return res.data as MeetingRoom;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting-rooms'] });
      // Also invalidate rooms for the scheduling modal
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
}

export function useUpdateMeetingRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateMeetingRoomDto }) => {
      const res = await apiClient.put(`/rooms/${id}`, data);
      return res.data as MeetingRoom;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting-rooms'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
}

export function useDeleteMeetingRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/rooms/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting-rooms'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
}
