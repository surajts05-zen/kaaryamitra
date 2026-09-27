import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Clock, Coffee, LogOut, LogIn, Wifi, WifiOff, AlertTriangle,
  CheckCircle2, Timer, Shield
} from 'lucide-react';
import { toast } from 'sonner';
import { format, differenceInSeconds } from 'date-fns';
import {
  useTodayStatus,
  useCheckIn,
  useCheckOut,
  useStartBreak,
  useEndBreak,
} from '@/features/attendance/hooks/use-attendance-queries';
import { useCompanySettings } from '@/features/company/hooks/use-org-queries';
import { cn } from '@/lib/utils';

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m`;
  if (m > 0) return `${m}m ${s.toString().padStart(2, '0')}s`;
  return `${s}s`;
}

function NetworkBadge({ status }: { status?: string }) {
  if (!status || status === 'NO_POLICY') return null;
  if (status === 'TRUSTED') {
    return (
      <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
        <Wifi className="w-2.5 h-2.5" />
        Trusted Network
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-[10px] font-medium text-amber-600 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-400 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
      <WifiOff className="w-2.5 h-2.5" />
      Unverified Network
    </span>
  );
}

function TrustBadge({ level }: { level?: string }) {
  if (!level) return null;
  const config: Record<string, { label: string; className: string }> = {
    VERIFIED: { label: 'Verified', className: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    ACCEPTED: { label: 'Accepted', className: 'text-blue-600 bg-blue-50 border-blue-200' },
    FLAGGED: { label: 'Flagged', className: 'text-amber-600 bg-amber-50 border-amber-200' },
    PENDING_APPROVAL: { label: 'Pending Review', className: 'text-orange-600 bg-orange-50 border-orange-200' },
  };
  const c = config[level];
  if (!c) return null;
  return (
    <span className={cn('flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border', c.className)}>
      <Shield className="w-2.5 h-2.5" />
      {c.label}
    </span>
  );
}

export function AttendanceWidget() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isLocating, setIsLocating] = useState(false);

  const { data: settings } = useCompanySettings();
  const { data: todayStatus, isLoading } = useTodayStatus();

  const checkInMutation = useCheckIn();
  const checkOutMutation = useCheckOut();
  const startBreakMutation = useStartBreak();
  const endBreakMutation = useEndBreak();

  const record = todayStatus?.record;
  const shift = todayStatus?.shift;

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Live elapsed time ticker
  useEffect(() => {
    if (!record?.punchInTime || record?.punchOutTime) {
      setElapsedSeconds(0);
      return;
    }
    const activeBreak = record?.breaks?.find((b: any) => !b.endAt);
    if (activeBreak) return; // don't tick while on break

    const update = () => {
      const seconds = differenceInSeconds(new Date(), new Date(record.punchInTime));
      const breakSeconds = (record.totalBreakMinutes ?? 0) * 60;
      setElapsedSeconds(Math.max(0, seconds - breakSeconds));
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [record?.punchInTime, record?.punchOutTime, record?.totalBreakMinutes]);

  const getLocation = (): Promise<{ latitude: number; longitude: number; locationAccuracy?: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
      } else {
        navigator.geolocation.getCurrentPosition(
          pos => resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            locationAccuracy: pos.coords.accuracy,
          }),
          err => reject(new Error(err.message)),
          { timeout: 10000, enableHighAccuracy: true }
        );
      }
    });
  };

  const handleAction = async (action: 'checkIn' | 'checkOut' | 'startBreak' | 'endBreak') => {
    let locData: any = {};

    if (settings?.isGeolocationEnforced && (action === 'checkIn' || action === 'checkOut')) {
      setIsLocating(true);
      try {
        locData = await getLocation();
      } catch (err: any) {
        toast.error('Location required: ' + err.message);
        setIsLocating(false);
        return;
      }
      setIsLocating(false);
    }

    try {
      if (action === 'checkIn') {
        const result = await checkInMutation.mutateAsync(locData);
        const meta = result?._meta;
        if (meta?.isLate) {
          toast.warning(`Punched in — ${meta.lateMinutes} min late`, { duration: 5000 });
        } else {
          toast.success('Punched in successfully!');
        }
      } else if (action === 'checkOut') {
        const result = await checkOutMutation.mutateAsync(locData);
        const meta = result?._meta;
        if (meta?.isEarlyExit) {
          toast.warning(`Punched out ${meta.earlyExitMinutes} min early`);
        } else {
          toast.success('Punched out successfully!');
        }
      } else if (action === 'startBreak') {
        await startBreakMutation.mutateAsync('BREAK');
        toast.success('Break started');
      } else if (action === 'endBreak') {
        await endBreakMutation.mutateAsync();
        toast.success('Break ended');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || `Failed to ${action}`);
    }
  };

  if (!settings?.isAttendanceEnabled) return null;

  const isCheckedIn = !!record?.punchInTime;
  const isCheckedOut = !!record?.punchOutTime;
  const activeBreak = record?.breaks?.find((b: any) => !b.endAt);
  const isOnBreak = !!activeBreak;
  const isPending = checkInMutation.isPending || checkOutMutation.isPending ||
    startBreakMutation.isPending || endBreakMutation.isPending || isLocating;

  // Status config
  type StatusKey = 'not-started' | 'checked-out' | 'on-break' | 'working';
  const statusKey: StatusKey = !isCheckedIn ? 'not-started' : isCheckedOut ? 'checked-out' : isOnBreak ? 'on-break' : 'working';
  const statusConfig: Record<StatusKey, { label: string; dot: string; accent: string }> = {
    'not-started': { label: 'Not Started', dot: 'bg-slate-400', accent: 'text-slate-500' },
    'checked-out': { label: 'Day Complete', dot: 'bg-emerald-500', accent: 'text-emerald-600' },
    'on-break': { label: 'On Break', dot: 'bg-amber-500 animate-pulse', accent: 'text-amber-600' },
    'working': { label: 'Working', dot: 'bg-blue-500 animate-pulse', accent: 'text-blue-600' },
  };
  const statusInfo = statusConfig[statusKey];

  return (
    <Card className="overflow-hidden border border-border/60 shadow-sm">
      {/* Header strip */}
      <CardHeader className="p-4 pb-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Clock className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-none">Time & Attendance</p>
              {shift && (
                <p className="text-xs text-muted-foreground mt-0.5">{shift.name} · {shift.startTime}–{shift.endTime}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={cn('w-2 h-2 rounded-full', statusInfo.dot)} />
            <span className={cn('text-xs font-medium', statusInfo.accent)}>{statusInfo.label}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {/* Clock */}
        <div className="text-center py-4">
          <div className="text-4xl font-light tabular-nums tracking-tight">
            {format(currentTime, 'hh:mm:ss')}
            <span className="text-2xl text-muted-foreground ml-1">{format(currentTime, 'a')}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{format(currentTime, 'EEEE, MMMM d, yyyy')}</p>
        </div>

        {/* Working duration */}
        {isCheckedIn && !isCheckedOut && !isOnBreak && elapsedSeconds > 0 && (
          <div className="flex items-center justify-center gap-2 mb-4">
            <Timer className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-sm font-medium tabular-nums">{formatDuration(elapsedSeconds)}</span>
            <span className="text-xs text-muted-foreground">working</span>
          </div>
        )}

        {/* Late/Early exit alerts */}
        {record?.isLate && !isCheckedOut && (
          <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2 mb-3">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>
              Arrived {record.lateMinutes} {record.lateMinutes === 1 ? 'minute' : 'minutes'} late
            </span>
          </div>
        )}
        {isCheckedOut && record?.isEarlyExit && (
          <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Left {record.earlyExitMinutes} min early</span>
          </div>
        )}
        {isCheckedOut && !record?.isEarlyExit && (
          <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 mb-3">
            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Day complete · {Math.floor((record?.totalMinutes ?? 0) / 60)}h {(record?.totalMinutes ?? 0) % 60}m worked</span>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col gap-2">
          {!isCheckedIn ? (
            <Button
              onClick={() => handleAction('checkIn')}
              disabled={isPending || isLoading}
              className="w-full h-11 font-semibold gap-2 bg-primary hover:bg-primary/90"
            >
              <LogIn className="w-4 h-4" />
              {isLocating ? 'Getting Location...' : isPending ? 'Punching In...' : 'Punch In'}
            </Button>
          ) : !isCheckedOut ? (
            <div className="flex gap-2">
              <Button
                onClick={() => handleAction('checkOut')}
                disabled={isPending || isOnBreak}
                variant="destructive"
                className="flex-1 h-11 font-semibold gap-2"
              >
                <LogOut className="w-4 h-4" />
                {isPending ? 'Processing...' : 'Punch Out'}
              </Button>
              {!isOnBreak ? (
                <Button
                  onClick={() => handleAction('startBreak')}
                  disabled={isPending}
                  variant="outline"
                  className="h-11 px-3 border-amber-200 text-amber-700 hover:bg-amber-50"
                  title="Start Break"
                >
                  <Coffee className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={() => handleAction('endBreak')}
                  disabled={isPending}
                  variant="outline"
                  className="h-11 px-3 border-blue-200 text-blue-700 hover:bg-blue-50"
                  title="End Break"
                >
                  <Coffee className="w-4 h-4" />
                </Button>
              )}
            </div>
          ) : null}
        </div>

        {/* Punch times summary */}
        {record?.punchInTime && (
          <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-muted-foreground mb-0.5">Punch In</p>
              <p className="font-semibold">{format(new Date(record.punchInTime), 'hh:mm a')}</p>
              {record.isLate && (
                <p className="text-amber-600 text-[10px] mt-0.5">{record.lateMinutes}m late</p>
              )}
            </div>
            <div>
              <p className="text-muted-foreground mb-0.5">Punch Out</p>
              <p className="font-semibold">
                {record.punchOutTime ? format(new Date(record.punchOutTime), 'hh:mm a') : '—'}
              </p>
            </div>
          </div>
        )}

        {/* Trust / network info */}
        {record?.punchInTime && (record?.punchInNetworkStatus || record?.overallTrustLevel) && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            <NetworkBadge status={record.punchInNetworkStatus} />
            <TrustBadge level={record.overallTrustLevel} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
