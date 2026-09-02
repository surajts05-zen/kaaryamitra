import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface DashboardStats {
  headcount: number;
  departments: number;
  locations: number;
  openRoles: number;
  upcomingHolidays: {
    id: string;
    name: string;
    date: string;
    type: string;
  }[];
  recentActivity: {
    id: string;
    action: string;
    actorEmail: string;
    createdAt: string;
  }[];
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: DashboardStats }>('/dashboard/stats');
      return res.data.data;
    },
  });
}
