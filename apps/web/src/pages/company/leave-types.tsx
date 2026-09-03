import React, { useState } from 'react';
import { useLeaveTypes, useCreateLeaveType, useUpdateLeaveType } from '@/features/leave/leave.service';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Settings2, CheckCircle2, XCircle, CalendarDays } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function LeaveTypesPage() {
  const { data: leaveTypes, isLoading } = useLeaveTypes();
  const createMutation = useCreateLeaveType();
  const updateMutation = useUpdateLeaveType();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    daysPerYear: 0,
    isPaid: true,
    accrualFrequency: 'YEARLY' as 'YEARLY' | 'MONTHLY',
    isCarryForwardAllowed: false,
    maxCarryForward: 0,
    isActive: true,
  });

  const handleOpenNew = () => {
    setEditingId(null);
    setFormData({
      name: '',
      code: '',
      daysPerYear: 0,
      isPaid: true,
      accrualFrequency: 'YEARLY',
      isCarryForwardAllowed: false,
      maxCarryForward: 0,
      isActive: true,
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (lt: any) => {
    setEditingId(lt.id);
    setFormData({
      name: lt.name,
      code: lt.code,
      daysPerYear: lt.daysPerYear,
      isPaid: lt.isPaid,
      accrualFrequency: lt.accrualFrequency,
      isCarryForwardAllowed: lt.isCarryForwardAllowed,
      maxCarryForward: lt.maxCarryForward,
      isActive: lt.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await updateMutation.mutateAsync({ id: editingId, data: formData });
    } else {
      await createMutation.mutateAsync(formData);
    }
    setIsDialogOpen(false);
  };

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <Breadcrumb
        items={[
          { label: 'Settings', path: 'settings' },
          { label: 'Leave Settings' },
        ]}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Leave Policies</h2>
          <p className="text-muted-foreground mt-1">Manage company time-off categories, annual allowances, and carry-forward rules.</p>
        </div>
        <Button onClick={handleOpenNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Leave Type
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 rounded-xl border border-border/60 bg-muted/20 animate-pulse" />
          ))}
        </div>
      ) : !leaveTypes || leaveTypes.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground bg-card">
          <CalendarDays className="mx-auto h-12 w-12 text-muted-foreground/40 mb-3" />
          <h3 className="font-semibold text-lg text-foreground mb-1">No Leave Types Configured</h3>
          <p className="text-sm mb-4">Add leave types (e.g., Casual Leave, Sick Leave, Earned Leave) to start managing employee time-off.</p>
          <Button onClick={handleOpenNew} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" /> Add First Leave Type
          </Button>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {leaveTypes.map((lt) => (
            <Card key={lt.id} className="border-border/60 hover:shadow-md transition-all group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 shrink-0">
                      <CalendarDays className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        {lt.name}
                        {!lt.isActive && (
                          <Badge variant="secondary" className="text-[10px] font-medium">
                            Inactive
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="text-xs font-mono text-muted-foreground mt-0.5">
                        Code: {lt.code}
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenEdit(lt)}
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    title="Edit Policy"
                  >
                    <Settings2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2.5">
                <div className="space-y-2 text-xs pt-1">
                  <div className="flex justify-between border-b border-border/40 pb-2">
                    <span className="text-muted-foreground font-medium">Annual Allowance</span>
                    <span className="font-semibold text-foreground">
                      {lt.daysPerYear} days / {lt.accrualFrequency === 'YEARLY' ? 'year' : 'month'}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-border/40 pb-2">
                    <span className="text-muted-foreground font-medium">Compensation</span>
                    <span className="font-medium flex items-center gap-1.5">
                      {lt.isPaid ? (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] font-medium py-0">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Paid Leave
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-muted text-muted-foreground text-[10px] font-medium py-0">
                          <XCircle className="h-3 w-3 mr-1" /> Unpaid
                        </Badge>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between pt-0.5">
                    <span className="text-muted-foreground font-medium">Carry Forward</span>
                    <span className="font-medium text-foreground">
                      {lt.isCarryForwardAllowed ? `Up to ${lt.maxCarryForward} days` : 'Not allowed'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Leave Policy' : 'Create Leave Type'}</DialogTitle>
              <DialogDescription>
                Configure allowance, accrual rules, and carry forward settings.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Leave Name</Label>
                <Input 
                  id="name" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  placeholder="e.g. Annual Leave" 
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="code">Short Code</Label>
                <Input 
                  id="code" 
                  value={formData.code} 
                  onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} 
                  placeholder="e.g. AL" 
                  required
                  disabled={!!editingId}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="daysPerYear">Allowance (Days)</Label>
                  <Input 
                    id="daysPerYear" 
                    type="number"
                    min="0"
                    step="0.5"
                    value={formData.daysPerYear} 
                    onChange={e => setFormData({...formData, daysPerYear: parseFloat(e.target.value) || 0})} 
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Accrual</Label>
                  <Select 
                    value={formData.accrualFrequency} 
                    onValueChange={(val: any) => setFormData({...formData, accrualFrequency: val})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="YEARLY">Yearly Upfront</SelectItem>
                      <SelectItem value="MONTHLY">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2.5 mt-1">
                <Checkbox 
                  id="isPaid" 
                  checked={formData.isPaid}
                  onCheckedChange={(checked) => setFormData({...formData, isPaid: checked === true})}
                />
                <Label htmlFor="isPaid" className="font-normal cursor-pointer text-sm">Paid Leave (Salaried time-off)</Label>
              </div>

              <div className="flex items-center space-x-2.5 mt-1">
                <Checkbox 
                  id="isCarryForwardAllowed" 
                  checked={formData.isCarryForwardAllowed}
                  onCheckedChange={(checked) => setFormData({...formData, isCarryForwardAllowed: checked === true})}
                />
                <Label htmlFor="isCarryForwardAllowed" className="font-normal cursor-pointer text-sm">Allow Carry Forward to next year</Label>
              </div>

              {formData.isCarryForwardAllowed && (
                <div className="grid gap-2 pl-6 pt-1">
                  <Label htmlFor="maxCarryForward" className="text-xs">Max Carry Forward Days</Label>
                  <Input 
                    id="maxCarryForward" 
                    type="number"
                    min="0"
                    value={formData.maxCarryForward} 
                    onChange={e => setFormData({...formData, maxCarryForward: parseFloat(e.target.value) || 0})} 
                  />
                </div>
              )}

              {editingId && (
                <div className="flex items-center space-x-2.5 border-t pt-4 mt-2">
                  <Checkbox 
                    id="isActive" 
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({...formData, isActive: checked === true})}
                  />
                  <Label htmlFor="isActive" className="font-medium cursor-pointer text-destructive text-sm">
                    Active (Employees can select and apply)
                  </Label>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) ? 'Saving...' : 'Save Policy'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
