import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Laptop, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate, useParams, Outlet } from 'react-router-dom';

export function DesktopGuardLayout() {
  return (
    <DesktopOnlyGuard>
      <Outlet />
    </DesktopOnlyGuard>
  );
}

export function DesktopOnlyGuard({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { slug } = useParams();

  if (isMobile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background text-center">
        <div className="bg-amber-100 dark:bg-amber-900/30 p-4 rounded-full mb-6 text-amber-600 dark:text-amber-400">
          <Laptop className="w-12 h-12" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Desktop Required</h1>
        <p className="text-muted-foreground mb-8 max-w-sm">
          This feature is optimized for larger screens. Please switch to a desktop or tablet device to access this page.
        </p>
        <Button 
          size="lg" 
          className="w-full max-w-xs"
          onClick={() => navigate(slug ? `/t/${slug}/me` : '/')}
        >
          Return to Dashboard
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
