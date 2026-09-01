import { useState } from 'react';
import { useChecklistTemplates, useEmployeeChecklists, useAssignChecklist } from '@/features/company/hooks/use-checklists-queries';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';

export function EmployeeChecklistsTab({ employeeId, type }: { employeeId: string; type: 'ONBOARDING' | 'OFFBOARDING' }) {
  const { data: allTemplates, isLoading: isLoadingAll } = useChecklistTemplates();
  const { data: employeeChecklists, isLoading: isLoadingEmp } = useEmployeeChecklists(employeeId);
  const assignMutation = useAssignChecklist();
  
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  const availableTemplates = allTemplates?.filter((t: any) => t.type === type) || [];
  
  // Filter assigned checklists for this tab's type
  const assignedChecklists = employeeChecklists?.filter((c: any) => c.type === type) || [];

  const handleAssign = () => {
    if (!selectedTemplateId) return;
    assignMutation.mutate({ templateId: selectedTemplateId, employeeId }, {
      onSuccess: () => {
        toast.success('Checklist assigned successfully');
        setIsAssignOpen(false);
        setSelectedTemplateId('');
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.error?.message || err.message || 'Failed to assign checklist');
      }
    });
  };

  if (isLoadingEmp || isLoadingAll) {
    return <div className="p-8 text-center text-muted-foreground">Loading checklists...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">{type === 'ONBOARDING' ? 'Onboarding' : 'Offboarding'} Checklists</h3>
          <p className="text-sm text-muted-foreground">Track tasks required for this employee's {type.toLowerCase()}.</p>
        </div>
        <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
          <DialogTrigger asChild>
            <Button>Assign Checklist</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign {type === 'ONBOARDING' ? 'Onboarding' : 'Offboarding'} Checklist</DialogTitle>
              <DialogDescription>
                Select a template to assign to this employee.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <select 
                className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                value={selectedTemplateId}
                onChange={e => setSelectedTemplateId(e.target.value)}
              >
                <option value="">-- Select Template --</option>
                {availableTemplates.map((template: any) => (
                  <option key={template.id} value={template.id}>
                    {template.name} ({template.tasks?.length || 0} tasks)
                  </option>
                ))}
              </select>
              {availableTemplates.length === 0 && (
                <p className="text-xs text-muted-foreground mt-2">No {type.toLowerCase()} templates defined in settings.</p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAssignOpen(false)}>Cancel</Button>
              <Button onClick={handleAssign} disabled={!selectedTemplateId || assignMutation.isPending}>
                {assignMutation.isPending ? 'Assigning...' : 'Assign'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-6 mt-4">
        {assignedChecklists.length === 0 ? (
          <div className="border rounded-md p-8 text-center text-muted-foreground bg-card">
            No {type.toLowerCase()} checklists assigned to this employee.
          </div>
        ) : (
          assignedChecklists.map((checklist: any) => {
            const totalTasks = checklist.tasks?.length || 0;
            const completedTasks = checklist.tasks?.filter((t: any) => t.status === 'COMPLETED').length || 0;
            const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
            
            return (
              <div key={checklist.id} className="border rounded-md bg-card overflow-hidden">
                <div className="p-4 border-b bg-muted/50 flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold">Checklist ID: {checklist.id.slice(-6).toUpperCase()}</h4>
                    <p className="text-sm text-muted-foreground">Status: {checklist.status}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{progress}% Completed</p>
                    <p className="text-xs text-muted-foreground">{completedTasks} of {totalTasks} tasks</p>
                  </div>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task</TableHead>
                      <TableHead>Assignee Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Completed At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {checklist.tasks?.length === 0 ? (
                      <TableRow><TableCell colSpan={4}>No tasks in this checklist.</TableCell></TableRow>
                    ) : (
                      checklist.tasks?.map((task: any) => (
                        <TableRow key={task.id}>
                          <TableCell className="font-medium">{task.title}</TableCell>
                          <TableCell>
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                              {task.assigneeRole || 'ANY'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              task.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {task.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground text-sm">
                            {task.completedAt ? format(new Date(task.completedAt), 'MMM d, yyyy') : '-'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
