import { useState } from 'react';
import { useCreateProject } from '@/features/projects/projects.service';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useCurrency } from '@/hooks/use-currency';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewProjectModal({ isOpen, onClose }: NewProjectModalProps) {
  const { currencySymbol } = useCurrency();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [status, setStatus] = useState('DRAFT');
  const [approvedBudget, setApprovedBudget] = useState<number | ''>('');
  
  const createMutation = useCreateProject();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) {
      toast.error('Name and Code are required');
      return;
    }
    
    try {
      await createMutation.mutateAsync({
        name,
        code,
        priority,
        status,
        approvedBudget: Number(approvedBudget) || 0,
      });
      toast.success('Project created successfully');
      onClose();
      // Reset form
      setName('');
      setCode('');
      setPriority('MEDIUM');
      setStatus('DRAFT');
      setApprovedBudget('');
    } catch (error: any) {
      toast.error(error?.response?.data?.error?.message || 'Failed to create project');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Project</DialogTitle>
          <DialogDescription>Create a new project workspace.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Project Name</Label>
            <Input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Website Redesign" />
          </div>
          
          <div className="space-y-2">
            <Label>Project Code</Label>
            <Input required value={code} onChange={e => setCode(e.target.value)} placeholder="e.g. WEB-2026" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="ON_HOLD">On Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Approved Budget ({currencySymbol})</Label>
            <Input type="number" min={0} value={approvedBudget} onChange={e => setApprovedBudget(e.target.value ? Number(e.target.value) : '')} placeholder="e.g. 500000" />
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
