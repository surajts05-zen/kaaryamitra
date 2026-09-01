import React, { useState } from 'react';
import { Plus, Trash2, Edit } from 'lucide-react';
import {
  useDocumentCategories,
  useCreateDocumentCategory,
  useUpdateDocumentCategory,
  useDeleteDocumentCategory,
} from '@/features/company/hooks/use-documents-queries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';

export function DocumentSettings() {
  const { data: categories = [], isLoading } = useDocumentCategories();
  const createCategory = useCreateDocumentCategory();
  const updateCategory = useUpdateDocumentCategory();
  const deleteCategory = useDeleteDocumentCategory();

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isRequired, setIsRequired] = useState(false);

  const handleOpenNew = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setIsRequired(false);
    setIsOpen(true);
  };

  const handleOpenEdit = (cat: any) => {
    setEditingId(cat.id);
    setName(cat.name);
    setDescription(cat.description || '');
    setIsRequired(cat.isRequired);
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    if (editingId) {
      await updateCategory.mutateAsync({ id: editingId, data: { name, description, isRequired } });
    } else {
      await createCategory.mutateAsync({ name, description, isRequired });
    }
    setIsOpen(false);
    setName('');
    setDescription('');
    setIsRequired(false);
    setEditingId(null);
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Document Categories</h2>
          <p className="text-sm text-muted-foreground">
            Manage the types of documents employees can upload.
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <Button onClick={handleOpenNew}>
            <Plus className="h-4 w-4 mr-2" /> Add Category
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Document Category' : 'Add Document Category'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Category Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Identity Proof" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional details..." />
              </div>
              <div className="flex items-center justify-between">
                <Label>Required for Onboarding</Label>
                <Switch checked={isRequired} onCheckedChange={setIsRequired} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={createCategory.isPending || updateCategory.isPending}>
                {(createCategory.isPending || updateCategory.isPending) ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Required</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  No categories defined.
                </TableCell>
              </TableRow>
            ) : (
              categories.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell className="font-medium">{cat.name}</TableCell>
                  <TableCell>{cat.description}</TableCell>
                  <TableCell>{cat.isRequired ? 'Yes' : 'No'}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEdit(cat)}
                      className="text-muted-foreground hover:text-primary mr-2"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this category?')) {
                          deleteCategory.mutate(cat.id);
                        }
                      }}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default DocumentSettings;
