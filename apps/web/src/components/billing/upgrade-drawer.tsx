import { Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/use-auth';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';

interface UpgradeDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureName: string;
}

export function UpgradeDrawer({ open, onOpenChange, featureName }: UpgradeDrawerProps) {
  const { tenant } = useAuth();

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <DrawerTitle className="text-2xl">Unlock {featureName}</DrawerTitle>
            <DrawerDescription className="text-base mt-2">
              This feature is restricted on your current plan. Upgrade to unlock powerful new capabilities for your team.
            </DrawerDescription>
          </DrawerHeader>
          <DrawerFooter className="pt-6">
            <Button asChild size="lg" className="w-full">
              <Link to={`/t/${tenant?.slug}/settings/billing/compare`}>
                See Upgrade Options
              </Link>
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" size="lg" className="w-full">
                Maybe Later
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

