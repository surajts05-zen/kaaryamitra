import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useProject, useMilestones, ProjectMilestone } from '@/features/projects/projects.service';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Plus, Edit } from 'lucide-react';
import { useCurrency } from '@/hooks/use-currency';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { NewMilestoneModal } from './components/new-milestone-modal';
import { useEmployees } from '@/features/company/hooks/use-employee-queries';

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: project, isLoading: projectLoading } = useProject(id);
  const { data: milestones, isLoading: milestonesLoading } = useMilestones(id!);
  const { data: employees } = useEmployees();
  const { formatCurrency } = useCurrency();
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<ProjectMilestone | null>(null);

  if (projectLoading) return <div className="p-8 text-center">Loading project details...</div>;
  if (!project) return <div className="p-8 text-center">Project not found</div>;

  const approvedBudget = Number(project.approvedBudget || 0);
  const milestoneActuals = milestones?.reduce((sum, m) => sum + Number(m.actualCost || 0), 0) || 0;
  const actualCost = Number(project.actualCost || 0) + milestoneActuals;
  const availableBudget = Math.max(0, approvedBudget - actualCost);

  return (
    <div className="p-6 w-full space-y-6">
      <Breadcrumb 
        items={[
          { label: 'Projects', path: 'projects' }, 
          { label: project.name }
        ]} 
        backPath="projects" 
        backLabel="Back to Projects" 
      />

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
            <div className="text-2xl font-bold">{formatCurrency(approvedBudget)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Actual Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(actualCost)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Available Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(availableBudget)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Milestones</CardTitle>
          <Button size="sm" onClick={() => { setEditingMilestone(null); setIsMilestoneModalOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Milestone
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Milestone</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Planned Start</TableHead>
                <TableHead>Planned End</TableHead>
                <TableHead className="text-right">Planned Budget</TableHead>
                <TableHead className="text-right">Actual Cost</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {milestonesLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-4 text-gray-500">
                    Loading milestones...
                  </TableCell>
                </TableRow>
              ) : milestones?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-4 text-gray-500">
                    No milestones found for this project.
                  </TableCell>
                </TableRow>
              ) : (
                milestones?.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.name}</TableCell>
                    <TableCell>
                      {m.ownerId ? (() => {
                        const emp = employees?.find((e: any) => e.id === m.ownerId);
                        return emp ? `${emp.firstName} ${emp.lastName}` : 'Unknown';
                      })() : <span className="text-gray-400 italic">Unassigned</span>}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{m.status}</Badge>
                    </TableCell>
                    <TableCell>{m.plannedStart ? new Date(m.plannedStart).toLocaleDateString() : '-'}</TableCell>
                    <TableCell>{m.plannedEnd ? new Date(m.plannedEnd).toLocaleDateString() : '-'}</TableCell>
                    <TableCell className="text-right">{formatCurrency(m.plannedBudget)}</TableCell>
                    <TableCell className="text-right font-medium text-emerald-600">
                      {formatCurrency(m.actualCost || 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-700"
                        onClick={() => {
                          setEditingMilestone(m);
                          setIsMilestoneModalOpen(true);
                        }}
                        title="Edit Milestone & Incurred Cost"
                      >
                        <Edit className="h-4 w-4 mr-1" /> Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <NewMilestoneModal
        isOpen={isMilestoneModalOpen}
        projectId={project.id}
        initialData={editingMilestone}
        onClose={() => {
          setIsMilestoneModalOpen(false);
          setEditingMilestone(null);
        }}
      />
    </div>
  );
}
