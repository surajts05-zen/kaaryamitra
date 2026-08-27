import { create } from 'zustand';
import { apiClient } from '@/lib/api-client';

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isOpen: boolean;
  isFetching: boolean;
  setOpen: (open: boolean) => void;
  fetchNotifications: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  startPolling: () => () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isOpen: false,
  isFetching: false,

  setOpen: (open) => {
    set({ isOpen: open });
    // Refresh when opening
    if (open) get().fetchNotifications();
  },

  fetchNotifications: async () => {
    if (get().isFetching) return;
    set({ isFetching: true });
    try {
      const res = await apiClient.get('/notifications');
      if (res.data.success) {
        set({
          notifications: res.data.data.notifications,
          unreadCount: res.data.data.unreadCount,
        });
      }
    } catch {
      // Silently ignore — user stays logged in
    } finally {
      set({ isFetching: false });
    }
  },

  markRead: async (id: string) => {
    // Optimistic update
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.id === id ? { ...n, readAt: new Date().toISOString() } : n,
      ),
      unreadCount: Math.max(0, s.unreadCount - 1),
    }));
    try {
      await apiClient.patch(`/notifications/${id}/read`);
    } catch {
      // Re-fetch on failure
      get().fetchNotifications();
    }
  },

  markAllRead: async () => {
    // Optimistic update
    set((s) => ({
      notifications: s.notifications.map((n) => ({
        ...n,
        readAt: n.readAt ?? new Date().toISOString(),
      })),
      unreadCount: 0,
    }));
    try {
      await apiClient.patch('/notifications/read-all');
    } catch {
      get().fetchNotifications();
    }
  },

  startPolling: () => {
    // Initial fetch
    get().fetchNotifications();
    // Poll every 30s
    const interval = setInterval(() => {
      get().fetchNotifications();
    }, 30_000);
    return () => clearInterval(interval);
  },
}));
