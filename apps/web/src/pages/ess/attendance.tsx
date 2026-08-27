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

export function MyAttendancePage() {
  const { data: settings } = useCompanySettings();
  const { data: records, isLoading } = useMyAttendance();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form states for regularization
  const [reqCheckIn, setReqCheckIn] = useState('');
  const [reqCheckOut, setReqCheckOut] = useState('');
  const [reason, setReason] = useState('');

  const regularizeMutation = useRequestRegularization();

  if (isLoading) return <div className="p-8">Loading attendance...</div>;

  if (settings && !settings.isAttendanceEnabled) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <h2 className="text-3xl font-bold tracking-tight">Attendance</h2>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">Attendance tracking is currently disabled by your organization.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

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
      // Combine date and time
      const baseDateStr = selectedDate; // YYYY-MM-DD
      const data: any = {
        date: new Date(baseDateStr).toISOString(),
        reason
      };

      if (reqCheckIn) {
        data.requestedCheckIn = new Date(`${baseDateStr}T${reqCheckIn}:00`).toISOString();
      }
      if (reqCheckOut) {
        data.requestedCheckOut = new Date(`${baseDateStr}T${reqCheckOut}:00`).toISOString();
      }

      await regularizeMutation.mutateAsync(data);
      toast.success('Regularization request submitted');
      setIsDialogOpen(false);
      
      // Reset
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
      case 'PRESENT': return <Badge className="bg-green-100 text-green-800">Present</Badge>;
      case 'ABSENT': return <Badge variant="destructive">Absent</Badge>;
      case 'HALF_DAY': return <Badge variant="secondary">Half Day</Badge>;
      case 'WFH': return <Badge className="bg-blue-100 text-blue-800">WFH</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">My Attendance</h2>
      </div>

      <div className="max-w-md">
        <AttendanceWidget />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Attendance Log</CardTitle>
          <CardDescription>Your attendance records for the current month.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Check In</TableHead>
                <TableHead>Check Out</TableHead>
                <TableHead>Total Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-4">
                    No records found for this month.
                  </TableCell>
                </TableRow>
              )}
              {records?.map((record: any) => {
                const pendingCorrection = record.corrections?.find((c: any) => c.status === 'PENDING');
                
                return (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">
                      {format(new Date(record.date), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      {record.punchInTime ? format(new Date(record.punchInTime), 'hh:mm a') : '--'}
                    </TableCell>
                    <TableCell>
                      {record.punchOutTime ? format(new Date(record.punchOutTime), 'hh:mm a') : '--'}
                    </TableCell>
                    <TableCell>
                      {record.totalMinutes ? `${Math.floor(record.totalMinutes / 60)}h ${record.totalMinutes % 60}m` : '--'}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(record.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      {pendingCorrection ? (
                        <span className="text-xs text-orange-600 font-medium bg-orange-50 px-2 py-1 rounded">Pending Regularization</span>
                      ) : (
                        <Dialog open={isDialogOpen && selectedDate === format(new Date(record.date), 'yyyy-MM-dd')} onOpenChange={(open) => {
                          if (open) {
                            setSelectedDate(format(new Date(record.date), 'yyyy-MM-dd'));
                          } else {
                            setIsDialogOpen(false);
                            setSelectedDate(null);
                          }
                          setIsDialogOpen(open);
                        }}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">Regularize</Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Regularize Attendance</DialogTitle>
                              <DialogDescription>
                                Request an attendance correction for {format(new Date(record.date), 'MMM dd, yyyy')}.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>Requested Check In (HH:MM)</Label>
                                  <Input type="time" value={reqCheckIn} onChange={e => setReqCheckIn(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                  <Label>Requested Check Out (HH:MM)</Label>
                                  <Input type="time" value={reqCheckOut} onChange={e => setReqCheckOut(e.target.value)} />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label>Reason</Label>
                                <Input value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g., Forgot to check in" />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
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
        </CardContent>
      </Card>
    </div>
  );
}
