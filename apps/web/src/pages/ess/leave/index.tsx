import React, { useState } from 'react';
import { useMyLeaveBalances, useMyLeaveApplications, useApplyLeave, useLeaveTypes } from '@/features/leave/leave.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, CalendarDays, Loader2 } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';

export function EssLeavePage() {
  const { data: balances, isLoading: loadingBalances } = useMyLeaveBalances();
  const { data: applications, isLoading: loadingApps } = useMyLeaveApplications();
  const { data: leaveTypes } = useLeaveTypes();
  const applyMutation = useApplyLeave();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    leaveTypeId: '',
    startDate: '',
    endDate: '',
    isHalfDay: false,
    halfDayPeriod: 'FIRST_HALF' as 'FIRST_HALF' | 'SECOND_HALF',
    reason: ''
  });

  const activeTypes = leaveTypes?.filter(lt => lt.isActive) || [];

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    await applyMutation.mutateAsync({
      ...formData,
      startDate: new Date(formData.startDate).toISOString(),
      endDate: new Date(formData.endDate).toISOString(),
    });
    setIsDialogOpen(false);
    setFormData({
      leaveTypeId: '',
      startDate: '',
      endDate: '',
      isHalfDay: false,
      halfDayPeriod: 'FIRST_HALF',
      reason: ''
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED': return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'REJECTED': return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      case 'PENDING': return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">My Leaves</h1>
          <p className="text-muted-foreground">Manage your time off and view leave balances.</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Apply for Leave
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loadingBalances ? (
          <p>Loading balances...</p>
        ) : balances?.length === 0 ? (
          <p className="text-muted-foreground text-sm col-span-full">No leave balances found.</p>
        ) : (
          balances?.map((bal) => (
            <Card key={bal.id} className="relative overflow-hidden group">
              <div 
                className="absolute top-0 left-0 w-1 h-full" 
                style={{ backgroundColor: bal.leaveType.color || '#4CAF50' }}
              />
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center justify-between">
                  {bal.leaveType.name}
                  <span className="text-2xl font-bold text-foreground">{bal.available}</span>
                </CardTitle>
                <CardDescription className="flex justify-between items-center mt-1">
                  <span>Available Balance</span>
                  <span className="text-xs">/ {bal.totalAccrued} Total</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mt-2 text-xs text-muted-foreground flex justify-between">
                  <span>Used: {bal.used}</span>
                  {bal.leaveType.isCarryForwardAllowed && <span>Carry Forward: Yes</span>}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Leave History</h2>
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                <tr>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Dates</th>
                  <th className="px-4 py-3 font-medium">Days</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Applied On</th>
                  <th className="px-4 py-3 font-medium">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loadingApps ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center"><Loader2 className="animate-spin h-5 w-5 mx-auto" /></td></tr>
                ) : applications?.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No leave history found.</td></tr>
                ) : (
                  applications?.map((app) => (
                    <tr key={app.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{app.leaveType.name}</td>
                      <td className="px-4 py-3">
                        {format(new Date(app.startDate), 'MMM d, yyyy')} 
                        {app.startDate !== app.endDate && ` - ${format(new Date(app.endDate), 'MMM d, yyyy')}`}
                      </td>
                      <td className="px-4 py-3">{app.totalDays} {app.isHalfDay && <span className="text-xs text-muted-foreground">({app.halfDayPeriod === 'FIRST_HALF' ? '1st Half' : '2nd Half'})</span>}</td>
                      <td className="px-4 py-3">{getStatusBadge(app.status)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{format(new Date(app.createdAt), 'MMM d, yyyy')}</td>
                      <td className="px-4 py-3 text-muted-foreground truncate max-w-[150px]" title={app.managerNote}>{app.managerNote || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleApply}>
            <DialogHeader>
              <DialogTitle>Apply for Leave</DialogTitle>
              <DialogDescription>
                Submit a new leave application to your manager.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Leave Type</Label>
                <Select 
                  value={formData.leaveTypeId} 
                  onValueChange={(val) => setFormData({...formData, leaveTypeId: val})}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeTypes.map(lt => (
                      <SelectItem key={lt.id} value={lt.id}>{lt.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Start Date</Label>
                  <Input 
                    type="date"
                    value={formData.startDate} 
                    onChange={e => setFormData({...formData, startDate: e.target.value})} 
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label>End Date</Label>
                  <Input 
                    type="date"
                    value={formData.endDate} 
                    onChange={e => setFormData({...formData, endDate: e.target.value})} 
                    required
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 mt-2">
                <Checkbox 
                  id="isHalfDay" 
                  checked={formData.isHalfDay}
                  onCheckedChange={(checked) => setFormData({...formData, isHalfDay: checked === true})}
                />
                <Label htmlFor="isHalfDay" className="font-normal cursor-pointer">Half Day</Label>
              </div>

              {formData.isHalfDay && (
                <div className="grid gap-2">
                  <Label>Which Half?</Label>
                  <Select 
                    value={formData.halfDayPeriod} 
                    onValueChange={(val: any) => setFormData({...formData, halfDayPeriod: val})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FIRST_HALF">First Half (Morning)</SelectItem>
                      <SelectItem value="SECOND_HALF">Second Half (Afternoon)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid gap-2">
                <Label>Reason (Optional)</Label>
                <Textarea 
                  value={formData.reason} 
                  onChange={e => setFormData({...formData, reason: e.target.value})} 
                  placeholder="Additional details..."
                  rows={3}
                />
              </div>

            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={applyMutation.isPending}>
                Submit Application
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
