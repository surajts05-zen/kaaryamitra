import React, { useState } from 'react';
import { useMyAttendance, useRequestRegularization } from '@/features/attendance/hooks/use-attendance-queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { AttendanceWidget } from '@/features/attendance/components/AttendanceWidget';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useCompanySettings } from '@/features/company/hooks/use-org-queries';
import { Clock, CalendarDays, Edit3, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MobileMyAttendance() {
  const { data: settings } = useCompanySettings();
  const { data, isLoading } = useMyAttendance();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Form states for regularization (using bottom sheet pattern approach)
  const [reqCheckIn, setReqCheckIn] = useState('');
  const [reqCheckOut, setReqCheckOut] = useState('');
  const [reason, setReason] = useState('');

  const regularizeMutation = useRequestRegularization();

  if (isLoading) return <div className="p-4 text-center text-sm text-muted-foreground mt-10">Loading attendance...</div>;

  if (settings && !settings.isAttendanceEnabled) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center h-[60vh]">
        <div className="bg-muted p-4 rounded-full mb-4">
          <Clock className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold mb-2">Attendance Disabled</h2>
        <p className="text-sm text-muted-foreground">Attendance tracking is currently disabled by your organization.</p>
      </div>
    );
  }

  const { records, stats } = data || { records: [], stats: {} };

  const handleRegularize = async () => {
    if (!selectedDate) return;

    if (!reqCheckIn && !reqCheckOut) {
      toast.error('Please provide at least one time correction');
      return;
    }
    if (!reason || reason.length < 5) {
      toast.error('Please provide a valid reason (min 5 characters)');
      return;
    }

    try {
      const baseDateStr = selectedDate; // YYYY-MM-DD
      const payload: any = {
        date: new Date(baseDateStr).toISOString(),
        reason
      };

      if (reqCheckIn) {
        payload.requestedCheckIn = new Date(`${baseDateStr}T${reqCheckIn}:00`).toISOString();
      }
      if (reqCheckOut) {
        payload.requestedCheckOut = new Date(`${baseDateStr}T${reqCheckOut}:00`).toISOString();
      }

      await regularizeMutation.mutateAsync(payload);
      toast.success('Regularization request submitted');
      
      closeRegularizeSheet();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to submit request');
    }
  };

  const closeRegularizeSheet = () => {
    setSelectedDate(null);
    setReqCheckIn('');
    setReqCheckOut('');
    setReason('');
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'PRESENT': return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Present</Badge>;
      case 'ABSENT': return <Badge className="bg-rose-50 text-rose-700 border-rose-200">Absent</Badge>;
      case 'HALF_DAY': return <Badge className="bg-amber-50 text-amber-700 border-amber-200">Half Day</Badge>;
      case 'WFH': return <Badge className="bg-blue-50 text-blue-700 border-blue-200">WFH</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="flex flex-col space-y-4 pb-24 relative">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-primary" /> Attendance
        </h2>
      </div>

      <AttendanceWidget />
      
      {stats && (
        <Card className="border-muted/60 shadow-sm">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-wider">This Month's Stats</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="grid grid-cols-4 gap-2 text-center divide-x divide-border/50">
              <div>
                <p className="text-[10px] text-muted-foreground font-medium mb-1">Present</p>
                <p className="text-lg font-bold text-emerald-600">{stats.presentDays}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-medium mb-1">Absent</p>
                <p className="text-lg font-bold text-rose-600">{stats.absentDays}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-medium mb-1">Late</p>
                <p className="text-lg font-bold text-amber-600">{stats.lateDays}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-medium mb-1">Hours</p>
                <p className="text-lg font-bold text-blue-600">{Math.floor(stats.totalHours)}<span className="text-xs">h</span></p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <h3 className="text-sm font-semibold mt-4 mb-2 px-1">Recent Logs</h3>
      
      <div className="space-y-3">
        {records?.length === 0 && (
          <div className="text-center text-muted-foreground py-8 bg-muted/30 rounded-xl">
            <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No records found for this period.</p>
          </div>
        )}
        
        {records?.map((record: any) => {
          const pendingCorrection = record.corrections?.find((c: any) => c.status === 'PENDING');
          const hasMissingPunch = record.punchInTime && !record.punchOutTime && new Date().getDate() !== new Date(record.date).getDate();
          
          return (
            <Card key={record.id} className={cn("border-muted/60 shadow-sm overflow-hidden", hasMissingPunch ? "border-rose-200 bg-rose-50/10" : "")}>
              <CardContent className="p-0">
                <div className="p-3 border-b flex justify-between items-center bg-muted/10">
                  <div>
                    <p className="font-semibold text-sm">{format(new Date(record.date), 'dd MMM yyyy')}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">{format(new Date(record.date), 'EEEE')}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {getStatusBadge(record.status)}
                    {record.totalMinutes > 0 && (
                      <span className="text-[10px] font-medium text-muted-foreground">
                        {Math.floor(record.totalMinutes / 60)}h {record.totalMinutes % 60}m
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="p-3 grid grid-cols-2 gap-3 relative">
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Check In</p>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <p className="text-sm font-mono font-medium">
                        {record.punchInTime ? format(new Date(record.punchInTime), 'hh:mm a') : '--:--'}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Check Out</p>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                      <p className="text-sm font-mono font-medium">
                        {record.punchOutTime ? format(new Date(record.punchOutTime), 'hh:mm a') : '--:--'}
                      </p>
                    </div>
                  </div>

                  {/* Vertical divider line */}
                  <div className="absolute left-1/2 top-4 bottom-4 w-px bg-border/50 -translate-x-1/2" />
                </div>

                {/* Exceptions & Actions Footer */}
                <div className="px-3 pb-3 flex flex-wrap items-center justify-between gap-2 border-t pt-2 bg-accent/10">
                  <div className="flex gap-1.5 flex-wrap flex-1">
                    {record.isLate && <Badge variant="outline" className="text-[9px] text-amber-700 bg-amber-50 border-amber-200">Late</Badge>}
                    {record.isEarlyExit && <Badge variant="outline" className="text-[9px] text-orange-700 bg-orange-50 border-orange-200">Early Exit</Badge>}
                    {hasMissingPunch && !pendingCorrection && (
                      <Badge variant="outline" className="text-[9px] text-rose-700 bg-rose-50 border-rose-200">
                        <AlertTriangle className="w-2.5 h-2.5 mr-0.5" /> Missing Punch
                      </Badge>
                    )}
                    {(!record.isLate && !record.isEarlyExit && !hasMissingPunch) && <span className="text-[10px] text-muted-foreground">Regular</span>}
                  </div>
                  
                  <div>
                    {pendingCorrection ? (
                      <Badge variant="outline" className="text-[9px] text-amber-700 bg-amber-50 border-amber-300">
                        <Clock className="w-2.5 h-2.5 mr-0.5" /> Pending
                      </Badge>
                    ) : (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 text-[10px] px-2 text-primary hover:bg-primary/10"
                        onClick={() => {
                          setSelectedDate(format(new Date(record.date), 'yyyy-MM-dd'));
                          if (record.punchInTime) setReqCheckIn(format(new Date(record.punchInTime), 'HH:mm'));
                          if (record.punchOutTime) setReqCheckOut(format(new Date(record.punchOutTime), 'HH:mm'));
                        }}
                      >
                        <Edit3 className="w-3 h-3 mr-1" /> Fix
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Full Screen Bottom Sheet for Regularization */}
      {selectedDate && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeRegularizeSheet} />
          
          <div className="relative bg-background w-full rounded-t-2xl shadow-2xl animate-in slide-in-from-bottom flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 className="font-bold">Regularize Attendance</h3>
                <p className="text-xs text-muted-foreground">{format(new Date(selectedDate), 'MMMM d, yyyy')}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={closeRegularizeSheet} className="h-8 w-8 rounded-full bg-muted">
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="p-4 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Check In</Label>
                  <Input type="time" className="h-10 text-sm" value={reqCheckIn} onChange={e => setReqCheckIn(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Check Out</Label>
                  <Input type="time" className="h-10 text-sm" value={reqCheckOut} onChange={e => setReqCheckOut(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Reason <span className="text-rose-500">*</span></Label>
                <Input className="h-10 text-sm" value={reason} onChange={e => setReason(e.target.value)} placeholder="App crashed, Forgot, etc." />
              </div>
              
              <Button 
                className="w-full h-12 rounded-xl mt-4 text-sm font-bold" 
                onClick={handleRegularize} 
                disabled={regularizeMutation.isPending}
              >
                {regularizeMutation.isPending ? 'Submitting...' : 'Submit Request'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
