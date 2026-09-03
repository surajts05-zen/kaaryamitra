import React, { useState } from 'react';
import { useStatutoryRules, useCreateStatutoryRule, useUpdateStatutoryRule } from '@/features/company/hooks/use-payroll-queries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plus, Loader2, Edit2, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

export function StatutorySettingsPage() {
  const { data: rules, isLoading } = useStatutoryRules();
  const createMutation = useCreateStatutoryRule();
  const updateMutation = useUpdateStatutoryRule();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      countryCode: (formData.get('countryCode') as string) || 'IN',
      name: formData.get('name') as string,
      code: formData.get('code') as string,
      type: formData.get('type') as string,
      baseComponent: (formData.get('baseComponent') as string) || null,
      rateOrAmount: Number(formData.get('rateOrAmount')),
      cappedAt: formData.get('cappedAt') ? Number(formData.get('cappedAt')) : null,
      effectiveFrom: (formData.get('effectiveFrom') as string) || new Date().toISOString(),
      isActive: formData.get('isActive') === 'on',
    };

    try {
      if (editingRule) {
        await updateMutation.mutateAsync({ id: editingRule.id, data });
        toast.success('Statutory rule updated successfully');
      } else {
        await createMutation.mutateAsync(data);
        toast.success('Statutory rule created successfully');
      }
      setIsModalOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save statutory rule');
    }
  };

  const openCreate = () => {
    setEditingRule(null);
    setIsModalOpen(true);
  };

  const openEdit = (rule: any) => {
    setEditingRule(rule);
    setIsModalOpen(true);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Statutory Compliances</h1>
          <p className="text-muted-foreground mt-1">
            Configure local tax rules, PF, ESI, and other compliance deductions for payroll.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Compliance Rule
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-primary" /> Active Rules
          </CardTitle>
          <CardDescription>Rules that will be automatically applied during payroll execution.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Country</TableHead>
                <TableHead>Rule Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Rate / Amount</TableHead>
                <TableHead>Capped At</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : rules?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                    No statutory rules defined.
                  </TableCell>
                </TableRow>
              ) : (
                rules?.map((rule: any) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium">{rule.countryCode}</TableCell>
                    <TableCell>{rule.name}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                        {rule.code}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{rule.type}</TableCell>
                    <TableCell>{rule.rateOrAmount}</TableCell>
                    <TableCell>{rule.cappedAt || 'No Cap'}</TableCell>
                    <TableCell>
                      {rule.isActive ? (
                        <span className="text-green-600 font-medium text-sm">Active</span>
                      ) : (
                        <span className="text-muted-foreground font-medium text-sm">Inactive</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(rule)}>
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
            <DialogTitle>{editingRule ? 'Edit Statutory Rule' : 'New Statutory Rule'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Country Code</Label>
                <Input name="countryCode" required defaultValue={editingRule?.countryCode || 'IN'} placeholder="e.g. IN" className="uppercase" />
              </div>
              <div className="space-y-2">
                <Label>Rule Code</Label>
                <Input name="code" required defaultValue={editingRule?.code || 'PF_EMP'} placeholder="e.g. PF_EMP, PT_KA" className="uppercase" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Rule Name</Label>
              <Input name="name" required defaultValue={editingRule?.name || ''} placeholder="e.g. Provident Fund (Employee)" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Rule Type</Label>
                <Select name="type" defaultValue={editingRule?.type || 'PERCENTAGE_OF_COMPONENT'}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE_OF_COMPONENT">Percentage of Base Component</SelectItem>
                    <SelectItem value="FIXED_SLAB">Fixed Slab Amount</SelectItem>
                    <SelectItem value="CUSTOM_FORMULA">Custom Formula</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Base Component Code</Label>
                <Input name="baseComponent" defaultValue={editingRule?.baseComponent || 'BASIC'} placeholder="e.g. BASIC" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Rate / Amount</Label>
                <Input type="number" step="0.01" name="rateOrAmount" required defaultValue={editingRule?.rateOrAmount || 12} />
              </div>
              <div className="space-y-2">
                <Label>Capped At (Optional)</Label>
                <Input type="number" name="cappedAt" defaultValue={editingRule?.cappedAt || ''} placeholder="e.g. 15000" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Effective From Date</Label>
              <Input type="date" name="effectiveFrom" required defaultValue={editingRule?.effectiveFrom ? new Date(editingRule.effectiveFrom).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]} />
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Switch id="isActive" name="isActive" defaultChecked={editingRule ? editingRule.isActive : true} />
              <Label htmlFor="isActive">Active Status</Label>
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Rule
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
