import { useState } from 'react';
import { useGoals, useCreateGoal } from '@/features/company/hooks/use-performance-queries';
import { useEmployees } from '@/features/company/hooks/use-employee-queries';
import { useDepartments } from '@/features/company/hooks/use-org-queries';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Target, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';

export function CompanyGoalsPage() {
  const { data: goals, isLoading } = useGoals();
  const { data: employees } = useEmployees();
  const { data: departments } = useDepartments();
  const createMutation = useCreateGoal();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'SMART_GOAL',
    status: 'NOT_STARTED',
    companyWide: 'false',
    departmentId: 'none',
    employeeId: 'none',
    startDate: '',
    dueDate: '',
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

  const handleSubmit = () => {
    createMutation.mutate({
      ...formData,
      companyWide: formData.companyWide === 'true',
      departmentId: formData.departmentId === 'none' ? undefined : formData.departmentId,
      employeeId: formData.employeeId === 'none' ? undefined : formData.employeeId,
    }, {
      onSuccess: () => {
        setIsModalOpen(false);
        setFormData({ title: '', description: '', type: 'SMART_GOAL', status: 'NOT_STARTED', companyWide: 'false', departmentId: 'none', employeeId: 'none', startDate: '', dueDate: '' });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Goals & OKRs</h2>
          <p className="text-muted-foreground">Manage organizational and departmental performance targets.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Create Goal
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Goals</CardTitle>
          <CardDescription>View and track progress across the company.</CardDescription>
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
                  <TableHead>Owner / Scope</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Timeline</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {goals?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No goals found. Create one to get started.</TableCell>
                  </TableRow>
                ) : (
                  goals?.map((goal: any) => (
                    <TableRow key={goal.id}>
                      <TableCell>
                        <div className="font-medium">{goal.title}</div>
                        {goal.description && <div className="text-xs text-muted-foreground truncate max-w-[250px]">{goal.description}</div>}
                      </TableCell>
                      <TableCell>{getTypeBadge(goal.type)}</TableCell>
                      <TableCell>
                        {goal.companyWide ? (
                          <span className="text-xs font-medium text-blue-600">Company-wide</span>
                        ) : goal.department ? (
                          <span className="text-xs font-medium text-purple-600">{goal.department.name} Dept</span>
                        ) : goal.employee ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs">{goal.employee.firstName} {goal.employee.lastName}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Unassigned</span>
                        )}
                      </TableCell>
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

      {/* CREATE GOAL MODAL */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Goal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input 
                placeholder="e.g. Increase Q3 Revenue by 15%" 
                value={formData.title} 
                onChange={e => setFormData({...formData, title: e.target.value})} 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Goal Type</Label>
                <Select value={formData.type} onValueChange={v => setFormData({...formData, type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OKR">OKR</SelectItem>
                    <SelectItem value="KPI">KPI</SelectItem>
                    <SelectItem value="SMART_GOAL">SMART Goal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Scope</Label>
                <Select value={formData.companyWide} onValueChange={v => setFormData({...formData, companyWide: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Company-wide</SelectItem>
                    <SelectItem value="false">Specific Assignment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.companyWide === 'false' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Select value={formData.departmentId} onValueChange={v => setFormData({...formData, departmentId: v})}>
                    <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {departments?.map((d: any) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Employee</Label>
                  <Select value={formData.employeeId} onValueChange={v => setFormData({...formData, employeeId: v})}>
                    <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {employees?.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.firstName} {e.lastName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input type="date" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!formData.title || !formData.startDate || !formData.dueDate || createMutation.isPending}>
              Create Goal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
