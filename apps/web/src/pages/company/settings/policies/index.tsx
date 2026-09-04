import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FileText, Plus, Folder, Clock, CheckCircle, Edit3, Trash2, Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm as useRHForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  useAdminPolicies,
  usePolicyCategories,
  useCreatePolicy,
  useCreatePolicyCategory,
  useUpdatePolicyCategory,
  useDeletePolicyCategory,
  useSeedPolicyTemplates
} from '@/features/company/hooks/use-policies-queries';
import { Loader2 } from 'lucide-react';

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional()
});

const policySchema = z.object({
  categoryId: z.string().min(1, 'Category is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  requiresAck: z.boolean().default(false)
});

export function PoliciesAdminList() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { data: policies, isLoading: isLoadingPolicies } = useAdminPolicies();
  const { data: categories, isLoading: isLoadingCategories } = usePolicyCategories();
  
  const createPolicy = useCreatePolicy();
  const createCategory = useCreatePolicyCategory();
  const updateCategory = useUpdatePolicyCategory();
  const deleteCategory = useDeletePolicyCategory();
  const seedTemplates = useSeedPolicyTemplates();

  const [categoryOpen, setCategoryOpen] = useState(false);
  const [policyOpen, setPolicyOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);

  const categoryForm = useRHForm<z.infer<typeof categorySchema>>({
    resolver: zodResolver(categorySchema)
  });

  const policyForm = useRHForm<z.infer<typeof policySchema>>({
    resolver: zodResolver(policySchema),
    defaultValues: { requiresAck: false }
  });

  const onCategorySubmit = async (data: z.infer<typeof categorySchema>) => {
    try {
      const payload: any = { ...data };
      if (!payload.description) delete payload.description;
      
      if (editingCategory) {
        await updateCategory.mutateAsync({ id: editingCategory.id, data: payload });
        toast.success('Category updated successfully');
      } else {
        await createCategory.mutateAsync(payload);
        toast.success('Category created successfully');
      }
      setCategoryOpen(false);
      setEditingCategory(null);
      categoryForm.reset();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save category');
    }
  };

  const handleEditCategory = (cat: any) => {
    setEditingCategory(cat);
    categoryForm.setValue('name', cat.name);
    categoryForm.setValue('description', cat.description || '');
    setCategoryOpen(true);
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      await deleteCategory.mutateAsync(id);
      toast.success('Category deleted successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete category');
    }
  };

  const handleSeedTemplates = async () => {
    try {
      await seedTemplates.mutateAsync();
      toast.success('Standard policy templates generated!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to generate templates');
    }
  };

  const onPolicySubmit = async (data: z.infer<typeof policySchema>) => {
    try {
      const payload: any = { ...data };
      if (!payload.description) delete payload.description;
      const res = await createPolicy.mutateAsync(payload);
      toast.success('Policy created successfully');
      setPolicyOpen(false);
      policyForm.reset();
      navigate(`/t/${slug}/settings/policies/${res.id}/edit`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create policy');
    }
  };

  if (isLoadingPolicies || isLoadingCategories) {
    return <div className="p-10 flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Policies & Handbook</h1>
          <p className="text-muted-foreground mt-1">Manage company policies, versions, categories, and employee acknowledgements.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={handleSeedTemplates}
            disabled={seedTemplates.isPending}
            title="Generate standard policies for all categories"
          >
            {seedTemplates.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2 text-primary" />}
            Seed Standard Handbooks
          </Button>

          <Dialog open={categoryOpen} onOpenChange={(val) => { setCategoryOpen(val); if (!val) { setEditingCategory(null); categoryForm.reset(); } }}>
            <DialogTrigger asChild>
              <Button variant="outline"><Folder className="w-4 h-4 mr-2" /> Manage Categories</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingCategory ? 'Edit Category' : 'Manage Policy Categories'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={categoryForm.handleSubmit(onCategorySubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label>Category Name</Label>
                  <Input {...categoryForm.register('name')} placeholder="e.g. Code of Conduct & Ethics" />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input {...categoryForm.register('description')} placeholder="Short description..." />
                </div>
                <div className="flex gap-2">
                  {editingCategory && (
                    <Button type="button" variant="outline" className="w-1/2" onClick={() => { setEditingCategory(null); categoryForm.reset(); }}>
                      Cancel Edit
                    </Button>
                  )}
                  <Button type="submit" className={editingCategory ? 'w-1/2' : 'w-full'} disabled={createCategory.isPending || updateCategory.isPending}>
                    {(createCategory.isPending || updateCategory.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {editingCategory ? 'Save Changes' : 'Create Category'}
                  </Button>
                </div>
              </form>

              {!editingCategory && categories && categories.length > 0 && (
                <div className="mt-4 pt-4 border-t space-y-2 max-h-60 overflow-y-auto">
                  <Label className="text-xs font-semibold uppercase text-muted-foreground">Existing Categories</Label>
                  {categories.map((cat: any) => (
                    <div key={cat.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 text-sm">
                      <div>
                        <span className="font-medium">{cat.name}</span>
                        {cat._count?.policies !== undefined && (
                          <span className="text-xs text-muted-foreground ml-2">({cat._count.policies} policies)</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleEditCategory(cat)}>
                          <Edit3 className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDeleteCategory(cat.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </DialogContent>
          </Dialog>

          <Dialog open={policyOpen} onOpenChange={setPolicyOpen}>
            <DialogTrigger asChild>
              <Button><FileText className="w-4 h-4 mr-2" /> New Policy</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Policy</DialogTitle>
              </DialogHeader>
              <form onSubmit={policyForm.handleSubmit(onPolicySubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select onValueChange={(val) => policyForm.setValue('categoryId', val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories?.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input {...policyForm.register('title')} placeholder="e.g. Remote Work & Flexible Hours Policy" />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input {...policyForm.register('description')} placeholder="Short summary of this policy..." />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label>Require Acknowledgement</Label>
                    <p className="text-sm text-muted-foreground">Employees must read and acknowledge this policy</p>
                  </div>
                  <Switch
                    checked={policyForm.watch('requiresAck')}
                    onCheckedChange={(val) => policyForm.setValue('requiresAck', val)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={createPolicy.isPending}>
                  {createPolicy.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Create Policy & Open Editor
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {categories?.map((category: any) => {
          const catPolicies = policies?.filter((p: any) => p.categoryId === category.id) || [];

          return (
            <div key={category.id} className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <div>
                  <h2 className="text-xl font-semibold flex items-center">
                    <Folder className="w-5 h-5 mr-2 text-primary" /> {category.name}
                  </h2>
                  {category.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{category.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" onClick={() => handleEditCategory(category)}>
                    <Edit3 className="w-3.5 h-3.5 mr-1" /> Edit Category
                  </Button>
                </div>
              </div>

              {catPolicies.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {catPolicies.map((policy: any) => (
                    <Card key={policy.id} className="flex flex-col hover:border-primary/50 transition-colors shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">{policy.title}</CardTitle>
                        {policy.description && <CardDescription className="line-clamp-2">{policy.description}</CardDescription>}
                      </CardHeader>
                      <CardContent className="flex-1 flex flex-col justify-end">
                        <div className="flex items-center justify-between text-sm text-muted-foreground mt-4 mb-4">
                          <div className="flex items-center gap-1.5">
                            {policy.isPublished ? (
                              <><CheckCircle className="w-4 h-4 text-green-500" /> Published</>
                            ) : (
                              <><Clock className="w-4 h-4 text-amber-500" /> Draft</>
                            )}
                          </div>
                          {policy.versions?.[0] && (
                            <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">v{policy.versions[0].versionNumber}</span>
                          )}
                        </div>
                        <Button variant="secondary" className="w-full" asChild>
                          <Link to={`/t/${slug}/settings/policies/${policy.id}/edit`}>
                            Manage & Edit Policy
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic py-2">No policies in this category yet.</p>
              )}
            </div>
          );
        })}

        {policies?.length === 0 && (
          <div className="text-center py-20 border-2 border-dashed rounded-xl text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium">No policies created yet</p>
            <p className="text-sm mb-4">Click "Seed Standard Handbooks" above to instantly generate policies for all categories.</p>
            <Button onClick={handleSeedTemplates} disabled={seedTemplates.isPending}>
              {seedTemplates.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Generate Standard Handbooks
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

