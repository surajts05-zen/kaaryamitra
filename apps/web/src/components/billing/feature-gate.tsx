import { ReactNode } from 'react';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface FeatureGateProps {
  moduleKey: string;
  children: ReactNode;
  fallback?: ReactNode;
  showOverlay?: boolean;
}

export function FeatureGate({ moduleKey, children, fallback, showOverlay = true }: FeatureGateProps) {
  const { tenant } = useAuth();
  
  // We use the cached featureFlags on the tenant object to avoid blocking renders on a network request.
  // The backend BillingService.syncFeatureFlags() keeps this in sync.
  const featureFlags = (tenant?.featureFlags as Record<string, boolean>) ?? {};
  const hasAccess = featureFlags[moduleKey] === true;

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback !== undefined) {
    return <>{fallback}</>;
  }

  if (showOverlay) {
    return (
      <div className="relative rounded-lg overflow-hidden border bg-muted/20">
        <div className="opacity-20 pointer-events-none select-none filter blur-sm">
          {children}
        </div>
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/60 backdrop-blur-[2px] p-6 text-center">
          <div className="bg-background border shadow-lg rounded-xl p-8 max-w-sm">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">Feature Locked</h3>
            <p className="text-muted-foreground text-sm mb-6">
              This feature is not available on your current plan. Upgrade your plan or purchase the add-on to unlock it.
            </p>
            <Button asChild className="w-full">
              <Link to={`/t/${tenant?.slug}/settings/billing/compare`}>
                View Upgrade Options
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
