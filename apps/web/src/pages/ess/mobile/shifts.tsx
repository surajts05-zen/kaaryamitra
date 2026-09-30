import * as React from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useMyShifts, useMyShiftSwaps, useRequestShiftSwap, useDailySchedule } from '@/features/company/hooks/use-shifts-queries';
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
import { Clock, ArrowRightLeft, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export function MobileMyShifts() {
  const { user } = useAuthStore();
  const { data: shifts, isLoading: loadingShifts } = useMyShifts((user as any)?.employeeId);
  const { data: swaps, isLoading: loadingSwaps } = useMyShiftSwaps();
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
    <div className="flex flex-col pb-6 space-y-4">
      <div className="flex items-center gap-3">
        <Link to=".." relative="path" className="p-2 -ml-2 rounded-full hover:bg-muted text-muted-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">My Shifts</h1>
          <p className="text-xs text-muted-foreground">Manage your work schedule</p>
        </div>
      </div>

      <Dialog open={isSwapDialogOpen} onOpenChange={setIsSwapDialogOpen}>
        <DialogTrigger asChild>
          <Button className="w-full">
            <ArrowRightLeft className="mr-2 h-4 w-4" />
            Request Shift Swap
          </Button>
        </DialogTrigger>
        <DialogContent className="w-[95vw] max-w-[425px] rounded-lg">
          <DialogHeader className="text-left">
            <DialogTitle>Request Swap</DialogTitle>
            <DialogDescription className="text-xs">
              Ask a coworker to swap shifts for a specific date.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRequestSwap} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Date</Label>
              <Input
                type="date"
                value={swapDate}
                onChange={e => { setSwapDate(e.target.value); setTargetEmployeeId(''); }}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Coworker to Swap With</Label>
              <Select value={targetEmployeeId} onValueChange={setTargetEmployeeId} disabled={!swapDate || loadingSchedule}>
                <SelectTrigger>
                  <SelectValue placeholder={!swapDate ? "Select date first..." : loadingSchedule ? "Loading..." : "Select coworker"} />
                </SelectTrigger>
                <SelectContent>
                  {dailySchedule?.map((schedule: any) => (
                    schedule.employee.id !== (user as any)?.employeeId && (
                      <SelectItem key={schedule.employee.id} value={schedule.employee.id}>
                        {schedule.employee.firstName} {schedule.employee.lastName}
                      </SelectItem>
                    )
                  ))}
                  {dailySchedule?.length === 1 && (dailySchedule[0] as any).employee?.id === (user as any)?.employeeId && (
                    <SelectItem value="none" disabled>No others scheduled</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Reason (Optional)</Label>
              <Input
                placeholder="e.g. Doctor appointment"
                value={swapReason}
                onChange={e => setSwapReason(e.target.value)}
              />
            </div>

            <DialogFooter className="flex-row gap-2 mt-4 sm:justify-end">
              <Button type="button" variant="outline" className="w-full" onClick={() => setIsSwapDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="w-full" disabled={requestSwap.isPending || !targetEmployeeId || !swapDate}>
                {requestSwap.isPending ? 'Requesting...' : 'Submit'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="schedule" className="w-full">
        <TabsList className="w-full grid grid-cols-2 mb-4">
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="swaps">Swaps</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="space-y-3 mt-0">
          {loadingShifts ? (
            <div className="py-8 text-center text-sm text-muted-foreground animate-pulse">Loading schedule...</div>
          ) : shifts?.length === 0 ? (
            <div className="rounded-lg border border-dashed py-10 px-4 text-center text-sm text-muted-foreground">
              No shifts assigned to you.
            </div>
          ) : (
            <div className="grid gap-3">
              {shifts?.map((es: any) => (
                <Card key={es.id} className="relative overflow-hidden">
                  <div className="absolute left-0 top-0 h-full w-1" style={{ backgroundColor: es.shift?.color || '#6366f1' }} />
                  <CardHeader className="p-4 pb-2 pl-5">
                    <CardTitle className="text-base">{es.shift?.name || 'Assigned Shift'}</CardTitle>
                    <CardDescription className="text-xs">
                      {es.shift?.type || 'Standard'} Shift
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 pl-5">
                    <div className="flex items-center gap-2 text-sm mt-1">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-medium">
                        {es.shift?.startTime || '--:--'} - {es.shift?.endTime || '--:--'}
                      </span>
                    </div>
                    <div className="mt-3 text-[10px] uppercase tracking-wider text-muted-foreground">
                      Effective: {format(new Date(es.effectiveFrom), 'MMM d, yyyy')}
                      {es.effectiveTo && ` - ${format(new Date(es.effectiveTo), 'MMM d, yyyy')}`}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="swaps" className="space-y-3 mt-0">
          {loadingSwaps ? (
            <div className="py-8 text-center text-sm text-muted-foreground animate-pulse">Loading swaps...</div>
          ) : swaps?.length === 0 ? (
            <div className="rounded-lg border border-dashed py-10 px-4 text-center text-sm text-muted-foreground">
              No shift swap requests.
            </div>
          ) : (
            <div className="grid gap-3">
              {swaps?.map((swap: any) => {
                const isReceived = swap.targetEmployeeId === (user as any)?.employeeId;
                return (
                  <Card key={swap.id}>
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <CardTitle className="text-sm">
                            {isReceived ? 'Received Request' : 'Sent Request'}
                          </CardTitle>
                          <CardDescription className="text-xs mt-1">
                            {format(new Date(swap.date), 'MMM d, yyyy')}
                          </CardDescription>
                        </div>
                        <span className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          swap.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-600' :
                          swap.status === 'APPROVED' ? 'bg-green-500/10 text-green-600' :
                          'bg-red-500/10 text-red-600'
                        }`}>
                          {swap.status}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="flex items-center justify-between text-xs mt-2 p-2 bg-muted/50 rounded-md">
                        {isReceived ? (
                          <>
                            <span className="font-medium truncate">{swap.requestingEmployee?.user.firstName}</span>
                            <ArrowRightLeft className="h-3 w-3 text-muted-foreground mx-2 shrink-0" />
                            <span className="font-medium text-muted-foreground">You</span>
                          </>
                        ) : (
                          <>
                            <span className="font-medium text-muted-foreground">You</span>
                            <ArrowRightLeft className="h-3 w-3 text-muted-foreground mx-2 shrink-0" />
                            <span className="font-medium truncate">{swap.targetEmployee?.user.firstName}</span>
                          </>
                        )}
                      </div>
                      {swap.reason && (
                        <p className="mt-3 text-[11px] text-muted-foreground italic line-clamp-2">
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
