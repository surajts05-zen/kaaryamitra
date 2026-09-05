import * as React from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useMyShifts, useMyShiftSwaps, useRequestShiftSwap, useDailySchedule } from '@/features/company/hooks/use-shifts-queries';
import { useEmployees } from '@/features/company/hooks/use-employee-queries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { CalendarClock, RefreshCw, Clock, ArrowRightLeft } from 'lucide-react';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export function MyShiftsPage() {
  const { user } = useAuthStore();
  const { data: shifts, isLoading: loadingShifts } = useMyShifts((user as any)?.employeeId);
  const { data: swaps, isLoading: loadingSwaps } = useMyShiftSwaps();
  const { data: employees } = useEmployees();
  const requestSwap = useRequestShiftSwap();


  const [isSwapDialogOpen, setIsSwapDialogOpen] = React.useState(false);
  const [targetEmployeeId, setTargetEmployeeId] = React.useState('');
  const [swapDate, setSwapDate] = React.useState('');
  const [swapReason, setSwapReason] = React.useState('');

  const { data: dailySchedule, isLoading: loadingSchedule } = useDailySchedule(swapDate);

  const handleRequestSwap = (e: React.FormEvent) => {
    e.preventDefault();
    requestSwap.mutate(
      { targetEmployeeId, date: swapDate, reason: swapReason },
      {
        onSuccess: () => {
          toast.success('Shift swap requested successfully');
          setIsSwapDialogOpen(false);
          setTargetEmployeeId('');
          setSwapDate('');
          setSwapReason('');
        }
      }
    );
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'My Shifts' }]} backPath="dashboard" backLabel="Back to Dashboard" />
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Shifts</h1>
          <p className="text-muted-foreground">View your assigned shifts and manage swap requests.</p>
        </div>

        <Dialog open={isSwapDialogOpen} onOpenChange={setIsSwapDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <ArrowRightLeft className="mr-2 h-4 w-4" />
              Request Shift Swap
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Request Shift Swap</DialogTitle>
              <DialogDescription>
                Ask a coworker to swap shifts with you for a specific date. Once they agree, it goes to your manager for approval.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleRequestSwap} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={swapDate}
                  onChange={e => { setSwapDate(e.target.value); setTargetEmployeeId(''); }}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Coworker to Swap With</Label>
                <Select value={targetEmployeeId} onValueChange={setTargetEmployeeId} disabled={!swapDate || loadingSchedule}>
                  <SelectTrigger>
                    <SelectValue placeholder={!swapDate ? "Select a date first..." : loadingSchedule ? "Loading schedule..." : "Select coworker..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {dailySchedule?.map((schedule: any) => (
                      schedule.employee.id !== (user as any)?.employeeId && (
                        <SelectItem key={schedule.employee.id} value={schedule.employee.id}>
                          {schedule.employee.firstName} {schedule.employee.lastName} ({schedule.shift.name})
                        </SelectItem>
                      )
                    ))}
                    {dailySchedule?.length === 1 && (dailySchedule[0] as any).employee?.id === (user as any)?.employeeId && (
                      <SelectItem value="none" disabled>No other coworkers scheduled</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Reason (Optional)</Label>
                <Input
                  placeholder="e.g. Doctor appointment"
                  value={swapReason}
                  onChange={e => setSwapReason(e.target.value)}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsSwapDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={requestSwap.isPending || !targetEmployeeId || !swapDate}>
                  {requestSwap.isPending ? 'Requesting...' : 'Submit Request'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="schedule" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="schedule">My Schedule</TabsTrigger>
          <TabsTrigger value="swaps">Swap Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="space-y-4">
          {loadingShifts ? (
            <div className="p-8">Loading schedule...</div>
          ) : shifts?.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
              No shifts assigned to you.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {shifts?.map((es) => (
                <Card key={es.id} className="relative overflow-hidden transition-all hover:shadow-md">
                  <div className="absolute left-0 top-0 h-full w-1.5" style={{ backgroundColor: es.shift?.color || '#6366f1' }} />
                  <CardHeader className="pb-3 pl-6">
                    <CardTitle className="text-lg">{es.shift?.name || 'Assigned Shift'}</CardTitle>
                    <CardDescription className="mt-1">
                      {es.shift?.type || 'Standard'} Shift
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pl-6">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {es.shift?.startTime || '--:--'} - {es.shift?.endTime || '--:--'}
                      </span>
                    </div>
                    <div className="mt-4 text-xs text-muted-foreground">
                      Effective: {format(new Date(es.effectiveFrom), 'MMM d, yyyy')}
                      {es.effectiveTo && ` to ${format(new Date(es.effectiveTo), 'MMM d, yyyy')}`}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="swaps" className="space-y-4">
          {loadingSwaps ? (
            <div className="p-8">Loading swaps...</div>
          ) : swaps?.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
              No shift swap requests found.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {swaps?.map((swap: any) => {
                const isReceived = swap.targetEmployeeId === (user as any)?.employeeId;
                return (
                  <Card key={swap.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-md flex items-center gap-2">
                          {isReceived ? 'Received Swap Request' : 'Sent Swap Request'}
                        </CardTitle>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          swap.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-600' :
                          swap.status === 'APPROVED' ? 'bg-green-500/10 text-green-600' :
                          'bg-red-500/10 text-red-600'
                        }`}>
                          {swap.status}
                        </span>
                      </div>
                      <CardDescription>
                        Date: {format(new Date(swap.date), 'MMMM d, yyyy')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm">
                        {isReceived ? (
                          <>
                            <span className="font-medium">{swap.requestingEmployee?.user.firstName} {swap.requestingEmployee?.user.lastName}</span>
                            <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-muted-foreground">You</span>
                          </>
                        ) : (
                          <>
                            <span className="font-medium text-muted-foreground">You</span>
                            <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{swap.targetEmployee?.user.firstName} {swap.targetEmployee?.user.lastName}</span>
                          </>
                        )}
                      </div>
                      {swap.reason && (
                        <p className="mt-4 text-sm text-muted-foreground bg-muted p-2 rounded-md">
                          "{swap.reason}"
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
