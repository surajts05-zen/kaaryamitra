import React, { useState } from 'react';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useHelpdeskCategories, useCreateHelpdeskCategory, useUpdateHelpdeskCategory, useDeleteHelpdeskCategory } from '@/features/company/hooks/use-helpdesk-queries';

export function HelpdeskSettingsPage() {
  const { data: categories, isLoading } = useHelpdeskCategories();
  const createMutation = useCreateHelpdeskCategory();
  const updateMutation = useUpdateHelpdeskCategory();
  const deleteMutation = useDeleteHelpdeskCategory();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    slaLowHours: 72,
    slaMediumHours: 48,
    slaHighHours: 24,
    slaUrgentHours: 4,
  });

  const handleOpenModal = (category: any = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description || '',
        slaLowHours: category.slaLowHours,
        slaMediumHours: category.slaMediumHours,
        slaHighHours: category.slaHighHours,
        slaUrgentHours: category.slaUrgentHours,
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        description: '',
        slaLowHours: 72,
        slaMediumHours: 48,
        slaHighHours: 24,
        slaUrgentHours: 4,
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    const payload = {
      ...formData,
      slaLowHours: Number(formData.slaLowHours),
      slaMediumHours: Number(formData.slaMediumHours),
      slaHighHours: Number(formData.slaHighHours),
      slaUrgentHours: Number(formData.slaUrgentHours),
    };

    if (editingCategory) {
      updateMutation.mutate(
        { id: editingCategory.id, ...payload },
        { onSuccess: () => setIsModalOpen(false) }
      );
    } else {
      createMutation.mutate(payload, { onSuccess: () => setIsModalOpen(false) });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this category? Tickets using it might prevent deletion.')) {
      deleteMutation.mutate(id, {
        onError: (err: any) => alert(err.response?.data?.error?.message || 'Failed to delete category')
      });
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Settings', path: 'settings' },
          { label: 'Helpdesk Categories' },
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Helpdesk Categories</h2>
          <p className="text-muted-foreground">Manage support categories and SLA timeouts</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="mr-2 h-4 w-4" /> Add Category
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
          <CardDescription>Default SLAs for tickets (in hours)</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Low SLA</TableHead>
                  <TableHead>Medium SLA</TableHead>
                  <TableHead>High SLA</TableHead>
                  <TableHead>Urgent SLA</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories?.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center">No categories found.</TableCell></TableRow>
                ) : (
                  categories?.map((cat: any) => (
                    <TableRow key={cat.id}>
                      <TableCell className="font-medium">{cat.name}</TableCell>
                      <TableCell>{cat.description}</TableCell>
                      <TableCell>{cat.slaLowHours}h</TableCell>
                      <TableCell>{cat.slaMediumHours}h</TableCell>
                      <TableCell>{cat.slaHighHours}h</TableCell>
                      <TableCell>{cat.slaUrgentHours}h</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenModal(cat)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(cat.id)} className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Edit Category' : 'New Category'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Category Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. IT Support"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Low Priority SLA (hrs)</Label>
                <Input
                  type="number"
                  value={formData.slaLowHours}
                  onChange={(e) => setFormData({ ...formData, slaLowHours: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Medium Priority SLA (hrs)</Label>
                <Input
                  type="number"
                  value={formData.slaMediumHours}
                  onChange={(e) => setFormData({ ...formData, slaMediumHours: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>High Priority SLA (hrs)</Label>
                <Input
                  type="number"
                  value={formData.slaHighHours}
                  onChange={(e) => setFormData({ ...formData, slaHighHours: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Urgent SLA (hrs)</Label>
                <Input
                  type="number"
                  value={formData.slaUrgentHours}
                  onChange={(e) => setFormData({ ...formData, slaUrgentHours: parseInt(e.target.value) })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleSave} 
              disabled={!formData.name || createMutation.isPending || updateMutation.isPending}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
