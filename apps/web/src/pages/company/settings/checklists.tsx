import { useState } from 'react';
import { 
  useChecklistTemplates, 
  useCreateChecklistTemplate, 
  useUpdateChecklistTemplate,
  useDeleteChecklistTemplate 
} from '@/features/company/hooks/use-checklists-queries';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';

export function ChecklistSettings() {
  const { data: templates, isLoading } = useChecklistTemplates();
  const createMutation = useCreateChecklistTemplate();
  const updateMutation = useUpdateChecklistTemplate();
  const deleteMutation = useDeleteChecklistTemplate();
  
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState('ONBOARDING');
  const [tasks, setTasks] = useState<{ title: string; assigneeRole: string; description?: string }[]>([
    { title: '', assigneeRole: 'MANAGER', description: '' }
  ]);

  const handleOpenNew = () => {
    setEditingId(null);
    setName('');
    setType('ONBOARDING');
    setTasks([{ title: '', assigneeRole: 'MANAGER', description: '' }]);
    setIsOpen(true);
  };

  const handleOpenEdit = (template: any) => {
    setEditingId(template.id);
    setName(template.name);
    setType(template.type);
    setTasks(template.tasks?.length ? template.tasks.map((t: any) => ({
      title: t.title,
      assigneeRole: t.assigneeRole,
      description: t.description || '',
    })) : [{ title: '', assigneeRole: 'MANAGER', description: '' }]);
    setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this checklist template?')) {
      try {
        await deleteMutation.mutateAsync(id);
        toast.success('Template deleted successfully');
      } catch (err: any) {
        toast.error(err.response?.data?.error?.message || 'Failed to delete template');
      }
    }
  };

  const addTask = () => {
    setTasks([...tasks, { title: '', assigneeRole: 'MANAGER', description: '' }]);
  };

  const removeTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const updateTask = (index: number, field: 'title' | 'assigneeRole' | 'description', value: string) => {
    const newTasks = [...tasks];
    if (newTasks[index]) {
      newTasks[index][field] = value;
      setTasks(newTasks);
    }
  };

  const handleSave = () => {
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

    const payload = {
      name, 
      type,
      description: '',
      tasks: validTasks
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload }, {
        onSuccess: () => {
          toast.success('Template updated successfully');
          setIsOpen(false);
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.error?.message || err.message || 'Failed to update template');
        }
      });
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success('Template created successfully');
          setIsOpen(false);
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.error?.message || err.message || 'Failed to create template');
        }
      });
    }
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6 max-w-5xl">
      <Breadcrumb
        items={[
          { label: 'Settings', path: 'settings' },
          { label: 'Checklist Templates' },
        ]}
      />

      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Checklist Templates</h2>
      </div>

      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle>Templates</CardTitle>
            <CardDescription>Define reusable onboarding and offboarding task templates.</CardDescription>
          </div>
          <Button onClick={handleOpenNew}>Create Template</Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Template Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Tasks</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4} className="text-center">Loading...</TableCell></TableRow>
              ) : templates?.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No templates defined.</TableCell></TableRow>
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
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(t)} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)} className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Checklist Template' : 'Create Checklist Template'}</DialogTitle>
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
              
              <div className="space-y-3">
                {tasks.map((task, index) => (
                  <div key={index} className="flex gap-3 items-start border p-3 rounded-md bg-muted/20">
                    <div className="flex-1 space-y-3">
                      <div className="flex gap-3">
                        <Input 
                          className="flex-1"
                          placeholder="Task Title (e.g. Setup Workstation)" 
                          value={task.title}
                          onChange={e => updateTask(index, 'title', e.target.value)}
                        />
                        <div className="w-[180px] shrink-0">
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
                      </div>
                      <Input 
                        className="bg-background"
                        placeholder="Description or instructions (optional)" 
                        value={task.description}
                        onChange={e => updateTask(index, 'description', e.target.value)}
                      />
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeTask(index)} className="text-destructive hover:text-destructive/90 hover:bg-destructive/10 shrink-0">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              
              {tasks.length === 0 && (
                <div className="text-center p-4 border border-dashed rounded-md text-muted-foreground text-sm">
                  No tasks added yet. Click "Add Task" to start building your checklist.
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
