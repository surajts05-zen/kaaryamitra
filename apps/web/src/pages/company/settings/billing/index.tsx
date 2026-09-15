import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle2, CreditCard, ShieldAlert, Zap } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useSubscription, useCancelSubscription } from '@/features/billing/hooks/use-billing-queries';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';

export function CompanyBillingPage() {
  const { tenant } = useAuth();
  const { data, isLoading } = useSubscription();
  const cancelMutation = useCancelSubscription();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!data?.subscription) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Could not load billing information.</AlertDescription>
      </Alert>
    );
  }

  const { subscription: sub, usage } = data;
  const isTrial = sub.status === 'TRIALING';
  const isPastDue = sub.status === 'PAST_DUE';
  const isCancelled = sub.status === 'CANCELLED';
  const isPendingPayment = sub.status === 'PENDING_PAYMENT';

  const handleCancel = () => {
    cancelMutation.mutate(true, {
      onSuccess: () => setShowCancelConfirm(false),
    });
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing & Plans</h1>
        <p className="text-muted-foreground mt-2">
          Manage your subscription, add-ons, and billing history.
        </p>
      </div>

      {isPastDue && (
        <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Payment Failed</AlertTitle>
          <AlertDescription>
            Your last payment failed. Please update your payment method to avoid service interruption.
          </AlertDescription>
        </Alert>
      )}

      {isTrial && sub.trialEnd && (
        <Alert className="bg-primary/5 border-primary/20 text-primary">
          <Zap className="h-4 w-4" />
          <AlertTitle>Trial Active</AlertTitle>
          <AlertDescription>
            Your trial expires on {format(new Date(sub.trialEnd), 'PPP')}. Upgrade now to lock in your features.
          </AlertDescription>
        </Alert>
      )}

      {isPendingPayment && (
        <Alert className="bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Payment Pending</AlertTitle>
          <AlertDescription>
            Your subscription has been updated but we are waiting for payment confirmation. Please complete the payment to activate your premium features.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Current Plan Overview */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Current Plan</CardTitle>
                <CardDescription>
                  You are currently on the <strong className="text-foreground">{sub.plan.name}</strong> plan.
                </CardDescription>
              </div>
              <Badge variant={isTrial ? 'secondary' : isCancelled ? 'destructive' : isPendingPayment ? 'outline' : 'default'} className={`uppercase ${isPendingPayment ? 'border-amber-500 text-amber-600 dark:text-amber-400' : ''}`}>
                {sub.status.replace('_', ' ')}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-8">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Billing Cycle</h4>
                <p className="text-lg font-semibold capitalize">{sub.billingCycle.toLowerCase()}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Renews on {format(new Date(sub.currentPeriodEnd), 'MMM d, yyyy')}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Add-ons Active</h4>
                <div className="flex flex-wrap gap-2 mt-2">
                  {sub.addons.length === 0 && <span className="text-sm text-muted-foreground">None</span>}
                  {sub.addons.map((a) => (
                    <Badge key={a.id} variant="outline">{a.addon.name}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-muted/50 flex items-center justify-between border-t py-4">
            <div className="text-sm">
              {sub.cancelAtPeriodEnd ? (
                <span className="text-destructive font-medium">Cancels at end of period</span>
              ) : (
                <span className="text-muted-foreground">Manage your subscription options</span>
              )}
            </div>
            <div className="flex space-x-2">
              {!sub.cancelAtPeriodEnd && sub.status !== 'CANCELLED' && (
                <Button variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setShowCancelConfirm(true)}>
                  Cancel Plan
                </Button>
              )}
              <Button asChild>
                <Link to={`/t/${tenant?.slug}/settings/billing/compare`}>
                  Change Plan
                </Link>
              </Button>
            </div>
          </CardFooter>
        </Card>

        {/* Quick Actions / Invoice teaser */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Payment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center space-x-4 p-4 rounded-lg border bg-card">
              <CreditCard className="h-6 w-6 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Payment Method</p>
                <p className="text-xs text-muted-foreground">Managed via Razorpay</p>
              </div>
            </div>
            <Button variant="outline" className="w-full" asChild>
              <a href={sub.plan.name !== 'Free' && !isTrial ? '#' : undefined} onClick={(e) => {
                if (sub.plan.name === 'Free' || isTrial) e.preventDefault();
              }} className={sub.plan.name === 'Free' || isTrial ? 'opacity-50 cursor-not-allowed' : ''}>
                View Billing Portal
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Usage Metering */}
      <h3 className="text-xl font-bold tracking-tight mt-10">Usage & Limits</h3>
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Employees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-baseline mb-2">
              <span className="text-3xl font-bold">{usage.employees.used}</span>
              <span className="text-sm font-medium text-muted-foreground">
                / {usage.employees.limit === null ? 'Unlimited' : usage.employees.limit}
              </span>
            </div>
            {usage.employees.limit !== null && (
              <Progress value={usage.employees.percentage} className={usage.employees.percentage > 90 ? 'bg-destructive/20 [&>div]:bg-destructive' : ''} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Storage (S3)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-baseline mb-2">
              <span className="text-3xl font-bold">{usage.storageMb.used} <span className="text-lg text-muted-foreground font-normal">MB</span></span>
              <span className="text-sm font-medium text-muted-foreground">
                / {usage.storageMb.limit === null ? 'Unlimited' : `${usage.storageMb.limit} MB`}
              </span>
            </div>
            {usage.storageMb.limit !== null && (
              <Progress value={usage.storageMb.percentage} className={usage.storageMb.percentage > 90 ? 'bg-destructive/20 [&>div]:bg-destructive' : ''} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              API Calls (Month)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-baseline mb-2">
              <span className="text-3xl font-bold">{(usage.apiCalls.used / 1000).toFixed(1)}k</span>
              <span className="text-sm font-medium text-muted-foreground">
                / {usage.apiCalls.limit === null ? 'Unlimited' : `${(usage.apiCalls.limit / 1000).toFixed(0)}k`}
              </span>
            </div>
            {usage.apiCalls.limit !== null && (
              <Progress value={usage.apiCalls.percentage} className={usage.apiCalls.percentage > 90 ? 'bg-destructive/20 [&>div]:bg-destructive' : ''} />
            )}
          </CardContent>
        </Card>
      </div>

      {showCancelConfirm && (
        <Alert variant="destructive" className="mt-8">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Cancel Subscription</AlertTitle>
          <AlertDescription className="space-y-4">
            <p>
              Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your current billing cycle ({format(new Date(sub.currentPeriodEnd), 'PPP')}).
            </p>
            <div className="flex space-x-4">
              <Button variant="destructive" onClick={handleCancel} disabled={cancelMutation.isPending}>
                {cancelMutation.isPending ? 'Cancelling...' : 'Yes, cancel subscription'}
              </Button>
              <Button variant="outline" onClick={() => setShowCancelConfirm(false)} disabled={cancelMutation.isPending}>
                Keep my plan
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

