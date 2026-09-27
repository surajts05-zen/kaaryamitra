import { useState } from 'react';
import { useMyAttendance, useRequestRegularization } from '@/features/attendance/hooks/use-attendance-queries';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { AttendanceWidget } from '@/features/attendance/components/AttendanceWidget';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useCompanySettings } from '@/features/company/hooks/use-org-queries';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Shield, Wifi, WifiOff, AlertTriangle, CheckCircle2, Clock, CalendarDays, Edit3, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MyAttendancePage() {
  const { data: settings } = useCompanySettings();
  const { data, isLoading } = useMyAttendance();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form states for regularization
  const [reqCheckIn, setReqCheckIn] = useState('');
  const [reqCheckOut, setReqCheckOut] = useState('');
  const [reason, setReason] = useState('');

  const regularizeMutation = useRequestRegularization();

  if (isLoading) return <div className="p-8 text-muted-foreground">Loading attendance...</div>;

  if (settings && !settings.isAttendanceEnabled) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Clock className="w-8 h-8 text-primary" /> My Attendance
        </h2>
        <Card className="border border-border/60">
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">Attendance tracking is currently disabled by your organization.</p>
          </CardContent>
        </Card>
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
      setIsDialogOpen(false);
      
      setReqCheckIn('');
      setReqCheckOut('');
      setReason('');
      setSelectedDate(null);
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to submit request');
    }
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
    <div className="flex-1 space-y-6 p-8 pt-6 max-w-6xl">
      <Breadcrumb items={[{ label: 'My Attendance' }]} backPath="dashboard" backLabel="Back to Dashboard" />
      
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <CalendarDays className="w-8 h-8 text-primary" /> My Attendance
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <AttendanceWidget />
          
          {stats && (
            <Card className="mt-6 border border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">This Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Present</p>
                    <p className="text-2xl font-bold text-emerald-600">{stats.presentDays}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Absent</p>
                    <p className="text-2xl font-bold text-rose-600">{stats.absentDays}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Late</p>
                    <p className="text-2xl font-bold text-amber-600">{stats.lateDays}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Total Hours</p>
                    <p className="text-2xl font-bold text-blue-600">{Math.floor(stats.totalHours)}h</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="md:col-span-2">
          <Card className="border border-border/60 h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Attendance Log</CardTitle>
              <CardDescription className="text-xs">Your daily check-in records and shift adherence.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[600px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Punches</TableHead>
                      <TableHead>Exceptions</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                          <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-30" />
                          <p>No records found for this period.</p>
                        </TableCell>
                      </TableRow>
                    )}
                    {records?.map((record: any) => {
                      const pendingCorrection = record.corrections?.find((c: any) => c.status === 'PENDING');
                      const hasMissingPunch = record.punchInTime && !record.punchOutTime && new Date().getDate() !== new Date(record.date).getDate();
                      
                      return (
                        <TableRow key={record.id} className={hasMissingPunch ? "bg-rose-50/30" : ""}>
                          <TableCell className="align-top pt-4">
                            <p className="font-medium text-sm whitespace-nowrap">{format(new Date(record.date), 'dd MMM yyyy')}</p>
                            <p className="text-xs text-muted-foreground">{format(new Date(record.date), 'EEEE')}</p>
                            {record.shift && <p className="text-[10px] text-primary/70 mt-1">{record.shift.name}</p>}
                          </TableCell>
                          
                          <TableCell className="align-top pt-4">
                            <div className="flex flex-col gap-2">
                              {/* Check In */}
                              <div className="flex items-start gap-2">
                                <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                <div>
                                  <p className="text-sm font-mono leading-none">
                                    {record.punchInTime ? format(new Date(record.punchInTime), 'hh:mm a') : '--:--'}
                                  </p>
                                  {record.punchInNetworkStatus === 'TRUSTED' && (
                                    <span className="text-[9px] text-emerald-600 flex items-center gap-0.5 mt-0.5"><Wifi className="w-2.5 h-2.5"/> Verified Network</span>
                                  )}
                                  {record.punchInNetworkStatus === 'UNTRUSTED' && (
                                    <span className="text-[9px] text-amber-600 flex items-center gap-0.5 mt-0.5"><WifiOff className="w-2.5 h-2.5"/> Untrusted Network</span>
                                  )}
                                </div>
                              </div>
                              
                              {/* Check Out */}
                              <div className="flex items-start gap-2">
                                <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                                <div>
                                  <p className="text-sm font-mono leading-none">
                                    {record.punchOutTime ? format(new Date(record.punchOutTime), 'hh:mm a') : '--:--'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          
                          <TableCell className="align-top pt-4">
                            <div className="flex flex-col gap-1.5 items-start">
                              {record.isLate && (
                                <Badge variant="outline" className="text-[10px] text-amber-700 bg-amber-50 border-amber-200 py-0 leading-tight h-5">
                                  Late Arrival ({record.lateMinutes}m)
                                </Badge>
                              )}
                              {record.isEarlyExit && (
                                <Badge variant="outline" className="text-[10px] text-orange-700 bg-orange-50 border-orange-200 py-0 leading-tight h-5">
                                  Early Exit ({record.earlyExitMinutes}m)
                                </Badge>
                              )}
                              {hasMissingPunch && !pendingCorrection && (
                                <Badge variant="outline" className="text-[10px] text-rose-700 bg-rose-50 border-rose-200 py-0 leading-tight h-5">
                                  <AlertTriangle className="w-3 h-3 mr-1" /> Missing Punch Out
                                </Badge>
                              )}
                              {record.exceptions?.includes('MANUAL_CORRECTION') && (
                                <Badge variant="outline" className="text-[10px] text-blue-700 bg-blue-50 border-blue-200 py-0 leading-tight h-5">
                                  Manual Edit
                                </Badge>
                              )}
                              {!record.isLate && !record.isEarlyExit && !hasMissingPunch && record.punchInTime && record.punchOutTime && (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </div>
                          </TableCell>
                          
                          <TableCell className="align-top pt-4">
                            <div className="space-y-1">
                              {getStatusBadge(record.status)}
                              {record.totalMinutes > 0 && (
                                <p className="text-xs text-muted-foreground font-medium">
                                  {Math.floor(record.totalMinutes / 60)}h {record.totalMinutes % 60}m
                                </p>
                              )}
                            </div>
                          </TableCell>
                          
                          <TableCell className="text-right align-top pt-4">
                            {pendingCorrection ? (
                              <Badge variant="outline" className="text-[10px] text-amber-700 bg-amber-50 border-amber-300">
                                <Clock className="w-3 h-3 mr-1" /> Request Pending
                              </Badge>
                            ) : (
                              <Dialog open={isDialogOpen && selectedDate === format(new Date(record.date), 'yyyy-MM-dd')} onOpenChange={(open) => {
                                if (open) {
                                  setSelectedDate(format(new Date(record.date), 'yyyy-MM-dd'));
                                  if (record.punchInTime) setReqCheckIn(format(new Date(record.punchInTime), 'HH:mm'));
                                  if (record.punchOutTime) setReqCheckOut(format(new Date(record.punchOutTime), 'HH:mm'));
                                } else {
                                  setIsDialogOpen(false);
                                  setSelectedDate(null);
                                  setReqCheckIn('');
                                  setReqCheckOut('');
                                }
                                setIsDialogOpen(open);
                              }}>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm" className="h-8 text-xs" title="Request Regularization">
                                    <Edit3 className="w-3.5 h-3.5 mr-1" /> Fix
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                  <DialogHeader>
                                    <DialogTitle>Regularize Attendance</DialogTitle>
                                    <DialogDescription>
                                      Submit a correction request for {format(new Date(record.date), 'MMMM d, yyyy')}. This will be routed to your manager for approval.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="grid gap-5 py-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label className="text-xs">Requested Check In</Label>
                                        <Input type="time" value={reqCheckIn} onChange={e => setReqCheckIn(e.target.value)} />
                                      </div>
                                      <div className="space-y-2">
                                        <Label className="text-xs">Requested Check Out</Label>
                                        <Input type="time" value={reqCheckOut} onChange={e => setReqCheckOut(e.target.value)} />
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <Label className="text-xs">Reason for correction <span className="text-rose-500">*</span></Label>
                                      <Input value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g., Forgot to check out, App crashed, etc." />
                                    </div>
                                  </div>
                                  <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                                    <Button onClick={handleRegularize} disabled={regularizeMutation.isPending}>
                                      {regularizeMutation.isPending ? 'Submitting...' : 'Submit Request'}
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
