import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from '@/lib/api-client';

export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  status: string;
  isSuperAdmin: boolean;
  tenantId: string | null;
  tenantSlug?: string | null;
};

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  login: (token: string, user: User) => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      login: (token, user) => {
        localStorage.setItem('km_access_token', token);
        set({ user, isAuthenticated: true });
      },
      logout: async () => {
        try {
          await apiClient.post('/auth/logout');
        } catch (e) {
          // ignore
        } finally {
          localStorage.removeItem('km_access_token');
          set({ user: null, isAuthenticated: false });
        }
      },
      checkAuth: async () => {
        const token = localStorage.getItem('km_access_token');
        if (!token) {
          set({ user: null, isAuthenticated: false, isLoading: false });
          return;
        }
        
        // If not authenticated yet, set loading true for initial load screen
        const current = get();
        if (!current.isAuthenticated) {
          set({ isLoading: true });
        }

        try {
          const res = await apiClient.get('/auth/me');
          if (res.data.success) {
            set({ user: res.data.data, isAuthenticated: true });
          }
        } catch (e: any) {
          // Only invalidate and clear session if API explicitly returns 401 Unauthorized
          if (e.response?.status === 401) {
            localStorage.removeItem('km_access_token');
            set({ user: null, isAuthenticated: false });
          }
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
