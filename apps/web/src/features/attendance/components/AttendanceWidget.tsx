import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, Coffee, LogOut, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import { format, differenceInHours, differenceInMinutes } from 'date-fns';
import { 
  useMyAttendance, 
  useCheckIn, 
  useCheckOut, 
  useStartBreak, 
  useEndBreak 
} from '@/features/attendance/hooks/use-attendance-queries';
import { useCompanySettings } from '@/features/company/hooks/use-org-queries';

export function AttendanceWidget() {
  const [location, setLocation] = useState<{ latitude: number, longitude: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const { data: settings } = useCompanySettings();
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const { data: attendanceData, isLoading } = useMyAttendance(todayStr);
  
  const checkInMutation = useCheckIn();
  const checkOutMutation = useCheckOut();
  const startBreakMutation = useStartBreak();
  const endBreakMutation = useEndBreak();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getLocation = (): Promise<{ latitude: number, longitude: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
      } else {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const loc = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            };
            setLocation(loc);
            resolve(loc);
          },
          (error) => {
            reject(new Error(error.message));
          }
        );
      }
    });
  };

  const handleAction = async (action: 'checkIn' | 'checkOut' | 'startBreak' | 'endBreak') => {
    let locData: { latitude?: number; longitude?: number } = {};
    
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
        await checkInMutation.mutateAsync(locData);
        toast.success('Checked in successfully!');
      } else if (action === 'checkOut') {
        await checkOutMutation.mutateAsync(locData);
        toast.success('Checked out successfully!');
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

  if (!settings?.isAttendanceEnabled) {
    return null; // Don't show if disabled
  }

  const record = attendanceData?.[0]; // today's record
  const isCheckedIn = !!record?.punchInTime;
  const isCheckedOut = !!record?.punchOutTime;
  const activeBreak = record?.breaks?.find((b: any) => !b.endAt);
  const isOnBreak = !!activeBreak;

  const isPending = checkInMutation.isPending || checkOutMutation.isPending || startBreakMutation.isPending || endBreakMutation.isPending || isLocating;

  let displayStatus = 'Not Checked In';
  let statusColor = 'text-muted-foreground';
  
  if (isCheckedOut) {
    displayStatus = 'Checked Out';
    statusColor = 'text-green-500';
  } else if (isOnBreak) {
    displayStatus = 'On Break';
    statusColor = 'text-orange-500';
  } else if (isCheckedIn) {
    displayStatus = 'Working';
    statusColor = 'text-blue-500';
  }

  return (
    <Card className="col-span-1 shadow-sm border border-border/50">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Time & Attendance
          </CardTitle>
          <div className={`text-sm font-medium ${statusColor}`}>
            {displayStatus}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="flex flex-col items-center justify-center space-y-6">
          <div className="text-4xl font-light tracking-tight">
            {format(currentTime, 'hh:mm:ss a')}
          </div>
          <div className="text-sm text-muted-foreground">
            {format(currentTime, 'EEEE, MMMM d, yyyy')}
          </div>

          <div className="flex flex-wrap justify-center gap-3 w-full">
            {!isCheckedIn ? (
              <Button 
                onClick={() => handleAction('checkIn')} 
                disabled={isPending || isLoading}
                className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Check In
              </Button>
            ) : !isCheckedOut ? (
              <>
                <Button 
                  onClick={() => handleAction('checkOut')} 
                  disabled={isPending || isOnBreak}
                  variant="destructive"
                  className="w-full sm:w-auto"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Check Out
                </Button>
                
                {!isOnBreak ? (
                  <Button 
                    onClick={() => handleAction('startBreak')} 
                    disabled={isPending}
                    variant="outline"
                    className="w-full sm:w-auto border-orange-200 text-orange-600 hover:bg-orange-50"
                  >
                    <Coffee className="w-4 h-4 mr-2" />
                    Start Break
                  </Button>
                ) : (
                  <Button 
                    onClick={() => handleAction('endBreak')} 
                    disabled={isPending}
                    variant="outline"
                    className="w-full sm:w-auto border-blue-200 text-blue-600 hover:bg-blue-50"
                  >
                    <Coffee className="w-4 h-4 mr-2" />
                    End Break
                  </Button>
                )}
              </>
            ) : null}
          </div>

          {settings.isGeolocationEnforced && (
            <div className="flex items-center text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-md">
              <MapPin className="w-3 h-3 mr-1.5" />
              Geolocation tracking enforced
            </div>
          )}

          {record && (
            <div className="w-full grid grid-cols-2 gap-4 mt-6 pt-6 border-t text-sm">
              <div>
                <span className="text-muted-foreground block mb-1">Check In</span>
                <span className="font-medium">{record.punchInTime ? format(new Date(record.punchInTime), 'hh:mm a') : '--'}</span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-1">Check Out</span>
                <span className="font-medium">{record.punchOutTime ? format(new Date(record.punchOutTime), 'hh:mm a') : '--'}</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
