import { useState, useEffect } from 'react';
import { useCreateMilestone, useUpdateMilestone, ProjectMilestone } from '@/features/projects/projects.service';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useCurrency } from '@/hooks/use-currency';
import { useEmployees } from '@/features/company/hooks/use-employee-queries';

interface NewMilestoneModalProps {
  isOpen: boolean;
  projectId: string;
  onClose: () => void;
  initialData?: ProjectMilestone | null;
}

export function NewMilestoneModal({ isOpen, projectId, onClose, initialData }: NewMilestoneModalProps) {
  const { currencySymbol } = useCurrency();
  const [name, setName] = useState('');
  const [status, setStatus] = useState('NOT_STARTED');
  const [description, setDescription] = useState('');
  const [plannedStart, setPlannedStart] = useState('');
  const [plannedEnd, setPlannedEnd] = useState('');
  const [plannedBudget, setPlannedBudget] = useState<number | ''>('');
  const [actualCost, setActualCost] = useState<number | ''>('');
  const [ownerId, setOwnerId] = useState('unassigned');

  const { data: employees } = useEmployees();
  const createMutation = useCreateMilestone();
  const updateMutation = useUpdateMilestone();

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setStatus(initialData.status || 'NOT_STARTED');
      setDescription(initialData.description || '');
      setPlannedStart(initialData.plannedStart ? new Date(initialData.plannedStart).toISOString().slice(0, 10) : '');
      setPlannedEnd(initialData.plannedEnd ? new Date(initialData.plannedEnd).toISOString().slice(0, 10) : '');
      setPlannedBudget(initialData.plannedBudget !== undefined ? Number(initialData.plannedBudget) : '');
      setActualCost(initialData.actualCost !== undefined ? Number(initialData.actualCost) : '');
      setOwnerId(initialData.ownerId || 'unassigned');
    } else {
      setName('');
      setStatus('NOT_STARTED');
      setDescription('');
      setPlannedStart('');
      setPlannedEnd('');
      setPlannedBudget('');
      setActualCost('');
      setOwnerId('unassigned');
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      toast.error('Milestone name is required');
      return;
    }

    try {
      const payload: Record<string, any> = {
        name,
        status,
        plannedBudget: Number(plannedBudget) || 0,
        actualCost: Number(actualCost) || 0,
      };
      if (ownerId && ownerId !== 'unassigned') payload.ownerId = ownerId;
      if (ownerId === 'unassigned') payload.ownerId = null;
      if (description) payload.description = description;
      if (plannedStart) payload.plannedStart = plannedStart;
      if (plannedEnd) payload.plannedEnd = plannedEnd;

      if (initialData?.id) {
        await updateMutation.mutateAsync({
          projectId,
          id: initialData.id,
          data: payload,
        });
        toast.success('Milestone updated successfully');
      } else {
        await createMutation.mutateAsync({
          projectId,
          data: payload as any,
        });
        toast.success('Milestone added successfully');
      }

      onClose();
    } catch (error: any) {
      toast.error(error?.response?.data?.error?.message || 'Failed to save milestone');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Milestone' : 'Add Milestone'}</DialogTitle>
          <DialogDescription>
            {initialData ? 'Update milestone status and incurred actual cost.' : 'Add a new delivery checkpoint for this project.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Milestone Name</Label>
            <Input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Design Prototype Signoff"
            />
          </div>

          <div className="space-y-2">
            <Label>Assignee</Label>
            <Select value={ownerId} onValueChange={setOwnerId}>
              <SelectTrigger><SelectValue placeholder="Select assignee" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {employees?.map((emp: any) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="NOT_STARTED">Not Started</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="SUBMITTED">Submitted</SelectItem>
                <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="DELAYED">Delayed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Description (Optional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Key deliverables or criteria"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Planned Start</Label>
              <Input
                type="date"
                value={plannedStart}
                onChange={(e) => setPlannedStart(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Planned End</Label>
              <Input
                type="date"
                value={plannedEnd}
                onChange={(e) => setPlannedEnd(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Planned Budget ({currencySymbol})</Label>
              <Input
                type="number"
                min={0}
                value={plannedBudget}
                onChange={(e) => setPlannedBudget(e.target.value ? Number(e.target.value) : '')}
                placeholder="e.g. 50000"
              />
            </div>

            <div className="space-y-2">
              <Label>Actual Cost ({currencySymbol})</Label>
              <Input
                type="number"
                min={0}
                value={actualCost}
                onChange={(e) => setActualCost(e.target.value ? Number(e.target.value) : '')}
                placeholder="e.g. 12000"
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : initialData ? 'Save Changes' : 'Add Milestone'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
