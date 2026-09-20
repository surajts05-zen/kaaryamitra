import { useState } from 'react';
import { useCreateProject } from '@/features/projects/projects.service';
import { useEmployees } from '@/features/company/hooks/use-employee-queries';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
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
  const [members, setMembers] = useState<{employeeId: string, role: string, accessLevel: string}[]>([]);
  
  const createMutation = useCreateProject();
  const { data: employees } = useEmployees();

  const handleAddMember = () => setMembers([...members, { employeeId: '', role: 'Member', accessLevel: 'READ_ONLY' }]);
  const handleRemoveMember = (index: number) => setMembers(members.filter((_, i) => i !== index));
  const handleMemberChange = (index: number, field: string, value: string) => {
    const newMembers = [...members];
    newMembers[index] = { ...newMembers[index], [field]: value } as any;
    setMembers(newMembers);
  };

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
        members: members.filter(m => m.employeeId !== '') as { employeeId: string; role: string; accessLevel: string }[]
      });
      toast.success('Project created successfully');
      onClose();
      // Reset form
      setName('');
      setCode('');
      setPriority('MEDIUM');
      setStatus('DRAFT');
      setApprovedBudget('');
      setMembers([]);
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

          <div className="space-y-4 pt-2">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-sm font-semibold">Project Members</h3>
              <Button type="button" variant="outline" size="sm" onClick={handleAddMember}>
                <Plus className="h-4 w-4 mr-2" /> Add Member
              </Button>
            </div>
            
            {members.map((member, index) => (
              <div key={index} className="grid grid-cols-12 gap-3 items-start bg-muted/50 p-3 rounded-md border">
                <div className="col-span-12 md:col-span-4 space-y-1">
                  <Label className="text-xs">Employee</Label>
                  <Select value={member.employeeId} onValueChange={(val) => handleMemberChange(index, 'employeeId', val)}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      {employees?.map((emp: any) => (
                        <SelectItem key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="col-span-6 md:col-span-4 space-y-1">
                  <Label className="text-xs">Role</Label>
                  <Input className="h-9" value={member.role} onChange={(e) => handleMemberChange(index, 'role', e.target.value)} />
                </div>
                
                <div className="col-span-4 md:col-span-3 space-y-1">
                  <Label className="text-xs">Access Level</Label>
                  <Select value={member.accessLevel} onValueChange={(val) => handleMemberChange(index, 'accessLevel', val)}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="READ_ONLY">Read Only</SelectItem>
                      <SelectItem value="READ_WRITE">Read/Write</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="col-span-2 md:col-span-1 flex justify-end mt-6">
                  <Button type="button" variant="ghost" size="icon" className="text-red-500 h-9 w-9" onClick={() => handleRemoveMember(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
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
