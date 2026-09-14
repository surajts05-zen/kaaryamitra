import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAdminStats, useAdminSubscriptions } from '@/features/billing/hooks/use-billing-queries';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, TrendingUp, AlertTriangle, XCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

export function AdminBillingDashboard() {
  const { data: stats, isLoading: loadingStats } = useAdminStats();
  const { data: subsData, isLoading: loadingSubs } = useAdminSubscriptions({ page: 1, limit: 10 });

  if (loadingStats || loadingSubs) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid md:grid-cols-4 gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Platform Billing & Subscriptions</h1>
        <p className="text-muted-foreground mt-2">
          Monitor MRR, active subscriptions, and recent billing activity across all tenants.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Approx. MRR</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.mrrInr || 0, 'INR')}</div>
            <p className="text-xs text-muted-foreground mt-1">Based on active subscriptions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Tenants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeSubscriptions || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Out of {stats?.totalSubscriptions} total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">In Trial</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.trialingSubscriptions || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Past Due / Cancelled</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {(stats?.pastDueSubscriptions || 0) + (stats?.cancelledSubscriptions || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.pastDueSubscriptions} past due, {stats?.cancelledSubscriptions} cancelled
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Subscriptions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Subscriptions</CardTitle>
              <CardDescription>Latest tenant subscription changes</CardDescription>
            </div>
            <Link to="/admin/tenants" className="text-sm font-medium text-primary hover:underline">
              View all tenants
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="px-4 py-3 font-medium">Tenant</th>
                  <th className="px-4 py-3 font-medium">Plan</th>
                  <th className="px-4 py-3 font-medium">Billing</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Period End</th>
                </tr>
              </thead>
              <tbody>
                {subsData?.subscriptions.map((sub: any) => (
                  <tr key={sub.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="px-4 py-3 font-medium">
                      <Link to={`/admin/tenants/${sub.tenant.id}`} className="hover:underline">
                        {sub.tenant.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {sub.plan.name}
                      {sub.addons.length > 0 && <span className="text-xs text-muted-foreground ml-2">(+{sub.addons.length} addons)</span>}
                    </td>
                    <td className="px-4 py-3 capitalize">{sub.billingCycle.toLowerCase()}</td>
                    <td className="px-4 py-3">
                      <Badge variant={sub.status === 'ACTIVE' ? 'default' : sub.status === 'TRIALING' ? 'secondary' : 'destructive'} className="uppercase">
                        {sub.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {format(new Date(sub.currentPeriodEnd), 'MMM d, yyyy')}
                    </td>
                  </tr>
                ))}
                {subsData?.subscriptions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      No subscriptions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
