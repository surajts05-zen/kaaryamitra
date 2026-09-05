import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export function EssMyGoalsPage() {
  const { slug } = useParams();

  const { data: goals, isLoading } = useQuery({
    queryKey: ['ess-my-goals', slug],
    queryFn: async () => {
      const res = await apiClient.get(`/t/${slug}/me/performance/goals`);
      return res.data.data;
    },
    enabled: !!slug
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ON_TRACK': return <Badge variant="outline" className="text-green-500 bg-green-50"><CheckCircle2 className="mr-1 h-3 w-3" /> On Track</Badge>;
      case 'AT_RISK': return <Badge variant="outline" className="text-amber-500 bg-amber-50"><AlertTriangle className="mr-1 h-3 w-3" /> At Risk</Badge>;
      case 'COMPLETED': return <Badge variant="default" className="bg-primary text-primary-foreground"><CheckCircle2 className="mr-1 h-3 w-3" /> Completed</Badge>;
      default: return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" /> Not Started</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'OKR': return <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">OKR</Badge>;
      case 'KPI': return <Badge variant="outline" className="border-purple-200 text-purple-700 bg-purple-50">KPI</Badge>;
      default: return <Badge variant="outline" className="border-gray-200">SMART Goal</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'My Goals' }]} backPath="dashboard" backLabel="Back to Dashboard" />
      <div>
        <h2 className="text-3xl font-bold tracking-tight">My Goals & OKRs</h2>
        <p className="text-muted-foreground">Track your individual performance targets and assigned company OKRs.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assigned Goals</CardTitle>
          <CardDescription>Your personal and departmental objectives.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">Loading goals...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Goal</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Timeline</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {goals?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No active goals assigned to you right now.</TableCell>
                  </TableRow>
                ) : (
                  goals?.map((goal: any) => (
                    <TableRow key={goal.id}>
                      <TableCell>
                        <div className="font-medium">{goal.title}</div>
                        {goal.description && <div className="text-xs text-muted-foreground truncate max-w-[300px]">{goal.description}</div>}
                        {goal.companyWide && <Badge variant="outline" className="mt-1 text-[10px] text-blue-500 border-blue-200">Company-wide</Badge>}
                        {goal.department && <Badge variant="outline" className="mt-1 text-[10px] text-purple-500 border-purple-200">Department</Badge>}
                      </TableCell>
                      <TableCell>{getTypeBadge(goal.type)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 bg-secondary rounded-full overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${goal.progress}%` }} />
                          </div>
                          <span className="text-xs font-medium">{goal.progress}%</span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(goal.status)}</TableCell>
                      <TableCell className="text-xs">
                        {format(new Date(goal.startDate), 'MMM d')} - {format(new Date(goal.dueDate), 'MMM d, yyyy')}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
