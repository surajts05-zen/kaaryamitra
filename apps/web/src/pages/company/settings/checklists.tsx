import { useState } from 'react';
import { useChecklistTemplates, useCreateChecklistTemplate } from '@/features/company/hooks/use-checklists-queries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export function ChecklistSettings() {
  const { data: templates, isLoading } = useChecklistTemplates();
  const createMutation = useCreateChecklistTemplate();
  
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('ONBOARDING');
  const [tasks, setTasks] = useState<{ title: string; assigneeRole: string }[]>([
    { title: '', assigneeRole: 'MANAGER' }
  ]);

  const addTask = () => {
    setTasks([...tasks, { title: '', assigneeRole: 'MANAGER' }]);
  };

  const removeTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const updateTask = (index: number, field: 'title' | 'assigneeRole', value: string) => {
    const newTasks = [...tasks];
    newTasks[index][field] = value;
    setTasks(newTasks);
  };

  const handleCreate = () => {
    if (!name.trim()) {
      toast.error('Please enter a template name');
      return;
    }
    
    // Filter out completely empty tasks
    const validTasks = tasks.filter(t => t.title.trim() !== '');
    if (validTasks.length === 0) {
      toast.error('Please add at least one task to the checklist');
      return;
    }

    createMutation.mutate({ 
      name, 
      type,
      description: '',
      tasks: validTasks
    }, {
      onSuccess: () => {
        toast.success('Template created successfully');
        setIsOpen(false);
        setName('');
        setTasks([{ title: '', assigneeRole: 'MANAGER' }]);
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.error?.message || err.message || 'Failed to create template');
      }
    });
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6 max-w-5xl">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Checklist Templates</h2>
      </div>

      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle>Templates</CardTitle>
            <CardDescription>Define reusable onboarding and offboarding task templates.</CardDescription>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button>Create Template</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Checklist Template</DialogTitle>
                <DialogDescription>Define the template details and the list of tasks to be completed.</DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Template Name <span className="text-red-500">*</span></label>
                    <Input placeholder="e.g. Standard Onboarding" value={name} onChange={e => setName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Checklist Type <span className="text-red-500">*</span></label>
                    <select 
                      className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                      value={type} 
                      onChange={e => setType(e.target.value)}
                    >
                      <option value="ONBOARDING">Onboarding</option>
                      <option value="OFFBOARDING">Offboarding</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium">Tasks List <span className="text-red-500">*</span></label>
                    <Button variant="outline" size="sm" onClick={addTask}>
                      <Plus className="h-4 w-4 mr-2" /> Add Task
                    </Button>
                  </div>
                  
                  {tasks.map((task, index) => (
                    <div key={index} className="flex gap-2 items-start border p-3 rounded-md bg-muted/20">
                      <div className="flex-1 space-y-2">
                        <Input 
                          placeholder="Task Title (e.g. Setup Workstation)" 
                          value={task.title}
                          onChange={e => updateTask(index, 'title', e.target.value)}
                        />
                      </div>
                      <div className="w-[180px]">
                        <select 
                          className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                          value={task.assigneeRole}
                          onChange={e => updateTask(index, 'assigneeRole', e.target.value)}
                        >
                          <option value="MANAGER">Manager</option>
                          <option value="HR">HR</option>
                          <option value="IT">IT</option>
                          <option value="EMPLOYEE">Employee</option>
                        </select>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeTask(index)} className="text-destructive hover:text-destructive/90 hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  
                  {tasks.length === 0 && (
                    <div className="text-center p-4 border border-dashed rounded-md text-muted-foreground text-sm">
                      No tasks added yet. Click "Add Task" to start building your checklist.
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creating...' : 'Save Template'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Template Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Tasks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={3} className="text-center">Loading...</TableCell></TableRow>
              ) : templates?.length === 0 ? (
                <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No templates defined.</TableCell></TableRow>
              ) : (
                templates?.map((t: any) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        t.type === 'ONBOARDING' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {t.type}
                      </span>
                    </TableCell>
                    <TableCell>{t.tasks?.length || 0} tasks</TableCell>
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
