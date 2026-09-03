import React, { useState } from 'react';
import { useSalaryStructures, useCreateSalaryStructure, useUpdateSalaryStructure, useSalaryComponents } from '@/features/company/hooks/use-compensation-queries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit2, Loader2, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

export default function SalaryStructuresPage() {
  const { data: structures, isLoading } = useSalaryStructures();
  const { data: components } = useSalaryComponents();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStructure, setEditingStructure] = useState<any>(null);

  // Form State for items
  const [items, setItems] = useState<any[]>([]);

  const createMutation = useCreateSalaryStructure();
  const updateMutation = useUpdateSalaryStructure();

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error('Add at least one salary component to the structure');
      return;
    }
    
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      isActive: formData.get('isActive') === 'on',
      items: items.map(i => ({
        componentId: i.componentId,
        calculationType: i.calculationType,
        value: Number(i.value),
        percentageBase: i.percentageBase || undefined,
        formula: i.formula || undefined
      })),
    };

    try {
      if (editingStructure) {
        await updateMutation.mutateAsync({ id: editingStructure.id, data });
        toast.success('Salary structure updated successfully');
      } else {
        await createMutation.mutateAsync(data);
        toast.success('Salary structure created successfully');
      }
      setIsModalOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save structure');
    }
  };

  const openEdit = (struct: any) => {
    setEditingStructure(struct);
    setItems(struct.items || []);
    setIsModalOpen(true);
  };

  const openCreate = () => {
    setEditingStructure(null);
    setItems([]);
    setIsModalOpen(true);
  };

  const addItem = () => {
    setItems([...items, { componentId: '', calculationType: 'FIXED', value: 0 }]);
  };
  
  const updateItem = (index: number, field: string, val: any) => {
    const newItems = [...items];
    newItems[index][field] = val;
    setItems(newItems);
  };
  
  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Salary Structures</h1>
          <p className="text-muted-foreground mt-1">
            Build and manage reusable compensation templates.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          Create Structure
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-10 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : structures?.length === 0 ? (
          <div className="col-span-full text-center py-10 text-muted-foreground border rounded-lg bg-card">
            No structures found. Create your first salary structure.
          </div>
        ) : (
          structures?.map((struct: any) => (
            <Card key={struct.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{struct.name}</CardTitle>
                    {struct.description && <p className="text-sm text-muted-foreground mt-1">{struct.description}</p>}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(struct)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Components ({struct.items.length})</p>
                  <div className="flex flex-wrap gap-2">
                    {struct.items.map((item: any) => (
                      <span key={item.id} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-secondary text-secondary-foreground border">
                        {item.component.code} 
                        {item.calculationType === 'PERCENTAGE' ? ` (${item.value}%)` : ''}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingStructure ? 'Edit Structure' : 'New Structure'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Structure Name</Label>
                <Input id="name" name="name" required defaultValue={editingStructure?.name} placeholder="e.g. Director Band" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" name="description" defaultValue={editingStructure?.description} placeholder="Optional notes" />
              </div>
            </div>

            <div className="space-y-4 border-t pt-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">Structure Components</h3>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="w-4 h-4 mr-2" /> Add Row
                </Button>
              </div>

              {items.length === 0 ? (
                <div className="text-center py-6 border border-dashed rounded-lg text-sm text-muted-foreground">
                  No components added. Click 'Add Row' to start building.
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div key={index} className="flex gap-3 items-start border p-3 rounded-lg bg-muted/20">
                      <div className="flex-1 space-y-2">
                        <Label className="text-xs">Component</Label>
                        <Select 
                          value={item.componentId} 
                          onValueChange={(val) => updateItem(index, 'componentId', val)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Component" />
                          </SelectTrigger>
                          <SelectContent>
                            {components?.map((c: any) => (
                              <SelectItem key={c.id} value={c.id}>{c.name} ({c.code})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="w-40 space-y-2">
                        <Label className="text-xs">Calculation</Label>
                        <Select 
                          value={item.calculationType} 
                          onValueChange={(val) => updateItem(index, 'calculationType', val)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="FIXED">Fixed Amount</SelectItem>
                            <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="w-32 space-y-2">
                        <Label className="text-xs">{item.calculationType === 'PERCENTAGE' ? 'Percentage %' : 'Value (optional)'}</Label>
                        <Input 
                          type="number" 
                          step="0.01" 
                          min="0"
                          value={item.value} 
                          onChange={(e) => updateItem(index, 'value', e.target.value)} 
                        />
                      </div>

                      {item.calculationType === 'PERCENTAGE' && (
                        <div className="flex-1 space-y-2">
                          <Label className="text-xs">Base Component Code</Label>
                          <Input 
                            placeholder="e.g. BASIC" 
                            value={item.percentageBase || ''} 
                            onChange={(e) => updateItem(index, 'percentageBase', e.target.value)} 
                            className="uppercase"
                          />
                        </div>
                      )}

                      <div className="pt-7">
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)} className="text-red-500 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2 border-t pt-4">
              <Switch id="isActive" name="isActive" defaultChecked={editingStructure ? editingStructure.isActive : true} />
              <Label htmlFor="isActive">Active Status</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Structure
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
