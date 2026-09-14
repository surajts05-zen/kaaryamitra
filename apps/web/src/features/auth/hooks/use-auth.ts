import { useAuthStore } from '@/store/auth.store';
import { useParams } from 'react-router-dom';

export function useAuth() {
  const { user, isAuthenticated, isLoading, logout, refreshUser } = useAuthStore();
  const params = useParams<{ tenantSlug?: string }>();

  const tenantSlug = params.tenantSlug || user?.tenantSlug || '';
  const tenantId = user?.tenantId || '';

  const tenant = tenantSlug
    ? {
        id: tenantId,
        slug: tenantSlug,
        featureFlags: (user as any)?.featureFlags as Record<string, boolean> | undefined,
      }
    : null;

  return {
    user,
    tenant,
    tenantSlug,
    isAuthenticated,
    isLoading,
    logout,
    refreshUser,
  };
}
