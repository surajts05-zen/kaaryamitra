import { useEffect } from 'react';
import { Navigate, Outlet, useLocation, useParams } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { Loader2 } from 'lucide-react';

export function ProtectedRoute() {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

export function TenantResolver() {
  const { slug } = useParams();
  const { user } = useAuthStore();
  
  // Real app logic would verify user.tenant.slug === slug
  // For now we just verify they are authenticated and have *a* tenant
  
  if (user && !user.isSuperAdmin && !user.tenantId) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="max-w-md text-center space-y-4">
          <h2 className="text-2xl font-bold">No Workspace Assigned</h2>
          <p className="text-muted-foreground">
            Your account is not linked to any active workspace. Please contact support or your administrator.
          </p>
        </div>
      </div>
    );
  }
  
  return <Outlet />;
}
