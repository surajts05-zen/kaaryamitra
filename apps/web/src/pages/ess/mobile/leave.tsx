import React, { useState } from 'react';
import { useMyLeaveBalances, useMyLeaveApplications, useApplyLeave, useLeaveTypes } from '@/features/leave/leave.service';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, CalendarDays, Loader2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export function MobileEssLeave() {
  const { data: balances, isLoading: loadingBalances } = useMyLeaveBalances();
  const { data: applications, isLoading: loadingApps } = useMyLeaveApplications();
  const { data: leaveTypes } = useLeaveTypes();
  const applyMutation = useApplyLeave();

  const [isSheetOpen, setIsSheetOpen] = useState(false);
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
    setIsSheetOpen(false);
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
      case 'APPROVED': return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Approved</Badge>;
      case 'REJECTED': return <Badge className="bg-rose-50 text-rose-700 border-rose-200">Rejected</Badge>;
      case 'PENDING': return <Badge className="bg-amber-50 text-amber-700 border-amber-200">Pending</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="flex flex-col space-y-4 pb-24 relative">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-primary" /> Leaves
        </h2>
        <Button size="sm" className="h-8 text-xs rounded-full px-4" onClick={() => setIsSheetOpen(true)}>
          <Plus className="w-3.5 h-3.5 mr-1" /> Apply
        </Button>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold px-1">My Balances</h3>
        {loadingBalances ? (
          <div className="flex gap-3 overflow-hidden">
            {[1, 2].map(i => <div key={i} className="h-28 w-40 flex-shrink-0 animate-pulse rounded-xl bg-muted" />)}
          </div>
        ) : balances?.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">No balances found.</p>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory hide-scrollbar">
            {balances?.map((bal) => (
              <Card key={bal.id} className="relative overflow-hidden snap-start flex-shrink-0 w-48 border-muted/60 shadow-sm">
                <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: bal.leaveType.color || '#4CAF50' }} />
                <CardContent className="p-4 pl-5">
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1 truncate">{bal.leaveType.name}</p>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-3xl font-bold text-foreground">{bal.available}</span>
                    <span className="text-[10px] text-muted-foreground">left</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground bg-muted/30 rounded p-1.5 px-2">
                    <span>Used: <span className="font-semibold text-foreground">{bal.used}</span></span>
                    <span>Total: <span className="font-semibold text-foreground">{bal.totalAccrued}</span></span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4">
        <h3 className="text-sm font-semibold px-1 mb-3">Recent Applications</h3>
        <div className="space-y-3">
          {loadingApps ? (
             <div className="flex justify-center p-4"><Loader2 className="animate-spin h-5 w-5 text-muted-foreground" /></div>
          ) : applications?.length === 0 ? (
            <Card className="border-dashed bg-muted/30">
              <CardContent className="p-6 text-center text-sm text-muted-foreground">
                No leave history found.
              </CardContent>
            </Card>
          ) : (
            applications?.map((app) => (
              <Card key={app.id} className="border-muted/60 shadow-sm overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-3 border-b flex justify-between items-center bg-muted/10">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: app.leaveType.color || '#4CAF50' }} />
                      <p className="font-semibold text-sm">{app.leaveType.name}</p>
                    </div>
                    {getStatusBadge(app.status)}
                  </div>
                  <div className="p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5 font-semibold">Date</p>
                        <p className="text-sm font-medium">
                          {format(new Date(app.startDate), 'MMM d, yyyy')} 
                          {app.startDate !== app.endDate && ` - ${format(new Date(app.endDate), 'MMM d, yyyy')}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5 font-semibold">Duration</p>
                        <p className="text-sm font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                          {app.totalDays} {app.totalDays === 1 ? 'Day' : 'Days'}
                        </p>
                      </div>
                    </div>
                    
                    {app.isHalfDay && (
                      <Badge variant="outline" className="text-[9px] mt-1 bg-muted/50">
                        {app.halfDayPeriod === 'FIRST_HALF' ? 'First Half (Morning)' : 'Second Half (Afternoon)'}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Full Screen Bottom Sheet for Leave Application */}
      {isSheetOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsSheetOpen(false)} />
          
          <div className="relative bg-background w-full rounded-t-2xl shadow-2xl animate-in slide-in-from-bottom flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b shrink-0">
              <div>
                <h3 className="font-bold">Apply for Leave</h3>
                <p className="text-xs text-muted-foreground">Submit a request to your manager</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsSheetOpen(false)} className="h-8 w-8 rounded-full bg-muted">
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <form onSubmit={handleApply} className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Leave Type <span className="text-rose-500">*</span></Label>
                <Select 
                  value={formData.leaveTypeId} 
                  onValueChange={(val) => setFormData({...formData, leaveTypeId: val})}
                  required
                >
                  <SelectTrigger className="h-12 bg-muted/30">
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
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Start Date <span className="text-rose-500">*</span></Label>
                  <Input 
                    type="date"
                    className="h-12 bg-muted/30"
                    value={formData.startDate} 
                    onChange={e => setFormData({...formData, startDate: e.target.value})} 
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">End Date <span className="text-rose-500">*</span></Label>
                  <Input 
                    type="date"
                    className="h-12 bg-muted/30"
                    value={formData.endDate} 
                    onChange={e => setFormData({...formData, endDate: e.target.value})} 
                    required
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg border border-border/50">
                <Checkbox 
                  id="isHalfDay" 
                  className="w-5 h-5 rounded"
                  checked={formData.isHalfDay}
                  onCheckedChange={(checked) => setFormData({...formData, isHalfDay: checked === true})}
                />
                <Label htmlFor="isHalfDay" className="font-medium cursor-pointer flex-1">This is a Half-Day Leave</Label>
              </div>

              {formData.isHalfDay && (
                <div className="space-y-1.5 animate-in slide-in-from-top-2">
                  <Label className="text-xs font-semibold">Which Half?</Label>
                  <Select 
                    value={formData.halfDayPeriod} 
                    onValueChange={(val: any) => setFormData({...formData, halfDayPeriod: val})}
                  >
                    <SelectTrigger className="h-12 bg-muted/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FIRST_HALF">First Half (Morning)</SelectItem>
                      <SelectItem value="SECOND_HALF">Second Half (Afternoon)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Reason (Optional)</Label>
                <Textarea 
                  value={formData.reason} 
                  className="resize-none bg-muted/30"
                  onChange={e => setFormData({...formData, reason: e.target.value})} 
                  placeholder="Traveling, Medical, etc."
                  rows={3}
                />
              </div>
              
              <div className="pt-4 pb-8">
                <Button 
                  type="submit" 
                  className="w-full h-12 rounded-xl text-sm font-bold shadow-md"
                  disabled={applyMutation.isPending}
                >
                  {applyMutation.isPending ? 'Submitting...' : 'Submit Application'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
