import React, { useState } from 'react';
import { 
  useSalaryComponents, 
  useCreateSalaryComponent, 
  useUpdateSalaryComponent,
  useSeedDefaultSalaryComponents
} from '@/features/company/hooks/use-compensation-queries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit2, Loader2, Sparkles } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

export default function SalaryComponentsPage() {
  const { data: components, isLoading } = useSalaryComponents();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState<any>(null);

  const createMutation = useCreateSalaryComponent();
  const updateMutation = useUpdateSalaryComponent();
  const seedMutation = useSeedDefaultSalaryComponents();

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      code: formData.get('code') as string,
      type: formData.get('type') as string,
      frequency: formData.get('frequency') as string,
      isTaxable: formData.get('isTaxable') === 'on',
      isActive: formData.get('isActive') === 'on',
      description: formData.get('description') as string,
    };

    try {
      if (editingComponent) {
        await updateMutation.mutateAsync({ id: editingComponent.id, data });
        toast.success('Salary component updated successfully');
      } else {
        await createMutation.mutateAsync(data);
        toast.success('Salary component created successfully');
      }
      setIsModalOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save component');
    }
  };

  const handleSeedDefaults = async () => {
    try {
      const res = await seedMutation.mutateAsync();
      toast.success(res.message || 'Standard Indian components added successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load standard components');
    }
  };

  const openEdit = (comp: any) => {
    setEditingComponent(comp);
    setIsModalOpen(true);
  };

  const openCreate = () => {
    setEditingComponent(null);
    setIsModalOpen(true);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Salary Components</h1>
          <p className="text-muted-foreground mt-1">
            Manage reusable earning and deduction components for salary structures.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={handleSeedDefaults} 
            disabled={seedMutation.isPending}
            className="gap-2 border-primary/30 text-primary hover:bg-primary/5"
          >
            {seedMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-primary" />}
            Load Standard Indian Components
          </Button>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Component
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Taxable</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : components?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    <div className="space-y-3">
                      <p>No components found. You can add one manually or load the standard Indian template.</p>
                      <Button variant="outline" size="sm" onClick={handleSeedDefaults} disabled={seedMutation.isPending} className="gap-2">
                        <Sparkles className="w-4 h-4 text-primary" /> Load Standard Indian Components
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                components?.map((comp: any) => (
                  <TableRow key={comp.id}>
                    <TableCell className="font-medium">{comp.code}</TableCell>
                    <TableCell>{comp.name}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                        {comp.type.replace('_', ' ')}
                      </span>
                    </TableCell>
                    <TableCell>{comp.frequency}</TableCell>
                    <TableCell>{comp.isTaxable ? 'Yes' : 'No'}</TableCell>
                    <TableCell>
                      {comp.isActive ? (
                        <span className="text-green-600 font-medium text-sm">Active</span>
                      ) : (
                        <span className="text-muted-foreground font-medium text-sm">Inactive</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(comp)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingComponent ? 'Edit Component' : 'New Component'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Component Name</Label>
                <Input id="name" name="name" required defaultValue={editingComponent?.name} placeholder="e.g. Basic Salary" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Component Code</Label>
                <Input id="code" name="code" required defaultValue={editingComponent?.code} placeholder="e.g. BASIC" className="uppercase" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select name="type" defaultValue={editingComponent?.type || 'EARNING'} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EARNING">Earning</SelectItem>
                    <SelectItem value="DEDUCTION">Deduction</SelectItem>
                    <SelectItem value="EMPLOYER_CONTRIBUTION">Employer Contribution</SelectItem>
                    <SelectItem value="EMPLOYEE_CONTRIBUTION">Employee Contribution</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="frequency">Frequency</Label>
                <Select name="frequency" defaultValue={editingComponent?.frequency || 'MONTHLY'} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                    <SelectItem value="ANNUAL">Annual</SelectItem>
                    <SelectItem value="ONE_TIME">One Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" name="description" defaultValue={editingComponent?.description} placeholder="Optional notes" />
            </div>

            <div className="flex gap-6 py-2">
              <div className="flex items-center space-x-2">
                <Switch id="isTaxable" name="isTaxable" defaultChecked={editingComponent ? editingComponent.isTaxable : true} />
                <Label htmlFor="isTaxable">Taxable Component</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="isActive" name="isActive" defaultChecked={editingComponent ? editingComponent.isActive : true} />
                <Label htmlFor="isActive">Active Status</Label>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Component
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
