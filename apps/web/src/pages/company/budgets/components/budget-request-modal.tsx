import { useState } from 'react';
import { useCreateBudgetRequest, useBudgetCategories, useCostCenters } from '@/features/budgets/budgets.service';
import { useProjects } from '@/features/projects/projects.service';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface BudgetRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BudgetRequestModal({ isOpen, onClose }: BudgetRequestModalProps) {
  const [requestType, setRequestType] = useState('NEW_PROJECT');
  const [priority, setPriority] = useState('MEDIUM');
  const [projectId, setProjectId] = useState('');
  const [costCenterId, setCostCenterId] = useState('');
  const [objective, setObjective] = useState('');
  const [businessJustification, setBusinessJustification] = useState('');
  
  const [lineItems, setLineItems] = useState([
    { description: '', quantity: 1, unitCost: 0, capexOpex: 'OPEX', categoryId: '' }
  ]);

  const { data: projects } = useProjects();
  const { data: categories } = useBudgetCategories();
  const { data: costCenters } = useCostCenters();
  
  const createMutation = useCreateBudgetRequest();

  const handleAddLineItem = () => {
    setLineItems([...lineItems, { description: '', quantity: 1, unitCost: 0, capexOpex: 'OPEX', categoryId: '' }]);
  };

  const handleRemoveLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  const handleLineItemChange = (index: number, field: keyof typeof lineItems[0], value: any) => {
    const newItems = [...lineItems];
    newItems[index] = { ...newItems[index], [field]: value } as typeof lineItems[0];
    setLineItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    if (lineItems.some(item => !item.description || item.quantity < 1 || item.unitCost < 0)) {
      toast.error('Please ensure all line items have a description, quantity ≥ 1, and cost ≥ 0.');
      return;
    }

    try {
      await createMutation.mutateAsync({
        requestType,
        priority,
        projectId: projectId || undefined,
        costCenterId: costCenterId || undefined,
        objective,
        businessJustification,
        lineItems
      });
      
      toast.success('Budget request submitted successfully');
      onClose();
    } catch (error: any) {
      toast.error(error?.response?.data?.error?.message || 'Failed to submit budget request');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Budget Request</DialogTitle>
          <DialogDescription>Submit a new budget request for approval.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Request Type</Label>
              <Select value={requestType} onValueChange={setRequestType}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="NEW_PROJECT">New Project</SelectItem>
                  <SelectItem value="REVISION">Budget Revision</SelectItem>
                  <SelectItem value="OPERATIONAL">Operational</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Project (Optional)</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">None</SelectItem>
                  {projects?.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cost Center (Optional)</Label>
              <Select value={costCenterId} onValueChange={setCostCenterId}>
                <SelectTrigger><SelectValue placeholder="Select cost center" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">None</SelectItem>
                  {costCenters?.map((cc) => (
                    <SelectItem key={cc.id} value={cc.id}>{cc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Objective</Label>
            <Input value={objective} onChange={(e) => setObjective(e.target.value)} placeholder="Brief objective of this request" />
          </div>

          <div className="space-y-2">
            <Label>Business Justification</Label>
            <Textarea value={businessJustification} onChange={(e) => setBusinessJustification(e.target.value)} placeholder="Why is this budget needed?" />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-sm font-semibold">Line Items</h3>
              <Button type="button" variant="outline" size="sm" onClick={handleAddLineItem}>
                <Plus className="h-4 w-4 mr-2" /> Add Item
              </Button>
            </div>

            {lineItems.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-3 items-start bg-muted/50 dark:bg-muted/20 p-3 rounded-md border">
                <div className="col-span-12 md:col-span-4 space-y-1">
                  <Label className="text-xs">Description</Label>
                  <Input size={1} required value={item.description} onChange={(e) => handleLineItemChange(index, 'description', e.target.value)} />
                </div>
                
                <div className="col-span-6 md:col-span-2 space-y-1">
                  <Label className="text-xs">Category</Label>
                  <Select value={item.categoryId} onValueChange={(val) => handleLineItemChange(index, 'categoryId', val)}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Cat" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">None</SelectItem>
                      {categories?.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="col-span-6 md:col-span-2 space-y-1">
                  <Label className="text-xs">Type</Label>
                  <Select value={item.capexOpex} onValueChange={(val) => handleLineItemChange(index, 'capexOpex', val)}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OPEX">OPEX</SelectItem>
                      <SelectItem value="CAPEX">CAPEX</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-4 md:col-span-1 space-y-1">
                  <Label className="text-xs">Qty</Label>
                  <Input type="number" min={1} required className="h-9" value={item.quantity} onChange={(e) => handleLineItemChange(index, 'quantity', parseInt(e.target.value))} />
                </div>
                
                <div className="col-span-6 md:col-span-2 space-y-1">
                  <Label className="text-xs">Unit Cost (₹)</Label>
                  <Input type="number" min={0} required className="h-9" value={item.unitCost} onChange={(e) => handleLineItemChange(index, 'unitCost', parseFloat(e.target.value))} />
                </div>
                
                <div className="col-span-2 md:col-span-1 flex justify-end mt-6">
                  <Button type="button" variant="ghost" size="icon" className="text-red-500 h-9 w-9" onClick={() => handleRemoveLineItem(index)} disabled={lineItems.length === 1}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Saving...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
