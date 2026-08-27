import React, { useState } from 'react';
import { useLeaveTypes, useCreateLeaveType, useUpdateLeaveType } from '@/features/leave/leave.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Settings2, CheckCircle2, XCircle } from 'lucide-react';
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
    isActive: true
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
      isActive: true
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
      isActive: lt.isActive
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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Leave Policies</h1>
          <p className="text-muted-foreground">Manage time-off types and accrual rules.</p>
        </div>
        <Button onClick={handleOpenNew} className="bg-km-forest hover:bg-km-forest/90">
          <Plus className="mr-2 h-4 w-4" />
          Add Leave Type
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <p>Loading...</p>
        ) : (
          leaveTypes?.map((lt) => (
            <Card key={lt.id} className="relative overflow-hidden group">
              <div 
                className="absolute top-0 left-0 w-1 h-full" 
                style={{ backgroundColor: lt.color || '#4CAF50' }}
              />
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      {lt.name}
                      {!lt.isActive && (
                        <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground font-normal">
                          Inactive
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1">{lt.code}</CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(lt)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Settings2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-muted-foreground">Allowance</span>
                    <span className="font-medium">{lt.daysPerYear} days/{lt.accrualFrequency === 'YEARLY' ? 'yr' : 'mo'}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-muted-foreground">Paid Time Off</span>
                    <span className="font-medium flex items-center">
                      {lt.isPaid ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-muted-foreground" />}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Carry Forward</span>
                    <span className="font-medium">
                      {lt.isCarryForwardAllowed ? `Up to ${lt.maxCarryForward} days` : 'No'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit' : 'Create'} Leave Type</DialogTitle>
              <DialogDescription>
                Configure the rules and allowance for this leave type.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input 
                  id="name" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  placeholder="e.g. Sick Leave"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="code">Code</Label>
                <Input 
                  id="code" 
                  value={formData.code} 
                  onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} 
                  placeholder="e.g. SL"
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
                    value={formData.daysPerYear} 
                    onChange={e => setFormData({...formData, daysPerYear: parseFloat(e.target.value)})} 
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

              <div className="flex items-center space-x-2 mt-2">
                <Checkbox 
                  id="isPaid" 
                  checked={formData.isPaid}
                  onCheckedChange={(checked) => setFormData({...formData, isPaid: checked === true})}
                />
                <Label htmlFor="isPaid" className="font-normal cursor-pointer">This is a Paid Leave</Label>
              </div>

              <div className="flex items-center space-x-2 mt-2">
                <Checkbox 
                  id="isCarryForwardAllowed" 
                  checked={formData.isCarryForwardAllowed}
                  onCheckedChange={(checked) => setFormData({...formData, isCarryForwardAllowed: checked === true})}
                />
                <Label htmlFor="isCarryForwardAllowed" className="font-normal cursor-pointer">Allow carry forward to next year</Label>
              </div>

              {formData.isCarryForwardAllowed && (
                <div className="grid gap-2">
                  <Label htmlFor="maxCarryForward">Max Carry Forward (Days)</Label>
                  <Input 
                    id="maxCarryForward" 
                    type="number"
                    value={formData.maxCarryForward} 
                    onChange={e => setFormData({...formData, maxCarryForward: parseFloat(e.target.value)})} 
                  />
                </div>
              )}

              {editingId && (
                <div className="flex items-center space-x-2 mt-2 border-t pt-4">
                  <Checkbox 
                    id="isActive" 
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({...formData, isActive: checked === true})}
                  />
                  <Label htmlFor="isActive" className="font-normal cursor-pointer text-red-500">Active (Employees can apply)</Label>
                </div>
              )}

            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-km-forest hover:bg-km-forest/90" disabled={createMutation.isPending || updateMutation.isPending}>
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
