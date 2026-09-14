import { useBudgetDashboard } from '@/features/budgets/budgets.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { 
  Landmark, 
  TrendingUp, 
  AlertCircle,
  FileText
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useCurrency } from '@/hooks/use-currency';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export function BudgetsDashboardPage() {
  const { data: dashboard, isLoading } = useBudgetDashboard();
  const { formatCurrency } = useCurrency();

  if (isLoading) return <div className="p-8 text-center">Loading dashboard...</div>;

  const kpis = dashboard?.kpis;
  const recentRequests = dashboard?.recentRequests || [];

  return (
    <div className="p-6 w-full space-y-6">
      <Breadcrumb items={[{ label: 'Budget Overview' }]} backPath="dashboard" backLabel="Back to Dashboard" />
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Budgets Overview</h1>
          <p className="text-gray-500 mt-1">Financial performance across all projects.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link to="../budgets/requests">View Requests</Link>
          </Button>
          <Button asChild>
            <Link to="../budgets/requests?new=true">New Request</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Approved Budget</CardTitle>
            <Landmark className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(kpis?.totalBudget)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Actual Cost</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(kpis?.actualCost)}</div>
            <p className="text-xs text-gray-500 mt-1">{kpis?.burnRatePct?.toFixed(1)}% burn rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Committed Cost</CardTitle>
            <FileText className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(kpis?.committedCost)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Available Balance</CardTitle>
            <AlertCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(kpis?.availableBudget)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Budget Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentRequests.map((req: any) => (
                <div key={req.id} className="flex justify-between items-center border-b pb-3 last:border-0">
                  <div>
                    <p className="font-medium text-sm">{req.requestNumber}</p>
                    <p className="text-xs text-gray-500">{req.project?.name || 'General'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">{formatCurrency(req.requestedAmount)}</p>
                    <Badge variant={req.status === 'APPROVED' ? 'default' : 'outline'}>{req.status}</Badge>
                  </div>
                </div>
              ))}
              {recentRequests.length === 0 && (
                <p className="text-sm text-gray-500">No recent requests.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
