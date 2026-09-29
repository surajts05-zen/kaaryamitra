import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, Loader2, MapPin, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { useTodayStatus, useCheckIn, useCheckOut } from '@/features/attendance/hooks/use-attendance-queries';
import { useCompanySettings } from '@/features/company/hooks/use-org-queries';

export function MobileCheckInFlow() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'IDLE' | 'LOCATING' | 'PROCESSING'>('IDLE');
  
  const { data: todayStatus, isLoading: statusLoading } = useTodayStatus();
  const { data: settings } = useCompanySettings();
  const checkInMutation = useCheckIn();
  const checkOutMutation = useCheckOut();

  const record = todayStatus?.record;
  const isCheckedIn = !!record?.punchInTime;
  const isCheckedOut = !!record?.punchOutTime;
  
  const handleFabClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const getLocation = (): Promise<{ latitude: number; longitude: number; accuracy: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
      } else {
        navigator.geolocation.getCurrentPosition(
          pos => resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          }),
          err => reject(new Error(err.message)),
          { timeout: 10000, enableHighAccuracy: true }
        );
      }
    });
  };

  const processImageWithGPS = async (file: File): Promise<string | null> => {
    return new Promise(async (resolve) => {
      try {
        setStep('LOCATING');
        const loc = await getLocation();
        
        setStep('PROCESSING');
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(null);
          
          // Set canvas dimensions
          canvas.width = img.width;
          canvas.height = img.height;
          
          // Draw original image
          ctx.drawImage(img, 0, 0);
          
          // Superimpose GPS data
          ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
          const textHeight = Math.max(20, img.height * 0.03);
          const padding = textHeight;
          const boxHeight = textHeight * 3 + padding * 2;
          ctx.fillRect(0, canvas.height - boxHeight, canvas.width, boxHeight);
          
          ctx.font = `${textHeight}px sans-serif`;
          ctx.fillStyle = 'white';
          const timeStr = new Date().toLocaleString();
          const coordStr = `Lat: ${loc.latitude.toFixed(6)}, Lng: ${loc.longitude.toFixed(6)}`;
          
          ctx.fillText(`Time: ${timeStr}`, padding, canvas.height - boxHeight + textHeight + padding/2);
          ctx.fillText(coordStr, padding, canvas.height - boxHeight + textHeight*2.5 + padding/2);
          
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          // Attach location data to return as well
          resolve(dataUrl);
        };
        img.src = URL.createObjectURL(file);
      } catch (err: any) {
        toast.error('Location error: ' + err.message);
        resolve(null);
      }
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const dataUrl = await processImageWithGPS(file);
    if (!dataUrl) {
      setIsProcessing(false);
      setStep('IDLE');
      return;
    }

    // Attempt to get location again just for the payload, or we can use the same one if we returned it.
    // For simplicity, we just fetch it again or send it. 
    try {
      const loc = await getLocation();
      const payload: any = {
        latitude: loc.latitude,
        longitude: loc.longitude,
        locationAccuracy: loc.accuracy,
        channel: 'MOBILE'
        // photoDataUrl: dataUrl // if backend supported it
      };

      if (!isCheckedIn) {
        const result = await checkInMutation.mutateAsync(payload);
        const meta = result?._meta;
        if (meta?.isLate) {
          toast.warning(`Punched in — ${meta.lateMinutes} min late`);
        } else {
          toast.success('Punched in successfully!');
        }
      } else if (!isCheckedOut) {
        const result = await checkOutMutation.mutateAsync(payload);
        const meta = result?._meta;
        if (meta?.isEarlyExit) {
          toast.warning(`Punched out ${meta.earlyExitMinutes} min early`);
        } else {
          toast.success('Punched out successfully!');
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || `Failed to punch`);
    } finally {
      setIsProcessing(false);
      setStep('IDLE');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (statusLoading || !settings?.isAttendanceEnabled || isCheckedOut) {
    return null; // hide FAB if checked out or disabled
  }

  const actionText = !isCheckedIn ? 'Punch In' : 'Punch Out';
  const ActionIcon = !isCheckedIn ? LogIn : LogOut;

  return (
    <>
      <input 
        type="file" 
        accept="image/*" 
        capture="environment" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
      />
      
      <div className="fixed bottom-20 right-6 z-40">
        <Button 
          onClick={handleFabClick}
          disabled={isProcessing}
          className="h-16 w-16 rounded-full shadow-xl flex items-center justify-center bg-primary hover:bg-primary/90 transition-all hover:scale-105"
        >
          {isProcessing ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary-foreground" />
          ) : (
            <Camera className="h-7 w-7 text-primary-foreground" />
          )}
        </Button>
      </div>

      {isProcessing && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-background p-6 rounded-xl shadow-2xl flex flex-col items-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <p className="font-bold">{step === 'LOCATING' ? 'Acquiring GPS Location...' : 'Processing Photo & Punch...'}</p>
          </div>
        </div>
      )}
    </>
  );
}
