import { useState, useEffect } from 'react';
import { useCreateBudgetRequest, useUpdateBudgetRequest, useBudgetCategories, useCostCenters, BudgetRequest } from '@/features/budgets/budgets.service';
import { useProjects } from '@/features/projects/projects.service';
import { useEmployees } from '@/features/company/hooks/use-employee-queries';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCurrency } from '@/hooks/use-currency';

interface BudgetRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: BudgetRequest | null;
}

export function BudgetRequestModal({ isOpen, onClose, initialData }: BudgetRequestModalProps) {
  const { currencySymbol } = useCurrency();
  const [requestType, setRequestType] = useState('NEW_PROJECT');
  const [priority, setPriority] = useState('MEDIUM');
  const [projectId, setProjectId] = useState('');
  const [costCenterId, setCostCenterId] = useState('');
  const [objective, setObjective] = useState('');
  const [businessJustification, setBusinessJustification] = useState('');
  
  const [lineItems, setLineItems] = useState([
    { description: '', quantity: 1, unitCost: 0, capexOpex: 'OPEX', categoryId: '' }
  ]);
  const [members, setMembers] = useState<{employeeId: string, accessLevel: string}[]>([]);

  const { data: projects } = useProjects();
  const { data: categories } = useBudgetCategories();
  const { data: costCenters } = useCostCenters();
  const { data: employees } = useEmployees();
  
  const createMutation = useCreateBudgetRequest();
  const updateMutation = useUpdateBudgetRequest();

  useEffect(() => {
    if (initialData) {
      setRequestType(initialData.requestType || 'NEW_PROJECT');
      setPriority(initialData.priority || 'MEDIUM');
      setProjectId(initialData.projectId || '');
      setCostCenterId(initialData.costCenterId || '');
      setObjective(initialData.objective || '');
      setBusinessJustification(initialData.businessJustification || '');
      if (initialData.lineItems && initialData.lineItems.length > 0) {
        setLineItems(initialData.lineItems.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitCost: Number(item.unitCost),
          capexOpex: item.capexOpex || 'OPEX',
          categoryId: item.categoryId || ''
        })));
      } else {
        setLineItems([{ description: '', quantity: 1, unitCost: 0, capexOpex: 'OPEX', categoryId: '' }]);
      }
      if ((initialData as any).members && (initialData as any).members.length > 0) {
        setMembers((initialData as any).members.map((m: any) => ({
          employeeId: m.employeeId,
          accessLevel: m.accessLevel || 'READ_ONLY'
        })));
      } else {
        setMembers([]);
      }
    } else {
      setRequestType('NEW_PROJECT');
      setPriority('MEDIUM');
      setProjectId('');
      setCostCenterId('');
      setObjective('');
      setBusinessJustification('');
      setLineItems([{ description: '', quantity: 1, unitCost: 0, capexOpex: 'OPEX', categoryId: '' }]);
      setMembers([]);
    }
  }, [initialData, isOpen]);

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

  const handleAddMember = () => setMembers([...members, { employeeId: '', accessLevel: 'READ_ONLY' }]);
  const handleRemoveMember = (index: number) => setMembers(members.filter((_, i) => i !== index));
  const handleMemberChange = (index: number, field: string, value: string) => {
    const newMembers = [...members];
    newMembers[index] = { ...newMembers[index], [field]: value } as any;
    setMembers(newMembers);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    if (lineItems.some(item => !item.description || item.quantity < 1 || item.unitCost < 0)) {
      toast.error('Please ensure all line items have a description, quantity ≥ 1, and cost ≥ 0.');
      return;
    }

    try {
      const sanitizedLineItems = lineItems.map(item => ({
        ...item,
        categoryId: (!item.categoryId || item.categoryId === 'NONE') ? undefined : item.categoryId
      }));

      const payload = {
        requestType,
        priority,
        projectId: (!projectId || projectId === 'NONE') ? undefined : projectId,
        costCenterId: (!costCenterId || costCenterId === 'NONE') ? undefined : costCenterId,
        objective,
        businessJustification,
        lineItems: sanitizedLineItems,
        members: members.filter(m => m.employeeId !== '') as { employeeId: string; accessLevel: string }[]
      };

      if (initialData?.id) {
        await updateMutation.mutateAsync({ id: initialData.id, data: payload });
        toast.success('Budget request updated successfully');
      } else {
        await createMutation.mutateAsync(payload);
        toast.success('Budget request created as draft');
      }
      
      onClose();
    } catch (error: any) {
      toast.error(error?.response?.data?.error?.message || 'Failed to save budget request');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Budget Request' : 'New Budget Request'}</DialogTitle>
          <DialogDescription>
            {initialData ? 'Update draft budget request details before submitting.' : 'Create a new budget request draft.'}
          </DialogDescription>
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
                  <Input type="number" min={1} required className="h-9" value={item.quantity} onChange={(e) => handleLineItemChange(index, 'quantity', parseInt(e.target.value) || 1)} />
                </div>
                
                <div className="col-span-6 md:col-span-2 space-y-1">
                  <Label className="text-xs">Unit Cost ({currencySymbol})</Label>
                  <Input type="number" min={0} required className="h-9" value={item.unitCost} onChange={(e) => handleLineItemChange(index, 'unitCost', parseFloat(e.target.value) || 0)} />
                </div>
                
                <div className="col-span-2 md:col-span-1 flex justify-end mt-6">
                  <Button type="button" variant="ghost" size="icon" className="text-red-500 h-9 w-9" onClick={() => handleRemoveLineItem(index)} disabled={lineItems.length === 1}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4 pt-2">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-sm font-semibold">Budget Members</h3>
              <Button type="button" variant="outline" size="sm" onClick={handleAddMember}>
                <Plus className="h-4 w-4 mr-2" /> Add Member
              </Button>
            </div>
            
            {members.map((member, index) => (
              <div key={index} className="grid grid-cols-12 gap-3 items-start bg-muted/50 p-3 rounded-md border">
                <div className="col-span-12 md:col-span-6 space-y-1">
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
                
                <div className="col-span-10 md:col-span-4 space-y-1">
                  <Label className="text-xs">Access Level</Label>
                  <Select value={member.accessLevel} onValueChange={(val) => handleMemberChange(index, 'accessLevel', val)}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="READ_ONLY">Read Only</SelectItem>
                      <SelectItem value="READ_WRITE">Read/Write</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="col-span-2 md:col-span-2 flex justify-end mt-6">
                  <Button type="button" variant="ghost" size="icon" className="text-red-500 h-9 w-9" onClick={() => handleRemoveMember(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : initialData ? 'Save Changes' : 'Save as Draft'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
