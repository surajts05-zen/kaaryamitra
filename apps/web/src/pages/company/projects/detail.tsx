import { useParams } from 'react-router-dom';
import { useProject, useMilestones } from '@/features/projects/projects.service';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useCurrency } from '@/hooks/use-currency';

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: project, isLoading: projectLoading } = useProject(id);
  const { data: milestones, isLoading: milestonesLoading } = useMilestones(id!);
  const { formatCurrency } = useCurrency();

  if (projectLoading) return <div className="p-8 text-center">Loading project details...</div>;
  if (!project) return <div className="p-8 text-center">Project not found</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          <p className="text-gray-500 mt-1">Code: {project.code} • Priority: {project.priority}</p>
        </div>
        <Badge variant={project.status === 'ACTIVE' ? 'default' : 'secondary'}>
          {project.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Approved Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(project.approvedBudget)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Actual Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(project.actualCost)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Available Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(project.availableBudget)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Milestones</CardTitle>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Milestone
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Milestone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Planned Start</TableHead>
                <TableHead>Planned End</TableHead>
                <TableHead className="text-right">Planned Budget</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {milestonesLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                    Loading milestones...
                  </TableCell>
                </TableRow>
              ) : milestones?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                    No milestones found for this project.
                  </TableCell>
                </TableRow>
              ) : (
                milestones?.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{m.status}</Badge>
                    </TableCell>
                    <TableCell>{m.plannedStart ? new Date(m.plannedStart).toLocaleDateString() : '-'}</TableCell>
                    <TableCell>{m.plannedEnd ? new Date(m.plannedEnd).toLocaleDateString() : '-'}</TableCell>
                    <TableCell className="text-right">{formatCurrency(m.plannedBudget)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
